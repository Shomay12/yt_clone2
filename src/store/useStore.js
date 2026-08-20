import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SpreadsheetDataService } from '../services/SpreadsheetDataService.js';
import { InsforgeService, parseAvdToSeconds, formatSecondsToAvd } from '../services/InsforgeService.js';
import {
  CHANNEL_BENCHMARKS,
  PROCESSED_VIDEOS,
  DAILY_SERIES,
  filterDailyMetricsByRange,
  aggregateMetrics,
  getTrafficSources,
  getAudienceBreakdown,
  generateDailyTimeSeries,
  generateRealtimeDataset,
  tickRealtimeData,
  formatDateRangeText,
  formatSingleDate
} from '../engine/AnalyticsSimulationEngine.js';

export const formatINR = (val) => {
  if (val === null || val === undefined) return '₹0.00';
  if (typeof val === 'number') {
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (typeof val === 'string') {
    let s = val.trim();
    if (s.startsWith('₹')) return s;
    if (s.startsWith('$')) s = s.slice(1);
    const num = parseFloat(s.replace(/,/g, ''));
    if (!isNaN(num)) {
      return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `₹${s}`;
  }
  return String(val);
};

export const fmtV = (n) => {
  const num = Number(n) || 0;
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(Math.round(num));
};

export const fmtW = (n) => {
  const num = Number(n) || 0;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M hrs`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K hrs`;
  return `${Math.round(num)} hrs`;
};

export const fmtS = (s) => {
  const num = Number(s) || 0;
  const prefix = num > 0 ? '+' : '';
  if (Math.abs(num) >= 1_000_000) return `${prefix}${(num / 1_000_000).toFixed(1)}M`;
  if (Math.abs(num) >= 1_000) return `${prefix}${(num / 1_000).toFixed(1)}K`;
  return `${prefix}${num.toLocaleString('en-IN')}`;
};

const INITIAL_ANCHOR_DATE = '2026-08-13';
const INITIAL_REALTIME = generateRealtimeDataset(INITIAL_ANCHOR_DATE);
const INITIAL_LAST28_DAILY = filterDailyMetricsByRange(DAILY_SERIES, '2026-07-17', '2026-08-13');
const INITIAL_AGG = aggregateMetrics(INITIAL_LAST28_DAILY);

// Baseline lifetime totals from the original simulation data
const BASELINE_VIEWS = PROCESSED_VIDEOS.reduce((acc, v) => acc + (Number(v.views) || 0), 0) || 21450000;
const BASELINE_REVENUE = PROCESSED_VIDEOS.reduce((acc, v) => acc + ((Number(v.views) || 0) / 1000 * (Number(v.rpm) || 33.64)), 0) || 722000;

const EMPTY_STATE = {
  channelInfo: {
    ...CHANNEL_BENCHMARKS,
    subscribersFormatted: '412.9K',
    lifetimeViewsFormatted: '21.5M',
    totalUploads: PROCESSED_VIDEOS.length,
    viewsLast28DaysFormatted: INITIAL_AGG.viewsFormatted,
    watchTimeLast28DaysFormatted: INITIAL_AGG.watchTimeHrsFormatted,
    subscribersGainedLast28DaysFormatted: INITIAL_AGG.subscribersNetFormatted,
    revenueLast28DaysFormatted: INITIAL_AGG.revenueFormatted,
    totalRevenueFormatted: '₹7,21,577.00',
    currency: 'INR'
  },
  videos: PROCESSED_VIDEOS,
  shorts: [
    { id: 'sh_01', title: 'Top 3 AI Agent Frameworks in 60s #shorts', views: 420000, likes: 38500, comments: 1240, remixes: 410, viewedPct: 78.4, swipedAwayPct: 21.6, publishDate: '2026-07-28', thumbnail: '/thumbnails/1.webp', visibility: 'Public' },
    { id: 'sh_02', title: 'Never hardcode your API keys 💀 #coding', views: 890000, likes: 72000, comments: 2450, remixes: 890, viewedPct: 84.2, swipedAwayPct: 15.8, publishDate: '2026-07-15', thumbnail: '/thumbnails/2.webp', visibility: 'Public' },
    { id: 'sh_03', title: 'Full Stack SaaS Architecture in 30 Seconds #systemdesign', views: 1250000, likes: 98000, comments: 4120, remixes: 1540, viewedPct: 89.1, swipedAwayPct: 10.9, publishDate: '2026-06-20', thumbnail: '/thumbnails/3.webp', visibility: 'Public' }
  ],
  liveStreams: [],
  playlists: [
    { id: 'pl_01', title: 'AI & Autonomous Agents Masterclass', videoCount: 4, visibility: 'Public', lastUpdated: '3 days ago' },
    { id: 'pl_02', title: 'Full Stack SaaS Engineering', videoCount: 3, visibility: 'Public', lastUpdated: '1 week ago' },
    { id: 'pl_03', title: 'System Design & Distributed Systems', videoCount: 3, visibility: 'Public', lastUpdated: '2 weeks ago' }
  ],
  podcasts: [],
  comments: [
    { id: 'c_1', videoId: 'vid_01', author: 'Alex Tech', authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80', text: 'This AI agent video is incredible! The tool calling architecture makes total sense now.', likes: 342, heart: true, time: '2 hours ago', status: 'Published' },
    { id: 'c_2', videoId: 'vid_02', author: 'DevGirl_99', authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80', text: 'Giving an agent control of your bank account was wild 🤯 great explanation!', likes: 189, heart: false, time: '5 hours ago', status: 'Published' },
    { id: 'c_3', videoId: 'vid_10', author: 'CodeMaster', authorAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80', text: 'Best system design video on YouTube. Period.', likes: 512, heart: true, time: '1 day ago', status: 'Published' }
  ],
  subtitles: PROCESSED_VIDEOS.map(v => ({
    id: `sub_${v.id}`,
    videoId: v.id,
    videoTitle: v.title,
    languages: ['English (Automatic)', 'Hindi', 'Spanish'],
    modified: v.publishDate,
    titleDescriptionState: 'Published',
    subtitlesState: 'Published'
  })),
  copyrightClaims: [
    { id: 'cc_01', videoTitle: 'AI Blogging Course in 2026', matchingVideoTitle: 'Royalty Background Lo-Fi Ambient', matchingChannel: 'Lofi Records Global', matchPercent: '12%', segment: '04:12 - 05:48', dateDetected: 'Jul 24, 2026', views: 529000, status: 'Active (No penalty)' },
    { id: 'cc_02', videoTitle: 'Long AI Video Kaise Banaye', matchingVideoTitle: 'Cyberpunk Synth Instrumental', matchingChannel: 'RetroWave Music', matchPercent: '8%', segment: '11:20 - 12:15', dateDetected: 'Aug 02, 2026', views: 892000, status: 'Resolved' }
  ],
  audioTracks: [
    { id: 'track_1', title: 'Synthwave Dreams', artist: 'Axiom Audio', duration: '3:45', genre: 'Electronic', mood: 'Dramatic', starred: true },
    { id: 'track_2', title: 'Lofi Study Beats', artist: 'Chillhop Lab', duration: '2:30', genre: 'Lofi', mood: 'Calm', starred: false },
    { id: 'track_3', title: 'Deep Focus Ambient', artist: 'Zenith Labs', duration: '4:12', genre: 'Ambient', mood: 'Calm', starred: true },
    { id: 'track_4', title: 'Epic Cinematic Rise', artist: 'Audiomachine', duration: '2:55', genre: 'Cinematic', mood: 'Dramatic', starred: false }
  ],
  notifications: [
    { id: 'n_1', title: 'System Design video reached 2.8M views!', message: 'Your video is trending #1 in Tech.', time: '1 hour ago', read: false },
    { id: 'n_2', title: 'New milestone: 400,000 Subscribers!', message: 'Congratulations on reaching 400K subscribers!', time: '1 day ago', read: false }
  ],
  earnConfig: {
    yppStatus: 'Active Partner',
    watchPageAds: true,
    shortsAds: true,
    memberships: true,
    supers: true,
    shopping: true,
    subscribersTarget: 1000,
    watchHoursTarget: 4000,
    shortsViewsTarget: 10000000
  },
  spreadsheetWarnings: [],
  settings: {
    currency: 'INR - Indian Rupee',
    theme: 'Dark',
    country: 'United States',
    keywords: 'AI, Autonomous Agents, Software Engineering, React, Node.js, System Design',
    defaultVisibility: 'Public',
    defaultCategory: 'Science & Technology'
  },
  trafficSourcesCustom: [
    { source: 'Browse Features', percentage: 42.5 },
    { source: 'Suggested Videos', percentage: 28.3 },
    { source: 'YouTube Search', percentage: 14.2 },
    { source: 'External', percentage: 6.4 },
    { source: 'Notifications', percentage: 4.1 },
    { source: 'Playlists', percentage: 2.5 },
    { source: 'Channel Pages', percentage: 1.2 },
    { source: 'Shorts Feed', percentage: 0.8 }
  ],
  searchTermsCustom: [
    { term: 'ai video maker', percentage: 24.5 },
    { term: 'kids cartoon animation', percentage: 18.2 },
    { term: 'how to create ai videos', percentage: 15.6 },
    { term: 'autonomous agents tutorial', percentage: 12.3 },
    { term: 'faceless youtube channel', percentage: 9.8 }
  ],
  externalSourcesCustom: [
    { source: 'Google Search', percentage: 46.2 },
    { source: 'WhatsApp', percentage: 22.8 },
    { source: 'Reddit', percentage: 14.5 },
    { source: 'Instagram', percentage: 9.3 },
    { source: 'Twitter / X', percentage: 7.2 }
  ],
  audienceCustom: {
    returningViewers: 34.2,
    newViewers: 65.8,
    uniqueViewersCount: 840000,
    subscribedWatchTimePct: 41.5,
    nonSubscribedWatchTimePct: 58.5,
    geographies: [
      { country: 'United States', percentage: 38.5, rpm: 48.20 },
      { country: 'Canada', percentage: 11.2, rpm: 42.50 },
      { country: 'United Kingdom', percentage: 9.8, rpm: 39.80 },
      { country: 'Germany', percentage: 8.4, rpm: 38.10 },
      { country: 'Australia', percentage: 6.5, rpm: 41.00 },
      { country: 'India', percentage: 14.2, rpm: 4.20 },
      { country: 'Philippines', percentage: 4.8, rpm: 5.10 },
      { country: 'Brazil', percentage: 4.0, rpm: 6.50 }
    ],
    ageGender: [
      { group: '18–24 years', percentage: 22.4, male: 74, female: 26 },
      { group: '25–34 years', percentage: 48.6, male: 76, female: 24 },
      { group: '35–44 years', percentage: 18.2, male: 72, female: 28 },
      { group: '45–54 years', percentage: 7.1, male: 70, female: 30 },
      { group: '55+ years', percentage: 3.7, male: 68, female: 32 }
    ],
    subtitleLanguages: [
      { language: 'English (Original)', percentage: 76.5 },
      { language: 'Spanish', percentage: 8.2 },
      { language: 'Hindi', percentage: 6.4 },
      { language: 'German', percentage: 4.1 },
      { language: 'No subtitles/CC', percentage: 4.8 }
    ]
  },
  revenueCustom: {
    monthlyRevenue: [
      { month: 'August 2026', revenue: 42050.00, formatted: '₹42,050.00' },
      { month: 'July 2026', revenue: 68420.00, formatted: '₹68,420.00' },
      { month: 'June 2026', revenue: 59310.00, formatted: '₹59,310.00' },
      { month: 'May 2026', revenue: 54100.00, formatted: '₹54,100.00' },
      { month: 'April 2026', revenue: 61850.00, formatted: '₹61,850.00' },
      { month: 'March 2026', revenue: 49200.00, formatted: '₹49,200.00' }
    ],
    revenueStreams: [
      { stream: 'Watch Page Ads', percentage: 84.5 },
      { stream: 'YouTube Premium', percentage: 9.2 },
      { stream: 'Channel Memberships', percentage: 4.1 },
      { stream: 'Super Chat & Stickers', percentage: 2.2 }
    ],
    adTypes: [
      { type: 'Skippable video ads', percentage: 68.4 },
      { type: 'Non-skippable ads', percentage: 19.2 },
      { type: 'Bumper ads', percentage: 8.1 },
      { type: 'Display / Overlay ads', percentage: 4.3 }
    ]
  },
  realtimeCustom: {
    liveSubsDelta: 0,
    speedMultiplier: 1.0,
    override48h: null,
    override60m: null
  },
  analytics: {
    daily: INITIAL_LAST28_DAILY,
    trafficSources: getTrafficSources(INITIAL_AGG.views),
    audience: getAudienceBreakdown(INITIAL_AGG.views),
    realtime: INITIAL_REALTIME,
    subscribers: [],
    charts: {
      overview: INITIAL_LAST28_DAILY,
      revenue: INITIAL_LAST28_DAILY,
      realtime: INITIAL_REALTIME.last48Hours,
      engagement: INITIAL_LAST28_DAILY,
      trafficSources: getTrafficSources(INITIAL_AGG.views),
      audience: getAudienceBreakdown(INITIAL_AGG.views),
      videoMetrics: null
    }
  },
  engine: {
    totalViews: INITIAL_AGG.views,
    totalRevenue: INITIAL_AGG.revenue,
    totalWatchTimeHrs: INITIAL_AGG.watchTimeHrs,
    averageRpm: INITIAL_AGG.rpm,
    averageCpm: INITIAL_AGG.cpm,
    averageCtr: INITIAL_AGG.ctr,
    averageViewDuration: '04:15',
    subscriberGrowth: INITIAL_AGG.subscribersNet,
    monthlyRevenue: [],
    topVideos: {
      mostViewed: [...PROCESSED_VIDEOS].sort((a, b) => b.views - a.views),
      highestRpm: [...PROCESSED_VIDEOS].sort((a, b) => b.rpm - a.rpm),
      highestRevenue: [...PROCESSED_VIDEOS].sort((a, b) => b.revenue - a.revenue),
      fastestGrowing: [...PROCESSED_VIDEOS].sort((a, b) => b.ctr - a.ctr)
    }
  }
};

function applySpreadsheetData(data) {
  return {
    channelInfo: { ...EMPTY_STATE.channelInfo, ...(data.channelInfo || {}) },
    videos: data.videos && data.videos.length > 0 ? data.videos : EMPTY_STATE.videos,
    shorts: data.shorts || [],
    liveStreams: data.liveStreams || [],
    playlists: data.playlists && data.playlists.length > 0 ? data.playlists : EMPTY_STATE.playlists,
    podcasts: data.podcasts || [],
    comments: data.comments && data.comments.length > 0 ? data.comments : EMPTY_STATE.comments,
    subtitles: data.subtitles || EMPTY_STATE.subtitles,
    copyrightClaims: data.copyrightClaims || [],
    audioTracks: data.audioTracks || EMPTY_STATE.audioTracks,
    notifications: data.notifications || EMPTY_STATE.notifications,
    settings: data.settings || EMPTY_STATE.settings,
    trafficSourcesCustom: data.trafficSourcesCustom || EMPTY_STATE.trafficSourcesCustom,
    searchTermsCustom: data.searchTermsCustom || EMPTY_STATE.searchTermsCustom,
    externalSourcesCustom: data.externalSourcesCustom || EMPTY_STATE.externalSourcesCustom,
    audienceCustom: data.audienceCustom || EMPTY_STATE.audienceCustom,
    revenueCustom: data.revenueCustom || EMPTY_STATE.revenueCustom,
    realtimeCustom: data.realtimeCustom || EMPTY_STATE.realtimeCustom,
    analytics: data.analytics || EMPTY_STATE.analytics,
    engine: data.engine || EMPTY_STATE.engine,
    spreadsheetWarnings: data.warnings || []
  };
}

export const useStore = create(
  persist(
    (set, get) => ({
      mode: 'simulation',
      isSpreadsheetLoading: false,
      spreadsheetError: null,
      lastSpreadsheetSync: null,
      spreadsheetConfig: {
        source: 'excel',
        autoRefreshInterval: 60,
        liveSync: true
      },

      // Insforge Database Connectivity State
      isDatabaseLoading: false,
      isDatabaseConnected: true,
      lastDatabaseSync: null,
      databaseError: null,

      // Date filtering state
      simulationAnchorDate: '2026-08-13',
      selectedDateRange: 'last28',
      customStartDate: '2026-07-17',
      customEndDate: '2026-08-13',
      realtimeDataset: INITIAL_REALTIME,

      ...EMPTY_STATE,
      toast: null,

      showToast: (message, type = 'info') => {
        set({ toast: { id: Date.now(), message, type } });
      },
      clearToast: () => set({ toast: null }),

      // ─── Insforge Database Sync Methods ───
      loadFromDatabase: async (silent = false) => {
        set({ isDatabaseLoading: true, databaseError: null });
        try {
          const res = await InsforgeService.loadDatabaseData();
          if (res.success) {
            const updates = {};
            const curState = get();
            if (res.channelInfo) {
              updates.channelInfo = {
                ...curState.channelInfo,
                ...res.channelInfo,
                hasExplicitChannelMetrics: true
              };
            }
            if (res.videos && res.videos.length > 0) {
              updates.videos = res.videos;
            }
            if (res.comments && res.comments.length > 0) {
              updates.comments = res.comments;
            }
            if (res.playlists && res.playlists.length > 0) {
              updates.playlists = res.playlists;
            }
            if (res.settings) {
              updates.settings = { ...curState.settings, ...res.settings };
            }
            if (res.subtitles && res.subtitles.length > 0) {
              updates.subtitles = res.subtitles;
            }
            if (res.audioTracks && res.audioTracks.length > 0) {
              updates.audioTracks = res.audioTracks;
            }
            if (res.stateData) {
              if (res.stateData.channelInfo) {
                updates.channelInfo = { ...curState.channelInfo, ...updates.channelInfo, ...res.stateData.channelInfo };
              }
              if (res.stateData.videos && res.stateData.videos.length > 0) {
                updates.videos = res.stateData.videos;
              }
              if (res.stateData.comments && res.stateData.comments.length > 0) {
                updates.comments = res.stateData.comments;
              }
              if (res.stateData.playlists && res.stateData.playlists.length > 0) {
                updates.playlists = res.stateData.playlists;
              }
              if (res.stateData.settings) {
                updates.settings = { ...curState.settings, ...updates.settings, ...res.stateData.settings };
              }
            }
            set({
              ...updates,
              hasCrmOverrides: true,
              isDatabaseLoading: false,
              isDatabaseConnected: true,
              lastDatabaseSync: new Date().toISOString(),
              databaseError: null
            });
            if (!silent) {
              get().showToast('Loaded latest state from Insforge database ✓', 'success');
            }
            return true;
          } else {
            set({ isDatabaseLoading: false, databaseError: res.error });
            return false;
          }
        } catch (err) {
          console.error('[Store] Database load error:', err);
          set({ isDatabaseLoading: false, databaseError: err.message });
          return false;
        }
      },

      persistToDatabase: async () => {
        const state = get();
        try {
          if (state.channelInfo) {
            await InsforgeService.saveChannelMetrics(state.channelInfo);
          }
          if (state.videos && state.videos.length > 0) {
            await InsforgeService.saveAllVideos(state.videos);
          }
          if (state.comments && state.comments.length > 0) {
            await InsforgeService.saveComments(state.comments);
          }
          if (state.playlists && state.playlists.length > 0) {
            await InsforgeService.savePlaylists(state.playlists);
          }
          if (state.settings) {
            await InsforgeService.saveSettings(state.settings);
          }
          await InsforgeService.saveFullSnapshot({
            channelInfo: state.channelInfo,
            videos: state.videos,
            comments: state.comments,
            playlists: state.playlists,
            settings: state.settings,
            subtitles: state.subtitles,
            audioTracks: state.audioTracks,
            savedAt: new Date().toISOString()
          });
          set({ lastDatabaseSync: new Date().toISOString(), isDatabaseConnected: true });
        } catch (err) {
          console.error('[Store] Error persisting to Insforge DB:', err);
        }
      },

      // Date range changer
      setDateRange: (rangeKey, customStart = null, customEnd = null) => {
        set(state => {
          const updates = { 
            selectedDateRange: rangeKey,
            dateRangeVersion: (state.dateRangeVersion || 0) + 1
          };
          if (customStart) updates.customStartDate = customStart;
          if (customEnd) updates.customEndDate = customEnd;
          return updates;
        });
      },

      // Set simulation anchor date (e.g. '2026-08-12') and update date ranges
      setSimulationAnchorDate: (anchorDate, customStart = null, customEnd = null) => {
        set(state => {
          const cleanAnchor = anchorDate ? anchorDate.split('T')[0] : '2026-08-12';
          let startStr = customStart;
          if (!startStr) {
            const d = new Date(`${cleanAnchor}T00:00:00Z`);
            d.setUTCDate(d.getUTCDate() - 27);
            startStr = d.toISOString().split('T')[0];
          }
          const endStr = customEnd ? customEnd : cleanAnchor;
          return {
            simulationAnchorDate: cleanAnchor,
            customStartDate: startStr,
            customEndDate: endStr,
            dateRangeVersion: (state.dateRangeVersion || 0) + 1
          };
        });
      },

      // Live realtime ticker tick function
      tickRealtime: () => {
        set(state => ({
          realtimeDataset: tickRealtimeData(state.realtimeDataset)
        }));
      },

      // Helper to retrieve computed analytics for any date range and video
      getAnalyticsForRange: (rangeKey = null, videoId = null) => {
        const state = get();
        const activeKey = rangeKey || state.selectedDateRange;
        const anchorDateStr = state.simulationAnchorDate || '2026-08-12';
        const today = new Date(anchorDateStr.includes('T') ? anchorDateStr : `${anchorDateStr}T00:00:00Z`);

        const formatDate = (d) => d.toISOString().split('T')[0];
        const subDays = (d, count) => {
          const res = new Date(d);
          res.setUTCDate(res.getUTCDate() - count);
          return res;
        };

        const todayStr = formatDate(today);
        let startStr = '2026-07-16';
        let endStr = todayStr;

        if (activeKey === 'today') {
          startStr = todayStr;
          endStr = todayStr;
        } else if (activeKey === 'first24') {
          startStr = formatDate(subDays(today, 1));
          endStr = todayStr;
        } else if (activeKey === 'yesterday') {
          const y = formatDate(subDays(today, 1));
          startStr = y;
          endStr = y;
        } else if (activeKey === 'last7') {
          startStr = formatDate(subDays(today, 6));
          endStr = todayStr;
        } else if (activeKey === 'last28') {
          startStr = state.customStartDate && state.customEndDate === todayStr ? state.customStartDate : formatDate(subDays(today, 27));
          endStr = todayStr;
        } else if (activeKey === 'last90') {
          startStr = formatDate(subDays(today, 89));
          endStr = todayStr;
        } else if (activeKey === '365') {
          startStr = formatDate(subDays(today, 364));
          endStr = todayStr;
        } else if (activeKey === 'lifetime' || activeKey === 'since_published') {
          startStr = '2025-08-01';
          endStr = todayStr;
        } else if (activeKey === '2026') {
          startStr = '2026-01-01';
          endStr = todayStr;
        } else if (activeKey === '2025') {
          startStr = '2025-01-01';
          endStr = '2025-12-31';
        } else if (activeKey === 'august') {
          startStr = '2026-08-01';
          endStr = todayStr > '2026-08-31' ? '2026-08-31' : todayStr;
        } else if (activeKey === 'july') {
          startStr = '2026-07-01';
          endStr = '2026-07-31';
        } else if (activeKey === 'june') {
          startStr = '2026-06-01';
          endStr = '2026-06-30';
        } else if (activeKey === 'custom') {
          startStr = state.customStartDate || formatDate(subDays(today, 27));
          endStr = state.customEndDate || todayStr;
        }

        // Dynamically generate daily time series ending at anchorDateStr so that
        // ANY date set in CRM (e.g. 2026-08-14, 2026-09-01, 2026-05-10) has complete, valid daily metrics
        const dynamicDailySeries = generateDailyTimeSeries(365, anchorDateStr);
        const filteredDaily = filterDailyMetricsByRange(dynamicDailySeries, startStr, endStr);
        const agg = aggregateMetrics(filteredDaily, videoId);
        const formattedDateRange = formatDateRangeText(startStr, endStr);

        // Per-video analytics: use the video's actual stored metrics directly
        if (videoId) {
          const targetVideo = state.videos.find(v => v.id === videoId || String(v.id) === String(videoId)) || state.videos[0];
          const videoViews = targetVideo ? (Number(targetVideo.views) || 0) : 0;
          const videoRpm = targetVideo?.rpm ? Number(targetVideo.rpm) : 33.64;
          const videoRevenue = targetVideo
            ? (targetVideo.revenue != null ? Number(targetVideo.revenue) : parseFloat(((videoViews / 1000) * videoRpm).toFixed(2)))
            : 0;
          const videoAvgDurationSecs = targetVideo?.avgViewDurationSecs || 105;
          const videoWatchTime = (targetVideo?.watchTimeHrs !== undefined && targetVideo?.watchTimeHrs !== null && Number(targetVideo?.watchTimeHrs) > 0)
            ? Number(targetVideo.watchTimeHrs)
            : parseFloat((videoViews * videoAvgDurationSecs / 3600).toFixed(1));

          const videoSubsGained = (targetVideo?.subscribersGained !== undefined && targetVideo?.subscribersGained !== null && Number(targetVideo?.subscribersGained) > 0)
            ? Number(targetVideo.subscribersGained)
            : ((targetVideo?.netSubscribers !== undefined && targetVideo?.netSubscribers !== null && Number(targetVideo?.netSubscribers) > 0)
                ? Number(targetVideo.netSubscribers)
                : Math.round(videoViews * 0.014));
          const videoSubsLost = targetVideo?.subscribersLost !== undefined
            ? Number(targetVideo.subscribersLost)
            : 0;
          const videoSubsNet = videoSubsGained;

          const videoCtr = targetVideo?.ctr ? Number(targetVideo.ctr) : 8.9;
          const videoImpressions = Math.round(videoViews * (100 / (videoCtr || 8.9)));

          const totalViewsInDaily = filteredDaily.reduce((acc, d) => acc + (d.views || 0), 0) || 1;

          const scaledDaily = filteredDaily.map(d => {
            const dayWeight = (d.views || 0) / totalViewsInDaily;
            const dViews = Math.round(videoViews * dayWeight);
            const dRev = parseFloat(((videoRevenue) * dayWeight).toFixed(2));
            const dWatch = parseFloat(((videoWatchTime) * dayWeight).toFixed(1));
            const dSubsNet = Math.round(videoSubsNet * dayWeight);
            const dSubsGained = Math.round(videoSubsGained * dayWeight);
            const dSubsLost = Math.round(videoSubsLost * dayWeight);

            return {
              ...d,
              views: dViews,
              revenue: dRev,
              watchTimeHrs: dWatch,
              subscribersNet: dSubsNet,
              subscribersGained: dSubsGained,
              subscribersLost: dSubsLost,
              impressions: Math.round(videoImpressions * dayWeight),
              ctr: videoCtr,
            };
          });

          return {
            dateRangeLabel: formattedDateRange,
            daily: scaledDaily,
            aggregated: {
              ...agg,
              views: videoViews,
              viewsFormatted: fmtV(videoViews),
              watchTimeHrs: videoWatchTime,
              watchTimeHrsFormatted: fmtW(videoWatchTime),
              revenue: videoRevenue,
              revenueFormatted: formatINR(videoRevenue),
              subscribersNet: videoSubsNet,
              subscribersGained: videoSubsGained,
              subscribersLost: videoSubsLost,
              subscribersNetFormatted: fmtS(videoSubsNet),
              subscribersGainedFormatted: fmtS(videoSubsGained),
              impressions: videoImpressions,
              impressionsFormatted: fmtV(videoImpressions),
              rpm: videoRpm,
              cpm: targetVideo?.cpm ? Number(targetVideo.cpm) : 58.00,
              ctr: videoCtr
            },
            trafficSources: getTrafficSources(videoViews),
            audience: getAudienceBreakdown(videoViews)
          };
        }

        // ── Channel analytics: always derive from actual video store data ──
        const storeVideos = state.videos || [];
        const currentTotalViews = storeVideos.reduce((acc, v) => acc + (Number(v.views) || 0), 0);
        const currentTotalRevenue = storeVideos.reduce((acc, v) => acc + (v.revenue != null ? Number(v.revenue) : ((Number(v.views) || 0) / 1000 * (Number(v.rpm) || 33.64))), 0);
        const currentTotalWatch = storeVideos.reduce((acc, v) => acc + (v.watchTimeHrs != null ? Number(v.watchTimeHrs) : ((Number(v.views) || 0) * (Number(v.avgViewDurationSecs) || 105) / 3600)), 0);
        const scaledSubsGained = storeVideos.reduce((acc, v) => acc + Number(v.subscribersGained !== undefined ? v.subscribersGained : (v.netSubscribers !== undefined ? v.netSubscribers : (v.subscribers || 0))), 0) || Math.round(agg.subscribersNet);
        const scaledSubsLost   = 0;
        const scaledSubsNet    = scaledSubsGained;

        const ci = state.channelInfo || {};
        const is28Days = (activeKey === 'last28');
        
        // Dynamic channel totals directly from actual video sums
        const base28Views   = (ci.hasExplicitChannelMetrics && ci.viewsLast28Days !== undefined && ci.viewsLast28Days > 0) ? ci.viewsLast28Days : currentTotalViews;
        const base28Revenue = (ci.hasExplicitChannelMetrics && ci.revenueLast28Days !== undefined && ci.revenueLast28Days > 0) ? ci.revenueLast28Days : currentTotalRevenue;
        const base28Watch   = (ci.hasExplicitChannelMetrics && ci.watchTimeLast28Days !== undefined && ci.watchTimeLast28Days > 0) ? ci.watchTimeLast28Days : currentTotalWatch;
        const base28SubsNet = (ci.hasExplicitChannelMetrics && ci.subscribersGainedLast28Days !== undefined && ci.subscribersGainedLast28Days > 0) ? ci.subscribersGainedLast28Days : scaledSubsNet;

        const finalViews   = is28Days ? base28Views : Math.round(base28Views * (agg.views / (INITIAL_AGG.views || 1)));
        const finalRevenue = is28Days ? base28Revenue : parseFloat((base28Revenue * (agg.revenue / (INITIAL_AGG.revenue || 1))).toFixed(2));
        const finalWatch   = is28Days ? base28Watch : parseFloat((base28Watch * (agg.watchTimeHrs / (INITIAL_AGG.watchTimeHrs || 1))).toFixed(1));
        const finalSubsNet = is28Days ? base28SubsNet : Math.round(base28SubsNet * (agg.subscribersNet / (INITIAL_AGG.subscribersNet || 1)));
        const finalImpressions = Math.round(finalViews * 11.2);

        const viewsFmt = fmtV(finalViews);
        const watchFmt = fmtW(finalWatch);
        const revFmt   = formatINR(finalRevenue);
        const subsFmt  = fmtS(finalSubsNet);

        // Scale daily chart proportionally so chart shape is preserved
        const simDailyTotal = filteredDaily.reduce((acc, d) => acc + (d.views || 0), 0) || 1;
        const scaledDaily = filteredDaily.map(d => {
          const w = (d.views || 0) / simDailyTotal;
          return {
            ...d,
            views:          Math.round(finalViews   * w),
            revenue:        parseFloat((finalRevenue * w).toFixed(2)),
            watchTimeHrs:   parseFloat((finalWatch   * w).toFixed(1)),
            subscribersNet: Math.round(finalSubsNet  * w),
            impressions:    Math.round(finalImpressions * w),
            ctr:            agg.ctr || 8.9,
          };
        });

        return {
          dateRangeLabel: formattedDateRange,
          daily: scaledDaily,
          aggregated: {
            ...agg,
            views:                   finalViews,
            viewsFormatted:          viewsFmt,
            watchTimeHrs:            finalWatch,
            watchTimeHrsFormatted:   watchFmt,
            revenue:                 finalRevenue,
            revenueFormatted:        revFmt,
            subscribersNet:          finalSubsNet,
            subscribersNetFormatted: subsFmt,
            subscribersGained:       scaledSubsGained,
            subscribersLost:         scaledSubsLost,
            impressions:             finalImpressions,
            impressionsFormatted:    fmtV(finalImpressions),
            ctr:                     agg.ctr || 8.9,
            rpm:                     finalViews > 0 ? parseFloat(((finalRevenue / finalViews) * 1000).toFixed(2)) : (agg.rpm || 33.64),
            cpm:                     agg.cpm || 58.00,
          },
          trafficSources: state.trafficSourcesCustom && state.trafficSourcesCustom.length > 0
            ? state.trafficSourcesCustom.map(t => ({
                ...t,
                views: Math.round(finalViews * (t.percentage / 100))
              }))
            : getTrafficSources(finalViews),
          searchTerms: state.searchTermsCustom || [],
          externalSources: state.externalSourcesCustom || [],
          audience: state.audienceCustom
            ? {
                ...getAudienceBreakdown(finalViews),
                geographies: (state.audienceCustom.geographies || []).map(g => ({
                  ...g,
                  views: Math.round(finalViews * (g.percentage / 100))
                })),
                ageGender: state.audienceCustom.ageGender || [],
                subtitleLanguages: state.audienceCustom.subtitleLanguages || [],
                viewerWatchBehavior: [
                  { type: 'Returning viewers', percentage: state.audienceCustom.returningViewers || 34.2, description: 'Viewers who watched your channel before and returned' },
                  { type: 'New viewers', percentage: state.audienceCustom.newViewers || 65.8, description: 'Viewers who watched your channel for the first time' }
                ],
                subscribedWatchTimePct: state.audienceCustom.subscribedWatchTimePct || 41.5,
                nonSubscribedWatchTimePct: state.audienceCustom.nonSubscribedWatchTimePct || 58.5
              }
            : getAudienceBreakdown(finalViews),
          revenueBreakdown: state.revenueCustom || {}
        };
      },

      loadFromSpreadsheet: async (silent = false, fromLiveSync = false) => {
        if (get().isSpreadsheetLoading && !fromLiveSync) return;
        set({ isSpreadsheetLoading: true, spreadsheetError: null });

        try {
          const [data, status] = await Promise.all([
            SpreadsheetDataService.getData(),
            SpreadsheetDataService.getStatus()
          ]);

          const parsedData = applySpreadsheetData(data);
          const currentStore = get();
          const hasCrm = currentStore.hasCrmOverrides;

          set({
            ...parsedData,
            // Preserve active CRM data overrides if present
            channelInfo: hasCrm ? currentStore.channelInfo : parsedData.channelInfo,
            videos: hasCrm ? currentStore.videos : parsedData.videos,
            hasCrmOverrides: hasCrm,
            mode: 'spreadsheet',
            isSpreadsheetLoading: false,
            lastSpreadsheetSync: status.lastLoadedAt || new Date().toISOString(),
            spreadsheetConfig: {
              source: status.source,
              excelPath: status.excelPath,
              googleSheetsId: status.googleSheetsId,
              autoRefreshInterval: status.autoRefreshInterval,
              liveSync: status.liveSync
            },
            spreadsheetError: null
          });

          if (!silent) {
            get().showToast('Spreadsheet data loaded', 'success');
          }
        } catch (err) {
          console.error('Spreadsheet load error:', err);
          set({
            isSpreadsheetLoading: false,
            spreadsheetError: err.message
          });
          if (!silent) {
            get().showToast(`Spreadsheet load failed: ${err.message}`, 'warning');
          }
        }
      },

      refreshSpreadsheet: async () => {
        set({ isSpreadsheetLoading: true });
        try {
          await SpreadsheetDataService.refresh();
          await get().loadFromSpreadsheet(true);
          get().showToast('Spreadsheet refreshed successfully', 'success');
        } catch (err) {
          set({ isSpreadsheetLoading: false, spreadsheetError: err.message });
          get().showToast(`Refresh failed: ${err.message}`, 'warning');
        }
      },

      updateSpreadsheetConfig: async (config) => {
        try {
          await SpreadsheetDataService.updateConfig(config);
          await get().loadFromSpreadsheet(true);
          get().showToast('Spreadsheet configuration updated', 'success');
        } catch (err) {
          get().showToast(`Config update failed: ${err.message}`, 'warning');
        }
      },

      addVideo: (newVid) => set((state) => {
        const videoObj = {
          id: `v${Date.now()}`,
          views: 0,
          viewsFormatted: '0',
          comments: 0,
          likes: 0,
          date: new Date().toISOString().split('T')[0],
          restrictions: 'None',
          monetization: true,
          type: 'video',
          visibility: 'Private',
          ...newVid
        };
        return {
          videos: [videoObj, ...state.videos],
          channelInfo: {
            ...state.channelInfo,
            totalUploads: state.videos.length + 1
          }
        };
      }),

      updateVideo: (id, updates) => set((state) => ({
        videos: state.videos.map(v => v.id === id ? { ...v, ...updates } : v)
      })),

      deleteVideo: (id) => set((state) => ({
        videos: state.videos.filter(v => v.id !== id),
        comments: state.comments.filter(c => c.videoId !== id),
        subtitles: state.subtitles.filter(s => s.videoId !== id),
        copyrightClaims: state.copyrightClaims.filter(c => c.videoId !== id)
      })),

      bulkDeleteVideos: (ids) => set((state) => ({
        videos: state.videos.filter(v => !ids.includes(v.id))
      })),

      bulkUpdateVisibility: (ids, visibility) => set((state) => ({
        videos: state.videos.map(v => ids.includes(v.id) ? { ...v, visibility } : v)
      })),

      addPlaylist: (title) => set((state) => ({
        playlists: [
          { id: `pl${Date.now()}`, title, videoCount: 0, visibility: 'Public', lastUpdated: 'Just now' },
          ...state.playlists
        ]
      })),

      deletePlaylist: (id) => set((state) => ({
        playlists: state.playlists.filter(p => p.id !== id)
      })),

      addCommentReply: (commentId, replyText) => set((state) => ({
        comments: state.comments.map(c => {
          if (c.id === commentId) {
            return {
              ...c,
              replies: [
                ...(c.replies || []),
                {
                  id: `r_${Date.now()}`,
                  author: state.channelInfo.name,
                  authorAvatar: state.channelInfo.avatar,
                  time: 'Just now',
                  text: replyText
                }
              ]
            };
          }
          return c;
        })
      })),

      toggleCommentHeart: (commentId) => set((state) => ({
        comments: state.comments.map(c => c.id === commentId ? { ...c, heart: !c.heart } : c)
      })),

      toggleCommentLike: (commentId) => set((state) => ({
        comments: state.comments.map(c => c.id === commentId ? { ...c, likes: c.likes + (c.userLiked ? -1 : 1), userLiked: !c.userLiked } : c)
      })),

      deleteComment: (commentId) => set((state) => ({
        comments: state.comments.filter(c => c.id !== commentId)
      })),

      hideUserFromChannel: (authorName) => set((state) => ({
        comments: state.comments.filter(c => c.author !== authorName),
        settings: {
          ...state.settings,
          blockedWords: (state.settings.blockedWords || '') + `, ${authorName}`
        }
      })),

      updateSubtitles: (id, updates) => set((state) => ({
        subtitles: state.subtitles.map(s => s.id === id ? { ...s, ...updates } : s)
      })),

      resolveCopyrightClaim: (claimId) => set((state) => ({
        copyrightClaims: state.copyrightClaims.map(c => c.id === claimId ? { ...c, status: 'Resolved', impact: 'Claim Released' } : c)
      })),

      toggleStarAudioTrack: (trackId) => set((state) => ({
        audioTracks: state.audioTracks.map(t => t.id === trackId ? { ...t, starred: !t.starred } : t)
      })),

      updateChannelInfo: (updates) => set((state) => ({
        channelInfo: { ...state.channelInfo, ...updates }
      })),

      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),

      markAllNotificationsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true }))
      })),

      // ─── CRM Actions ───────────────────────────────────────────────────
      // Update a single video's numeric metrics, subscriber gain, AVD & thumbnail
      updateVideoMetrics: (id, updates) => {
        set((state) => {
          const updatedVideos = state.videos.map(v => {
            if (String(v.id) !== String(id)) return v;
            const merged = { ...v, ...updates };
            const views = Number(updates.views !== undefined ? updates.views : (v.views ?? 0));
            const rpm = Number(updates.rpm !== undefined ? updates.rpm : (v.rpm ?? 33.64));
            const revenue = updates.revenue !== undefined && updates.revenue !== null && Number(updates.revenue) > 0
              ? Number(updates.revenue)
              : parseFloat(((views / 1000) * rpm).toFixed(2));
            const likes = Number(updates.likes !== undefined ? updates.likes : (v.likes ?? Math.round(views * 0.046)));
            const comments = Number(updates.comments !== undefined ? updates.comments : (v.comments ?? Math.round(views * 0.0034)));
            const subsGained = Number(updates.subscribersGained !== undefined ? updates.subscribersGained : (updates.subscribers !== undefined ? updates.subscribers : (v.subscribersGained ?? v.subscribers ?? Math.round(views * 0.014))));
            const subsLost = 0;
            const netSubs = subsGained;
            const thumbnail = updates.thumbnail !== undefined ? updates.thumbnail : v.thumbnail;

            // Handle Video Duration & Average View Timing (AVD)
            const durationSecs = updates.durationSecs !== undefined
              ? Number(updates.durationSecs)
              : (updates.duration !== undefined ? parseAvdToSeconds(updates.duration, v.durationSecs || 618) : (v.durationSecs || 618));
            const duration = updates.duration !== undefined
              ? updates.duration
              : (updates.durationSecs !== undefined ? formatSecondsToAvd(durationSecs) : (v.duration || formatSecondsToAvd(durationSecs)));

            const avgViewDurationSecs = updates.avgViewDurationSecs !== undefined
              ? Number(updates.avgViewDurationSecs)
              : (updates.avgViewDuration !== undefined ? parseAvdToSeconds(updates.avgViewDuration, v.avgViewDurationSecs || 105) : (v.avgViewDurationSecs || 105));
            const avgViewDuration = updates.avgViewDuration !== undefined
              ? updates.avgViewDuration
              : (updates.avgViewDurationSecs !== undefined ? formatSecondsToAvd(avgViewDurationSecs) : (v.avgViewDuration || formatSecondsToAvd(avgViewDurationSecs)));
            const watchTimeHrs = (updates.watchTimeHrs !== undefined && Number(updates.watchTimeHrs) > 0)
              ? Number(updates.watchTimeHrs)
              : parseFloat(((views * avgViewDurationSecs) / 3600).toFixed(1));

            return {
              ...merged,
              thumbnail,
              duration,
              durationSecs,
              rpm,
              views,
              revenue,
              likes,
              comments,
              avgViewDuration,
              avgViewDurationSecs,
              avd: avgViewDuration,
              watchTimeHrs,
              subscribersGained: subsGained,
              subscribersLost: subsLost,
              netSubscribers: netSubs,
              subscribersNet: netSubs,
              viewsFormatted: fmtV(views),
              revenueFormatted: formatINR(revenue),
              watchTimeHrsFormatted: fmtW(watchTimeHrs),
              subscribersNetFormatted: fmtS(netSubs),
              subscribersGainedFormatted: fmtS(subsGained)
            };
          });

          const totalViews = updatedVideos.reduce((acc, v) => acc + (Number(v.views) || 0), 0);
          const totalRevenue = updatedVideos.reduce((acc, v) => acc + (v.revenue != null ? Number(v.revenue) : ((Number(v.views) || 0) / 1000 * (Number(v.rpm) || 33.64))), 0);
          const totalWatch = updatedVideos.reduce((acc, v) => acc + (v.watchTimeHrs != null ? Number(v.watchTimeHrs) : ((Number(v.views) || 0) * (Number(v.avgViewDurationSecs) || 105) / 3600)), 0);
          const totalSubsGained = updatedVideos.reduce((acc, v) => acc + (Number(v.subscribersGained) || 0), 0);
          const totalSubsLost = updatedVideos.reduce((acc, v) => acc + (Number(v.subscribersLost) || 0), 0);
          const netSubs = totalSubsGained - totalSubsLost;

          return {
            hasCrmOverrides: true,
            dateRangeVersion: (state.dateRangeVersion || 0) + 1,
            videos: updatedVideos,
            channelInfo: {
              ...state.channelInfo,
              totalViews,
              lifetimeViewsFormatted: fmtV(totalViews),
              totalRevenue,
              totalRevenueFormatted: formatINR(totalRevenue),
              viewsLast28Days: totalViews,
              viewsLast28DaysFormatted: fmtV(totalViews),
              revenueLast28Days: parseFloat(totalRevenue.toFixed(2)),
              revenueLast28DaysFormatted: formatINR(totalRevenue),
              watchTimeLast28Days: parseFloat(totalWatch.toFixed(1)),
              watchTimeLast28DaysFormatted: fmtW(totalWatch),
              subscribersGainedLast28Days: netSubs,
              subscribersGainedLast28DaysFormatted: fmtS(netSubs),
              hasExplicitChannelMetrics: false
            }
          };
        });
        get().persistToDatabase();
      },

      // Update channel-level CRM metrics (subscribers, views, revenue, RPM …)
      crmUpdateChannelMetrics: (updates) => {
        set((state) => {
          const subs = updates.subscribers !== undefined ? Number(updates.subscribers) : state.channelInfo.subscribers;
          const subsGained = updates.subscribersGainedLast28Days !== undefined ? Number(updates.subscribersGainedLast28Days) : (state.channelInfo.subscribersGainedLast28Days || 0);
          const views28 = updates.viewsLast28Days !== undefined ? Number(updates.viewsLast28Days) : (state.channelInfo.viewsLast28Days || 0);
          const watchTime28 = updates.watchTimeLast28Days !== undefined ? Number(updates.watchTimeLast28Days) : (state.channelInfo.watchTimeLast28Days || 0);
          const revenue28 = updates.revenueLast28Days !== undefined ? Number(updates.revenueLast28Days) : (state.channelInfo.revenueLast28Days || 0);

          return {
            hasCrmOverrides: true,
            dateRangeVersion: (state.dateRangeVersion || 0) + 1,
            channelInfo: {
              ...state.channelInfo,
              ...updates,
              hasExplicitChannelMetrics: true,
              subscribers: subs,
              subscribersFormatted: subs ? subs.toLocaleString('en-IN') : '0',
              subscribersGainedLast28Days: subsGained,
              subscribersGainedLast28DaysFormatted: fmtS(subsGained),
              viewsLast28Days: views28,
              viewsLast28DaysFormatted: fmtV(views28),
              watchTimeLast28Days: watchTime28,
              watchTimeLast28DaysFormatted: fmtW(watchTime28),
              revenueLast28Days: revenue28,
              revenueLast28DaysFormatted: formatINR(revenue28)
            }
          };
        });
        get().persistToDatabase();
      },

      // Set a single RPM across all videos and recalculate revenues
      bulkSetVideoRPM: (rpm) => {
        set((state) => {
          const r = Number(rpm);
          const updatedVideos = state.videos.map(v => {
            const views = Number(v.views) || 0;
            const revenue = (views / 1000) * r;
            return {
              ...v,
              rpm: r,
              revenue,
              revenueFormatted: formatINR(revenue)
            };
          });
          const totalViews = updatedVideos.reduce((acc, v) => acc + (Number(v.views) || 0), 0);
          const totalRevenue = updatedVideos.reduce((acc, v) => acc + (v.revenue != null ? Number(v.revenue) : ((Number(v.views) || 0) / 1000 * r)), 0);
          const totalWatch = updatedVideos.reduce((acc, v) => acc + (v.watchTimeHrs != null ? Number(v.watchTimeHrs) : ((Number(v.views) || 0) * (Number(v.avgViewDurationSecs) || 105) / 3600)), 0);
          return {
            hasCrmOverrides: true,
            dateRangeVersion: (state.dateRangeVersion || 0) + 1,
            videos: updatedVideos,
            channelInfo: {
              ...state.channelInfo,
              totalRevenue,
              totalRevenueFormatted: formatINR(totalRevenue),
              revenueLast28Days: parseFloat(totalRevenue.toFixed(2)),
              revenueLast28DaysFormatted: formatINR(totalRevenue),
              viewsLast28Days: totalViews,
              viewsLast28DaysFormatted: fmtV(totalViews),
              watchTimeLast28Days: parseFloat(totalWatch.toFixed(1)),
              watchTimeLast28DaysFormatted: fmtW(totalWatch)
            }
          };
        });
        get().persistToDatabase();
      },

      // Multiply all video views by a factor (e.g. 1.2 = +20%)
      bulkMultiplyViews: (factor) => {
        set((state) => {
          const f = Number(factor) || 1;
          const updatedVideos = state.videos.map(v => {
            const views = Math.round((Number(v.views) || 0) * f);
            const rpm = Number(v.rpm) || 33.64;
            const revenue = (views / 1000) * rpm;
            const avgViewDurationSecs = Number(v.avgViewDurationSecs) || 105;
            const watchTimeHrs = parseFloat(((views * avgViewDurationSecs) / 3600).toFixed(1));
            return {
              ...v,
              views,
              viewsFormatted: fmtV(views),
              revenue,
              revenueFormatted: formatINR(revenue),
              watchTimeHrs
            };
          });
          const totalViews = updatedVideos.reduce((acc, v) => acc + (Number(v.views) || 0), 0);
          const totalRevenue = updatedVideos.reduce((acc, v) => acc + (v.revenue != null ? Number(v.revenue) : ((Number(v.views) || 0) / 1000 * (Number(v.rpm) || 33.64))), 0);
          const totalWatch = updatedVideos.reduce((acc, v) => acc + (v.watchTimeHrs != null ? Number(v.watchTimeHrs) : ((Number(v.views) || 0) * (Number(v.avgViewDurationSecs) || 105) / 3600)), 0);
          return {
            hasCrmOverrides: true,
            dateRangeVersion: (state.dateRangeVersion || 0) + 1,
            videos: updatedVideos,
            channelInfo: {
              ...state.channelInfo,
              totalViews,
              lifetimeViewsFormatted: fmtV(totalViews),
              totalRevenue,
              totalRevenueFormatted: formatINR(totalRevenue),
              viewsLast28Days: totalViews,
              viewsLast28DaysFormatted: fmtV(totalViews),
              revenueLast28Days: parseFloat(totalRevenue.toFixed(2)),
              revenueLast28DaysFormatted: formatINR(totalRevenue),
              watchTimeLast28Days: parseFloat(totalWatch.toFixed(1)),
              watchTimeLast28DaysFormatted: fmtW(totalWatch)
            }
          };
        });
        get().persistToDatabase();
      },

      // Apply preset scenarios or import JSON
      crmApplyPreset: (presetKey) => {
        set((state) => {
          const fmt = (n) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n);
          const fmtINR = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

          if (presetKey === 'viral') {
            const subs = 25000000;
            const subsGained = 1200000;
            const views = 45000000;
            const watchTime = 180000;
            const revenue = 185000.00;
            return {
              hasCrmOverrides: true,
              channelInfo: {
                ...state.channelInfo,
                subscribers: subs,
                subscribersFormatted: fmt(subs),
                subscribersGainedLast28Days: subsGained,
                subscribersGainedLast28DaysFormatted: `+${fmt(subsGained)}`,
                viewsLast28Days: views,
                viewsLast28DaysFormatted: fmt(views),
                watchTimeLast28Days: watchTime,
                watchTimeLast28DaysFormatted: fmt(watchTime),
                revenueLast28Days: revenue,
                revenueLast28DaysFormatted: fmtINR(revenue),
                hasExplicitChannelMetrics: true
              },
              videos: state.videos.map(v => {
                const newViews = v.views * 5;
                const newRpm = 45.00;
                const newRev = (newViews / 1000) * newRpm;
                return {
                  ...v,
                  views: newViews,
                  viewsFormatted: fmt(newViews),
                  rpm: newRpm,
                  revenue: newRev,
                  revenueFormatted: fmtINR(newRev)
                };
              })
            };
          }

          if (presetKey === 'high_rpm') {
            return {
              hasCrmOverrides: true,
              videos: state.videos.map(v => {
                const newRpm = 85.50;
                const newRev = (v.views / 1000) * newRpm;
                return {
                  ...v,
                  rpm: newRpm,
                  revenue: newRev,
                  revenueFormatted: fmtINR(newRev)
                };
              })
            };
          }

          return {};
        });
        get().persistToDatabase();
      },

      // ─── Extended CRM Actions ──────────────────────────────────────────
      crmAddComment: (commentData) => {
        set((state) => {
          const newComment = {
            id: commentData.id || `c_${Date.now()}`,
            videoId: commentData.videoId || (state.videos[0]?.id || 'VID001'),
            author: commentData.author || 'Viewer',
            authorAvatar: commentData.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(commentData.author || 'Viewer')}&background=random`,
            text: commentData.text || '',
            likes: Number(commentData.likes) || 0,
            heart: Boolean(commentData.heart),
            userLiked: Boolean(commentData.userLiked),
            time: commentData.time || 'Just now',
            status: commentData.status || 'Published',
            replies: commentData.replies || []
          };
          return {
            comments: [newComment, ...state.comments],
            hasCrmOverrides: true
          };
        });
        get().persistToDatabase();
      },

      crmUpdateComment: (id, updates) => {
        set((state) => ({
          comments: state.comments.map(c => c.id === id ? { ...c, ...updates } : c),
          hasCrmOverrides: true
        }));
        get().persistToDatabase();
      },

      crmDeleteComment: (id) => {
        set((state) => ({
          comments: state.comments.filter(c => c.id !== id),
          hasCrmOverrides: true
        }));
        InsforgeService.deleteComment(id);
      },

      crmAddPlaylist: (playlistData) => {
        set((state) => {
          const newPl = {
            id: playlistData.id || `pl_${Date.now()}`,
            title: playlistData.title || 'New Playlist',
            videoCount: Number(playlistData.videoCount) || 0,
            visibility: playlistData.visibility || 'Public',
            lastUpdated: playlistData.lastUpdated || 'Just now',
            videos: playlistData.videos || []
          };
          return {
            playlists: [newPl, ...state.playlists],
            hasCrmOverrides: true
          };
        });
        get().persistToDatabase();
      },

      crmUpdatePlaylist: (id, updates) => {
        set((state) => ({
          playlists: state.playlists.map(p => p.id === id ? { ...p, ...updates } : p),
          hasCrmOverrides: true
        }));
        get().persistToDatabase();
      },

      crmDeletePlaylist: (id) => {
        set((state) => ({
          playlists: state.playlists.filter(p => p.id !== id),
          hasCrmOverrides: true
        }));
        InsforgeService.deletePlaylist(id);
      },

      crmUpdateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
          hasCrmOverrides: true
        }));
        get().persistToDatabase();
      },

      crmAddVideo: (newVid) => {
        set((state) => {
          const id = newVid.id || `VID${(state.videos.length + 1).toString().padStart(3, '0')}`;
          const views = Number(newVid.views) || 100000;
          const rpm = Number(newVid.rpm) || 33.64;
          const durationSecs = newVid.durationSecs || 600;
          const avgViewDurationSecs = newVid.avgViewDurationSecs || 180;
          const revenue = Number(((views / 1000) * rpm).toFixed(2));
          const watchTimeHrs = Number(((views * avgViewDurationSecs) / 3600).toFixed(1));
          const subscribersGained = newVid.subscribersGained !== undefined ? Number(newVid.subscribersGained) : Math.round(views * 0.014);

          const fullVid = {
            id,
            title: newVid.title || 'Untitled Video',
            description: newVid.description || '',
            thumbnail: newVid.thumbnail || '/thumbnails/1.webp',
            duration: newVid.duration || formatSecondsToAvd(durationSecs),
            durationSecs,
            avgViewDuration: newVid.avgViewDuration || formatSecondsToAvd(avgViewDurationSecs),
            avgViewDurationSecs,
            views,
            viewsFormatted: fmtV(views),
            rpm,
            cpm: Number((rpm * 1.72).toFixed(2)),
            revenue,
            revenueFormatted: formatINR(revenue),
            watchTimeHrs,
            watchTimeHrsFormatted: `${fmtW(watchTimeHrs)} hrs`,
            subscribersGained,
            subscribersLost: 0,
            netSubscribers: subscribersGained,
            likes: newVid.likes !== undefined ? Number(newVid.likes) : Math.round(views * 0.046),
            comments: newVid.comments !== undefined ? Number(newVid.comments) : Math.round(views * 0.0034),
            shares: Math.round(views * 0.008),
            ctr: newVid.ctr || 8.5,
            publishDate: newVid.publishDate || new Date().toISOString().split('T')[0],
            category: newVid.category || 'Entertainment',
            visibility: newVid.visibility || 'Public',
            monetization: newVid.monetization || 'On'
          };

          const updatedVideos = [fullVid, ...state.videos];
          const totalViews = updatedVideos.reduce((acc, v) => acc + (Number(v.views) || 0), 0);
          const totalRevenue = updatedVideos.reduce((acc, v) => acc + (v.revenue != null ? Number(v.revenue) : ((Number(v.views) || 0) / 1000 * (Number(v.rpm) || 33.64))), 0);
          const totalWatch = updatedVideos.reduce((acc, v) => acc + (v.watchTimeHrs != null ? Number(v.watchTimeHrs) : ((Number(v.views) || 0) * (Number(v.avgViewDurationSecs) || 105) / 3600)), 0);

          return {
            videos: updatedVideos,
            channelInfo: {
              ...state.channelInfo,
              totalViews,
              lifetimeViewsFormatted: fmtV(totalViews),
              totalRevenue,
              totalRevenueFormatted: formatINR(totalRevenue),
              viewsLast28Days: totalViews,
              viewsLast28DaysFormatted: fmtV(totalViews),
              watchTimeLast28Days: parseFloat(totalWatch.toFixed(1)),
              watchTimeLast28DaysFormatted: fmtW(totalWatch),
              revenueLast28Days: parseFloat(totalRevenue.toFixed(2)),
              revenueLast28DaysFormatted: formatINR(totalRevenue)
            },
            hasCrmOverrides: true
          };
        });
        get().persistToDatabase();
      },

      crmDeleteVideo: (id) => {
        set((state) => {
          const updatedVideos = state.videos.filter(v => v.id !== id && String(v.id) !== String(id));
          const totalViews = updatedVideos.reduce((acc, v) => acc + (Number(v.views) || 0), 0);
          const totalRevenue = updatedVideos.reduce((acc, v) => acc + (v.revenue != null ? Number(v.revenue) : ((Number(v.views) || 0) / 1000 * (Number(v.rpm) || 33.64))), 0);
          const totalWatch = updatedVideos.reduce((acc, v) => acc + (v.watchTimeHrs != null ? Number(v.watchTimeHrs) : ((Number(v.views) || 0) * (Number(v.avgViewDurationSecs) || 105) / 3600)), 0);

          return {
            videos: updatedVideos,
            channelInfo: {
              ...state.channelInfo,
              totalViews,
              lifetimeViewsFormatted: fmtV(totalViews),
              totalRevenue,
              totalRevenueFormatted: formatINR(totalRevenue),
              viewsLast28Days: totalViews,
              viewsLast28DaysFormatted: fmtV(totalViews),
              watchTimeLast28Days: parseFloat(totalWatch.toFixed(1)),
              watchTimeLast28DaysFormatted: fmtW(totalWatch),
              revenueLast28Days: parseFloat(totalRevenue.toFixed(2)),
              revenueLast28DaysFormatted: formatINR(totalRevenue)
            },
            hasCrmOverrides: true
          };
        });
        get().persistToDatabase();
      },

      crmDuplicateVideo: (id) => {
        set((state) => {
          const target = state.videos.find(v => v.id === id || String(v.id) === String(id));
          if (!target) return state;
          const clonedId = `VID${Date.now().toString().slice(-4)}`;
          const cloned = {
            ...target,
            id: clonedId,
            title: `${target.title} (Copy)`,
            publishDate: new Date().toISOString().split('T')[0]
          };
          const updatedVideos = [cloned, ...state.videos];
          return {
            videos: updatedVideos,
            hasCrmOverrides: true
          };
        });
        get().persistToDatabase();
      },

      crmUpdateTrafficSources: (customList) => {
        set({ trafficSourcesCustom: customList, hasCrmOverrides: true });
        get().persistToDatabase();
      },

      crmUpdateSearchTerms: (terms) => {
        set({ searchTermsCustom: terms, hasCrmOverrides: true });
        get().persistToDatabase();
      },

      crmUpdateExternalSources: (sources) => {
        set({ externalSourcesCustom: sources, hasCrmOverrides: true });
        get().persistToDatabase();
      },

      crmUpdateAudience: (audienceData) => {
        set((state) => ({
          audienceCustom: { ...(state.audienceCustom || {}), ...audienceData },
          hasCrmOverrides: true
        }));
        get().persistToDatabase();
      },

      crmUpdateRevenueCustom: (revenueData) => {
        set((state) => ({
          revenueCustom: { ...(state.revenueCustom || {}), ...revenueData },
          hasCrmOverrides: true
        }));
        get().persistToDatabase();
      },

      crmUpdateRealtimeConfig: (realtimeConfig) => {
        set((state) => ({
          realtimeCustom: { ...(state.realtimeCustom || {}), ...realtimeConfig },
          hasCrmOverrides: true
        }));
        get().persistToDatabase();
      },

      crmAddShort: (shortData) => {
        set((state) => {
          const id = shortData.id || `sh_${Date.now()}`;
          const newShort = {
            id,
            title: shortData.title || 'New Short',
            views: Number(shortData.views) || 50000,
            likes: Number(shortData.likes) || 2500,
            comments: Number(shortData.comments) || 120,
            remixes: Number(shortData.remixes) || 45,
            viewedPct: Number(shortData.viewedPct) || 75.0,
            swipedAwayPct: Number(shortData.swipedAwayPct) || 25.0,
            publishDate: shortData.publishDate || new Date().toISOString().split('T')[0],
            thumbnail: shortData.thumbnail || '/thumbnails/1.webp',
            visibility: shortData.visibility || 'Public'
          };
          return {
            shorts: [newShort, ...state.shorts],
            hasCrmOverrides: true
          };
        });
        get().persistToDatabase();
      },

      crmUpdateShort: (id, updates) => {
        set((state) => ({
          shorts: state.shorts.map(s => s.id === id ? { ...s, ...updates } : s),
          hasCrmOverrides: true
        }));
        get().persistToDatabase();
      },

      crmDeleteShort: (id) => {
        set((state) => ({
          shorts: state.shorts.filter(s => s.id !== id),
          hasCrmOverrides: true
        }));
        get().persistToDatabase();
      },

      crmAddCopyrightClaim: (claimData) => {
        set((state) => {
          const id = claimData.id || `cc_${Date.now()}`;
          const newClaim = {
            id,
            videoTitle: claimData.videoTitle || 'Video',
            matchingVideoTitle: claimData.matchingVideoTitle || 'Audio Track',
            matchingChannel: claimData.matchingChannel || 'Music Label',
            matchPercent: claimData.matchPercent || '10%',
            segment: claimData.segment || '01:00 - 02:00',
            dateDetected: claimData.dateDetected || 'Today',
            views: Number(claimData.views) || 100000,
            status: claimData.status || 'Active (No penalty)'
          };
          return {
            copyrightClaims: [newClaim, ...state.copyrightClaims],
            hasCrmOverrides: true
          };
        });
        get().persistToDatabase();
      },

      crmDeleteCopyrightClaim: (id) => {
        set((state) => ({
          copyrightClaims: state.copyrightClaims.filter(c => c.id !== id),
          hasCrmOverrides: true
        }));
        get().persistToDatabase();
      },

      crmAddAudioTrack: (trackData) => {
        set((state) => {
          const id = trackData.id || `track_${Date.now()}`;
          const newTrack = {
            id,
            title: trackData.title || 'New Audio Track',
            artist: trackData.artist || 'Axiom Records',
            duration: trackData.duration || '3:30',
            genre: trackData.genre || 'Electronic',
            mood: trackData.mood || 'Bright',
            starred: Boolean(trackData.starred)
          };
          return {
            audioTracks: [newTrack, ...state.audioTracks],
            hasCrmOverrides: true
          };
        });
        get().persistToDatabase();
      },

      crmDeleteAudioTrack: (id) => {
        set((state) => ({
          audioTracks: state.audioTracks.filter(t => t.id !== id),
          hasCrmOverrides: true
        }));
        get().persistToDatabase();
      },

      crmAddSubtitleTrack: (subData) => {
        set((state) => {
          const id = subData.id || `sub_${Date.now()}`;
          const newSub = {
            id,
            videoId: subData.videoId || state.videos[0]?.id || 'VID001',
            videoTitle: subData.videoTitle || state.videos[0]?.title || 'Video Title',
            languages: subData.languages || ['English', 'Hindi'],
            modified: subData.modified || new Date().toISOString().split('T')[0],
            titleDescriptionState: subData.titleDescriptionState || 'Published',
            subtitlesState: subData.subtitlesState || 'Published'
          };
          return {
            subtitles: [newSub, ...state.subtitles],
            hasCrmOverrides: true
          };
        });
        get().persistToDatabase();
      },

      crmUpdateSubtitleTrack: (id, updates) => {
        set((state) => ({
          subtitles: state.subtitles.map(s => s.id === id ? { ...s, ...updates } : s),
          hasCrmOverrides: true
        }));
        get().persistToDatabase();
      },

      crmDeleteSubtitleTrack: (id) => {
        set((state) => ({
          subtitles: state.subtitles.filter(s => s.id !== id),
          hasCrmOverrides: true
        }));
        get().persistToDatabase();
      },

      crmAddNotification: (notifData) => {
        set((state) => {
          const id = notifData.id || `n_${Date.now()}`;
          const newNotif = {
            id,
            title: notifData.title || 'Studio Notification',
            message: notifData.message || '',
            time: notifData.time || 'Just now',
            read: false
          };
          return {
            notifications: [newNotif, ...state.notifications],
            hasCrmOverrides: true
          };
        });
        get().persistToDatabase();
      },

      crmDeleteNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id),
          hasCrmOverrides: true
        }));
        get().persistToDatabase();
      },

      crmUpdateEarnConfig: (updates) => {
        set((state) => ({
          earnConfig: { ...(state.earnConfig || {}), ...updates },
          hasCrmOverrides: true
        }));
        get().persistToDatabase();
      },

      crmImportState: (newState) => {
        set((state) => ({
          ...state,
          ...newState,
          hasCrmOverrides: true
        }));
        get().persistToDatabase();
      },

      reloadFromSpreadsheet: () => {
        set({ hasCrmOverrides: false });
        return get().refreshSpreadsheet();
      }
    }),
    {
      name: 'yt-studio-analytics-v5',
      storage: createJSONStorage(() => (typeof window !== 'undefined' && window.localStorage ? window.localStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} })),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (state.channelInfo) {
            if (state.channelInfo.revenueLast28DaysFormatted) {
              state.channelInfo.revenueLast28DaysFormatted = formatINR(state.channelInfo.revenueLast28DaysFormatted);
            }
            if (state.channelInfo.totalRevenueFormatted) {
              state.channelInfo.totalRevenueFormatted = formatINR(state.channelInfo.totalRevenueFormatted);
            }
            state.channelInfo.currency = 'INR';
          }
          if (state.videos && Array.isArray(state.videos)) {
            state.videos = state.videos.map(v => {
              const subsGained = Number(v.subscribersGained !== undefined ? v.subscribersGained : (v.subscribers || 0));
              const netSubs = Number(v.netSubscribers !== undefined ? v.netSubscribers : subsGained);
              return {
                ...v,
                revenueFormatted: formatINR(v.revenueFormatted || v.revenue),
                subscribersNetFormatted: fmtS(netSubs),
                subscribersGainedFormatted: fmtS(subsGained),
                viewsFormatted: fmtV(v.views),
                watchTimeHrsFormatted: fmtW(v.watchTimeHrs)
              };
            });
          }
          if (state.settings) {
            state.settings.currency = 'INR - Indian Rupee';
          }
        }
      },
      partialize: (state) => ({
        settings: state.settings,
        spreadsheetConfig: state.spreadsheetConfig,
        selectedDateRange: state.selectedDateRange,
        simulationAnchorDate: state.simulationAnchorDate,
        customStartDate: state.customStartDate,
        customEndDate: state.customEndDate,
        dateRangeVersion: state.dateRangeVersion,
        hasCrmOverrides: state.hasCrmOverrides,
        channelInfo: state.channelInfo,
        videos: state.videos,
        shorts: state.shorts,
        comments: state.comments,
        playlists: state.playlists,
        subtitles: state.subtitles,
        copyrightClaims: state.copyrightClaims,
        audioTracks: state.audioTracks,
        notifications: state.notifications,
        earnConfig: state.earnConfig,
        trafficSourcesCustom: state.trafficSourcesCustom,
        searchTermsCustom: state.searchTermsCustom,
        externalSourcesCustom: state.externalSourcesCustom,
        audienceCustom: state.audienceCustom,
        revenueCustom: state.revenueCustom,
        realtimeCustom: state.realtimeCustom
      })
    }
  )
);
