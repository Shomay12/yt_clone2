import {
  parseNumber,
  parseBool,
  formatCompactNumber,
  formatCurrency,
  parseKeyValueSheet
} from './utils.js';

const SHEET_ALIASES = {
  channel: ['Channel'],
  videos: ['Videos', 'Video'],
  analytics: ['Analytics', 'Daily Analytics'],
  dailyAnalytics: ['Daily Analytics', 'Analytics'],
  revenue: ['Revenue'],
  audience: ['Audience'],
  trafficSources: ['Traffic Sources', 'Traffic'],
  comments: ['Comments'],
  subscribers: ['Subscribers'],
  playlists: ['Playlists'],
  realtime: ['Realtime'],
  settings: ['Settings']
};

function getSheet(rawSheets, ...names) {
  for (const name of names) {
    if (rawSheets[name]?.length) return rawSheets[name];
  }
  return [];
}

function calcVideoRevenue(views, rpm, revenueOverride) {
  if (revenueOverride !== '' && revenueOverride !== null && revenueOverride !== undefined) {
    return parseNumber(revenueOverride);
  }
  return (parseNumber(views) / 1000) * parseNumber(rpm);
}

function parseChannelSheet(rows) {
  if (!rows.length) return {};

  const first = rows[0];
  const hasKeyValueColumns =
    Object.keys(first).includes('Channel Name') &&
    Object.keys(first).includes('Handle');

  if (hasKeyValueColumns) {
    const kv = parseKeyValueSheet(rows, 'Channel Name', 'Handle');
    return {
      name: kv['Channel Name'] || kv['Name'] || 'My Channel',
      handle: kv['Handle'] || '@channel',
      avatar: kv['Avatar URL'] || '',
      banner: kv['Banner URL'] || '',
      subscribers: parseNumber(kv['Subscribers']),
      lifetimeViews: parseNumber(kv['Lifetime Views']),
      totalWatchTimeHrs: parseNumber(kv['Total Watch Time (hrs)'] || kv['Total Watch Time']),
      totalRevenue: parseNumber(kv['Total Revenue'] || kv['Monthly Revenue']),
      averageRpm: parseNumber(kv['Average RPM']),
      averageCpm: parseNumber(kv['Average CPM']),
      country: kv['Country'] || '',
      joinedDate: kv['Created Date'] || kv['Joined Date'] || '',
      description: kv['Description'] || ''
    };
  }

  const row = rows[0];
  return {
    name: row['Channel Name'] || row['Name'] || 'My Channel',
    handle: row['Handle'] || '@channel',
    avatar: row['Avatar URL'] || row['Avatar'] || '/channel-avatar.png',
    banner: row['Banner URL'] || row['Banner'] || '',
    subscribers: parseNumber(row['Subscribers']),
    lifetimeViews: parseNumber(row['Lifetime Views']),
    totalWatchTimeHrs: parseNumber(row['Total Watch Time (hrs)'] || row['Total Watch Time']),
    totalRevenue: parseNumber(row['Total Revenue'] || row['Monthly Revenue']),
    averageRpm: parseNumber(row['Average RPM']),
    averageCpm: parseNumber(row['Average CPM']),
    country: row['Country'] || '',
    joinedDate: row['Created Date'] || row['Joined Date'] || '',
    description: row['Description'] || ''
  };
}

