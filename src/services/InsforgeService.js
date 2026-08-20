import { createClient } from '@insforge/sdk';

export const INSFORGE_CONFIG = {
  baseUrl: import.meta.env?.VITE_INSFORGE_URL || import.meta.env?.VITE_INSFORGE_BASE_URL || 'https://zt9vsanb.ap-southeast.insforge.app',
  anonKey: import.meta.env?.VITE_INSFORGE_ANON_KEY || 'anon_6c1365427153ae74a1af5b04648e3ceed511b3fee1dedd3dafae52eb0c59cc38',
  projectId: import.meta.env?.VITE_INSFORGE_PROJECT_ID || 'fa322b88-223f-474a-bb6c-770596286e21',
  projectName: 'yt_clone_data'
};

export const insforge = createClient({
  baseUrl: INSFORGE_CONFIG.baseUrl,
  anonKey: INSFORGE_CONFIG.anonKey
});

export const parseAvdToSeconds = (avdStr, fallback = 105) => {
  if (typeof avdStr === 'number') return isNaN(avdStr) ? fallback : avdStr;
  if (!avdStr || typeof avdStr !== 'string') return fallback;
  const clean = avdStr.trim();
  if (clean.includes(':')) {
    const parts = clean.split(':').map(p => parseInt(p, 10) || 0);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  const parsed = parseInt(clean.replace(/[^0-9]/g, ''), 10);
  return isNaN(parsed) ? fallback : parsed;
};

export const formatSecondsToAvd = (totalSecs) => {
  const s = Math.max(0, parseInt(totalSecs, 10) || 0);
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  const formattedSecs = secs < 10 ? `0${secs}` : `${secs}`;
  return `${mins}:${formattedSecs}`;
};

export const InsforgeService = {
  /**
   * Load complete CRM data from Insforge PostgreSQL database.
   */
  async loadDatabaseData() {
    try {
      // 1. Parallel fetch from all CRM tables
      const [
        { data: channelData, error: channelErr },
        { data: videosData, error: videosErr },
        { data: commentsData, error: commentsErr },
        { data: playlistsData, error: playlistsErr },
        { data: settingsData, error: settingsErr },
        { data: subtitlesData, error: subtitlesErr },
        { data: audioData, error: audioErr },
        { data: snapshot, error: snapshotErr }
      ] = await Promise.all([
        insforge.database.from('crm_channel').select('*').limit(1).catch(err => ({ data: null, error: err })),
        insforge.database.from('crm_videos').select('*').order('sort_order', { ascending: true }).catch(err => ({ data: null, error: err })),
        insforge.database.from('crm_comments').select('*').order('created_at', { ascending: false }).catch(err => ({ data: null, error: err })),
        insforge.database.from('crm_playlists').select('*').order('created_at', { ascending: false }).catch(err => ({ data: null, error: err })),
        insforge.database.from('crm_settings').select('*').eq('key', 'app_settings').limit(1).catch(err => ({ data: null, error: err })),
        insforge.database.from('crm_subtitles').select('*').catch(err => ({ data: null, error: err })),
        insforge.database.from('crm_audio_library').select('*').catch(err => ({ data: null, error: err })),
        insforge.database.from('crm_state').select('state_data').eq('key', 'current_state').single().catch(err => ({ data: null, error: err }))
      ]);

      if (channelErr) console.warn('[Insforge] Channel fetch note:', channelErr.message);
      if (videosErr) console.warn('[Insforge] Videos fetch note:', videosErr.message);

      let channelInfo = null;
      if (channelData && channelData.length > 0) {
        const raw = channelData[0];
        channelInfo = {
          id: raw.channel_id,
          name: raw.name,
          handle: raw.handle,
          avatar: raw.avatar,
          banner: raw.banner,
          country: raw.country,
          subscribers: Number(raw.subscribers) || 0,
          subscribersFormatted: raw.subscribers_formatted || (Number(raw.subscribers) || 0).toLocaleString('en-IN'),
          subscribersGainedLast28Days: Number(raw.subscribers_gained_last_28_days) || 0,
          subscribersGainedLast28DaysFormatted: raw.subscribers_gained_last_28_days_formatted,
          viewsLast28Days: Number(raw.views_last_28_days) || 0,
          viewsLast28DaysFormatted: raw.views_last_28_days_formatted,
          watchTimeLast28Days: Number(raw.watch_time_last_28_days) || 0,
          watchTimeLast28DaysFormatted: raw.watch_time_last_28_days_formatted,
          revenueLast28Days: Number(raw.revenue_last_28_days) || 0,
          revenueLast28DaysFormatted: raw.revenue_last_28_days_formatted,
          totalViews: Number(raw.total_views) || 0,
          totalRevenue: Number(raw.total_revenue) || 0,
          totalRevenueFormatted: raw.total_revenue_formatted,
          currency: raw.currency || 'INR',
          hasExplicitChannelMetrics: Boolean(raw.has_explicit_channel_metrics)
        };
      }

      let videos = null;
      if (videosData && videosData.length > 0) {
        videos = videosData.map(v => {
          const views = Number(v.views) || 0;
          const rpm = Number(v.rpm) || 33.64;
          const revenue = v.revenue != null ? Number(v.revenue) : (views / 1000) * rpm;
          const avgViewDurationSecs = Number(v.avg_view_duration_secs) || parseAvdToSeconds(v.avg_view_duration, 105);
          const avgViewDuration = v.avg_view_duration || formatSecondsToAvd(avgViewDurationSecs);
          const watchTimeHrs = (v.watch_time_hrs !== undefined && v.watch_time_hrs !== null && Number(v.watch_time_hrs) > 0)
            ? Number(v.watch_time_hrs)
            : parseFloat(((views * avgViewDurationSecs) / 3600).toFixed(1));

          return {
            id: v.id,
            title: v.title,
            description: v.description,
            thumbnail: v.thumbnail,
            duration: v.duration || '10:18',
            durationSecs: Number(v.duration_secs) || 618,
            avgViewDuration,
            avgViewDurationSecs,
            avd: avgViewDuration,
            views,
            viewsFormatted: v.views_formatted || (views >= 1_000_000 ? `${(views / 1_000_000).toFixed(1)}M` : views >= 1_000 ? `${(views / 1_000).toFixed(0)}K` : String(views)),
            likes: Number(v.likes) || Math.round(views * 0.046),
            comments: Number(v.comments) || Math.round(views * 0.0034),
            rpm,
            cpm: Number(v.cpm) || 58.00,
            ctr: Number(v.ctr) || 8.90,
            revenue,
            revenueFormatted: v.revenue_formatted || `₹${revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            subscribersGained: Number(v.subscribers_gained) || Math.round(views * 0.014),
            subscribersLost: Number(v.subscribers_lost) || 0,
            netSubscribers: (Number(v.net_subscribers) && Number(v.net_subscribers) > 0) ? Number(v.net_subscribers) : (Number(v.subscribers_gained) || Math.round(views * 0.014)),
            watchTimeHrs,
            impressions: Number(v.impressions) || Math.round(views / ((Number(v.ctr) || 8.90) / 100)),
            visibility: v.visibility || 'Public',
            monetization: v.monetization !== false,
            restrictions: v.restrictions || 'None',
            category: v.category || 'Entertainment',
            publishDate: v.publish_date || '2026-02-14',
            sortOrder: Number(v.sort_order) || 0
          };
        });
      }

      let comments = null;
      if (commentsData && commentsData.length > 0) {
        comments = commentsData.map(c => ({
          id: c.id,
          videoId: c.video_id,
          author: c.author,
          authorAvatar: c.author_avatar,
          text: c.text,
          likes: Number(c.likes) || 0,
          heart: Boolean(c.heart),
          userLiked: Boolean(c.user_liked),
          time: c.time || 'Just now',
          status: c.status || 'Published',
          replies: Array.isArray(c.replies) ? c.replies : []
        }));
      }

      let playlists = null;
      if (playlistsData && playlistsData.length > 0) {
        playlists = playlistsData.map(p => ({
          id: p.id,
          title: p.title,
          videoCount: Number(p.video_count) || 0,
          visibility: p.visibility || 'Public',
          lastUpdated: p.last_updated || 'Just now',
          videos: Array.isArray(p.videos) ? p.videos : []
        }));
      }

      let settings = null;
      if (settingsData && settingsData.length > 0) {
        const s = settingsData[0];
        settings = {
          currency: s.currency || 'INR - Indian Rupee',
          theme: s.theme || 'Dark',
          country: s.country || 'United States',
          keywords: s.keywords || '',
          defaultVisibility: s.default_visibility || 'Public',
          defaultCategory: s.default_category || 'Entertainment',
          blockedWords: s.blocked_words || ''
        };
      }

      let subtitles = null;
      if (subtitlesData && subtitlesData.length > 0) {
        subtitles = subtitlesData.map(sub => ({
          id: sub.id,
          videoId: sub.video_id,
          videoTitle: sub.video_title,
          languages: Array.isArray(sub.languages) ? sub.languages : ['English (Automatic)'],
          modified: sub.modified || '2026-08-12',
          titleDescriptionState: sub.title_description_state || 'Published',
          subtitlesState: sub.subtitles_state || 'Published'
        }));
      }

      let audioTracks = null;
      if (audioData && audioData.length > 0) {
        audioTracks = audioData.map(a => ({
          id: a.id,
          title: a.title,
          artist: a.artist,
          duration: a.duration || '3:00',
          genre: a.genre || 'Electronic',
          mood: a.mood || 'Dramatic',
          starred: Boolean(a.starred),
          audioUrl: a.audio_url || ''
        }));
      }

      return {
        success: true,
        channelInfo,
        videos,
        comments,
        playlists,
        settings,
        subtitles,
        audioTracks,
        stateData: snapshot?.state_data || null
      };
    } catch (err) {
      console.error('[Insforge] Failed to load data from database:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Save Channel Metrics to Insforge crm_channel table.
   */
  async saveChannelMetrics(channelInfo) {
    if (!channelInfo) return;
    try {
      const payload = {
        channel_id: channelInfo.id || 'UCqpdVWIzEQUcbf4pAxlneOQ',
        name: channelInfo.name || 'Kids Toon',
        handle: channelInfo.handle || '@kidstoon',
        avatar: channelInfo.avatar,
        banner: channelInfo.banner,
        country: channelInfo.country || 'United States',
        subscribers: Number(channelInfo.subscribers) || 0,
        subscribers_formatted: channelInfo.subscribersFormatted || `${channelInfo.subscribers}`,
        subscribers_gained_last_28_days: Number(channelInfo.subscribersGainedLast28Days) || 0,
        subscribers_gained_last_28_days_formatted: channelInfo.subscribersGainedLast28DaysFormatted || `${channelInfo.subscribersGainedLast28Days}`,
        views_last_28_days: Number(channelInfo.viewsLast28Days) || 0,
        views_last_28_days_formatted: channelInfo.viewsLast28DaysFormatted || `${channelInfo.viewsLast28Days}`,
        watch_time_last_28_days: Number(channelInfo.watchTimeLast28Days) || 0,
        watch_time_last_28_days_formatted: channelInfo.watchTimeLast28DaysFormatted || `${channelInfo.watchTimeLast28Days} hrs`,
        revenue_last_28_days: Number(channelInfo.revenueLast28Days) || 0,
        revenue_last_28_days_formatted: channelInfo.revenueLast28DaysFormatted || `₹${channelInfo.revenueLast28Days}`,
        total_views: Number(channelInfo.lifetimeViews || channelInfo.totalViews) || 21450000,
        total_revenue: Number(channelInfo.totalRevenue) || 721577,
        total_revenue_formatted: channelInfo.totalRevenueFormatted,
        currency: channelInfo.currency || 'INR',
        has_explicit_channel_metrics: true
      };

      const { data, error } = await insforge.database
        .from('crm_channel')
        .upsert(payload);

      if (error) console.warn('[Insforge] Upsert channel error:', error);
      return { success: !error, data };
    } catch (err) {
      console.error('[Insforge] saveChannelMetrics error:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Save Video Metrics to Insforge crm_videos table.
   */
  async saveVideoMetrics(videoId, videoData) {
    if (!videoId || !videoData) return;
    try {
      const views = Number(videoData.views) || 0;
      const rpm = Number(videoData.rpm) || 33.64;
      const revenue = videoData.revenue != null ? Number(videoData.revenue) : (views / 1000) * rpm;
      const avgViewDurationSecs = Number(videoData.avgViewDurationSecs) || parseAvdToSeconds(videoData.avgViewDuration, 105);
      const avgViewDuration = videoData.avgViewDuration || formatSecondsToAvd(avgViewDurationSecs);
      const watchTimeHrs = parseFloat(((views * avgViewDurationSecs) / 3600).toFixed(1));

      const payload = {
        id: String(videoId),
        title: videoData.title,
        description: videoData.description,
        thumbnail: videoData.thumbnail,
        duration: videoData.duration || '10:18',
        duration_secs: Number(videoData.durationSecs) || 618,
        avg_view_duration: avgViewDuration,
        avg_view_duration_secs: avgViewDurationSecs,
        views,
        views_formatted: videoData.viewsFormatted || `${views}`,
        likes: Number(videoData.likes) || Math.round(views * 0.046),
        comments: Number(videoData.comments) || Math.round(views * 0.0034),
        rpm,
        cpm: Number(videoData.cpm) || 58.00,
        ctr: Number(videoData.ctr) || 8.90,
        revenue,
        revenue_formatted: videoData.revenueFormatted || `₹${revenue.toFixed(2)}`,
        subscribers_gained: Number(videoData.subscribersGained) || Math.round(views * 0.014),
        subscribers_lost: Number(videoData.subscribersLost) || 0,
        net_subscribers: (Number(videoData.netSubscribers) && Number(videoData.netSubscribers) > 0) ? Number(videoData.netSubscribers) : (Number(videoData.subscribersGained) || Math.round(views * 0.014)),
        watch_time_hrs: watchTimeHrs,
        impressions: Number(videoData.impressions) || Math.round(views / ((Number(videoData.ctr) || 8.90) / 100)),
        visibility: videoData.visibility || 'Public',
        monetization: videoData.monetization !== false,
        restrictions: videoData.restrictions || 'None',
        category: videoData.category || 'Entertainment',
        publish_date: videoData.publishDate || '2026-02-14',
        sort_order: Number(videoData.sortOrder) || 0
      };

      const { data, error } = await insforge.database
        .from('crm_videos')
        .upsert(payload);

      if (error) console.warn('[Insforge] Upsert video error:', error);
      return { success: !error, data };
    } catch (err) {
      console.error('[Insforge] saveVideoMetrics error:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Save All Videos to Insforge crm_videos table in batch.
   */
  async saveAllVideos(videosList) {
    if (!Array.isArray(videosList) || videosList.length === 0) return;
    try {
      const records = videosList.map((v, idx) => {
        const views = Number(v.views) || 0;
        const rpm = Number(v.rpm) || 33.64;
        const revenue = v.revenue != null ? Number(v.revenue) : (views / 1000) * rpm;
        const avgViewDurationSecs = Number(v.avgViewDurationSecs) || parseAvdToSeconds(v.avgViewDuration, 105);
        const avgViewDuration = v.avgViewDuration || formatSecondsToAvd(avgViewDurationSecs);
        const watchTimeHrs = parseFloat(((views * avgViewDurationSecs) / 3600).toFixed(1));

        return {
          id: String(v.id),
          channel_id: 'UCqpdVWIzEQUcbf4pAxlneOQ',
          title: v.title || `Video ${idx + 1}`,
          description: v.description || '',
          thumbnail: v.thumbnail,
          duration: v.duration || '10:18',
          duration_secs: Number(v.durationSecs) || 618,
          avg_view_duration: avgViewDuration,
          avg_view_duration_secs: avgViewDurationSecs,
          views,
          views_formatted: v.viewsFormatted || `${views}`,
          likes: Number(v.likes) || Math.round(views * 0.046),
          comments: Number(v.comments) || Math.round(views * 0.0034),
          rpm,
          cpm: Number(v.cpm) || 58.00,
          ctr: Number(v.ctr) || 8.90,
          revenue,
          revenue_formatted: v.revenueFormatted || `₹${revenue.toFixed(2)}`,
          subscribers_gained: Number(v.subscribersGained) || Math.round(views * 0.014),
          subscribers_lost: Number(v.subscribersLost) || 0,
          net_subscribers: (Number(v.netSubscribers) && Number(v.netSubscribers) > 0) ? Number(v.netSubscribers) : (Number(v.subscribersGained) || Math.round(views * 0.014)),
          watch_time_hrs: watchTimeHrs,
          impressions: Number(v.impressions) || Math.round(views / ((Number(v.ctr) || 8.90) / 100)),
          visibility: v.visibility || 'Public',
          monetization: v.monetization !== false,
          restrictions: v.restrictions || 'None',
          category: v.category || 'Entertainment',
          publish_date: v.publishDate || '2026-02-14',
          sort_order: v.sortOrder !== undefined ? Number(v.sortOrder) : idx + 1
        };
      });

      const { data, error } = await insforge.database
        .from('crm_videos')
        .upsert(records);

      if (error) console.warn('[Insforge] Batch upsert videos error:', error);
      return { success: !error, data };
    } catch (err) {
      console.error('[Insforge] saveAllVideos error:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Save comments to Insforge crm_comments table.
   */
  async saveComments(commentsList) {
    if (!Array.isArray(commentsList) || commentsList.length === 0) return;
    try {
      const records = commentsList.map(c => ({
        id: String(c.id),
        video_id: c.videoId ? String(c.videoId) : 'VID001',
        author: c.author || 'User',
        author_avatar: c.authorAvatar || '',
        text: c.text || '',
        likes: Number(c.likes) || 0,
        heart: Boolean(c.heart),
        user_liked: Boolean(c.userLiked),
        time: c.time || 'Just now',
        status: c.status || 'Published',
        replies: Array.isArray(c.replies) ? c.replies : []
      }));

      const { data, error } = await insforge.database
        .from('crm_comments')
        .upsert(records);

      if (error) console.warn('[Insforge] Batch upsert comments error:', error);
      return { success: !error, data };
    } catch (err) {
      console.error('[Insforge] saveComments error:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Save single comment or reply.
   */
  async upsertComment(comment) {
    if (!comment || !comment.id) return;
    try {
      const payload = {
        id: String(comment.id),
        video_id: comment.videoId ? String(comment.videoId) : 'VID001',
        author: comment.author || 'User',
        author_avatar: comment.authorAvatar || '',
        text: comment.text || '',
        likes: Number(comment.likes) || 0,
        heart: Boolean(comment.heart),
        user_liked: Boolean(comment.userLiked),
        time: comment.time || 'Just now',
        status: comment.status || 'Published',
        replies: Array.isArray(comment.replies) ? comment.replies : []
      };

      const { data, error } = await insforge.database
        .from('crm_comments')
        .upsert(payload);

      return { success: !error, data };
    } catch (err) {
      console.error('[Insforge] upsertComment error:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Delete comment from Insforge database.
   */
  async deleteComment(commentId) {
    if (!commentId) return;
    try {
      const { data, error } = await insforge.database
        .from('crm_comments')
        .delete()
        .eq('id', String(commentId));

      return { success: !error, data };
    } catch (err) {
      console.error('[Insforge] deleteComment error:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Save playlists to Insforge crm_playlists table.
   */
  async savePlaylists(playlistsList) {
    if (!Array.isArray(playlistsList) || playlistsList.length === 0) return;
    try {
      const records = playlistsList.map(p => ({
        id: String(p.id),
        title: p.title || 'Untitled Playlist',
        video_count: Number(p.videoCount) || (Array.isArray(p.videos) ? p.videos.length : 0),
        visibility: p.visibility || 'Public',
        last_updated: p.lastUpdated || 'Just now',
        videos: Array.isArray(p.videos) ? p.videos : []
      }));

      const { data, error } = await insforge.database
        .from('crm_playlists')
        .upsert(records);

      if (error) console.warn('[Insforge] Batch upsert playlists error:', error);
      return { success: !error, data };
    } catch (err) {
      console.error('[Insforge] savePlaylists error:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Delete playlist from Insforge database.
   */
  async deletePlaylist(playlistId) {
    if (!playlistId) return;
    try {
      const { data, error } = await insforge.database
        .from('crm_playlists')
        .delete()
        .eq('id', String(playlistId));

      return { success: !error, data };
    } catch (err) {
      console.error('[Insforge] deletePlaylist error:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Save settings to Insforge crm_settings table.
   */
  async saveSettings(settings) {
    if (!settings) return;
    try {
      const payload = {
        key: 'app_settings',
        currency: settings.currency || 'INR - Indian Rupee',
        theme: settings.theme || 'Dark',
        country: settings.country || 'United States',
        keywords: settings.keywords || '',
        default_visibility: settings.defaultVisibility || 'Public',
        default_category: settings.defaultCategory || 'Entertainment',
        blocked_words: settings.blockedWords || ''
      };

      const { data, error } = await insforge.database
        .from('crm_settings')
        .upsert(payload);

      return { success: !error, data };
    } catch (err) {
      console.error('[Insforge] saveSettings error:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Persist full snapshot to crm_state table and server endpoint.
   */
  async saveFullSnapshot(stateSnapshot) {
    try {
      const payload = {
        key: 'current_state',
        state_data: stateSnapshot
      };

      const { data, error } = await insforge.database
        .from('crm_state')
        .upsert(payload);

      // Also backup to server endpoint
      try {
        await fetch('/api/crm/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(stateSnapshot)
        });
      } catch {
        // Fallback local save is best effort
      }

      return { success: !error, data };
    } catch (err) {
      console.error('[Insforge] saveFullSnapshot error:', err);
      return { success: false, error: err.message };
    }
  }
};
