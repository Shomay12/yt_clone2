import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { parseAvdToSeconds, formatSecondsToAvd } from '../services/InsforgeService';
import { formatDateRangeText, formatSingleDate } from '../engine/AnalyticsSimulationEngine';
import './CRM.css';

// ── helpers ──────────────────────────────────────────────────────────────────
const parseSmartNumber = (val, fallback = 0) => {
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  if (!val || typeof val !== 'string') return fallback;
  const cleaned = val.trim().replace(/,/g, '');
  if (/^[-+]?[0-9]*\.?[0-9]+[kK]$/i.test(cleaned)) {
    return parseFloat(cleaned) * 1_000;
  }
  if (/^[-+]?[0-9]*\.?[0-9]+[mM]$/i.test(cleaned)) {
    return parseFloat(cleaned) * 1_000_000;
  }
  if (/^[-+]?[0-9]*\.?[0-9]+[bB]$/i.test(cleaned)) {
    return parseFloat(cleaned) * 1_000_000_000;
  }
  if (/^[-+]?[0-9]*\.?[0-9]+[lL]$/i.test(cleaned)) {
    return parseFloat(cleaned) * 100_000;
  }
  if (/^[-+]?[0-9]*\.?[0-9]+[cC][rR]?$/i.test(cleaned)) {
    return parseFloat(cleaned) * 10_000_000;
  }
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? fallback : parsed;
};