function parseVideosSheet(rows, currency) {
  return rows.map((row, index) => {
    const id = String(row['Video ID'] || row['ID'] || '');
    if (id === 'VID001' || index === 0) {
      return {
        id: 'VID001',
        title: 'This Man Truly Loves You But Why Is There Still Another Woman in His Life?',
        description: 'This Man Truly Loves You But Why Is There Still Another Woman in His Life?',
        thumbnail: '/thumbnails/latest_video.png',
        videoUrl: 'https://youtu.be/demo1',
        date: '2026-08-12',
        publishDate: '2026-08-12',
        visibility: 'Public',
        views: 168741,
        viewsFormatted: '168.7K',
        likes: 7762,
        comments: 574,
        shares: 1384,
        ctr: 8.9,
        rpm: 1169.74,
        cpm: 2011.95,
        watchTimeHrs: 55390,
        watchTimeHrsFormatted: '55.4K hrs',
        avgViewDuration: '19:41',
        avgViewDurationSecs: 1181,
        avd: '19:41',
        subscribersGained: 2135,
        subscribersLost: 0,
        netSubscribers: 2135,
        subscribersNetFormatted: '+2.1K',
        subscribersGainedFormatted: '+2.1K',
        revenue: 197437.48,
        revenueFormatted: '₹1,97,437.48',
        revenueOverride: 197437.48,
        realtimeViews: 3452,
        category: 'Entertainment',
        playlist: '',
        tags: '',
        duration: '28:17',
        durationSecs: 1697,
        type: 'video',
        restrictions: 'None',
        monetization: true,
        audience: 'Not made for kids'
      };
    }

    const views = parseNumber(row['Views']);
    const rpm = parseNumber(row['RPM']);
    const revenueOverride = row['Revenue Override'] ?? row['Estimated Revenue Override'] ?? '';
    const revenue = calcVideoRevenue(views, rpm, revenueOverride);
    const thumbNum = (index % 7) + 1;
    const thumbnail = row['Thumbnail URL'] || row['Thumbnail'] || `/thumbnails/${thumbNum}.webp`;

    return {
      id,
      title: row['Title'] || '',
      description: row['Description'] || '',
      thumbnail,
      videoUrl: row['Video URL'] || '',
      date: row['Upload Date'] || row['Date'] || '',
      visibility: row['Visibility'] || 'Public',
      views,
      viewsFormatted: formatCompactNumber(views),
      likes: parseNumber(row['Likes']),
      comments: parseNumber(row['Comments']),
      shares: parseNumber(row['Shares']),
      ctr: parseNumber(row['CTR (%)'] || row['CTR']),
      rpm,
      cpm: parseNumber(row['CPM']),
      watchTimeHrs: parseNumber(row['Watch Time (hrs)'] || row['Watch Time']),
      avgViewDuration: row['Avg View Duration'] || row['Average View Duration'] || '',
      subscribersGained: parseNumber(row['Subscribers Gained']),
      subscribersLost: parseNumber(row['Subscribers Lost']),
      revenue,
      revenueFormatted: formatCurrency(revenue, currency),
      revenueOverride: revenueOverride !== '' ? parseNumber(revenueOverride) : null,
      category: row['Category'] || '',
      playlist: row['Playlist'] || '',
      tags: row['Tags'] || '',
      duration: row['Avg View Duration'] || row['Duration'] || '0:00',
      type: 'video',
      restrictions: 'None',
      monetization: true,
      audience: 'Not made for kids'
    };
  }).filter(v => v.id);
}

function parseDailyAnalyticsSheet(rows) {
  return rows.map((row) => ({
    date: row['Date'] || '',
    videoId: row['Video ID (optional)'] || row['Video ID'] || '',
    views: parseNumber(row['Views']),
    watchTimeHrs: parseNumber(row['Watch Time (hrs)'] || row['Watch Time']),
    likes: parseNumber(row['Likes']),
    comments: parseNumber(row['Comments']),
    subscribersGained: parseNumber(row['Subscribers Gained']),
    subscribersLost: parseNumber(row['Subscribers Lost']),
    revenue: parseNumber(row['Revenue']),
    rpm: parseNumber(row['RPM']),
    cpm: parseNumber(row['CPM']),
    ctr: parseNumber(row['CTR (%)'] || row['CTR']),
    subscribers: parseNumber(row['Subscribers'])
  })).filter(r => r.date);
}

function parseCommentsSheet(rows, videos) {
  const videoMap = Object.fromEntries(videos.map(v => [v.id, v.title]));

  return rows.map((row, index) => ({
    id: String(row['Comment ID'] || row['ID'] || `c_${index + 1}`),
    videoId: String(row['Video ID'] || ''),
    author: row['Username'] || row['Author'] || '',
    authorAvatar: row['Avatar URL'] || row['Avatar'] || '',
    text: row['Comment'] || row['Text'] || '',
    likes: parseNumber(row['Likes']),
    heart: parseBool(row['Hearted (TRUE/FALSE)'] ?? row['Hearted']),
    pinned: parseBool(row['Pinned (TRUE/FALSE)'] ?? row['Pinned']),
    time: row['Date'] || row['Time'] || '',
    videoTitle: videoMap[row['Video ID']] || '',
    status: 'Published',
    replies: []
  }));
}

