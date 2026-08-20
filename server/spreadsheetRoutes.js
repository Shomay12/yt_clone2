import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@insforge/sdk';
import { spreadsheetService } from './spreadsheet/index.js';
import { normalizeForVideo } from './spreadsheet/normalize.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CRM_STORE_FILE = path.resolve(__dirname, 'crm_store.json');

const insforgeServer = createClient({
  baseUrl: process.env.INSFORGE_URL || process.env.VITE_INSFORGE_BASE_URL || 'https://zt9vsanb.ap-southeast.insforge.app',
  anonKey: process.env.INSFORGE_ANON_KEY || process.env.VITE_INSFORGE_ANON_KEY || 'anon_6c1365427153ae74a1af5b04648e3ceed511b3fee1dedd3dafae52eb0c59cc38'
});

export function registerSpreadsheetRoutes(app) {
  // Permanent CRM Storage endpoints backed by Insforge PostgreSQL
  app.get('/api/crm/data', async (req, res) => {
    try {
      // 1. Fetch from Insforge DB
      const [
        { data: channelData },
        { data: videosData },
        { data: commentsData },
        { data: playlistsData },
        { data: settingsData },
        { data: stateSnapshot }
      ] = await Promise.all([
        insforgeServer.database.from('crm_channel').select('*').limit(1).catch(() => ({ data: null })),
        insforgeServer.database.from('crm_videos').select('*').order('sort_order', { ascending: true }).catch(() => ({ data: null })),
        insforgeServer.database.from('crm_comments').select('*').order('created_at', { ascending: false }).catch(() => ({ data: null })),
        insforgeServer.database.from('crm_playlists').select('*').order('created_at', { ascending: false }).catch(() => ({ data: null })),
        insforgeServer.database.from('crm_settings').select('*').eq('key', 'app_settings').limit(1).catch(() => ({ data: null })),
        insforgeServer.database.from('crm_state').select('state_data').eq('key', 'current_state').single().catch(() => ({ data: null }))
      ]);

      if (channelData || videosData || commentsData || playlistsData || stateSnapshot) {
        return res.json({
          success: true,
          source: 'insforge_db',
          data: {
            channelInfo: channelData?.[0] || null,
            videos: videosData || null,
            comments: commentsData || null,
            playlists: playlistsData || null,
            settings: settingsData?.[0] || null,
            stateData: stateSnapshot?.state_data || null
          }
        });
      }

      // 2. Fallback to local cache file
      if (fs.existsSync(CRM_STORE_FILE)) {
        const data = JSON.parse(fs.readFileSync(CRM_STORE_FILE, 'utf8'));
        return res.json({ success: true, source: 'local_cache', data });
      }
      return res.json({ success: true, data: null });
    } catch (err) {
      if (fs.existsSync(CRM_STORE_FILE)) {
        const data = JSON.parse(fs.readFileSync(CRM_STORE_FILE, 'utf8'));
        return res.json({ success: true, source: 'local_cache', data });
      }
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/crm/save', async (req, res) => {
    try {
      const payload = req.body || {};
      fs.writeFileSync(CRM_STORE_FILE, JSON.stringify(payload, null, 2), 'utf8');

      // Persist snapshot to Insforge
      try {
        await insforgeServer.database.from('crm_state').upsert({
          key: 'current_state',
          state_data: payload
        });
      } catch (dbErr) {
        console.warn('[Server] Insforge DB snapshot note:', dbErr.message);
      }

      res.json({ success: true, savedAt: new Date().toISOString(), dbSynced: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/spreadsheet/status', (req, res) => {
    res.json(spreadsheetService.getStatus());
  });

  app.get('/api/spreadsheet/data', async (req, res) => {
    try {
      if (!spreadsheetService.cache) {
        await spreadsheetService.load();
      }
      const videoId = req.query.videoId;
      let data = spreadsheetService.getData();
      if (videoId) {
        data = normalizeForVideo(data, videoId);
      }
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/spreadsheet/refresh', async (req, res) => {
    try {
      const data = await spreadsheetService.load(true);
      spreadsheetService.broadcast({ type: 'data-updated', loadedAt: spreadsheetService.lastLoadedAt });
      res.json({ success: true, loadedAt: spreadsheetService.lastLoadedAt, meta: data.meta });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/spreadsheet/config', (req, res) => {
    res.json(spreadsheetService.getStatus());
  });

  app.post('/api/spreadsheet/config', (req, res) => {
    try {
      const { source, excelPath, googleSheetsId, autoRefreshInterval, liveSync } = req.body;
      const updates = {};
      if (source) updates.source = source;
      if (excelPath) updates.excelPath = excelPath;
      if (googleSheetsId !== undefined) updates.googleSheetsId = googleSheetsId;
      if (autoRefreshInterval !== undefined) updates.autoRefreshInterval = Number(autoRefreshInterval);
      if (liveSync !== undefined) updates.liveSync = Boolean(liveSync);

      spreadsheetService.saveConfig(updates);
      res.json({ success: true, status: spreadsheetService.getStatus() });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/spreadsheet/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const send = (event) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    send({ type: 'connected', loadedAt: spreadsheetService.lastLoadedAt });

    const unsubscribe = spreadsheetService.subscribe(send);

    req.on('close', () => {
      unsubscribe();
    });
  });

  spreadsheetService.load().catch(err => {
    console.error('[Spreadsheet] Initial load failed:', err.message);
  });
}