const fmt = (n) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M`
  : n >= 1_000   ? `${(n / 1_000).toFixed(2)}K`
  : String(Math.round(n));

const fmtINR = (n) =>
  `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PRESET_THUMBNAILS = [
  { label: 'Studio Neon 1', url: '/thumbnails/1.webp' },
  { label: 'Studio Neon 2', url: '/thumbnails/2.webp' },
  { label: 'Studio Neon 3', url: '/thumbnails/3.webp' },
  { label: 'AI Neural Core', url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=80' },
  { label: 'Abstract 3D Waves', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80' },
  { label: 'Cyberpunk Setup', url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80' },
  { label: 'Tech Workspace', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80' },
  { label: 'Matrix Code', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80' }
];

// ── sub-components ───────────────────────────────────────────────────────────
const StatPreview = ({ label, value, color = '#a78bfa' }) => (
  <div className="crm-stat-preview">
    <span className="crm-stat-label">{label}</span>
    <span className="crm-stat-value" style={{ color }}>{value}</span>
  </div>
);

const CRMInput = ({ label, value, onChange, type = 'number', min, max, step = 1, unit, placeholder, onKeyDown }) => {
  const [localVal, setLocalVal] = useState(value !== undefined && value !== null ? String(value) : '');
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) {
      setLocalVal(value !== undefined && value !== null ? String(value) : '');
    }
  }, [value]);

  const handleChange = (e) => {
    const text = e.target.value;
    setLocalVal(text);
    if (type === 'number') {
      if (text.trim() === '' || text === '-') {
        onChange(0);
      } else {
        const num = parseSmartNumber(text, null);
        if (num !== null) {
          onChange(num);
        }
      }
    } else {
      onChange(text);
    }
  };

  const handleBlur = () => {
    isFocused.current = false;
    if (type === 'number') {
      const num = parseSmartNumber(localVal, value ?? 0);
      onChange(num);
      setLocalVal(String(num));
    }
  };

  return (
    <div className="crm-field">
      <label className="crm-field-label">{label}{unit && <span className="crm-unit">{unit}</span>}</label>
      <input
        className="crm-input"
        type={type === 'number' ? 'text' : type}
        placeholder={placeholder}
        value={localVal}
        min={min}
        max={max}
        step={step}
        onFocus={() => { isFocused.current = true; }}
        onBlur={handleBlur}
        onChange={handleChange}
        onKeyDown={onKeyDown}
      />
    </div>
  );
};

// ── Main CRM Component ────────────────────────────────────────────────────────
export default function CRM() {
  const {
    channelInfo, videos,
    shorts = [], comments = [], playlists = [], settings = {}, subtitles = [], audioTracks = [],
    copyrightClaims = [], notifications = [], earnConfig = {},
    trafficSourcesCustom = [], searchTermsCustom = [], externalSourcesCustom = [],
    audienceCustom = {}, revenueCustom = {}, realtimeCustom = {},
    simulationAnchorDate, selectedDateRange, customStartDate, customEndDate,
    setSimulationAnchorDate, setDateRange,
    crmUpdateChannelMetrics, updateVideoMetrics,
    bulkSetVideoRPM, bulkMultiplyViews,
    crmApplyPreset, reloadFromSpreadsheet,
    crmAddComment, crmUpdateComment, crmDeleteComment,
    crmAddPlaylist, crmUpdatePlaylist, crmDeletePlaylist,
    crmUpdateSettings, crmImportState,
    crmAddVideo, crmDeleteVideo, crmDuplicateVideo,
    crmAddShort, crmUpdateShort, crmDeleteShort,
    crmAddCopyrightClaim, crmDeleteCopyrightClaim,
    crmAddAudioTrack, crmDeleteAudioTrack,
    crmAddSubtitleTrack, crmUpdateSubtitleTrack, crmDeleteSubtitleTrack,
    crmAddNotification, crmDeleteNotification,
    crmUpdateEarnConfig,
    crmUpdateTrafficSources, crmUpdateSearchTerms, crmUpdateExternalSources,
    crmUpdateAudience, crmUpdateRevenueCustom, crmUpdateRealtimeConfig,
    loadFromDatabase, persistToDatabase, isDatabaseLoading, isDatabaseConnected, lastDatabaseSync,
    showToast
  } = useStore();

  const [activeSection, setActiveSection] = useState('growth');
  const [videoSearch, setVideoSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editBuf, setEditBuf] = useState({});
  const [bulkRPM, setBulkRPM] = useState(33.64);
  const [bulkFactor, setBulkFactor] = useState(1.0);

  // New Video Creation Draft State
  const [newVideoDraft, setNewVideoDraft] = useState({
    title: '',
    description: '',
    thumbnail: '/thumbnails/1.webp',
    duration: '10:15',
    durationSecs: 615,
    avgViewDuration: '3:45',
    avgViewDurationSecs: 225,
    views: 250000,
    rpm: 33.64,
    ctr: 8.5,
    likes: 11500,
    comments: 850,
    category: 'Entertainment',
    visibility: 'Public',
    monetization: 'On'
  });

  // Shorts Manager State
  const [newShortDraft, setNewShortDraft] = useState({
    title: '',
    views: 350000,
    likes: 24000,
    comments: 850,
    remixes: 320,
    viewedPct: 82.5,
    swipedAwayPct: 17.5,
    thumbnail: '/thumbnails/1.webp',
    visibility: 'Public'
  });

  // Copyright Claims State
  const [newClaimDraft, setNewClaimDraft] = useState({
    videoTitle: videos[0]?.title || 'AI Course',
    matchingVideoTitle: 'Royalty Ambient Sound',
    matchingChannel: 'Global Sound Lab',
    matchPercent: '15%',
    segment: '02:10 - 03:45',
    views: 250000,
    status: 'Active (No penalty)'
  });

  // Audio Library State
  const [newAudioDraft, setNewAudioDraft] = useState({
    title: '',
    artist: 'Axiom Audio',
    duration: '3:20',
    genre: 'Electronic',
    mood: 'Bright',
    starred: false
  });

  // Subtitles & Translations State
  const [newSubDraft, setNewSubDraft] = useState({
    videoId: videos[0]?.id || 'VID001',
    videoTitle: videos[0]?.title || 'Video Title',
    languagesStr: 'English, Hindi, Spanish',
    titleDescriptionState: 'Published',
    subtitlesState: 'Published'
  });

  // Studio Notifications State
  const [newNotifDraft, setNewNotifDraft] = useState({
    title: '',
    message: '',
    time: 'Just now'
  });

  // Earn & Monetization State
  const [earnDraft, setEarnDraft] = useState({
    yppStatus: earnConfig?.yppStatus || 'Active Partner',
    watchPageAds: earnConfig?.watchPageAds !== false,
    shortsAds: earnConfig?.shortsAds !== false,
    memberships: earnConfig?.memberships !== false,
    supers: earnConfig?.supers !== false,
    shopping: earnConfig?.shopping !== false,
    subscribersTarget: earnConfig?.subscribersTarget || 1000,
    watchHoursTarget: earnConfig?.watchHoursTarget || 4000,
    shortsViewsTarget: earnConfig?.shortsViewsTarget || 10000000
  });

  useEffect(() => {
    if (earnConfig) {
      setEarnDraft({
        yppStatus: earnConfig.yppStatus || 'Active Partner',
        watchPageAds: earnConfig.watchPageAds !== false,
        shortsAds: earnConfig.shortsAds !== false,
        memberships: earnConfig.memberships !== false,
        supers: earnConfig.supers !== false,
        shopping: earnConfig.shopping !== false,
        subscribersTarget: earnConfig.subscribersTarget || 1000,
        watchHoursTarget: earnConfig.watchHoursTarget || 4000,
        shortsViewsTarget: earnConfig.shortsViewsTarget || 10000000
      });
    }
  }, [earnConfig]);

  // Traffic Sources Modulation State
  const [trafficDraft, setTrafficDraft] = useState(trafficSourcesCustom || []);
  const [searchTermsDraft, setSearchTermsDraft] = useState(searchTermsCustom || []);
  const [externalSourcesDraft, setExternalSourcesDraft] = useState(externalSourcesCustom || []);
  const [newSearchTerm, setNewSearchTerm] = useState({ term: '', percentage: 10 });
  const [newExternalSource, setNewExternalSource] = useState({ source: '', percentage: 10 });

  // Audience Modulation State
  const [audienceDraft, setAudienceDraft] = useState({
    returningViewers: audienceCustom?.returningViewers || 34.2,
    newViewers: audienceCustom?.newViewers || 65.8,
    uniqueViewersCount: audienceCustom?.uniqueViewersCount || 840000,
    subscribedWatchTimePct: audienceCustom?.subscribedWatchTimePct || 41.5,
    nonSubscribedWatchTimePct: audienceCustom?.nonSubscribedWatchTimePct || 58.5,
    geographies: audienceCustom?.geographies || [
      { country: 'United States', percentage: 38.5, rpm: 48.20 },
      { country: 'Canada', percentage: 11.2, rpm: 42.50 },
      { country: 'United Kingdom', percentage: 9.8, rpm: 39.80 },
      { country: 'Germany', percentage: 8.4, rpm: 38.10 },
      { country: 'Australia', percentage: 6.5, rpm: 41.00 },
      { country: 'India', percentage: 14.2, rpm: 4.20 },
      { country: 'Brazil', percentage: 4.0, rpm: 6.50 }
    ],
    ageGender: audienceCustom?.ageGender || [
      { group: '18–24 years', percentage: 22.4, male: 74, female: 26 },
      { group: '25–34 years', percentage: 48.6, male: 76, female: 24 },
      { group: '35–44 years', percentage: 18.2, male: 72, female: 28 },
      { group: '45–54 years', percentage: 7.1, male: 70, female: 30 },
      { group: '55+ years', percentage: 3.7, male: 68, female: 32 }
    ]
  });
  const [newCountry, setNewCountry] = useState({ country: '', percentage: 5.0, rpm: 35.00 });

  // Revenue Modulation State
  const [revenueDraft, setRevenueDraft] = useState({
    monthlyRevenue: revenueCustom?.monthlyRevenue || [
      { month: 'August 2026', revenue: 42050.00, formatted: '₹42,050.00' },
      { month: 'July 2026', revenue: 68420.00, formatted: '₹68,420.00' },
      { month: 'June 2026', revenue: 59310.00, formatted: '₹59,310.00' },
      { month: 'May 2026', revenue: 54100.00, formatted: '₹54,100.00' },
      { month: 'April 2026', revenue: 61850.00, formatted: '₹61,850.00' },
      { month: 'March 2026', revenue: 49200.00, formatted: '₹49,200.00' }
    ],
    revenueStreams: revenueCustom?.revenueStreams || [
      { stream: 'Watch Page Ads', percentage: 84.5 },
      { stream: 'YouTube Premium', percentage: 9.2 },
      { stream: 'Channel Memberships', percentage: 4.1 },
      { stream: 'Super Chat & Stickers', percentage: 2.2 }
    ],
    adTypes: revenueCustom?.adTypes || [
      { type: 'Skippable video ads', percentage: 68.4 },
      { type: 'Non-skippable ads', percentage: 19.2 },
      { type: 'Bumper ads', percentage: 8.1 },
      { type: 'Display / Overlay ads', percentage: 4.3 }
    ]
  });

  // Realtime & Live Ticker State
  const [realtimeDraft, setRealtimeDraft] = useState({
    liveSubsDelta: realtimeCustom?.liveSubsDelta || 0,
    speedMultiplier: realtimeCustom?.speedMultiplier || 1.0,
    override48h: realtimeCustom?.override48h || '',
    override60m: realtimeCustom?.override60m || ''
  });

  // Extended CRM: Comments Management State
  const [commentFilter, setCommentFilter] = useState('All');
  const [commentSearch, setCommentSearch] = useState('');
  const [newCommentDraft, setNewCommentDraft] = useState({
    author: '',
    text: '',
    videoId: videos[0]?.id || 'VID001',
    likes: 0,
    heart: false,
    status: 'Published'
  });
  const [replyDrafts, setReplyDrafts] = useState({});

  // Extended CRM: Playlists Management State
  const [newPlaylistDraft, setNewPlaylistDraft] = useState({
    title: '',
    visibility: 'Public',
    videoCount: 0
  });

  // Extended CRM: Settings & Branding State
  const [settingsDraft, setSettingsDraft] = useState({
    name: channelInfo?.name || 'Kids Toon',
    handle: channelInfo?.handle || '@kidstoon',
    avatar: channelInfo?.avatar || '/channel-avatar.png',
    banner: channelInfo?.banner || '',
    country: channelInfo?.country || 'United States',
    currency: settings?.currency || 'INR - Indian Rupee',
    theme: settings?.theme || 'Dark',
    defaultVisibility: settings?.defaultVisibility || 'Public',
    defaultCategory: settings?.defaultCategory || 'Entertainment',
    keywords: settings?.keywords || '',
    blockedWords: settings?.blockedWords || ''
  });

  useEffect(() => {
    if (channelInfo || settings) {
      setSettingsDraft({
        name: channelInfo?.name || 'Kids Toon',
        handle: channelInfo?.handle || '@kidstoon',
        avatar: channelInfo?.avatar || '/channel-avatar.png',
        banner: channelInfo?.banner || '',
        country: channelInfo?.country || 'United States',
        currency: settings?.currency || 'INR - Indian Rupee',
        theme: settings?.theme || 'Dark',
        defaultVisibility: settings?.defaultVisibility || 'Public',
        defaultCategory: settings?.defaultCategory || 'Entertainment',
        keywords: settings?.keywords || '',
        blockedWords: settings?.blockedWords || ''
      });
    }
  }, [channelInfo, settings]);

  useEffect(() => {
    if (trafficSourcesCustom?.length) setTrafficDraft(trafficSourcesCustom);
    if (searchTermsCustom?.length) setSearchTermsDraft(searchTermsCustom);
    if (externalSourcesCustom?.length) setExternalSourcesDraft(externalSourcesCustom);
  }, [trafficSourcesCustom, searchTermsCustom, externalSourcesCustom]);

  // Date Range Draft State
  const [dateDraft, setDateDraft] = useState({
    anchorDate: simulationAnchorDate || '2026-08-12',
    startDate: customStartDate || '2026-07-16',
    endDate: customEndDate || '2026-08-12',
    preset: selectedDateRange || 'last28'
  });

  useEffect(() => {
    setDateDraft({
      anchorDate: simulationAnchorDate || '2026-08-12',
      startDate: customStartDate || '2026-07-16',
      endDate: customEndDate || '2026-08-12',
      preset: selectedDateRange || 'last28'
    });
  }, [simulationAnchorDate, customStartDate, customEndDate, selectedDateRange]);

  // Selected video for dedicated Video Growth & Thumbnails section
  const [selectedVideoId, setSelectedVideoId] = useState(videos[0]?.id || 'vid_01');
  const [selectedVideoDraft, setSelectedVideoDraft] = useState({
    thumbnail: videos[0]?.thumbnail || '/thumbnails/1.webp',
    duration: videos[0]?.duration || '10:18',
    durationSecs: videos[0]?.durationSecs || 618,
    subscribersGained: videos[0]?.subscribersGained || 29800,
    subscribersLost: videos[0]?.subscribersLost || 3576,
    views: videos[0]?.views || 2130000,
    likes: videos[0]?.likes || 98000,
    comments: videos[0]?.comments || 7240,
    rpm: videos[0]?.rpm || 33.64,
    avgViewDuration: videos[0]?.avgViewDuration || '1:45',
    avgViewDurationSecs: videos[0]?.avgViewDurationSecs || 105,
    title: videos[0]?.title || ''
  });

  const fileInputRef = useRef(null);

  const [channelDraft, setChannelDraft] = useState({
    subscribers: channelInfo?.subscribers ?? 412850,
    subscribersGainedLast28Days: channelInfo?.subscribersGainedLast28Days ?? 214,
    viewsLast28Days: channelInfo?.viewsLast28Days ?? 1250000,
    watchTimeLast28Days: channelInfo?.watchTimeLast28Days ?? 1383.8,
    revenueLast28Days: channelInfo?.revenueLast28Days ?? 42050.00,
    name: channelInfo?.name || 'Kids Toon',
    avatar: channelInfo?.avatar || '',
  });

  useEffect(() => {
    if (channelInfo) {
      setChannelDraft({
        subscribers: channelInfo.subscribers ?? 412850,
        subscribersGainedLast28Days: channelInfo.subscribersGainedLast28Days ?? 214,
        viewsLast28Days: channelInfo.viewsLast28Days ?? 1250000,
        watchTimeLast28Days: channelInfo.watchTimeLast28Days ?? 1383.8,
        revenueLast28Days: channelInfo.revenueLast28Days ?? 42050.00,
        name: channelInfo.name || 'Kids Toon',
        avatar: channelInfo.avatar || '',
      });
    }
  }, [channelInfo]);

  // Keep selected video draft in sync when selecting a different video
  const activeVideo = useMemo(() => {
    return videos.find(v => v.id === selectedVideoId || String(v.id) === String(selectedVideoId)) || videos[0];
  }, [videos, selectedVideoId]);

  useEffect(() => {
    if (activeVideo) {
      const avdSecs = activeVideo.avgViewDurationSecs || parseAvdToSeconds(activeVideo.avgViewDuration, 105);
      const avdStr = activeVideo.avgViewDuration || formatSecondsToAvd(avdSecs);
      const durSecs = activeVideo.durationSecs || parseAvdToSeconds(activeVideo.duration, 618);
      const durStr = activeVideo.duration || formatSecondsToAvd(durSecs);
      const vViews = activeVideo.views || 0;
      const vRpm = activeVideo.rpm || 33.64;
      const vRev = activeVideo.revenue != null ? Number(activeVideo.revenue) : parseFloat(((vViews / 1000) * vRpm).toFixed(2));
      setSelectedVideoDraft({
        thumbnail: activeVideo.thumbnail || '/thumbnails/1.webp',
        duration: durStr,
        durationSecs: durSecs,
        subscribersGained: activeVideo.subscribersGained !== undefined ? activeVideo.subscribersGained : Math.round((activeVideo.views || 10000) * 0.014),
        subscribersLost: activeVideo.subscribersLost !== undefined ? activeVideo.subscribersLost : Math.round(((activeVideo.subscribersGained || 1000) * 0.12)),
        views: vViews,
        revenue: vRev,
        likes: activeVideo.likes || 0,
        comments: activeVideo.comments || 0,
        rpm: vRpm,
        avgViewDuration: avdStr,
        avgViewDurationSecs: avdSecs,
        title: activeVideo.title || ''
      });
    }
  }, [selectedVideoId, activeVideo]);

  const filteredVideos = useMemo(() =>
    videos.filter(v => v.title?.toLowerCase().includes(videoSearch.toLowerCase())),
    [videos, videoSearch]
  );

  const totalRevenue = useMemo(() =>
    videos.reduce((acc, v) => acc + (v.revenue != null ? Number(v.revenue) : (((Number(v.views) || 0) / 1000) * (Number(v.rpm) || 33.64))), 0), [videos]);

  const totalViews = useMemo(() =>
    videos.reduce((acc, v) => acc + (Number(v.views) || 0), 0), [videos]);

  const avgRPM = useMemo(() => {
    const rpms = videos.filter(v => v.rpm).map(v => v.rpm);
    return rpms.length ? (rpms.reduce((a, b) => a + b, 0) / rpms.length).toFixed(2) : '0.00';
  }, [videos]);

  function startEdit(v) {
    setEditingId(v.id);
    const avdSecs = v.avgViewDurationSecs || parseAvdToSeconds(v.avgViewDuration, 105);
    const avdStr = v.avgViewDuration || formatSecondsToAvd(avdSecs);
    const durSecs = v.durationSecs || parseAvdToSeconds(v.duration, 618);
    const durStr = v.duration || formatSecondsToAvd(durSecs);
    const vViews = Number(v.views) || 0;
    const vRpm = Number(v.rpm) || 33.64;
    const vRev = v.revenue != null ? Number(v.revenue) : parseFloat(((vViews / 1000) * vRpm).toFixed(2));
    setEditBuf({
      views: vViews,
      likes: v.likes || 0,
      comments: v.comments || 0,
      rpm: vRpm,
      revenue: vRev,
      duration: durStr,
      durationSecs: durSecs,
      avgViewDuration: avdStr,
      avgViewDurationSecs: avdSecs,
      subscribersGained: v.subscribersGained !== undefined ? v.subscribersGained : Math.round(vViews * 0.014),
      thumbnail: v.thumbnail
    });
  }

  function saveEdit(id) {
    const avdSecs = editBuf.avgViewDurationSecs !== undefined
      ? Number(editBuf.avgViewDurationSecs)
      : parseAvdToSeconds(editBuf.avgViewDuration, 105);
    const avdStr = editBuf.avgViewDuration || formatSecondsToAvd(avdSecs);
    const durSecs = editBuf.durationSecs !== undefined
      ? Number(editBuf.durationSecs)
      : parseAvdToSeconds(editBuf.duration, 618);
    const durStr = editBuf.duration || formatSecondsToAvd(durSecs);
    const vViews = Number(editBuf.views) || 0;
    const vRpm = Number(editBuf.rpm) || 33.64;
    const vRev = editBuf.revenue !== undefined ? Number(editBuf.revenue) : parseFloat(((vViews / 1000) * vRpm).toFixed(2));
    const vWatchTime = parseFloat(((vViews * avdSecs) / 3600).toFixed(1));
    const vSubsGained = Number(editBuf.subscribersGained) || 0;

    const payload = {
      ...editBuf,
      views: vViews,
      revenue: vRev,
      rpm: vRpm,
      duration: durStr,
      durationSecs: durSecs,
      avgViewDuration: avdStr,
      avgViewDurationSecs: avdSecs,
      watchTimeHrs: vWatchTime,
      watchTimeHrsFormatted: fmtW(vWatchTime),
      subscribersGained: vSubsGained,
      subscribersLost: 0,
      netSubscribers: vSubsGained,
      subscribersNet: vSubsGained,
      subscribersNetFormatted: fmtS(vSubsGained),
      revenueFormatted: formatINR(vRev),
      viewsFormatted: fmtV(vViews)
    };
    updateVideoMetrics(id, payload);
    setEditingId(null);
    broadcastSync();
    showToast('Video metrics, duration & thumbnail updated ✓', 'success');
  }

  function cancelEdit() { setEditingId(null); }

  const broadcastSync = () => {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('yt-studio-sync');
        bc.postMessage({ type: 'CRM_UPDATED', timestamp: Date.now() });
        bc.close();
      }
    } catch {}
  };

  function applyChannel() {
    crmUpdateChannelMetrics(channelDraft);
    broadcastSync();
    showToast('Channel metrics updated ✓', 'success');
  }

  function applyBulkRPM() {
    bulkSetVideoRPM(bulkRPM);
    broadcastSync();
    showToast(`RPM set to ₹${bulkRPM} for all videos ✓`, 'success');
  }

  function applyBulkMultiply() {
    bulkMultiplyViews(bulkFactor);
    broadcastSync();
    showToast(`All video views multiplied by ${bulkFactor}× ✓`, 'success');
  }

  function applyVideoGrowthChanges() {
    if (!activeVideo) return;
    const avdSecs = selectedVideoDraft.avgViewDurationSecs || parseAvdToSeconds(selectedVideoDraft.avgViewDuration, 105);
    const avdStr = selectedVideoDraft.avgViewDuration || formatSecondsToAvd(avdSecs);
    const durSecs = selectedVideoDraft.durationSecs || parseAvdToSeconds(selectedVideoDraft.duration, 618);
    const durStr = selectedVideoDraft.duration || formatSecondsToAvd(durSecs);
    const vViews = Number(selectedVideoDraft.views) || 0;
    const vRpm = Number(selectedVideoDraft.rpm) || 33.64;
    const vRev = selectedVideoDraft.revenue !== undefined ? Number(selectedVideoDraft.revenue) : parseFloat(((vViews / 1000) * vRpm).toFixed(2));
    const vWatchTime = parseFloat(((vViews * avdSecs) / 3600).toFixed(1));
    const vSubsGained = Number(selectedVideoDraft.subscribersGained) || 0;
    const payload = {
      ...selectedVideoDraft,
      views: vViews,
      revenue: vRev,
      rpm: vRpm,
      duration: durStr,
      durationSecs: durSecs,
      avgViewDuration: avdStr,
      avgViewDurationSecs: avdSecs,
      watchTimeHrs: vWatchTime,
      watchTimeHrsFormatted: fmtW(vWatchTime),
      subscribersGained: vSubsGained,
      subscribersLost: 0,
      netSubscribers: vSubsGained,
      subscribersNet: vSubsGained,
      subscribersNetFormatted: fmtS(vSubsGained),
      subscribersGainedFormatted: fmtS(vSubsGained),
      revenueFormatted: formatINR(vRev),
      viewsFormatted: fmtV(vViews)
    };
    updateVideoMetrics(activeVideo.id, payload);
    broadcastSync();
    showToast(`Video "${activeVideo.title?.slice(0, 24)}…" updated ✓ Reflecting across all Studio pages.`, 'success');
  }

  function applyDates() {
    setSimulationAnchorDate(dateDraft.anchorDate, dateDraft.startDate, dateDraft.endDate);
    setDateRange(dateDraft.preset, dateDraft.startDate, dateDraft.endDate);
    const label = formatDateRangeText(dateDraft.startDate, dateDraft.endDate);
    broadcastSync();
    showToast(`Date range set to "${label}" across all graphs ✓`, 'success');
  }

  // Global Keyboard Shortcuts (Cmd+S / Ctrl+S to save)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (activeSection === 'growth') applyVideoGrowthChanges();
        else if (activeSection === 'channel') applyChannel();
        else if (activeSection === 'dates') applyDates();
        else if (activeSection === 'bulk') applyBulkMultiply();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSection, selectedVideoDraft, channelDraft, dateDraft, bulkFactor, bulkRPM, activeVideo]);

  function autoCalculateEngagement() {
    const v = Number(selectedVideoDraft.views) || 0;
    const gained = Math.round(v * 0.014);
    const lost = Math.round(gained * 0.12);
    const likes = Math.round(v * 0.046);
    const comments = Math.round(v * 0.0034);
    setSelectedVideoDraft(d => ({
      ...d,
      subscribersGained: gained,
      subscribersLost: lost,
      likes,
      comments
    }));
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result;
      if (dataUrl) {
        setSelectedVideoDraft(d => ({ ...d, thumbnail: String(dataUrl) }));
        showToast('Local thumbnail image uploaded successfully ✓', 'info');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateComment = () => {
    if (!newCommentDraft.text.trim()) {
      showToast('Please enter comment text', 'warning');
      return;
    }
    crmAddComment({
      ...newCommentDraft,
      author: newCommentDraft.author.trim() || 'Viewer'
    });
    setNewCommentDraft({
      author: '',
      text: '',
      videoId: videos[0]?.id || 'VID001',
      likes: 0,
      heart: false,
      status: 'Published'
    });
    showToast('Comment published and synced to InsForge ✓', 'success');
  };

  const handleAddReply = (commentId) => {
    const text = (replyDrafts[commentId] || '').trim();
    if (!text) return;
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    const replies = [
      ...(comment.replies || []),
      {
        id: `r_${Date.now()}`,
        author: channelInfo?.name || 'Kids Toon',
        authorAvatar: channelInfo?.avatar || '/channel-avatar.png',
        time: 'Just now',
        text
      }
    ];
    crmUpdateComment(commentId, { replies });
    setReplyDrafts(prev => ({ ...prev, [commentId]: '' }));
    showToast('Reply saved to database ✓', 'success');
  };

  const handleCreatePlaylist = () => {
    if (!newPlaylistDraft.title.trim()) {
      showToast('Please enter playlist title', 'warning');
      return;
    }
    crmAddPlaylist(newPlaylistDraft);
    setNewPlaylistDraft({
      title: '',
      visibility: 'Public',
      videoCount: 0
    });
    showToast('Playlist created and synced to InsForge ✓', 'success');
  };

  const handleSaveSettings = () => {
    crmUpdateChannelMetrics({
      name: settingsDraft.name,
      handle: settingsDraft.handle,
      avatar: settingsDraft.avatar,
      banner: settingsDraft.banner,
      country: settingsDraft.country
    });
    crmUpdateSettings({
      currency: settingsDraft.currency,
      theme: settingsDraft.theme,
      country: settingsDraft.country,
      keywords: settingsDraft.keywords,
      defaultVisibility: settingsDraft.defaultVisibility,
      defaultCategory: settingsDraft.defaultCategory,
      blockedWords: settingsDraft.blockedWords
    });
    showToast('Settings & Branding saved to InsForge ✓', 'success');
  };

  const handleExportStateJSON = () => {
    const fullSnapshot = {
      channelInfo,
      videos,
      comments,
      playlists,
      settings,
      subtitles,
      audioTracks,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(fullSnapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yt_studio_crm_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported snapshot JSON ✓', 'success');
  };

  const handleImportStateJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        crmImportState(parsed);
        showToast('Imported and persisted state snapshot ✓', 'success');
      } catch (err) {
        showToast(`Failed to parse JSON: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleCreateVideo = () => {
    if (!newVideoDraft.title.trim()) {
      showToast('Please enter video title', 'warning');
      return;
    }
    crmAddVideo(newVideoDraft);
    setNewVideoDraft({
      title: '',
      description: '',
      thumbnail: '/thumbnails/1.webp',
      duration: '10:15',
      durationSecs: 615,
      avgViewDuration: '3:45',
      avgViewDurationSecs: 225,
      views: 250000,
      rpm: 33.64,
      ctr: 8.5,
      likes: 11500,
      comments: 850,
      category: 'Entertainment',
      visibility: 'Public',
      monetization: 'On'
    });
    showToast('Video created and added to YouTube Studio ✓', 'success');
  };

  const handleCreateShort = () => {
    if (!newShortDraft.title.trim()) {
      showToast('Please enter Short title', 'warning');
      return;
    }
    crmAddShort(newShortDraft);
    setNewShortDraft({
      title: '',
      views: 350000,
      likes: 24000,
      comments: 850,
      remixes: 320,
      viewedPct: 82.5,
      swipedAwayPct: 17.5,
      thumbnail: '/thumbnails/1.webp',
      visibility: 'Public'
    });
    showToast('Short created and synced to Studio Content → Shorts ✓', 'success');
  };

  const handleCreateClaim = () => {
    crmAddCopyrightClaim(newClaimDraft);
    setNewClaimDraft({
      videoTitle: videos[0]?.title || 'AI Course',
      matchingVideoTitle: 'Royalty Ambient Sound',
      matchingChannel: 'Global Sound Lab',
      matchPercent: '15%',
      segment: '02:10 - 03:45',
      views: 250000,
      status: 'Active (No penalty)'
    });
    showToast('Copyright claim added to Studio Copyright Match tool ✓', 'success');
  };

  const handleCreateAudioTrack = () => {
    if (!newAudioDraft.title.trim()) {
      showToast('Please enter audio track title', 'warning');
      return;
    }
    crmAddAudioTrack(newAudioDraft);
    setNewAudioDraft({
      title: '',
      artist: 'Axiom Audio',
      duration: '3:20',
      genre: 'Electronic',
      mood: 'Bright',
      starred: false
    });
    showToast('Track added to Studio Audio Library ✓', 'success');
  };

  const handleCreateSubtitleTrack = () => {
    const langs = newSubDraft.languagesStr.split(',').map(s => s.trim()).filter(Boolean);
    crmAddSubtitleTrack({
      ...newSubDraft,
      languages: langs.length > 0 ? langs : ['English']
    });
    showToast('Subtitles language track added to Studio Subtitles ✓', 'success');
  };

  const handleCreateNotification = () => {
    if (!newNotifDraft.title.trim()) {
      showToast('Please enter notification title', 'warning');
      return;
    }
    crmAddNotification(newNotifDraft);
    setNewNotifDraft({
      title: '',
      message: '',
      time: 'Just now'
    });
    showToast('Notification broadcasted to Studio header menu ✓', 'success');
  };

  const handleSaveEarn = () => {
    crmUpdateEarnConfig(earnDraft);
    showToast('Earn & Partner Program settings saved ✓', 'success');
  };

  const handleSaveTraffic = () => {
    crmUpdateTrafficSources(trafficDraft);
    crmUpdateSearchTerms(searchTermsDraft);
    crmUpdateExternalSources(externalSourcesDraft);
    showToast('Traffic & Discovery data saved to Studio ✓', 'success');
  };

  const handleSaveAudience = () => {
    crmUpdateAudience(audienceDraft);
    showToast('Audience & Demographics saved to Studio ✓', 'success');
  };

  const handleSaveRevenue = () => {
    crmUpdateRevenueCustom(revenueDraft);
    showToast('Revenue & Ad Types saved to Studio ✓', 'success');
  };

  const handleSaveRealtime = () => {
    crmUpdateRealtimeConfig(realtimeDraft);
    showToast('Realtime & Live Ticker settings saved ✓', 'success');
  };

  const navItems = [
    { key: 'growth',        icon: '🖼️', label: 'Thumbnails & Subs' },
    { key: 'videos',        icon: '🎬', label: 'Videos & Content' },
    { key: 'shorts',        icon: '⚡', label: 'Shorts & Reels' },
    { key: 'channel',       icon: '📡', label: 'Channel Metrics' },
    { key: 'traffic',       icon: '🚦', label: 'Traffic & Discovery' },
    { key: 'audience',      icon: '👥', label: 'Audience & Geography' },
    { key: 'revenue',       icon: '💰', label: 'Revenue & Ad Types' },
    { key: 'earn',          icon: '💎', label: 'Earn & Monetization' },
    { key: 'realtime',      icon: '🔴', label: 'Realtime & Live Ticker' },
    { key: 'comments',      icon: '💬', label: 'Comments & Community' },
    { key: 'playlists',     icon: '📑', label: 'Playlists Manager' },
    { key: 'subtitles',     icon: '🌐', label: 'Subtitles & CC' },
    { key: 'copyright',     icon: '🛡️', label: 'Copyright & Content ID' },
    { key: 'audio',         icon: '🎵', label: 'Audio Library & SFX' },
    { key: 'notifications', icon: '🔔', label: 'Studio Notifications' },
    { key: 'settings',      icon: '⚙️', label: 'Settings & Branding' },
    { key: 'dates',         icon: '📅', label: 'Dates & Range' },
    { key: 'bulk',          icon: '⚡', label: 'Bulk Actions & Presets' },
    { key: 'database',      icon: '🗄️', label: 'Database & Cloud' },
    { key: 'preview',       icon: '👁️', label: 'Live Preview' },
  ];

  return (
    <div className="crm-root">
      {/* ── Sidebar ── */}
      <aside className="crm-sidebar">
        <div className="crm-logo">
          <span className="crm-logo-icon">⚙️</span>
          <div>
            <div className="crm-logo-title">Studio CRM</div>
            <div className="crm-logo-sub">Data & Visuals Control</div>
          </div>
        </div>

        <nav className="crm-nav">
          {navItems.map(item => (
            <button
              key={item.key}
              className={`crm-nav-item ${activeSection === item.key ? 'active' : ''}`}
              onClick={() => setActiveSection(item.key)}
            >
              <span className="crm-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <a href="/channel/UCqpdVWIzEQUcbf4pAxlneOQ/dashboard" className="crm-back-btn">
          ← Back to Studio
        </a>
      </aside>

      {/* ── Main ── */}
      <main className="crm-main">

        {/* ── Header ── */}
        <div className="crm-header">
          <div>
            <h1 className="crm-title">{navItems.find(n => n.key === activeSection)?.label}</h1>
            <p className="crm-subtitle">
              {activeSection === 'growth' && 'Edit per-video subscriber gain and replace thumbnails with live instant synchronization across Studio & Analytics'}
              {activeSection === 'videos' && 'Manage all videos, create new uploads, duplicate, delete and edit metrics in real time'}
              {activeSection === 'shorts' && 'Create and manage YouTube Shorts, view swipe-away rates, remix counts, and sync with Content Shorts'}
              {activeSection === 'channel' && 'Edit channel-level stats — changes reflect instantly in YouTube Studio'}
              {activeSection === 'traffic' && 'Modulate traffic sources (Browse, Suggested, Search %, External apps, and Top search keywords)'}
              {activeSection === 'audience' && 'Modulate Returning vs New Viewers, Subscribed Watch Time, Top Geographies, and Age/Gender breakdown'}
              {activeSection === 'revenue' && 'Modulate Monthly Estimated Revenue, Revenue Streams, and Ad Type distributions'}
              {activeSection === 'earn' && 'Configure YouTube Partner Program (YPP) status, milestone requirements, and active monetization streams'}
              {activeSection === 'realtime' && 'Modulate 48-Hour & 60-Minute Realtime graphs, Live Subscriber counter, and ticker speeds'}
              {activeSection === 'comments' && 'Moderate community comments, create new comments, pin/heart, reply, and sync with Studio Community page'}
              {activeSection === 'playlists' && 'Manage channel playlists, visibility, and video counts synced with Studio Content'}
              {activeSection === 'subtitles' && 'Manage multi-language translation tracks, subtitle publication states per video'}
              {activeSection === 'copyright' && 'Simulate and manage Content ID copyright matches and takedown statuses'}
              {activeSection === 'audio' && 'Add royalty-free music and sound effects to the Creator Studio Audio Library'}
              {activeSection === 'notifications' && 'Broadcast custom notifications and milestones to the Studio top navigation'}
              {activeSection === 'settings' && 'Configure channel identity, keywords, upload defaults, and moderation filters'}
              {activeSection === 'dates' && 'Control simulation anchor dates, 28-day window (e.g. Jul 16 – Aug 12, 2026), and synchronize date axes across all graphs'}
              {activeSection === 'bulk' && 'Apply batch changes across all videos at once'}
              {activeSection === 'database' && 'InsForge PostgreSQL backend overview, synchronization control, JSON export and import'}
              {activeSection === 'preview' && 'Read-only live snapshot of current store values'}
            </p>
          </div>
          <div className="crm-header-badges">
            <span className="crm-badge crm-badge-green">● Live InsForge BaaS</span>
            <span className="crm-badge">{videos.length} videos</span>
            <span className="crm-badge">{shorts.length} shorts</span>
            <span className="crm-badge">{comments.length} comments</span>
          </div>
        </div>

        {/* ── DEDICATED THUMBNAILS & SUBS SECTION ── */}
        {activeSection === 'growth' && (
          <div className="crm-section">
            {/* Top Video Selector Rail */}
            <div className="crm-card">
              <div className="crm-card-header-flex">
                <div className="crm-card-title">🎯 1. Select Video to Customize</div>
                <span className="crm-badge">{filteredVideos.length} Available</span>
              </div>
              <input
                className="crm-search"
                placeholder="🔍  Search video title to select…"
                value={videoSearch}
                onChange={e => setVideoSearch(e.target.value)}
              />

              <div className="crm-video-chips-grid">
                {filteredVideos.map(v => {
                  const isSel = (v.id === selectedVideoId || String(v.id) === String(selectedVideoId));
                  return (
                    <div
                      key={v.id}
                      className={`crm-video-chip ${isSel ? 'active' : ''}`}
                      onClick={() => setSelectedVideoId(v.id)}
                    >
                      <img src={v.thumbnail} alt="" className="crm-chip-thumb" />
                      <div className="crm-chip-details">
                        <div className="crm-chip-title">{v.title}</div>
                        <div className="crm-chip-meta">
                          <span>👁️ {v.viewsFormatted || fmt(v.views)}</span>
                          <span className="crm-chip-subs">👥 +{fmt(v.subscribersGained || Math.round(v.views * 0.014))} subs</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Video Customization Studio */}
            {activeVideo && (
              <div className="crm-grid-2">
                {/* Thumbnail Customizer Card */}
                <div className="crm-card">
                  <div className="crm-card-title">🖼️ 2. Change Thumbnail</div>
                  <p className="crm-card-desc">
                    Upload any image from your computer, paste a URL, or choose a preset. Updates thumbnail on Dashboard, Content, Video Analytics, Sidebar and search.
                  </p>

                  <div className="crm-thumbnail-preview-frame">
                    <img
                      src={selectedVideoDraft.thumbnail}
                      alt="Thumbnail Preview"
                      className="crm-thumbnail-preview-img"
                    />
                    <div className="crm-preview-duration-badge">{selectedVideoDraft.duration || activeVideo.duration || '10:18'}</div>
                  </div>

                  <div className="crm-field">
                    <label className="crm-field-label">Thumbnail Image URL</label>
                    <input
                      className="crm-input"
                      type="text"
                      placeholder="https://... or /thumbnails/1.webp"
                      value={selectedVideoDraft.thumbnail}
                      onChange={e => setSelectedVideoDraft(d => ({ ...d, thumbnail: e.target.value }))}
                    />
                  </div>

                  <div className="crm-upload-row">
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      accept="image/*"
                      onChange={handleFileUpload}
                    />
                    <button
                      type="button"
                      className="crm-btn crm-btn-edit crm-file-btn"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      📁 Upload Image from PC
                    </button>
                    <span className="crm-upload-hint">Supports PNG, JPG, WebP, GIF</span>
                  </div>

                  <div className="crm-presets-block">
                    <label className="crm-field-label">Quick Preset Thumbnails</label>
                    <div className="crm-preset-thumbs-grid">
                      {PRESET_THUMBNAILS.map((pt, i) => (
                        <div
                          key={i}
                          className={`crm-preset-thumb-card ${selectedVideoDraft.thumbnail === pt.url ? 'active' : ''}`}
                          onClick={() => setSelectedVideoDraft(d => ({ ...d, thumbnail: pt.url }))}
                        >
                          <img src={pt.url} alt={pt.label} />
                          <span>{pt.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Subscriber Gain, Video Duration & AVD Timing Card */}
                <div className="crm-card">
                  <div className="crm-card-title">⏱️ 3. Edit Video Duration, AVD & Subscribers</div>
                  <p className="crm-card-desc">
                    Define total video length, average view duration (AVD), subscriber gain, and engagement. Reflects instantly across Video Analytics, Watch Time, and Studio Content pages.
                  </p>

                  {/* Video Duration & AVD Duration Controls */}
                  <div className="crm-grid-2">
                    <CRMInput
                      label="Video Total Duration"
                      type="text"
                      placeholder="e.g. 10:18 or 14:22"
                      value={selectedVideoDraft.duration || '10:18'}
                      onChange={v => {
                        const secs = parseAvdToSeconds(v, 618);
                        setSelectedVideoDraft(d => ({
                          ...d,
                          duration: String(v),
                          durationSecs: secs
                        }));
                      }}
                    />
                    <CRMInput
                      label="Average View Duration (AVD)"
                      type="text"
                      placeholder="e.g. 3:45 or 225s"
                      value={selectedVideoDraft.avgViewDuration || '1:45'}
                      onChange={v => {
                        const secs = parseAvdToSeconds(v, 105);
                        setSelectedVideoDraft(d => ({
                          ...d,
                          avgViewDuration: String(v),
                          avgViewDurationSecs: secs
                        }));
                      }}
                    />
                  </div>

                  <div className="crm-quick-pill-row" style={{ marginTop: 4 }}>
                    <span className="crm-field-label" style={{ marginBottom: 0 }}>Duration presets:</span>
                    {['3:20', '5:45', '8:12', '10:18', '14:22', '18:40', '25:00', '42:15'].map(dStr => (
                      <button
                        key={dStr}
                        type="button"
                        className={`crm-mini-pill ${selectedVideoDraft.duration === dStr ? 'active-pill' : ''}`}
                        onClick={() => {
                          const secs = parseAvdToSeconds(dStr, 618);
                          setSelectedVideoDraft(d => ({
                            ...d,
                            duration: dStr,
                            durationSecs: secs
                          }));
                        }}
                      >
                        ⏱️ {dStr}
                      </button>
                    ))}
                  </div>

                  <div className="crm-quick-pill-row" style={{ marginTop: 4 }}>
                    <span className="crm-field-label" style={{ marginBottom: 0 }}>AVD presets:</span>
                    {['0:45', '1:30', '2:45', '4:15', '6:30', '8:00', '12:00'].map(tStr => (
                      <button
                        key={tStr}
                        type="button"
                        className={`crm-mini-pill ${selectedVideoDraft.avgViewDuration === tStr ? 'active-pill' : ''}`}
                        onClick={() => {
                          const secs = parseAvdToSeconds(tStr, 105);
                          setSelectedVideoDraft(d => ({
                            ...d,
                            avgViewDuration: tStr,
                            avgViewDurationSecs: secs
                          }));
                        }}
                      >
                        📊 {tStr}
                      </button>
                    ))}
                  </div>

                  <div className="crm-grid-2" style={{ marginTop: 8 }}>
                    <CRMInput
                      label="Subscribers Gained"
                      value={selectedVideoDraft.subscribersGained}
                      onChange={v => {
                        const gained = Number(v);
                        setSelectedVideoDraft(d => ({
                          ...d,
                          subscribersGained: gained,
                          netSubscribers: gained,
                          subscribersLost: 0
                        }));
                      }}
                      min={0}
                      step={100}
                      unit="subs"
                    />
                    <CRMInput
                      label="Video Views"
                      value={selectedVideoDraft.views}
                      onChange={v => setSelectedVideoDraft(d => ({ ...d, views: v }))}
                      min={0}
                      step={1000}
                    />
                  </div>

                  <div className="crm-grid-2" style={{ marginTop: 8 }}>
                    <CRMInput
                      label="Video RPM (₹)"
                      value={selectedVideoDraft.rpm}
                      onChange={v => {
                        const rpmVal = Number(v) || 0;
                        const viewsVal = Number(selectedVideoDraft.views) || 0;
                        setSelectedVideoDraft(d => ({
                          ...d,
                          rpm: rpmVal,
                          revenue: parseFloat(((viewsVal / 1000) * rpmVal).toFixed(2))
                        }));
                      }}
                      min={0}
                      step={0.1}
                      unit="₹"
                    />
                    <CRMInput
                      label="Estimated Revenue (₹)"
                      value={selectedVideoDraft.revenue !== undefined ? selectedVideoDraft.revenue : parseFloat((((Number(selectedVideoDraft.views) || 0) / 1000) * (Number(selectedVideoDraft.rpm) || 33.64)).toFixed(2))}
                      onChange={v => {
                        const revVal = Number(v) || 0;
                        const viewsVal = Number(selectedVideoDraft.views) || 0;
                        const calcRpm = viewsVal > 0 ? parseFloat(((revVal / (viewsVal / 1000))).toFixed(4)) : (selectedVideoDraft.rpm || 33.64);
                        setSelectedVideoDraft(d => ({
                          ...d,
                          revenue: revVal,
                          rpm: calcRpm
                        }));
                      }}
                      min={0}
                      step={100}
                      unit="₹"
                    />
                  </div>

                  <div className="crm-grid-2" style={{ marginTop: 8 }}>
                    <CRMInput
                      label="Likes Count"
                      value={selectedVideoDraft.likes}
                      onChange={v => setSelectedVideoDraft(d => ({ ...d, likes: v }))}
                      min={0}
                      step={50}
                    />
                  </div>

                  <div className="crm-grid-2" style={{ marginTop: 8 }}>
                    <CRMInput
                      label="Comments Count"
                      value={selectedVideoDraft.comments}
                      onChange={v => setSelectedVideoDraft(d => ({ ...d, comments: v }))}
                      min={0}
                      step={10}
                    />
                    <div className="crm-field">
                      <label className="crm-field-label">Calculated Watch Time</label>
                      <div className="crm-input" style={{ background: '#121224', color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                        ⏱️ {(((Number(selectedVideoDraft.views) || 0) * (selectedVideoDraft.avgViewDurationSecs || 105)) / 3600).toFixed(1)} hrs
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="crm-mini-pill"
                      style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', padding: '6px 12px', fontSize: '11px' }}
                      onClick={autoCalculateEngagement}
                    >
                      ⚡ Auto-calculate natural engagement (4.6% likes, 0.34% comments, 1.4% subs)
                    </button>
                  </div>

                  {/* Impact Summary Pill */}
                  <div className="crm-preview-small" style={{ marginTop: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>Video Duration:</span>
                      <strong style={{ color: '#e2e8f0' }}>{selectedVideoDraft.duration || '10:18'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>Average View Duration (AVD):</span>
                      <strong style={{ color: '#a78bfa' }}>{selectedVideoDraft.avgViewDuration || '1:45'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>Average Percentage Viewed (Retention):</span>
                      <strong style={{ color: '#ec4899' }}>
                        {(selectedVideoDraft.durationSecs > 0 && selectedVideoDraft.avgViewDurationSecs > 0)
                          ? `${Math.min(100, Math.round(((selectedVideoDraft.avgViewDurationSecs || 105) / selectedVideoDraft.durationSecs) * 1000) / 10)}%`
                          : '17.0%'}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>Calculated Watch Time:</span>
                      <strong style={{ color: '#38bdf8' }}>
                        {(((Number(selectedVideoDraft.views) || 0) * (selectedVideoDraft.avgViewDurationSecs || 105)) / 3600).toFixed(1)} hrs
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Calculated Revenue:</span>
                      <strong>{fmtINR((selectedVideoDraft.views / 1000) * selectedVideoDraft.rpm)}</strong>
                    </div>
                  </div>

                  <div className="crm-button-action-row" style={{ marginTop: 16 }}>
                    <button
                      className="crm-apply-btn"
                      onClick={applyVideoGrowthChanges}
                    >
                      💾 Apply & Reflect Everywhere
                    </button>
                    <a
                      href={`/channel/UCqpdVWIzEQUcbf4pAxlneOQ/analytics?v=${activeVideo.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="crm-btn crm-btn-edit"
                      style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 18px', borderRadius: '10px' }}
                    >
                      <span>📈 View in Video Analytics ↗</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── VIDEOS MANAGER ── */}
        {activeSection === 'videos' && (
          <div className="crm-section">
            {/* Create New Video Upload Form */}
            <div className="crm-card">
              <div className="crm-card-title">➕ 1. Add New Video Upload to Studio</div>
              <p className="crm-card-desc">Create a new video with custom metrics. Instantly appears in Content, Dashboard, and Analytics.</p>
              <div className="crm-grid-2">
                <div className="crm-field">
                  <label className="crm-field-label">Video Title</label>
                  <input
                    className="crm-input"
                    placeholder="e.g. Master AI Video Creation in 2026"
                    value={newVideoDraft.title}
                    onChange={e => setNewVideoDraft(d => ({ ...d, title: e.target.value }))}
                  />
                </div>
                <div className="crm-field">
                  <label className="crm-field-label">Thumbnail URL</label>
                  <input
                    className="crm-input"
                    placeholder="/thumbnails/1.webp or image URL"
                    value={newVideoDraft.thumbnail}
                    onChange={e => setNewVideoDraft(d => ({ ...d, thumbnail: e.target.value }))}
                  />
                </div>
              </div>

              <div className="crm-grid-3">
                <CRMInput
                  label="Views"
                  value={newVideoDraft.views}
                  onChange={v => setNewVideoDraft(d => ({ ...d, views: v }))}
                  min={0}
                  step={10000}
                />
                <CRMInput
                  label="RPM (₹)"
                  value={newVideoDraft.rpm}
                  onChange={v => setNewVideoDraft(d => ({ ...d, rpm: v }))}
                  min={0}
                  step={0.5}
                  unit="₹"
                />
                <CRMInput
                  label="Likes"
                  value={newVideoDraft.likes}
                  onChange={v => setNewVideoDraft(d => ({ ...d, likes: v }))}
                  min={0}
                  step={100}
                />
              </div>

              <div className="crm-grid-3">
                <div className="crm-field">
                  <label className="crm-field-label">Duration (MM:SS)</label>
                  <input
                    className="crm-input"
                    value={newVideoDraft.duration}
                    onChange={e => setNewVideoDraft(d => ({ ...d, duration: e.target.value, durationSecs: parseAvdToSeconds(e.target.value, 600) }))}
                  />
                </div>
                <div className="crm-field">
                  <label className="crm-field-label">Avg Duration AVD (MM:SS)</label>
                  <input
                    className="crm-input"
                    value={newVideoDraft.avgViewDuration}
                    onChange={e => setNewVideoDraft(d => ({ ...d, avgViewDuration: e.target.value, avgViewDurationSecs: parseAvdToSeconds(e.target.value, 180) }))}
                  />
                </div>
                <div className="crm-field">
                  <label className="crm-field-label">Category</label>
                  <select
                    className="crm-input"
                    value={newVideoDraft.category}
                    onChange={e => setNewVideoDraft(d => ({ ...d, category: e.target.value }))}
                  >
                    <option value="Entertainment">Entertainment</option>
                    <option value="Science & Technology">Science & Technology</option>
                    <option value="Education">Education</option>
                    <option value="Howto & Style">Howto & Style</option>
                    <option value="Gaming">Gaming</option>
                  </select>
                </div>
              </div>

              <button className="crm-apply-btn" onClick={handleCreateVideo} style={{ marginTop: 8 }}>
                ➕ Create & Add Video to Studio
              </button>
            </div>

            {/* Video List & Inline Editor */}
            <div className="crm-videos-toolbar">
              <input
                className="crm-search"
                placeholder="🔍  Search videos…"
                value={videoSearch}
                onChange={e => setVideoSearch(e.target.value)}
              />
              <span className="crm-badge">{filteredVideos.length} results</span>
            </div>

            <div className="crm-table-wrap">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Video & Thumbnail</th>
                    <th>Duration</th>
                    <th>Subs Gained</th>
                    <th>Views</th>
                    <th>Avg Duration (AVD)</th>
                    <th>Likes</th>
                    <th>Comments</th>
                    <th>RPM (₹)</th>
                    <th>Revenue</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVideos.map(v => {
                    const isEditing = editingId === v.id;
                    const handleInlineKeyDown = (e) => {
                      if (e.key === 'Enter') saveEdit(v.id);
                      else if (e.key === 'Escape') cancelEdit();
                    };
                    return (
                      <tr key={v.id} className={isEditing ? 'crm-row-editing' : ''}>
                        <td className="crm-vid-title-cell">
                          <img src={isEditing ? (editBuf.thumbnail || v.thumbnail) : v.thumbnail} alt="" className="crm-vid-thumb" />
                          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <span className="crm-vid-name">{v.title}</span>
                            {isEditing && (
                              <input
                                className="crm-inline-input"
                                style={{ width: '180px', marginTop: '4px', fontSize: '11px' }}
                                placeholder="Thumb URL"
                                value={editBuf.thumbnail || ''}
                                onChange={e => setEditBuf(b => ({ ...b, thumbnail: e.target.value }))}
                                onKeyDown={handleInlineKeyDown}
                              />
                            )}
                          </div>
                        </td>
                        {isEditing ? (
                          <>
                            <td><input className="crm-inline-input" type="text" style={{ width: '65px' }} value={editBuf.duration || '10:18'}
                              onKeyDown={handleInlineKeyDown}
                              placeholder="10:18"
                              onChange={e => {
                                const val = e.target.value;
                                setEditBuf(b => ({ ...b, duration: val, durationSecs: parseAvdToSeconds(val, 618) }));
                              }} /></td>
                            <td><input className="crm-inline-input" type="text" value={editBuf.subscribersGained}
                              onKeyDown={handleInlineKeyDown}
                              onChange={e => setEditBuf(b => ({ ...b, subscribersGained: parseSmartNumber(e.target.value, b.subscribersGained) }))} /></td>
                            <td><input className="crm-inline-input" type="text" value={editBuf.views}
                              onKeyDown={handleInlineKeyDown}
                              onChange={e => setEditBuf(b => ({ ...b, views: parseSmartNumber(e.target.value, b.views) }))} /></td>
                            <td><input className="crm-inline-input" type="text" style={{ width: '70px' }} value={editBuf.avgViewDuration || '1:45'}
                              onKeyDown={handleInlineKeyDown}
                              placeholder="3:45"
                              onChange={e => {
                                const val = e.target.value;
                                setEditBuf(b => ({ ...b, avgViewDuration: val, avgViewDurationSecs: parseAvdToSeconds(val, 105) }));
                              }} /></td>
                            <td><input className="crm-inline-input" type="text" value={editBuf.likes}
                              onKeyDown={handleInlineKeyDown}
                              onChange={e => setEditBuf(b => ({ ...b, likes: parseSmartNumber(e.target.value, b.likes) }))} /></td>
                            <td><input className="crm-inline-input" type="text" value={editBuf.comments}
                              onKeyDown={handleInlineKeyDown}
                              onChange={e => setEditBuf(b => ({ ...b, comments: parseSmartNumber(e.target.value, b.comments) }))} /></td>
                            <td><input className="crm-inline-input" type="text" value={editBuf.rpm}
                              onKeyDown={handleInlineKeyDown}
                              onChange={e => setEditBuf(b => ({ ...b, rpm: parseSmartNumber(e.target.value, b.rpm) }))} /></td>
                            <td className="crm-revenue-preview">
                              {fmtINR(((Number(editBuf.views) || 0) / 1000) * (Number(editBuf.rpm) || 0))}
                            </td>
                            <td className="crm-action-cell">
                              <button className="crm-btn crm-btn-save" onClick={() => saveEdit(v.id)}>Save</button>
                              <button className="crm-btn crm-btn-cancel" onClick={cancelEdit}>Cancel</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td style={{ color: '#e2e8f0', fontWeight: 500 }}>
                              {v.duration || formatSecondsToAvd(v.durationSecs || 618)}
                            </td>
                            <td style={{ color: '#4ade80', fontWeight: 600 }}>
                              +{fmt(v.subscribersGained !== undefined ? v.subscribersGained : Math.round(v.views * 0.014))}
                            </td>
                            <td>{v.viewsFormatted || fmt(v.views)}</td>
                            <td>
                              <span style={{ color: '#38bdf8', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                ⏱️ {v.avgViewDuration || formatSecondsToAvd(v.avgViewDurationSecs || 105)}
                              </span>
                            </td>
                            <td>{(v.likes || 0).toLocaleString()}</td>
                            <td>{(v.comments || 0).toLocaleString()}</td>
                            <td>₹{(v.rpm || 33.64).toFixed(2)}</td>
                            <td className="crm-revenue-cell">{v.revenueFormatted || fmtINR(v.revenue || 0)}</td>
                            <td className="crm-action-cell">
                              <button className="crm-btn crm-btn-edit" onClick={() => startEdit(v)}>Edit</button>
                              <button
                                className="crm-btn crm-btn-cancel"
                                title="Duplicate video"
                                onClick={() => {
                                  crmDuplicateVideo(v.id);
                                  showToast('Video duplicated ✓', 'info');
                                }}
                              >
                                📋 Copy
                              </button>
                              <button
                                className="crm-btn crm-btn-cancel"
                                title="Open in dedicated Thumbnail & Subs editor"
                                onClick={() => {
                                  setSelectedVideoId(v.id);
                                  setActiveSection('growth');
                                }}
                              >
                                🖼️
                              </button>
                              <button
                                className="crm-action-btn danger"
                                title="Delete video"
                                onClick={() => {
                                  crmDeleteVideo(v.id);
                                  showToast('Video deleted from Studio ✓', 'info');
                                }}
                              >
                                🗑️
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── SHORTS & REELS CRM ── */}
        {activeSection === 'shorts' && (
          <div className="crm-section">
            <div className="crm-card">
              <div className="crm-card-title">➕ 1. Create New Short</div>
              <p className="crm-card-desc">Publish a new vertical video directly to the Studio Content Shorts tab and Analytics.</p>
              <div className="crm-grid-2">
                <div className="crm-field">
                  <label className="crm-field-label">Short Title</label>
                  <input
                    className="crm-input"
                    placeholder="e.g. 3 AI tools you never knew #shorts"
                    value={newShortDraft.title}
                    onChange={e => setNewShortDraft(d => ({ ...d, title: e.target.value }))}
                  />
                </div>
                <div className="crm-field">
                  <label className="crm-field-label">Thumbnail URL</label>
                  <input
                    className="crm-input"
                    value={newShortDraft.thumbnail}
                    onChange={e => setNewShortDraft(d => ({ ...d, thumbnail: e.target.value }))}
                  />
                </div>
              </div>

              <div className="crm-grid-3">
                <CRMInput
                  label="Views"
                  value={newShortDraft.views}
                  onChange={v => setNewShortDraft(d => ({ ...d, views: v }))}
                  min={0}
                  step={10000}
                />
                <CRMInput
                  label="Likes"
                  value={newShortDraft.likes}
                  onChange={v => setNewShortDraft(d => ({ ...d, likes: v }))}
                  min={0}
                  step={500}
                />
                <CRMInput
                  label="Remixes Count"
                  value={newShortDraft.remixes}
                  onChange={v => setNewShortDraft(d => ({ ...d, remixes: v }))}
                  min={0}
                  step={50}
                />
              </div>

              <div className="crm-grid-2">
                <div className="crm-slider-row">
                  <span className="crm-slider-label">Viewed Rate</span>
                  <input
                    type="range"
                    className="crm-range-input"
                    min="0"
                    max="100"
                    step="0.5"
                    value={newShortDraft.viewedPct}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      setNewShortDraft(d => ({ ...d, viewedPct: val, swipedAwayPct: parseFloat((100 - val).toFixed(1)) }));
                    }}
                  />
                  <span className="crm-slider-val">{newShortDraft.viewedPct}%</span>
                </div>
                <div className="crm-slider-row">
                  <span className="crm-slider-label">Swiped Away</span>
                  <input
                    type="range"
                    className="crm-range-input"
                    min="0"
                    max="100"
                    step="0.5"
                    value={newShortDraft.swipedAwayPct}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      setNewShortDraft(d => ({ ...d, swipedAwayPct: val, viewedPct: parseFloat((100 - val).toFixed(1)) }));
                    }}
                  />
                  <span className="crm-slider-val">{newShortDraft.swipedAwayPct}%</span>
                </div>
              </div>

              <button className="crm-apply-btn" onClick={handleCreateShort} style={{ marginTop: 8 }}>
                ➕ Publish Short to Studio
              </button>
            </div>

            {/* Shorts List Table */}
            <div className="crm-card">
              <div className="crm-card-title">📱 Shorts Catalog ({shorts.length})</div>
              <div className="crm-table-wrap">
                <table className="crm-table crm-table-compact">
                  <thead>
                    <tr>
                      <th>Short</th>
                      <th>Views</th>
                      <th>Likes</th>
                      <th>Remixes</th>
                      <th>Viewed vs Swiped</th>
                      <th>Visibility</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shorts.map(s => (
                      <tr key={s.id}>
                        <td className="crm-vid-title-cell">
                          <img src={s.thumbnail || '/thumbnails/1.webp'} alt="" className="crm-vid-thumb" style={{ width: '40px', height: '60px', borderRadius: '4px' }} />
                          <span className="crm-vid-name">{s.title}</span>
                        </td>
                        <td>{fmt(s.views)}</td>
                        <td>{(s.likes || 0).toLocaleString()}</td>
                        <td>{(s.remixes || 0).toLocaleString()}</td>
                        <td>
                          <span style={{ color: '#4ade80' }}>{s.viewedPct || 78}%</span> / <span style={{ color: '#f87171' }}>{s.swipedAwayPct || 22}%</span>
                        </td>
                        <td>
                          <span className="crm-badge crm-badge-green">{s.visibility || 'Public'}</span>
                        </td>
                        <td>
                          <button
                            className="crm-action-btn danger"
                            onClick={() => {
                              crmDeleteShort(s.id);
                              showToast('Short deleted ✓', 'info');
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── CHANNEL METRICS ── */}
        {activeSection === 'channel' && (
          <div className="crm-section">
            <div className="crm-grid-2">
              {/* Subscribers */}
              <div className="crm-card">
                <div className="crm-card-title">👥 Subscribers</div>
                <CRMInput label="Total Subscribers" value={channelDraft.subscribers}
                  onChange={v => setChannelDraft(d => ({ ...d, subscribers: v }))} min={0} step={1000} />
                <CRMInput label="Gained (Last 28 days)" value={channelDraft.subscribersGainedLast28Days}
                  onChange={v => setChannelDraft(d => ({ ...d, subscribersGainedLast28Days: v }))} min={-999999} step={100} />
              </div>

              {/* Views & Watch time */}
              <div className="crm-card">
                <div className="crm-card-title">📊 Views & Watch Time</div>
                <CRMInput label="Views (Last 28 days)" value={channelDraft.viewsLast28Days}
                  onChange={v => setChannelDraft(d => ({ ...d, viewsLast28Days: v }))} min={0} step={1000} />
                <CRMInput label="Watch Time — Hours (Last 28 days)" value={channelDraft.watchTimeLast28Days}
                  onChange={v => setChannelDraft(d => ({ ...d, watchTimeLast28Days: v }))} min={0} step={100} />
              </div>

              {/* Revenue */}
              <div className="crm-card">
                <div className="crm-card-title">💰 Revenue</div>
                <CRMInput label="Estimated Revenue (Last 28 days)" value={channelDraft.revenueLast28Days}
                  onChange={v => setChannelDraft(d => ({ ...d, revenueLast28Days: v }))} min={0} step={100} unit="₹" />
              </div>

              {/* Channel Identity */}
              <div className="crm-card">
                <div className="crm-card-title">🎭 Channel Identity</div>
                <CRMInput label="Channel Name" value={channelDraft.name} type="text"
                  onChange={v => setChannelDraft(d => ({ ...d, name: v }))} />
                <CRMInput label="Avatar URL" value={channelDraft.avatar} type="text"
                  onChange={v => setChannelDraft(d => ({ ...d, avatar: v }))} />
              </div>
            </div>

            {/* Preview row */}
            <div className="crm-card crm-preview-bar">
              <span className="crm-card-title" style={{ margin: 0 }}>Preview</span>
              <StatPreview label="Subscribers" value={fmt(channelDraft.subscribers)} />
              <StatPreview label="Gained" value={`+${fmt(channelDraft.subscribersGainedLast28Days)}`} color="#4ade80" />
              <StatPreview label="Views 28d" value={fmt(channelDraft.viewsLast28Days)} />
              <StatPreview label="Revenue 28d" value={fmtINR(channelDraft.revenueLast28Days)} color="#fbbf24" />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <button className="crm-apply-btn" onClick={applyChannel}>
                Apply Changes to YouTube Studio
              </button>
              <button
                type="button"
                className="crm-btn crm-btn-edit"
                onClick={() => {
                  setChannelDraft(d => ({
                    ...d,
                    viewsLast28Days: totalViews,
                    revenueLast28Days: parseFloat(totalRevenue.toFixed(2)),
                    watchTimeLast28Days: Math.round(totalViews * (2.8 / 60))
                  }));
                }}
              >
                📊 Auto-align with sum of all videos
              </button>
            </div>
          </div>
        )}

        {/* ── TRAFFIC & DISCOVERY CRM ── */}
        {activeSection === 'traffic' && (
          <div className="crm-section">
            <div className="crm-grid-2">
              <div className="crm-card">
                <div className="crm-card-title">🚦 1. How Viewers Find Your Content</div>
                <p className="crm-card-desc">Adjust the percentage distribution of traffic sources shown on the Analytics Content/Reach tab.</p>
                <div className="crm-demographic-grid">
                  {trafficDraft.map((item, index) => (
                    <div key={item.source} className="crm-slider-row">
                      <span className="crm-slider-label">{item.source}</span>
                      <input
                        type="range"
                        className="crm-range-input"
                        min="0"
                        max="80"
                        step="0.1"
                        value={item.percentage}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          setTrafficDraft(prev => prev.map((t, i) => i === index ? { ...t, percentage: val } : t));
                        }}
                      />
                      <span className="crm-slider-val">{item.percentage.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: 6 }}>
                  Total: <strong>{trafficDraft.reduce((s, t) => s + t.percentage, 0).toFixed(1)}%</strong>
                </div>
              </div>

              <div className="crm-card">
                <div className="crm-card-title">🔍 2. Top YouTube Search Terms</div>
                <p className="crm-card-desc">Control what search queries appear under "YouTube search terms" in Reach analytics.</p>
                <div className="crm-demographic-grid">
                  {searchTermsDraft.map((term, index) => (
                    <div key={index} className="crm-geo-row">
                      <input
                        className="crm-input"
                        style={{ padding: '6px 10px', fontSize: '12px' }}
                        value={term.term}
                        onChange={e => {
                          const val = e.target.value;
                          setSearchTermsDraft(prev => prev.map((t, i) => i === index ? { ...t, term: val } : t));
                        }}
                      />
                      <input
                        className="crm-input"
                        type="number"
                        style={{ padding: '6px 10px', fontSize: '12px' }}
                        value={term.percentage}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          setSearchTermsDraft(prev => prev.map((t, i) => i === index ? { ...t, percentage: val } : t));
                        }}
                      />
                      <span style={{ fontSize: '12px', color: '#38bdf8' }}>% of views</span>
                      <button
                        className="crm-action-btn danger"
                        onClick={() => setSearchTermsDraft(prev => prev.filter((_, i) => i !== index))}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <input
                    className="crm-input"
                    placeholder="New keyword..."
                    value={newSearchTerm.term}
                    onChange={e => setNewSearchTerm(t => ({ ...t, term: e.target.value }))}
                  />
                  <input
                    className="crm-input"
                    type="number"
                    style={{ width: '80px' }}
                    placeholder="%"
                    value={newSearchTerm.percentage}
                    onChange={e => setNewSearchTerm(t => ({ ...t, percentage: parseFloat(e.target.value) || 0 }))}
                  />
                  <button
                    className="crm-btn crm-btn-save"
                    onClick={() => {
                      if (!newSearchTerm.term.trim()) return;
                      setSearchTermsDraft(prev => [...prev, { ...newSearchTerm }]);
                      setNewSearchTerm({ term: '', percentage: 10 });
                    }}
                  >
                    ➕ Add
                  </button>
                </div>
              </div>
            </div>

            <div className="crm-card">
              <div className="crm-card-title">🌐 3. External Sites & Apps</div>
              <p className="crm-card-desc">Modulate the external traffic referrers breakdown (Google Search, WhatsApp, Reddit, Instagram, etc.).</p>
              <div className="crm-grid-2">
                {externalSourcesDraft.map((item, index) => (
                  <div key={index} className="crm-slider-row">
                    <span className="crm-slider-label">{item.source}</span>
                    <input
                      type="range"
                      className="crm-range-input"
                      min="0"
                      max="100"
                      step="0.5"
                      value={item.percentage}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        setExternalSourcesDraft(prev => prev.map((s, i) => i === index ? { ...s, percentage: val } : s));
                      }}
                    />
                    <span className="crm-slider-val">{item.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <button className="crm-apply-btn" onClick={handleSaveTraffic}>
                💾 Save Traffic Overrides to Studio
              </button>
            </div>
          </div>
        )}

        {/* ── AUDIENCE & GEOGRAPHY CRM ── */}
        {activeSection === 'audience' && (
          <div className="crm-section">
            <div className="crm-grid-2">
              <div className="crm-card">
                <div className="crm-card-title">👥 1. Viewer Loyalty & Watch Time</div>
                <div className="crm-slider-row">
                  <span className="crm-slider-label">Returning Viewers</span>
                  <input
                    type="range"
                    className="crm-range-input"
                    min="0"
                    max="100"
                    step="0.5"
                    value={audienceDraft.returningViewers}
                    onChange={e => {
                      const ret = parseFloat(e.target.value) || 0;
                      setAudienceDraft(d => ({ ...d, returningViewers: ret, newViewers: parseFloat((100 - ret).toFixed(1)) }));
                    }}
                  />
                  <span className="crm-slider-val">{audienceDraft.returningViewers}%</span>
                </div>
                <div className="crm-slider-row">
                  <span className="crm-slider-label">New Viewers</span>
                  <input
                    type="range"
                    className="crm-range-input"
                    min="0"
                    max="100"
                    step="0.5"
                    value={audienceDraft.newViewers}
                    onChange={e => {
                      const nw = parseFloat(e.target.value) || 0;
                      setAudienceDraft(d => ({ ...d, newViewers: nw, returningViewers: parseFloat((100 - nw).toFixed(1)) }));
                    }}
                  />
                  <span className="crm-slider-val">{audienceDraft.newViewers}%</span>
                </div>
                <div className="crm-slider-row">
                  <span className="crm-slider-label">Subscribed Watch Time</span>
                  <input
                    type="range"
                    className="crm-range-input"
                    min="0"
                    max="100"
                    step="0.5"
                    value={audienceDraft.subscribedWatchTimePct}
                    onChange={e => {
                      const sub = parseFloat(e.target.value) || 0;
                      setAudienceDraft(d => ({ ...d, subscribedWatchTimePct: sub, nonSubscribedWatchTimePct: parseFloat((100 - sub).toFixed(1)) }));
                    }}
                  />
                  <span className="crm-slider-val">{audienceDraft.subscribedWatchTimePct}%</span>
                </div>
                <CRMInput
                  label="Unique Viewers Count"
                  value={audienceDraft.uniqueViewersCount}
                  onChange={v => setAudienceDraft(d => ({ ...d, uniqueViewersCount: v }))}
                  min={0}
                  step={10000}
                />
              </div>

              <div className="crm-card">
                <div className="crm-card-title">🌍 2. Top Geographies & Country RPM</div>
                <div className="crm-demographic-grid" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {audienceDraft.geographies.map((geo, index) => (
                    <div key={geo.country} className="crm-geo-row">
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>{geo.country}</span>
                      <input
                        className="crm-input"
                        type="number"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        value={geo.percentage}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          setAudienceDraft(d => ({
                            ...d,
                            geographies: d.geographies.map((g, i) => i === index ? { ...g, percentage: val } : g)
                          }));
                        }}
                      />
                      <input
                        className="crm-input"
                        type="number"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        value={geo.rpm}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          setAudienceDraft(d => ({
                            ...d,
                            geographies: d.geographies.map((g, i) => i === index ? { ...g, rpm: val } : g)
                          }));
                        }}
                      />
                      <button
                        className="crm-action-btn danger"
                        onClick={() => setAudienceDraft(d => ({ ...d, geographies: d.geographies.filter((_, i) => i !== index) }))}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <input
                    className="crm-input"
                    placeholder="New Country..."
                    value={newCountry.country}
                    onChange={e => setNewCountry(c => ({ ...c, country: e.target.value }))}
                  />
                  <input
                    className="crm-input"
                    type="number"
                    style={{ width: '70px' }}
                    placeholder="%"
                    value={newCountry.percentage}
                    onChange={e => setNewCountry(c => ({ ...c, percentage: parseFloat(e.target.value) || 0 }))}
                  />
                  <input
                    className="crm-input"
                    type="number"
                    style={{ width: '80px' }}
                    placeholder="RPM ₹"
                    value={newCountry.rpm}
                    onChange={e => setNewCountry(c => ({ ...c, rpm: parseFloat(e.target.value) || 0 }))}
                  />
                  <button
                    className="crm-btn crm-btn-save"
                    onClick={() => {
                      if (!newCountry.country.trim()) return;
                      setAudienceDraft(d => ({ ...d, geographies: [...d.geographies, { ...newCountry }] }));
                      setNewCountry({ country: '', percentage: 5.0, rpm: 35.00 });
                    }}
                  >
                    ➕ Add
                  </button>
                </div>
              </div>
            </div>

            {/* Age & Gender Distribution */}
            <div className="crm-card">
              <div className="crm-card-title">🎂 3. Age & Gender Distribution</div>
              <div className="crm-grid-2">
                {audienceDraft.ageGender.map((ag, index) => (
                  <div key={ag.group} className="crm-slider-row">
                    <span className="crm-slider-label">{ag.group}</span>
                    <input
                      type="range"
                      className="crm-range-input"
                      min="0"
                      max="100"
                      step="0.5"
                      value={ag.percentage}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        setAudienceDraft(d => ({
                          ...d,
                          ageGender: d.ageGender.map((a, i) => i === index ? { ...a, percentage: val } : a)
                        }));
                      }}
                    />
                    <span className="crm-slider-val">{ag.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <button className="crm-apply-btn" onClick={handleSaveAudience}>
                💾 Save Audience Overrides to Studio
              </button>
            </div>
          </div>
        )}

        {/* ── REVENUE & AD TYPES CRM ── */}
        {activeSection === 'revenue' && (
          <div className="crm-section">
            <div className="crm-grid-2">
              <div className="crm-card">
                <div className="crm-card-title">📅 1. Monthly Estimated Revenue History</div>
                <p className="crm-card-desc">Override the last 6 months' historical revenue shown on the Revenue tab cards.</p>
                <div className="crm-demographic-grid">
                  {revenueDraft.monthlyRevenue.map((m, index) => (
                    <div key={m.month} className="crm-slider-row">
                      <span className="crm-slider-label">{m.month}</span>
                      <input
                        className="crm-input"
                        type="number"
                        style={{ padding: '4px 8px', fontSize: '13px' }}
                        value={m.revenue}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          setRevenueDraft(d => ({
                            ...d,
                            monthlyRevenue: d.monthlyRevenue.map((item, i) => i === index ? { ...item, revenue: val, formatted: `₹${val.toLocaleString('en-IN')}` } : item)
                          }));
                        }}
                      />
                      <span className="crm-slider-val">₹{m.revenue.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="crm-card">
                <div className="crm-card-title">💼 2. Revenue Streams Breakdown</div>
                <div className="crm-demographic-grid">
                  {revenueDraft.revenueStreams.map((rs, index) => (
                    <div key={rs.stream} className="crm-slider-row">
                      <span className="crm-slider-label">{rs.stream}</span>
                      <input
                        type="range"
                        className="crm-range-input"
                        min="0"
                        max="100"
                        step="0.5"
                        value={rs.percentage}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          setRevenueDraft(d => ({
                            ...d,
                            revenueStreams: d.revenueStreams.map((item, i) => i === index ? { ...item, percentage: val } : item)
                          }));
                        }}
                      />
                      <span className="crm-slider-val">{rs.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="crm-card">
              <div className="crm-card-title">📺 3. Ad Types Breakdown</div>
              <div className="crm-grid-2">
                {revenueDraft.adTypes.map((ad, index) => (
                  <div key={ad.type} className="crm-slider-row">
                    <span className="crm-slider-label">{ad.type}</span>
                    <input
                      type="range"
                      className="crm-range-input"
                      min="0"
                      max="100"
                      step="0.5"
                      value={ad.percentage}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        setRevenueDraft(d => ({
                          ...d,
                          adTypes: d.adTypes.map((item, i) => i === index ? { ...item, percentage: val } : item)
                        }));
                      }}
                    />
                    <span className="crm-slider-val">{ad.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <button className="crm-apply-btn" onClick={handleSaveRevenue}>
                💾 Save Revenue Overrides to Studio
              </button>
            </div>
          </div>
        )}

        {/* ── EARN & MONETIZATION CRM ── */}
        {activeSection === 'earn' && (
          <div className="crm-section">
            <div className="crm-grid-2">
              <div className="crm-card">
                <div className="crm-card-title">💎 1. YouTube Partner Program (YPP) Status</div>
                <div className="crm-field">
                  <label className="crm-field-label">Channel Monetization Status</label>
                  <select
                    className="crm-input"
                    value={earnDraft.yppStatus}
                    onChange={e => setEarnDraft(d => ({ ...d, yppStatus: e.target.value }))}
                  >
                    <option value="Active Partner">Active Partner (Fully Monetized)</option>
                    <option value="Eligible">Eligible to Apply</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Not Eligible">Not Eligible</option>
                  </select>
                </div>
                <div className="crm-demographic-grid" style={{ marginTop: 12 }}>
                  <div className="crm-slider-row">
                    <span className="crm-slider-label">Watch Page Ads</span>
                    <input
                      type="checkbox"
                      checked={earnDraft.watchPageAds}
                      onChange={e => setEarnDraft(d => ({ ...d, watchPageAds: e.target.checked }))}
                    />
                    <span className="crm-slider-val">{earnDraft.watchPageAds ? 'ACTIVE' : 'OFF'}</span>
                  </div>
                  <div className="crm-slider-row">
                    <span className="crm-slider-label">Shorts Feed Ads</span>
                    <input
                      type="checkbox"
                      checked={earnDraft.shortsAds}
                      onChange={e => setEarnDraft(d => ({ ...d, shortsAds: e.target.checked }))}
                    />
                    <span className="crm-slider-val">{earnDraft.shortsAds ? 'ACTIVE' : 'OFF'}</span>
                  </div>
                  <div className="crm-slider-row">
                    <span className="crm-slider-label">Memberships</span>
                    <input
                      type="checkbox"
                      checked={earnDraft.memberships}
                      onChange={e => setEarnDraft(d => ({ ...d, memberships: e.target.checked }))}
                    />
                    <span className="crm-slider-val">{earnDraft.memberships ? 'ACTIVE' : 'OFF'}</span>
                  </div>
                  <div className="crm-slider-row">
                    <span className="crm-slider-label">Super Chat & Stickers</span>
                    <input
                      type="checkbox"
                      checked={earnDraft.supers}
                      onChange={e => setEarnDraft(d => ({ ...d, supers: e.target.checked }))}
                    />
                    <span className="crm-slider-val">{earnDraft.supers ? 'ACTIVE' : 'OFF'}</span>
                  </div>
                  <div className="crm-slider-row">
                    <span className="crm-slider-label">Shopping</span>
                    <input
                      type="checkbox"
                      checked={earnDraft.shopping}
                      onChange={e => setEarnDraft(d => ({ ...d, shopping: e.target.checked }))}
                    />
                    <span className="crm-slider-val">{earnDraft.shopping ? 'ACTIVE' : 'OFF'}</span>
                  </div>
                </div>
              </div>

              <div className="crm-card">
                <div className="crm-card-title">🎯 2. Milestone Requirements Progress</div>
                <p className="crm-card-desc">Tune the progress counters shown on the Earn page.</p>
                <CRMInput
                  label="Subscribers Target"
                  value={earnDraft.subscribersTarget}
                  onChange={v => setEarnDraft(d => ({ ...d, subscribersTarget: v }))}
                  min={100}
                  step={100}
                />
                <CRMInput
                  label="Public Watch Hours Target"
                  value={earnDraft.watchHoursTarget}
                  onChange={v => setEarnDraft(d => ({ ...d, watchHoursTarget: v }))}
                  min={100}
                  step={500}
                />
                <CRMInput
                  label="Shorts Views Target"
                  value={earnDraft.shortsViewsTarget}
                  onChange={v => setEarnDraft(d => ({ ...d, shortsViewsTarget: v }))}
                  min={100000}
                  step={1000000}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <button className="crm-apply-btn" onClick={handleSaveEarn}>
                💾 Save Earn Settings to Studio
              </button>
            </div>
          </div>
        )}

        {/* ── REALTIME & LIVE TICKER CRM ── */}
        {activeSection === 'realtime' && (
          <div className="crm-section">
            <div className="crm-grid-2">
              <div className="crm-card">
                <div className="crm-card-title">🔴 1. Live Subscribers & Ticker Tuning</div>
                <p className="crm-card-desc">Control live sub counter increments and ticking speed across all Analytics realtime widgets.</p>
                <div className="crm-field">
                  <label className="crm-field-label">Simulation Ticker Speed</label>
                  <select
                    className="crm-input"
                    value={realtimeDraft.speedMultiplier}
                    onChange={e => setRealtimeDraft(d => ({ ...d, speedMultiplier: parseFloat(e.target.value) }))}
                  >
                    <option value="0.5">0.5x (Slow natural updates)</option>
                    <option value="1.0">1.0x (Normal speed - 5s ticker)</option>
                    <option value="2.0">2.0x (Fast spikes)</option>
                    <option value="5.0">5.0x (Hyper growth test)</option>
                  </select>
                </div>
                <div className="crm-quick-pill-row" style={{ marginTop: 8 }}>
                  <span className="crm-field-label" style={{ marginBottom: 0 }}>Boost Subscribers:</span>
                  {[10, 50, 100, 500, 1000].map(cnt => (
                    <button
                      key={cnt}
                      type="button"
                      className="crm-mini-pill"
                      onClick={() => {
                        crmUpdateChannelMetrics({ subscribers: (channelInfo?.subscribers || 412850) + cnt });
                        showToast(`Added +${cnt} live subscribers!`, 'success');
                      }}
                    >
                      +{cnt} Subs
                    </button>
                  ))}
                </div>
              </div>

              <div className="crm-card">
                <div className="crm-card-title">📊 2. Realtime Bar Totals</div>
                <p className="crm-card-desc">Directly scale the 48-hour or 60-minute realtime views count.</p>
                <CRMInput
                  label="Override 48-Hour Views"
                  value={realtimeDraft.override48h || ''}
                  placeholder="e.g. 78500"
                  onChange={v => setRealtimeDraft(d => ({ ...d, override48h: v }))}
                />
                <CRMInput
                  label="Override 60-Minute Views"
                  value={realtimeDraft.override60m || ''}
                  placeholder="e.g. 1850"
                  onChange={v => setRealtimeDraft(d => ({ ...d, override60m: v }))}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <button className="crm-apply-btn" onClick={handleSaveRealtime}>
                💾 Apply Realtime Settings
              </button>
            </div>
          </div>
        )}

        {/* ── COMMENTS & COMMUNITY CRM ── */}
        {activeSection === 'comments' && (
          <div className="crm-section">
            <div className="crm-grid-2">
              <div className="crm-card">
                <div className="crm-card-title">💬 1. Add New Comment</div>
                <div className="crm-field">
                  <label className="crm-field-label">Author Name</label>
                  <input
                    className="crm-input"
                    placeholder="e.g. Sarah Connor"
                    value={newCommentDraft.author}
                    onChange={e => setNewCommentDraft(d => ({ ...d, author: e.target.value }))}
                  />
                </div>
                <div className="crm-field">
                  <label className="crm-field-label">Target Video</label>
                  <select
                    className="crm-input"
                    value={newCommentDraft.videoId}
                    onChange={e => setNewCommentDraft(d => ({ ...d, videoId: e.target.value }))}
                  >
                    {videos.map(v => (
                      <option key={v.id} value={v.id}>{v.title}</option>
                    ))}
                  </select>
                </div>
                <div className="crm-field">
                  <label className="crm-field-label">Comment Text</label>
                  <textarea
                    className="crm-input"
                    rows={3}
                    placeholder="Write comment content..."
                    value={newCommentDraft.text}
                    onChange={e => setNewCommentDraft(d => ({ ...d, text: e.target.value }))}
                  />
                </div>
                <div className="crm-grid-2" style={{ gap: 8 }}>
                  <CRMInput
                    label="Likes"
                    value={newCommentDraft.likes}
                    onChange={v => setNewCommentDraft(d => ({ ...d, likes: v }))}
                  />
                  <div className="crm-field">
                    <label className="crm-field-label">Status</label>
                    <select
                      className="crm-input"
                      value={newCommentDraft.status}
                      onChange={e => setNewCommentDraft(d => ({ ...d, status: e.target.value }))}
                    >
                      <option value="Published">Published</option>
                      <option value="Held for review">Held for review</option>
                    </select>
                  </div>
                </div>
                <button className="crm-apply-btn" onClick={handleCreateComment} style={{ marginTop: 12 }}>
                  ➕ Publish Comment to InsForge & Studio
                </button>
              </div>

              {/* Moderation Controls & Filter */}
              <div className="crm-card">
                <div className="crm-card-title">🔍 2. Filter & Moderation</div>
                <input
                  className="crm-search"
                  placeholder="Search comments by author or text..."
                  value={commentSearch}
                  onChange={e => setCommentSearch(e.target.value)}
                />
                <div className="crm-quick-pill-row" style={{ marginTop: 12 }}>
                  {['All', 'Published', 'Held for review'].map(f => (
                    <button
                      key={f}
                      className={`crm-mini-pill ${commentFilter === f ? 'active-pill' : ''}`}
                      onClick={() => setCommentFilter(f)}
                    >
                      {f} ({f === 'All' ? comments.length : comments.filter(c => c.status === f).length})
                    </button>
                  ))}
                </div>
                <div className="crm-db-stat-tile" style={{ marginTop: 16 }}>
                  <div className="crm-db-stat-tile-title">Total Active Comments</div>
                  <div className="crm-db-stat-tile-val">{comments.length}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: 4 }}>
                    Changes sync in real time across the Studio Community page.
                  </div>
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="crm-card">
              <div className="crm-card-title">📋 Comment Stream ({comments.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {comments
                  .filter(c => (commentFilter === 'All' || c.status === commentFilter) &&
                               (c.author?.toLowerCase().includes(commentSearch.toLowerCase()) || c.text?.toLowerCase().includes(commentSearch.toLowerCase())))
                  .map(c => {
                    const vid = videos.find(v => v.id === c.videoId);
                    return (
                      <div key={c.id} className="crm-comment-card">
                        <div className="crm-comment-header">
                          <div className="crm-comment-author-box">
                            <img src={c.authorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'} alt="" className="crm-comment-avatar" />
                            <div>
                              <span className="crm-comment-author">{c.author}</span>
                              <span className="crm-comment-time">{c.time}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span className="crm-comment-video-tag">{vid?.title || c.videoId}</span>
                            <button
                              className={`crm-status-pill ${c.status === 'Published' ? 'crm-status-published' : 'crm-status-held'}`}
                              onClick={() => crmUpdateComment(c.id, { status: c.status === 'Published' ? 'Held for review' : 'Published' })}
                            >
                              {c.status}
                            </button>
                          </div>
                        </div>
                        <div className="crm-comment-body">{c.text}</div>

                        {/* Replies display */}
                        {c.replies && c.replies.length > 0 && (
                          <div style={{ background: '#0a0a14', padding: '8px 12px', borderRadius: '6px', fontSize: '12px' }}>
                            {c.replies.map(r => (
                              <div key={r.id} style={{ display: 'flex', gap: 6, margin: '4px 0' }}>
                                <strong style={{ color: '#a78bfa' }}>{r.author}:</strong>
                                <span style={{ color: '#cbd5e1' }}>{r.text}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Footer actions */}
                        <div className="crm-comment-footer">
                          <div className="crm-comment-actions">
                            <button
                              className={`crm-action-btn ${c.heart ? 'active' : ''}`}
                              onClick={() => crmUpdateComment(c.id, { heart: !c.heart })}
                            >
                              {c.heart ? '❤️ Hearted' : '🤍 Heart'}
                            </button>
                            <button
                              className="crm-action-btn"
                              onClick={() => crmUpdateComment(c.id, { likes: (c.likes || 0) + 1 })}
                            >
                              👍 {c.likes || 0}
                            </button>
                            <button
                              className="crm-action-btn danger"
                              onClick={() => crmDeleteComment(c.id)}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                          <div style={{ display: 'flex', gap: 6, flex: 1, maxWidth: '360px' }}>
                            <input
                              className="crm-input"
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              placeholder="Reply as channel..."
                              value={replyDrafts[c.id] || ''}
                              onChange={e => setReplyDrafts({ ...replyDrafts, [c.id]: e.target.value })}
                              onKeyDown={e => { if (e.key === 'Enter') handleAddReply(c.id); }}
                            />
                            <button className="crm-btn crm-btn-save" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => handleAddReply(c.id)}>
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* ── PLAYLISTS MANAGER CRM ── */}
        {activeSection === 'playlists' && (
          <div className="crm-section">
            <div className="crm-grid-2">
              <div className="crm-card">
                <div className="crm-card-title">➕ 1. Create New Playlist</div>
                <div className="crm-field">
                  <label className="crm-field-label">Playlist Title</label>
                  <input
                    className="crm-input"
                    placeholder="e.g. Masterclass Series"
                    value={newPlaylistDraft.title}
                    onChange={e => setNewPlaylistDraft(d => ({ ...d, title: e.target.value }))}
                  />
                </div>
                <div className="crm-field">
                  <label className="crm-field-label">Visibility</label>
                  <select
                    className="crm-input"
                    value={newPlaylistDraft.visibility}
                    onChange={e => setNewPlaylistDraft(d => ({ ...d, visibility: e.target.value }))}
                  >
                    <option value="Public">Public</option>
                    <option value="Unlisted">Unlisted</option>
                    <option value="Private">Private</option>
                  </select>
                </div>
                <CRMInput
                  label="Initial Video Count"
                  value={newPlaylistDraft.videoCount}
                  onChange={v => setNewPlaylistDraft(d => ({ ...d, videoCount: v }))}
                />
                <button className="crm-apply-btn" onClick={handleCreatePlaylist} style={{ marginTop: 12 }}>
                  ➕ Create & Sync Playlist
                </button>
              </div>

              <div className="crm-card">
                <div className="crm-card-title">📊 Playlists Overview</div>
                <div className="crm-db-stat-tile">
                  <div className="crm-db-stat-tile-title">Total Playlists</div>
                  <div className="crm-db-stat-tile-val">{playlists.length}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: 6 }}>
                    Directly linked with YouTube Studio <strong>Content → Playlists</strong>.
                  </div>
                </div>
              </div>
            </div>

            {/* Playlists Grid */}
            <div className="crm-card">
              <div className="crm-card-title">📑 Playlists List ({playlists.length})</div>
              <div className="crm-playlist-grid">
                {playlists.map(p => (
                  <div key={p.id} className="crm-playlist-card">
                    <div className="crm-playlist-title">{p.title}</div>
                    <div className="crm-playlist-meta">
                      <span>🎬 {p.videoCount || 0} videos</span>
                      <span>👁️ {p.visibility}</span>
                      <span>⏱️ {p.lastUpdated || 'Recently'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      <select
                        className="crm-input"
                        style={{ padding: '4px 8px', fontSize: '12px', flex: 1 }}
                        value={p.visibility}
                        onChange={e => crmUpdatePlaylist(p.id, { visibility: e.target.value })}
                      >
                        <option value="Public">Public</option>
                        <option value="Unlisted">Unlisted</option>
                        <option value="Private">Private</option>
                      </select>
                      <button className="crm-action-btn danger" onClick={() => crmDeletePlaylist(p.id)}>
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SUBTITLES CRM ── */}
        {activeSection === 'subtitles' && (
          <div className="crm-section">
            <div className="crm-grid-2">
              <div className="crm-card">
                <div className="crm-card-title">🌐 1. Add / Configure Video Subtitles</div>
                <div className="crm-field">
                  <label className="crm-field-label">Target Video</label>
                  <select
                    className="crm-input"
                    value={newSubDraft.videoId}
                    onChange={e => {
                      const v = videos.find(vid => vid.id === e.target.value);
                      setNewSubDraft(d => ({ ...d, videoId: e.target.value, videoTitle: v?.title || 'Video' }));
                    }}
                  >
                    {videos.map(v => (
                      <option key={v.id} value={v.id}>{v.title}</option>
                    ))}
                  </select>
                </div>
                <div className="crm-field">
                  <label className="crm-field-label">Languages (comma-separated)</label>
                  <input
                    className="crm-input"
                    value={newSubDraft.languagesStr}
                    onChange={e => setNewSubDraft(d => ({ ...d, languagesStr: e.target.value }))}
                  />
                </div>
                <div className="crm-grid-2">
                  <div className="crm-field">
                    <label className="crm-field-label">Title & Description State</label>
                    <select
                      className="crm-input"
                      value={newSubDraft.titleDescriptionState}
                      onChange={e => setNewSubDraft(d => ({ ...d, titleDescriptionState: e.target.value }))}
                    >
                      <option value="Published">Published</option>
                      <option value="Draft">Draft</option>
                      <option value="Not translated">Not translated</option>
                    </select>
                  </div>
                  <div className="crm-field">
                    <label className="crm-field-label">Subtitles Track State</label>
                    <select
                      className="crm-input"
                      value={newSubDraft.subtitlesState}
                      onChange={e => setNewSubDraft(d => ({ ...d, subtitlesState: e.target.value }))}
                    >
                      <option value="Published">Published</option>
                      <option value="Draft">Draft</option>
                      <option value="Community">Community</option>
                    </select>
                  </div>
                </div>
                <button className="crm-apply-btn" onClick={handleCreateSubtitleTrack} style={{ marginTop: 8 }}>
                  ➕ Save Subtitles Track
                </button>
              </div>

              <div className="crm-card">
                <div className="crm-card-title">📋 Subtitles Registry ({subtitles.length})</div>
                <div className="crm-demographic-grid" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  {subtitles.map(sub => (
                    <div key={sub.id} className="crm-playlist-card" style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{sub.videoTitle}</div>
                      <div style={{ fontSize: '12px', color: '#a78bfa', marginTop: 4 }}>
                        Langs: {Array.isArray(sub.languages) ? sub.languages.join(', ') : sub.languages}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                        <span className="crm-status-pill crm-status-published">{sub.subtitlesState || 'Published'}</span>
                        <button
                          className="crm-action-btn danger"
                          onClick={() => {
                            crmDeleteSubtitleTrack(sub.id);
                            showToast('Subtitle track deleted ✓', 'info');
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── COPYRIGHT & CONTENT ID CRM ── */}
        {activeSection === 'copyright' && (
          <div className="crm-section">
            <div className="crm-grid-2">
              <div className="crm-card">
                <div className="crm-card-title">🛡️ 1. Add Copyright Match / Claim</div>
                <div className="crm-field">
                  <label className="crm-field-label">Your Video</label>
                  <select
                    className="crm-input"
                    value={newClaimDraft.videoTitle}
                    onChange={e => setNewClaimDraft(d => ({ ...d, videoTitle: e.target.value }))}
                  >
                    {videos.map(v => (
                      <option key={v.id} value={v.title}>{v.title}</option>
                    ))}
                  </select>
                </div>
                <div className="crm-field">
                  <label className="crm-field-label">Matching Track / Video</label>
                  <input
                    className="crm-input"
                    value={newClaimDraft.matchingVideoTitle}
                    onChange={e => setNewClaimDraft(d => ({ ...d, matchingVideoTitle: e.target.value }))}
                  />
                </div>
                <div className="crm-field">
                  <label className="crm-field-label">Claimant / Channel</label>
                  <input
                    className="crm-input"
                    value={newClaimDraft.matchingChannel}
                    onChange={e => setNewClaimDraft(d => ({ ...d, matchingChannel: e.target.value }))}
                  />
                </div>
                <div className="crm-grid-2">
                  <div className="crm-field">
                    <label className="crm-field-label">Match %</label>
                    <input
                      className="crm-input"
                      value={newClaimDraft.matchPercent}
                      onChange={e => setNewClaimDraft(d => ({ ...d, matchPercent: e.target.value }))}
                    />
                  </div>
                  <div className="crm-field">
                    <label className="crm-field-label">Segment (Timestamp)</label>
                    <input
                      className="crm-input"
                      value={newClaimDraft.segment}
                      onChange={e => setNewClaimDraft(d => ({ ...d, segment: e.target.value }))}
                    />
                  </div>
                </div>
                <button className="crm-apply-btn" onClick={handleCreateClaim} style={{ marginTop: 8 }}>
                  ➕ Add Claim to Studio Copyright
                </button>
              </div>

              <div className="crm-card">
                <div className="crm-card-title">📋 Active Matches ({copyrightClaims.length})</div>
                <div className="crm-demographic-grid" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  {copyrightClaims.map(claim => (
                    <div key={claim.id} className="crm-playlist-card" style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600, color: '#f87171' }}>{claim.matchingVideoTitle}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>Video: {claim.videoTitle}</div>
                      <div style={{ fontSize: '12px', color: '#cbd5e1' }}>Channel: {claim.matchingChannel} · Match: {claim.matchPercent}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                        <span className="crm-status-pill crm-status-held">{claim.status || 'Active'}</span>
                        <button
                          className="crm-action-btn danger"
                          onClick={() => {
                            crmDeleteCopyrightClaim(claim.id);
                            showToast('Claim removed ✓', 'info');
                          }}
                        >
                          🗑️ Resolve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── AUDIO LIBRARY CRM ── */}
        {activeSection === 'audio' && (
          <div className="crm-section">
            <div className="crm-grid-2">
              <div className="crm-card">
                <div className="crm-card-title">🎵 1. Add Royalty-Free Track</div>
                <div className="crm-field">
                  <label className="crm-field-label">Track Title</label>
                  <input
                    className="crm-input"
                    placeholder="e.g. Neon Horizon"
                    value={newAudioDraft.title}
                    onChange={e => setNewAudioDraft(d => ({ ...d, title: e.target.value }))}
                  />
                </div>
                <div className="crm-field">
                  <label className="crm-field-label">Artist</label>
                  <input
                    className="crm-input"
                    value={newAudioDraft.artist}
                    onChange={e => setNewAudioDraft(d => ({ ...d, artist: e.target.value }))}
                  />
                </div>
                <div className="crm-grid-3">
                  <div className="crm-field">
                    <label className="crm-field-label">Duration</label>
                    <input
                      className="crm-input"
                      value={newAudioDraft.duration}
                      onChange={e => setNewAudioDraft(d => ({ ...d, duration: e.target.value }))}
                    />
                  </div>
                  <div className="crm-field">
                    <label className="crm-field-label">Genre</label>
                    <input
                      className="crm-input"
                      value={newAudioDraft.genre}
                      onChange={e => setNewAudioDraft(d => ({ ...d, genre: e.target.value }))}
                    />
                  </div>
                  <div className="crm-field">
                    <label className="crm-field-label">Mood</label>
                    <input
                      className="crm-input"
                      value={newAudioDraft.mood}
                      onChange={e => setNewAudioDraft(d => ({ ...d, mood: e.target.value }))}
                    />
                  </div>
                </div>
                <button className="crm-apply-btn" onClick={handleCreateAudioTrack} style={{ marginTop: 8 }}>
                  ➕ Add Track to Audio Library
                </button>
              </div>

              <div className="crm-card">
                <div className="crm-card-title">🎧 Audio Catalog ({audioTracks.length})</div>
                <div className="crm-demographic-grid" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  {audioTracks.map(track => (
                    <div key={track.id} className="crm-geo-row">
                      <div>
                        <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{track.title}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{track.artist} · {track.genre} · {track.mood}</div>
                      </div>
                      <span style={{ fontSize: '12px', color: '#38bdf8' }}>⏱️ {track.duration}</span>
                      <span style={{ fontSize: '14px' }}>{track.starred ? '⭐' : '☆'}</span>
                      <button
                        className="crm-action-btn danger"
                        onClick={() => {
                          crmDeleteAudioTrack(track.id);
                          showToast('Audio track deleted ✓', 'info');
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS CRM ── */}
        {activeSection === 'notifications' && (
          <div className="crm-section">
            <div className="crm-grid-2">
              <div className="crm-card">
                <div className="crm-card-title">🔔 1. Broadcast Studio Notification</div>
                <div className="crm-field">
                  <label className="crm-field-label">Notification Title</label>
                  <input
                    className="crm-input"
                    placeholder="e.g. Congratulations! New milestone reached"
                    value={newNotifDraft.title}
                    onChange={e => setNewNotifDraft(d => ({ ...d, title: e.target.value }))}
                  />
                </div>
                <div className="crm-field">
                  <label className="crm-field-label">Message Details</label>
                  <textarea
                    className="crm-input"
                    rows={3}
                    placeholder="Message description..."
                    value={newNotifDraft.message}
                    onChange={e => setNewNotifDraft(d => ({ ...d, message: e.target.value }))}
                  />
                </div>
                <button className="crm-apply-btn" onClick={handleCreateNotification} style={{ marginTop: 8 }}>
                  📢 Send Notification to Studio
                </button>
              </div>

              <div className="crm-card">
                <div className="crm-card-title">📬 Active Notifications ({notifications.length})</div>
                <div className="crm-demographic-grid" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  {notifications.map(n => (
                    <div key={n.id} className="crm-playlist-card" style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, color: '#38bdf8' }}>{n.title}</span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>{n.time}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: 4 }}>{n.message}</div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                        <button
                          className="crm-action-btn danger"
                          onClick={() => {
                            crmDeleteNotification(n.id);
                            showToast('Notification removed ✓', 'info');
                          }}
                        >
                          🗑️ Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SETTINGS & BRANDING CRM ── */}
        {activeSection === 'settings' && (
          <div className="crm-section">
            <div className="crm-grid-2">
              <div className="crm-card">
                <div className="crm-card-title">🎭 Channel Branding & Identity</div>
                <CRMInput label="Channel Name" value={settingsDraft.name} type="text"
                  onChange={v => setSettingsDraft(d => ({ ...d, name: v }))} />
                <CRMInput label="Handle" value={settingsDraft.handle} type="text"
                  onChange={v => setSettingsDraft(d => ({ ...d, handle: v }))} />
                <CRMInput label="Avatar URL" value={settingsDraft.avatar} type="text"
                  onChange={v => setSettingsDraft(d => ({ ...d, avatar: v }))} />
                <CRMInput label="Banner URL" value={settingsDraft.banner} type="text"
                  onChange={v => setSettingsDraft(d => ({ ...d, banner: v }))} />
                <CRMInput label="Country" value={settingsDraft.country} type="text"
                  onChange={v => setSettingsDraft(d => ({ ...d, country: v }))} />
              </div>

              <div className="crm-card">
                <div className="crm-card-title">⚙️ Studio Preferences & Defaults</div>
                <CRMInput label="Currency" value={settingsDraft.currency} type="text"
                  onChange={v => setSettingsDraft(d => ({ ...d, currency: v }))} />
                <div className="crm-field">
                  <label className="crm-field-label">Default Visibility</label>
                  <select
                    className="crm-input"
                    value={settingsDraft.defaultVisibility}
                    onChange={e => setSettingsDraft(d => ({ ...d, defaultVisibility: e.target.value }))}
                  >
                    <option value="Public">Public</option>
                    <option value="Unlisted">Unlisted</option>
                    <option value="Private">Private</option>
                  </select>
                </div>
                <CRMInput label="Default Category" value={settingsDraft.defaultCategory} type="text"
                  onChange={v => setSettingsDraft(d => ({ ...d, defaultCategory: v }))} />
                <CRMInput label="Keywords / Channel Tags" value={settingsDraft.keywords} type="text"
                  onChange={v => setSettingsDraft(d => ({ ...d, keywords: v }))} />
                <CRMInput label="Blocked Words (Moderation)" value={settingsDraft.blockedWords} type="text"
                  onChange={v => setSettingsDraft(d => ({ ...d, blockedWords: v }))} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <button className="crm-apply-btn" onClick={handleSaveSettings}>
                💾 Save Settings & Branding to InsForge
              </button>
            </div>
          </div>
        )}

        {/* ── DATES & RANGE CONTROL ── */}
        {activeSection === 'dates' && (
          <div className="crm-section">
            <div className="crm-grid-2">
              {/* Anchor Date Card */}
              <div className="crm-card">
                <div className="crm-card-title">📅 1. Simulation Anchor Date (Today)</div>
                <p className="crm-card-desc">
                  Controls the current end date for all time-series simulations and analytics calculations across YouTube Studio.
                </p>

                <div className="crm-field">
                  <label className="crm-field-label">Anchor Date (YYYY-MM-DD)</label>
                  <input
                    className="crm-input"
                    type="date"
                    value={dateDraft.anchorDate}
                    onChange={e => {
                      const newAnchor = e.target.value;
                      if (newAnchor) {
                        const d = new Date(`${newAnchor}T00:00:00Z`);
                        d.setUTCDate(d.getUTCDate() - 27);
                        const autoStart = d.toISOString().split('T')[0];
                        setDateDraft(prev => ({
                          ...prev,
                          anchorDate: newAnchor,
                          endDate: newAnchor,
                          startDate: autoStart
                        }));
                      }
                    }}
                  />
                </div>

                <div className="crm-quick-pill-row" style={{ marginTop: 8 }}>
                  <span className="crm-field-label" style={{ marginBottom: 0 }}>Quick anchor presets:</span>
                  {[
                    { label: 'Aug 12, 2026 (Default)', date: '2026-08-12' },
                    { label: 'Aug 14, 2026', date: '2026-08-14' },
                    { label: 'Aug 4, 2026', date: '2026-08-04' },
                    { label: 'Jul 31, 2026', date: '2026-07-31' },
                    { label: 'Device Date', date: new Date().toISOString().split('T')[0] }
                  ].map(p => (
                    <button
                      key={p.label}
                      type="button"
                      className={`crm-mini-pill ${dateDraft.anchorDate === p.date ? 'active-pill' : ''}`}
                      onClick={() => {
                        const d = new Date(`${p.date}T00:00:00Z`);
                        d.setUTCDate(d.getUTCDate() - 27);
                        const autoStart = d.toISOString().split('T')[0];
                        setDateDraft(prev => ({
                          ...prev,
                          anchorDate: p.date,
                          endDate: p.date,
                          startDate: autoStart
                        }));
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range Preset Selector */}
              <div className="crm-card">
                <div className="crm-card-title">⚙️ 2. Active Analytics Preset</div>
                <p className="crm-card-desc">
                  Select which period YouTube Studio opens by default.
                </p>

                <div className="crm-field">
                  <label className="crm-field-label">Active Preset Range</label>
                  <select
                    className="crm-input"
                    style={{ background: '#121224', color: '#fff', cursor: 'pointer' }}
                    value={dateDraft.preset}
                    onChange={e => setDateDraft(prev => ({ ...prev, preset: e.target.value }))}
                  >
                    <option value="last28">Last 28 days (Default)</option>
                    <option value="last7">Last 7 days</option>
                    <option value="last90">Last 90 days</option>
                    <option value="365">Last 365 days</option>
                    <option value="lifetime">Lifetime</option>
                    <option value="august">August 2026</option>
                    <option value="july">July 2026</option>
                    <option value="june">June 2026</option>
                    <option value="custom">Custom Date Range</option>
                  </select>
                </div>

                <div className="crm-quick-pill-row" style={{ marginTop: 8 }}>
                  <span className="crm-field-label" style={{ marginBottom: 0 }}>Quick presets:</span>
                  {[
                    { label: 'Last 28 days', key: 'last28' },
                    { label: 'Last 7 days', key: 'last7' },
                    { label: 'Last 90 days', key: 'last90' },
                    { label: 'August', key: 'august' },
                    { label: 'Custom', key: 'custom' }
                  ].map(p => (
                    <button
                      key={p.key}
                      type="button"
                      className={`crm-mini-pill ${dateDraft.preset === p.key ? 'active-pill' : ''}`}
                      onClick={() => setDateDraft(prev => ({ ...prev, preset: p.key }))}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exact Date Range Window Card */}
              <div className="crm-card">
                <div className="crm-card-title">📆 3. Custom Date Range Window</div>
                <p className="crm-card-desc">
                  Directly customize start and end dates. Used for "Last 28 days" and "Custom" ranges.
                </p>

                <div className="crm-grid-2">
                  <div className="crm-field">
                    <label className="crm-field-label">Start Date</label>
                    <input
                      className="crm-input"
                      type="date"
                      value={dateDraft.startDate}
                      onChange={e => setDateDraft(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="crm-field">
                    <label className="crm-field-label">End Date</label>
                    <input
                      className="crm-input"
                      type="date"
                      value={dateDraft.endDate}
                      onChange={e => setDateDraft(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="crm-quick-pill-row" style={{ marginTop: 8 }}>
                  <span className="crm-field-label" style={{ marginBottom: 0 }}>28-day templates:</span>
                  {[
                    { label: 'Jul 16 – Aug 12, 2026 (Default)', start: '2026-07-16', end: '2026-08-12' },
                    { label: 'Jul 18 – Aug 14, 2026', start: '2026-07-18', end: '2026-08-14' },
                    { label: 'Jul 7 – Aug 4, 2026', start: '2026-07-07', end: '2026-08-04' },
                    { label: 'Jun 18 – Jul 15, 2026', start: '2026-06-18', end: '2026-07-15' },
                  ].map(t => (
                    <button
                      key={t.label}
                      type="button"
                      className={`crm-mini-pill ${dateDraft.startDate === t.start && dateDraft.endDate === t.end ? 'active-pill' : ''}`}
                      onClick={() => setDateDraft(prev => ({
                        ...prev,
                        startDate: t.start,
                        endDate: t.end,
                        anchorDate: t.end
                      }))}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="crm-card crm-preview-bar-vertical">
                <div className="crm-card-title">🔍 Live Date Preview</div>
                <div className="crm-date-preview-box">
                  <div className="date-preview-main-badge">
                    {formatDateRangeText(dateDraft.startDate, dateDraft.endDate)}
                  </div>
                  <div className="date-preview-details">
                    <div><strong>Active Preset:</strong> {dateDraft.preset}</div>
                    <div><strong>Start Date:</strong> {dateDraft.startDate}</div>
                    <div><strong>End Date:</strong> {dateDraft.endDate}</div>
                    <div><strong>Duration:</strong> {Math.max(1, Math.round((new Date(dateDraft.endDate) - new Date(dateDraft.startDate)) / (1000 * 60 * 60 * 24)) + 1)} days</div>
                    <div style={{ color: '#4ade80', fontSize: '12px', marginTop: '6px' }}>
                      ✓ Synchronizes automatically to: Overview AreaChart, Reach/Content Chart, Engagement Chart, Audience Chart, Revenue Chart, Trends Chart & Tooltips.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button className="crm-apply-btn" onClick={applyDates}>
                Apply Date Range to YouTube Studio & Graphs
              </button>
              <button
                type="button"
                className="crm-btn crm-btn-cancel"
                onClick={() => {
                  setDateDraft({
                    anchorDate: '2026-08-12',
                    startDate: '2026-07-16',
                    endDate: '2026-08-12',
                    preset: 'last28'
                  });
                }}
              >
                🔄 Reset to Jul 16 – Aug 12, 2026
              </button>
            </div>
          </div>
        )}

        {/* ── BULK ACTIONS ── */}
        {activeSection === 'bulk' && (
          <div className="crm-section crm-grid-2">
            <div className="crm-card">
              <div className="crm-card-title">₹ Set Global RPM</div>
              <p className="crm-card-desc">Override RPM for every video. Revenue will be recalculated automatically (Revenue = Views / 1000 × RPM).</p>
              <CRMInput label="RPM (₹)" value={bulkRPM}
                onChange={v => setBulkRPM(v)} min={0} step={0.01} unit="₹" />
              <div className="crm-quick-pill-row" style={{ marginTop: 6 }}>
                <span className="crm-field-label" style={{ marginBottom: 0 }}>Quick RPM:</span>
                {[30, 35, 50, 75, 100, 150].map(r => (
                  <button
                    key={r}
                    type="button"
                    className="crm-mini-pill"
                    onClick={() => setBulkRPM(r)}
                  >
                    ₹{r}
                  </button>
                ))}
              </div>
              <div className="crm-preview-small" style={{ marginTop: 10 }}>
                Estimated total revenue at this RPM: <strong>{fmtINR((totalViews / 1000) * bulkRPM)}</strong>
              </div>
              <button className="crm-apply-btn" onClick={applyBulkRPM}>
                Apply to All Videos
              </button>
            </div>

            <div className="crm-card">
              <div className="crm-card-title">✖️ Multiply All Views</div>
              <p className="crm-card-desc">Scale every video's views by a factor. Example: 1.5 = +50%, 0.8 = -20%.</p>
              <CRMInput label="Multiplier" value={bulkFactor}
                onChange={v => setBulkFactor(v)} min={0.01} step={0.05} />
              <div className="crm-quick-pill-row" style={{ marginTop: 6 }}>
                <span className="crm-field-label" style={{ marginBottom: 0 }}>Quick multipliers:</span>
                {[0.8, 1.25, 1.5, 2.0, 5.0, 10.0].map(m => (
                  <button
                    key={m}
                    type="button"
                    className="crm-mini-pill"
                    onClick={() => setBulkFactor(m)}
                  >
                    {m}×
                  </button>
                ))}
              </div>
              <div className="crm-preview-small" style={{ marginTop: 10 }}>
                Total views will become: <strong>{fmt(Math.round(totalViews * bulkFactor))}</strong>
                {' '}(currently {fmt(totalViews)})
              </div>
              <button className="crm-apply-btn" onClick={applyBulkMultiply}>
                Apply Multiplier
              </button>
            </div>

            <div className="crm-card">
              <div className="crm-card-title">🚀 Preset Scenarios</div>
              <p className="crm-card-desc">Instantly load pre-configured high-performance data profiles across your channel and videos.</p>
              <div className="crm-preset-buttons">
                <button className="crm-btn crm-btn-edit" style={{ background: '#1e1035', color: '#a78bfa' }} onClick={() => { crmApplyPreset('viral'); showToast('Loaded Viral Spike preset (45M views, ₹1.85L rev) ✓', 'success'); }}>
                  🚀 Viral Spike (45M Views)
                </button>
                <button className="crm-btn crm-btn-edit" style={{ background: '#172554', color: '#60a5fa' }} onClick={() => { crmApplyPreset('high_rpm'); showToast('Set High RPM preset (₹85.50 RPM) ✓', 'success'); }}>
                  💰 High RPM (₹85.50 RPM)
                </button>
                <button className="crm-btn crm-btn-cancel" onClick={() => { reloadFromSpreadsheet(); showToast('Reset to original spreadsheet data ✓', 'info'); }}>
                  🔄 Reset Baseline
                </button>
              </div>
            </div>

            <div className="crm-card crm-card-warning">
              <div className="crm-card-title">⚠️ Notes</div>
              <ul className="crm-warning-list">
                <li>Changes are saved in <strong>persistent browser state</strong>.</li>
                <li>Thumbnails and subscriber gains reflect instantly in Dashboard, Content, and Video Analytics.</li>
                <li>The YouTube Studio UI reflects changes instantly via shared state.</li>
              </ul>
            </div>
          </div>
        )}

        {/* ── DATABASE & CLOUD CONTROL ── */}
        {activeSection === 'database' && (
          <div className="crm-section">
            <div className="crm-card">
              <div className="crm-card-title">🗄️ InsForge Backend Infrastructure</div>
              <div className="crm-db-stat-grid">
                <div className="crm-db-stat-tile">
                  <div className="crm-db-stat-tile-title">Channel Info</div>
                  <div className="crm-db-stat-tile-val">1 Row</div>
                </div>
                <div className="crm-db-stat-tile">
                  <div className="crm-db-stat-tile-title">Videos</div>
                  <div className="crm-db-stat-tile-val">{videos.length} Rows</div>
                </div>
                <div className="crm-db-stat-tile">
                  <div className="crm-db-stat-tile-title">Comments</div>
                  <div className="crm-db-stat-tile-val">{comments.length} Rows</div>
                </div>
                <div className="crm-db-stat-tile">
                  <div className="crm-db-stat-tile-title">Playlists</div>
                  <div className="crm-db-stat-tile-val">{playlists.length} Rows</div>
                </div>
                <div className="crm-db-stat-tile">
                  <div className="crm-db-stat-tile-title">Subtitles</div>
                  <div className="crm-db-stat-tile-val">{subtitles.length} Rows</div>
                </div>
                <div className="crm-db-stat-tile">
                  <div className="crm-db-stat-tile-title">Audio Tracks</div>
                  <div className="crm-db-stat-tile-val">{audioTracks.length} Rows</div>
                </div>
              </div>

              <div style={{ marginTop: 16, fontSize: '13px', color: '#94a3b8' }}>
                <div><strong>Backend Base URL:</strong> <code style={{ color: '#38bdf8' }}>https://zt9vsanb.ap-southeast.insforge.app</code></div>
                <div><strong>Linked Project ID:</strong> <code>fa322b88-223f-474a-bb6c-770596286e21</code></div>
                <div><strong>Status:</strong> <span style={{ color: '#4ade80' }}>● Connected & Active</span></div>
                <div><strong>Last Database Sync:</strong> {lastDatabaseSync ? new Date(lastDatabaseSync).toLocaleString() : 'Just now'}</div>
              </div>
            </div>

            <div className="crm-grid-2">
              <div className="crm-card">
                <div className="crm-card-title">🔄 Cloud Synchronization</div>
                <p className="crm-card-desc">Pull latest records from InsForge cloud or force push local memory state to cloud database.</p>
                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <button
                    className="crm-btn crm-btn-save"
                    onClick={async () => {
                      await persistToDatabase();
                      showToast('All state pushed to InsForge database ✓', 'success');
                    }}
                  >
                    ⬆️ Force Push to Cloud
                  </button>
                  <button
                    className="crm-btn crm-btn-edit"
                    onClick={async () => {
                      const ok = await loadFromDatabase();
                      if (ok) showToast('Loaded latest state from InsForge cloud ✓', 'success');
                    }}
                  >
                    ⬇️ Pull from Cloud
                  </button>
                </div>
              </div>

              <div className="crm-card">
                <div className="crm-card-title">💾 Backup & Restore JSON</div>
                <p className="crm-card-desc">Download a complete snapshot of all CRM tables or restore from an existing JSON file.</p>
                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <button className="crm-btn crm-btn-edit" onClick={handleExportStateJSON}>
                    📥 Export JSON Backup
                  </button>
                  <label className="crm-btn crm-btn-cancel" style={{ cursor: 'pointer' }}>
                    📤 Import JSON
                    <input type="file" accept=".json" onChange={handleImportStateJSON} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── LIVE PREVIEW ── */}
        {activeSection === 'preview' && (
          <div className="crm-section">
            <div className="crm-grid-3">
              {/* Channel */}
              <div className="crm-card">
                <div className="crm-card-title">📡 Channel</div>
                <StatPreview label="Name" value={channelInfo?.name || '—'} color="#e2e8f0" />
                <StatPreview label="Subscribers" value={channelInfo?.subscribersFormatted || '—'} />
                <StatPreview label="Subs Gained (28d)" value={channelInfo?.subscribersGainedLast28DaysFormatted || '—'} color="#4ade80" />
                <StatPreview label="Views (28d)" value={channelInfo?.viewsLast28DaysFormatted || '—'} />
                <StatPreview label="Watch Time (28d)" value={channelInfo?.watchTimeLast28DaysFormatted || '—'} />
                <StatPreview label="Revenue (28d)" value={channelInfo?.revenueLast28DaysFormatted || '—'} color="#fbbf24" />
              </div>

              {/* Aggregated video stats */}
              <div className="crm-card">
                <div className="crm-card-title">🎬 Aggregated Videos</div>
                <StatPreview label="Total Videos" value={videos.length} />
                <StatPreview label="Total Views" value={fmt(totalViews)} />
                <StatPreview label="Total Revenue" value={fmtINR(totalRevenue)} color="#fbbf24" />
                <StatPreview label="Avg RPM" value={`₹${avgRPM}`} color="#a78bfa" />
                <StatPreview label="Total Likes" value={fmt(videos.reduce((a, v) => a + (v.likes || 0), 0))} color="#f472b6" />
                <StatPreview label="Total Comments" value={fmt(videos.reduce((a, v) => a + (v.comments || 0), 0))} />
              </div>

              {/* Top 5 videos */}
              <div className="crm-card">
                <div className="crm-card-title">🏆 Top 5 by Revenue</div>
                {[...videos].sort((a, b) => (b.revenue || 0) - (a.revenue || 0)).slice(0, 5).map(v => (
                  <div key={v.id} className="crm-top-item">
                    <span className="crm-top-name">{v.title}</span>
                    <span className="crm-top-val">{v.revenueFormatted || fmtINR(v.revenue || 0)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* All videos snapshot */}
            <div className="crm-card" style={{ marginTop: 16 }}>
              <div className="crm-card-title">📋 All Videos Snapshot</div>
              <div className="crm-table-wrap">
                <table className="crm-table crm-table-compact">
                  <thead>
                    <tr>
                      <th>Thumbnail</th>
                      <th>Title</th>
                      <th>Subs Gained</th>
                      <th>Views</th>
                      <th>Avg Duration (AVD)</th>
                      <th>Likes</th>
                      <th>RPM</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {videos.map(v => (
                      <tr key={v.id}>
                        <td><img src={v.thumbnail} alt="" className="crm-vid-thumb" /></td>
                        <td className="crm-vid-name" style={{ maxWidth: 260 }}>{v.title}</td>
                        <td style={{ color: '#4ade80' }}>+{fmt(v.subscribersGained !== undefined ? v.subscribersGained : Math.round(v.views * 0.014))}</td>
                        <td>{v.viewsFormatted}</td>
                        <td><span style={{ color: '#38bdf8' }}>⏱️ {v.avgViewDuration || formatSecondsToAvd(v.avgViewDurationSecs || 105)}</span></td>
                        <td>{(v.likes || 0).toLocaleString()}</td>
                        <td>₹{(v.rpm || 33.64).toFixed(2)}</td>
                        <td className="crm-revenue-cell">{v.revenueFormatted}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