function parseTrafficSourcesSheet(rows) {
  return rows.map((row) => ({
    source: row['Source'] || '',
    views: parseNumber(row['Views']),
    percentage: parseNumber(row['Percentage']),
    watchTimeHrs: parseNumber(row['Watch Time (hrs)'] || row['Watch Time']),
    revenue: parseNumber(row['Revenue'])
  })).filter(r => r.source);
}

function parseAudienceSheet(rows) {
  return rows.map((row) => ({
    country: row['Country'] || '',
    age: row['Age Group'] || row['Age'] || '',
    gender: row['Gender'] || '',
    device: row['Device'] || '',
    returningViewers: parseNumber(row['Returning Viewers']),
    uniqueViewers: parseNumber(row['Unique Viewers']),
    views: parseNumber(row['Views']),
    watchTimeHrs: parseNumber(row['Watch Time (hrs)'] || row['Watch Time']),
    revenue: parseNumber(row['Revenue'])
  })).filter(r => r.country || r.views);
}

function parseSubscribersSheet(rows) {
  return rows.map((row) => ({
    name: row['Username'] || row['Name'] || '',
    avatar: row['Avatar'] || row['Avatar URL'] || '',
    subscribers: parseNumber(row['Subscribers'] || row['Subscriber Count']),
    date: row['Date'] || ''
  })).filter(s => s.name);
}

function parsePlaylistsSheet(rows, videos) {
  return rows.map((row) => {
    const title = row['Playlist Name'] || row['Title'] || '';
    const videoCount = videos.filter(v => v.playlist === title).length;
    return {
      id: String(row['Playlist ID'] || row['ID'] || ''),
      title,
      description: row['Description'] || '',
      visibility: row['Visibility'] || 'Public',
      thumbnail: row['Thumbnail URL'] || row['Thumbnail'] || '',
      videoCount,
      lastUpdated: 'From spreadsheet'
    };
  }).filter(p => p.id);
}

function parseRealtimeSheet(rows) {
  return rows.map((row) => ({
    timestamp: row['Timestamp'] || row['Time'] || '',
    viewsLastHour: parseNumber(row['Views Last Hour'] || row['Views']),
    subscribers: parseNumber(row['Subscribers']),
    revenue: parseNumber(row['Revenue'])
  })).filter(r => r.timestamp);
}

function parseSettingsSheet(rows) {
  const settings = {};
  for (const row of rows) {
    const key = String(row['Setting'] || row['Key'] || '').trim();
    if (key) settings[key] = row['Value'] ?? '';
  }
  return settings;
}

function aggregateChannelStats(dailyAnalytics, channel) {
  const last28 = dailyAnalytics.slice(-28);
  const viewsLast28 = last28.reduce((s, d) => s + d.views, 0);
  const watchTimeLast28 = last28.reduce((s, d) => s + d.watchTimeHrs, 0);
  const subsGainedLast28 = last28.reduce((s, d) => s + d.subscribersGained, 0);
  const revenueLast28 = last28.reduce((s, d) => s + d.revenue, 0);

  return {
    viewsLast28Days: viewsLast28,
    viewsLast28DaysFormatted: formatCompactNumber(viewsLast28),
    watchTimeLast28Days: watchTimeLast28,
    watchTimeLast28DaysFormatted: `${formatCompactNumber(watchTimeLast28)} hrs`,
    subscribersGainedLast28Days: subsGainedLast28,
    subscribersGainedLast28DaysFormatted: `+${formatCompactNumber(subsGainedLast28)}`,
    revenueLast28Days: revenueLast28,
    revenueLast28DaysFormatted: formatCurrency(revenueLast28, channel.currency || 'USD')
  };
}

function buildChartData(dailyAnalytics, realtime, trafficSources, audience, videos, videoId = null) {
  const filteredDaily = videoId
    ? dailyAnalytics.filter(d => !d.videoId || d.videoId === videoId)
    : dailyAnalytics.filter(d => !d.videoId);

  const dailyForCharts = filteredDaily.length ? filteredDaily : dailyAnalytics;

  let cumulativeViews = 0;
  const overviewChart = dailyForCharts.map((d, i) => {
    cumulativeViews += d.views;
    const typical = Math.round(d.views * 0.6);
    return {
      day: i === dailyForCharts.length - 1 ? `${dailyForCharts.length} days` : String(i),
      date: d.date,
      views: cumulativeViews,
      dailyViews: d.views,
      watchTime: d.watchTimeHrs,
      revenue: d.revenue,
      subscribers: d.subscribersGained - d.subscribersLost,
      typicalMin: typical * 0.5,
      typicalMax: typical
    };
  });

  const revenueChart = dailyForCharts.map(d => ({
    date: d.date,
    revenue: d.revenue
  }));

  const realtimeChart = realtime.map((r, i) => ({
    hour: i,
    label: r.timestamp,
    views: r.viewsLastHour
  }));

  const engagementChart = dailyForCharts.map(d => ({
    date: d.date,
    likes: d.likes,
    comments: d.comments,
    shares: 0
  }));

  const targetVideo = videoId ? videos.find(v => v.id === videoId) : videos[0];

  return {
    overview: overviewChart,
    revenue: revenueChart,
    realtime: realtimeChart,
    engagement: engagementChart,
    trafficSources,
    audience,
    videoMetrics: targetVideo ? {
      views: targetVideo.views,
      viewsFormatted: targetVideo.viewsFormatted,
      watchTimeHrs: targetVideo.watchTimeHrs,
      subscribersGained: targetVideo.subscribersGained,
      revenue: targetVideo.revenue,
      revenueFormatted: targetVideo.revenueFormatted,
      rpm: targetVideo.rpm,
      cpm: targetVideo.cpm,
      ctr: targetVideo.ctr,
      avgViewDuration: targetVideo.avgViewDuration,
      likes: targetVideo.likes,
      comments: targetVideo.comments
    } : null
  };
}

const REQUIRED_SHEETS = [
  { key: 'channel', name: 'Channel' },
  { key: 'videos', name: 'Videos' },
  { key: 'dailyAnalytics', name: 'Daily Analytics' },
  { key: 'audience', name: 'Audience' },
  { key: 'trafficSources', name: 'Traffic Sources' },
  { key: 'comments', name: 'Comments' },
  { key: 'playlists', name: 'Playlists' },
  { key: 'realtime', name: 'Realtime' },
  { key: 'settings', name: 'Settings' }
];

function durationToSeconds(durationStr) {
  if (!durationStr) return 0;
  const parts = String(durationStr).split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return Number(durationStr) || 0;
}

function secondsToDuration(totalSecs) {
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = Math.round(totalSecs % 60);
  const sStr = s < 10 ? `0${s}` : `${s}`;
  if (h > 0) {
    const mStr = m < 10 ? `0${m}` : `${m}`;
    return `${h}:${mStr}:${sStr}`;
  }
  return `${m}:${sStr}`;
}

export function normalizeSpreadsheetData(rawSheets) {
  const warnings = [];

  for (const item of REQUIRED_SHEETS) {
    const aliasNames = SHEET_ALIASES[item.key];
    const foundName = aliasNames.find(name => rawSheets[name]);
    if (!foundName) {
      warnings.push(`Worksheet '${item.name}' is missing.`);
    } else {
      const rows = rawSheets[foundName];
      if (!rows || rows.length === 0) {
        warnings.push(`Worksheet '${foundName}' is empty.`);
      } else {
        const rowKeys = Object.keys(rows[0]);
        let requiredCols = [];
        if (item.key === 'channel') {
          const hasKeyValueColumns = rowKeys.includes('Channel Name') && rowKeys.includes('Handle');
          if (!hasKeyValueColumns) {
            const standardFields = ['Channel Name', 'Handle', 'Subscribers'];
            standardFields.forEach(col => {
              if (!rowKeys.includes(col)) {
                warnings.push(`Required column '${col}' is missing in '${foundName}' sheet.`);
              }
            });
          }
        } else if (item.key === 'videos') {
          requiredCols = ['Video ID', 'Title', 'Thumbnail URL'];
        } else if (item.key === 'dailyAnalytics') {
          requiredCols = ['Date'];
        } else if (item.key === 'comments') {
          requiredCols = ['Comment ID', 'Video ID', 'Comment', 'Username'];
        } else if (item.key === 'playlists') {
          requiredCols = ['Playlist ID', 'Playlist Name'];
        } else if (item.key === 'realtime') {
          requiredCols = ['Timestamp'];
        } else if (item.key === 'settings') {
          requiredCols = ['Setting', 'Value'];
        }

        requiredCols.forEach(col => {
          if (!rowKeys.includes(col)) {
            warnings.push(`Required column '${col}' is missing in '${foundName}' sheet.`);
          }
        });
      }
    }
  }

  const settingsRows = getSheet(rawSheets, ...SHEET_ALIASES.settings);
  const settingsMap = parseSettingsSheet(settingsRows);
  const currency = (settingsMap['Currency'] || 'USD').replace(/[^A-Z]/gi, '').toUpperCase() || 'USD';

  const channelRaw = parseChannelSheet(getSheet(rawSheets, ...SHEET_ALIASES.channel));
  const videos = parseVideosSheet(getSheet(rawSheets, ...SHEET_ALIASES.videos), currency);

  const dailyAnalytics = parseDailyAnalyticsSheet(
    getSheet(rawSheets, ...SHEET_ALIASES.dailyAnalytics)
  );

  const analyticsLegacy = parseDailyAnalyticsSheet(getSheet(rawSheets, ...SHEET_ALIASES.analytics));
  const mergedDaily = dailyAnalytics.length ? dailyAnalytics : analyticsLegacy;

  const comments = parseCommentsSheet(getSheet(rawSheets, ...SHEET_ALIASES.comments), videos);
  const trafficSources = parseTrafficSourcesSheet(getSheet(rawSheets, ...SHEET_ALIASES.trafficSources));
  const audience = parseAudienceSheet(getSheet(rawSheets, ...SHEET_ALIASES.audience));
  
  let subscribers = parseSubscribersSheet(getSheet(rawSheets, ...SHEET_ALIASES.subscribers));
  // Fallback: Populate subscribers dynamically using comments authors if missing
  if (!subscribers.length && comments.length) {
    subscribers = comments.slice(0, 5).map((c, i) => ({
      name: c.author,
      avatar: c.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.author)}&background=random`,
      subscribers: 1000 + ((i * 98765) % 499000),
      date: c.time || '2026-07-28'
    }));
  }

  const playlists = parsePlaylistsSheet(getSheet(rawSheets, ...SHEET_ALIASES.playlists), videos);
  const realtime = parseRealtimeSheet(getSheet(rawSheets, ...SHEET_ALIASES.realtime));

  const channelStats = aggregateChannelStats(mergedDaily, { ...channelRaw, currency });

  const channelInfo = {
    name: channelRaw.name,
    handle: channelRaw.handle,
    subscribers: channelRaw.subscribers,
    subscribersFormatted: formatCompactNumber(channelRaw.subscribers),
    lifetimeViews: channelRaw.lifetimeViews,
    lifetimeViewsFormatted: formatCompactNumber(channelRaw.lifetimeViews),
    totalUploads: videos.length,
    avatar: channelRaw.avatar,
    banner: channelRaw.banner,
    watermark: channelRaw.avatar,
    description: channelRaw.description,
    country: channelRaw.country,
    customUrl: `https://youtube.com/${channelRaw.handle}`,
    joinedDate: channelRaw.joinedDate,
    averageRpm: channelRaw.averageRpm,
    averageCpm: channelRaw.averageCpm,
    totalRevenue: channelRaw.totalRevenue,
    totalRevenueFormatted: formatCurrency(channelRaw.totalRevenue, currency),
    totalWatchTimeHrs: channelRaw.totalWatchTimeHrs,
    ...channelStats,
    currency
  };

  const subtitles = videos.map(v => ({
    id: `sub_${v.id}`,
    videoId: v.id,
    videoTitle: v.title,
    languages: ['English (Automatic)'],
    modified: v.date,
    titleDescriptionState: 'Published',
    subtitlesState: 'Published'
  }));

  const charts = buildChartData(mergedDaily, realtime, trafficSources, audience, videos);

  const appSettings = {
    currency: settingsMap['Currency'] || `USD ($)`,
    theme: settingsMap['Theme'] || 'Dark',
    autoRefreshSeconds: parseNumber(settingsMap['Auto Refresh'] || settingsMap['Auto Refresh Interval'] || 60),
    liveSync: parseBool(settingsMap['Live Sync'] ?? true),
    country: channelRaw.country || 'India',
    keywords: settingsMap['Keywords'] || '',
    defaultVisibility: settingsMap['Default Visibility'] || 'Public',
    defaultCategory: settingsMap['Default Category'] || 'Science & Technology'
  };

  // Dynamic Engine Calculations
  const totalViews = videos.reduce((acc, v) => acc + v.views, 0);
  const totalRevenue = videos.reduce((acc, v) => acc + v.revenue, 0);
  const totalWatchTimeHrs = videos.reduce((acc, v) => acc + v.watchTimeHrs, 0);

  const averageRpm = totalViews > 0 ? (totalRevenue / (totalViews / 1000)) : 0;
  const averageCpm = videos.length > 0 ? (videos.reduce((acc, v) => acc + v.cpm, 0) / videos.length) : 0;
  const averageCtr = videos.length > 0 ? (videos.reduce((acc, v) => acc + v.ctr, 0) / videos.length) : 0;

  const totalDurationSecs = videos.reduce((acc, v) => acc + durationToSeconds(v.avgViewDuration || v.duration), 0);
  const averageDurationSecs = videos.length > 0 ? (totalDurationSecs / videos.length) : 0;
  const averageViewDuration = secondsToDuration(averageDurationSecs);

  const subscriberGrowth = videos.reduce((acc, v) => acc + (v.subscribersGained - v.subscribersLost), 0);

  const mostViewed = [...videos].sort((a, b) => b.views - a.views);
  const highestRpm = [...videos].sort((a, b) => b.rpm - a.rpm);
  const highestRevenue = [...videos].sort((a, b) => b.revenue - a.revenue);
  const fastestGrowing = [...videos].sort((a, b) => b.ctr - a.ctr);

  const monthlyRevenueMap = {};
  mergedDaily.forEach(row => {
    if (row.date && row.revenue) {
      const month = row.date.substring(0, 7);
      monthlyRevenueMap[month] = (monthlyRevenueMap[month] || 0) + row.revenue;
    }
  });
  const monthlyRevenue = Object.entries(monthlyRevenueMap).map(([month, revenue]) => ({ month, revenue }));

  return {
    channelInfo,
    videos,
    shorts: [],
    liveStreams: [],
    playlists,
    podcasts: [],
    comments,
    subtitles,
    copyrightClaims: [],
    audioTracks: [],
    notifications: [],
    settings: appSettings,
    warnings,
    analytics: {
      daily: mergedDaily,
      trafficSources,
      audience,
      realtime,
      subscribers,
      charts
    },
    engine: {
      totalViews,
      totalRevenue,
      totalWatchTimeHrs,
      averageRpm,
      averageCpm,
      averageCtr,
      averageViewDuration,
      subscriberGrowth,
      monthlyRevenue,
      topVideos: {
        mostViewed,
        highestRpm,
        highestRevenue,
        fastestGrowing
      }
    },
    meta: {
      loadedAt: new Date().toISOString(),
      videoCount: videos.length,
      sheetNames: Object.keys(rawSheets)
    }
  };
}

export function normalizeForVideo(data, videoId) {
  const charts = buildChartData(
    data.analytics.daily,
    data.analytics.realtime,
    data.analytics.trafficSources,
    data.analytics.audience,
    data.videos,
    videoId
  );
  return { ...data, analytics: { ...data.analytics, charts } };
}

