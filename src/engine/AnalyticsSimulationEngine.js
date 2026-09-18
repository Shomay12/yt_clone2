/**
 * AnalyticsSimulationEngine.js
 * 
 * Mathematically rigorous simulation engine for YouTube Studio Analytics.
 * Enforces exact formulas:
 *   - Revenue = (Views / 1000) * RPM
 *   - Watch Time (hrs) = Views * (Avg View Duration in sec / 3600)
 *   - Net Subscribers = Subscribers Gained - Subscribers Lost
 *   - Views = Impressions * (CTR / 100)
 *   - Country-weighted RPMs yielding channel average RPM ~$33.64 and CPM ~$58.00
 */

export const CHANNEL_BENCHMARKS = {
  name: 'Kids Toon',
  handle: '@kidstoon',
  subscribers: 412850,
  lifetimeViews: 21450000,
  averageRpm: 33.64,
  averageCpm: 58.00,
  joinedDate: '2021-03-15',
  country: 'United States',
  avatar: '/channel-avatar.png',
  banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80'
};

export const RAW_VIDEOS = [
  {
    id: 'VID001',
    title: 'This Man Truly Loves You But Why Is There Still Another Woman in His Life?',
    description: 'This Man Truly Loves You But Why Is There Still Another Woman in His Life?',
    duration: '28:17',
    durationSecs: 1697,
    avgViewDuration: '19:41',
    avd: '19:41',
    avgViewDurationSecs: 1181,
    views: 168741,
    ctr: 8.9,
    rpm: 1169.74,
    cpm: 2011.95,
    publishDate: '2026-08-12',
    thumbnail: '/thumbnails/latest_video.png',
    category: 'Entertainment',
    watchTimeHrs: 55390,
    revenue: 197437.48,
    revenueFormatted: '₹1,97,437.48',
    watchTimeHrsFormatted: '55.4K hrs',
    subscribersGained: 2135,
    subscribersLost: 0,
    netSubscribers: 2135,
    viewsFormatted: '168.7K',
    realtimeViews: 3452
  },
  {
    id: 'VID002',
    title: 'Long AI Video Kaise Banaye (14 Min Video) | AI Video Kaise Banaye | AI Video Maker',
    description: 'Full 14 minute long AI video creation masterclass.',
    duration: '14:22',
    durationSecs: 862,
    avgViewDuration: '3:45',
    avgViewDurationSecs: 225,
    views: 892000,
    ctr: 7.2,
    rpm: 33.80,
    cpm: 58.14,
    publishDate: '2026-02-28',
    thumbnail: '/thumbnails/2.webp',
    category: 'Entertainment'
  },
  {
    id: 'VID003',
    title: 'Create Kids Cartoon Nursery Rhymes with AI | AI Video Kaise Banaye | AI Video Maker',
    description: 'Nursery rhymes cartoon video creation using AI tools.',
    duration: '12:14',
    durationSecs: 734,
    avgViewDuration: '2:57',
    avgViewDurationSecs: 177,
    views: 650000,
    ctr: 6.4,
    rpm: 33.80,
    cpm: 58.14,
    publishDate: '2026-03-02',
    thumbnail: '/thumbnails/3.webp',
    category: 'Entertainment'
  },
  {
    id: 'VID004',
    title: 'AI Blogging Course in 2026 using facebook, Instagram Youtube...',
    description: 'Full course on AI blogging, social media traffic & monetization.',
    duration: '10:18',
    durationSecs: 618,
    avgViewDuration: '3:12',
    avgViewDurationSecs: 192,
    views: 529000,
    ctr: 6.2,
    rpm: 33.80,
    cpm: 58.14,
    publishDate: '2026-03-15',
    thumbnail: '/thumbnails/4.webp',
    category: 'Education'
  },
  {
    id: 'VID005',
    title: 'बिना चेहरा दिखाए YouTube Video कैसे बनाए ? New Channel Ideas | YouTube search',
    description: 'Faceless YouTube channel ideas and automation guide.',
    duration: '10:18',
    durationSecs: 618,
    avgViewDuration: '1:51',
    avgViewDurationSecs: 111,
    views: 410000,
    ctr: 7.8,
    rpm: 33.70,
    cpm: 57.96,
    publishDate: '2026-03-22',
    thumbnail: '/thumbnails/5.webp',
    category: 'Education'
  },
  {
    id: 'VID006',
    title: 'Make AI Videos Using Notebook LM',
    description: 'Learn to build videos with NotebookLM.',
    duration: '12:14',
    durationSecs: 734,
    avgViewDuration: '0:31',
    avgViewDurationSecs: 31,
    views: 438000,
    ctr: 4.9,
    rpm: 34.50,
    cpm: 59.34,
    publishDate: '2026-04-10',
    thumbnail: '/thumbnails/4.webp',
    category: 'Science & Technology'
  },
  {
    id: 'VID007',
    title: 'Raj Shamani Business Idea',
    description: 'Analyzing top business ideas and SaaS strategies.',
    duration: '08:42',
    durationSecs: 522,
    avgViewDuration: '0:46',
    avgViewDurationSecs: 46,
    views: 2110000,
    ctr: 9.3,
    rpm: 33.20,
    cpm: 57.10,
    publishDate: '2026-04-28',
    thumbnail: '/thumbnails/5.webp',
    category: 'Business'
  },
  {
    id: 'VID008',
    title: 'How to Make AI Influencers For FREE | Lip Sync Dancing AI Influencer...',
    description: 'Create AI influencers with lip-sync and dancing animations for free.',
    duration: '07:56',
    durationSecs: 476,
    avgViewDuration: '2:03',
    avgViewDurationSecs: 123,
    views: 973000,
    ctr: 7.1,
    rpm: 33.40,
    cpm: 57.45,
    publishDate: '2026-06-02',
    thumbnail: '/thumbnails/7.webp',
    category: 'Entertainment'
  },
  {
    id: 'VID009',
    title: 'This AI Saved Me 20 Hours',
    description: 'Automation tools saving developer and creator time.',
    duration: '09:31',
    durationSecs: 571,
    avgViewDuration: '3:45',
    avgViewDurationSecs: 225,
    views: 1678000,
    ctr: 8.4,
    rpm: 34.00,
    cpm: 58.48,
    publishDate: '2026-07-12',
    thumbnail: '/thumbnails/2.webp',
    category: 'Science & Technology'
  },
  {
    id: 'VID010',
    title: 'My Biggest AI Project Yet',
    description: 'Unveiling autonomous AI agent architecture built over 3 months.',
    duration: '07:56',
    durationSecs: 476,
    avgViewDuration: '3:20',
    avgViewDurationSecs: 200,
    views: 812000,
    ctr: 6.8,
    rpm: 33.60,
    cpm: 57.79,
    publishDate: '2026-07-22',
    thumbnail: '/thumbnails/3.webp',
    category: 'Science & Technology'
  }
];

// Calculate derived stats for raw videos ensuring internal consistency
export const PROCESSED_VIDEOS = RAW_VIDEOS.map(v => {
  const impressions = v.impressions || Math.round(v.views / (v.ctr / 100));
  const watchTimeHrs = v.watchTimeHrs !== undefined ? Number(v.watchTimeHrs) : parseFloat((v.views * (v.avgViewDurationSecs / 3600)).toFixed(1));
  const revenue = v.revenue !== undefined ? Number(v.revenue) : parseFloat(((v.views / 1000) * v.rpm).toFixed(2));
  const likes = v.likes || Math.round(v.views * 0.046);
  const comments = v.comments || Math.round(v.views * 0.0034);
  const shares = v.shares || Math.round(v.views * 0.0082);
  const subscribersGained = v.subscribersGained !== undefined ? Number(v.subscribersGained) : Math.round(v.views * 0.014);
  const subscribersLost = v.subscribersLost !== undefined ? Number(v.subscribersLost) : 0;
  const netSubscribers = v.netSubscribers !== undefined ? Number(v.netSubscribers) : subscribersGained;

  return {
    ...v,
    impressions,
    watchTimeHrs,
    revenue,
    revenueFormatted: v.revenueFormatted || `₹${revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    viewsFormatted: v.viewsFormatted || (v.views >= 1000000 ? `${(v.views / 1000000).toFixed(1)}M` : `${(v.views / 1000).toFixed(1)}K`),
    likes,
    comments,
    shares,
    subscribersGained,
    subscribersLost,
    netSubscribers
  };
});

export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const FULL_MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function formatSingleDate(dateInput) {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? new Date(dateInput.includes('T') ? dateInput : `${dateInput}T00:00:00Z`) : dateInput;
  if (isNaN(d.getTime())) return String(dateInput);
  const month = MONTH_NAMES[d.getUTCMonth()];
  const day = d.getUTCDate();
  const year = d.getUTCFullYear();
  return `${month} ${day}, ${year}`;
}

export function formatDateRangeText(startDateInput, endDateInput) {
  if (!startDateInput || !endDateInput) return '';
  const s = typeof startDateInput === 'string' ? new Date(startDateInput.includes('T') ? startDateInput : `${startDateInput}T00:00:00Z`) : startDateInput;
  const e = typeof endDateInput === 'string' ? new Date(endDateInput.includes('T') ? endDateInput : `${endDateInput}T00:00:00Z`) : endDateInput;
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return `${startDateInput} – ${endDateInput}`;

  const sMonth = MONTH_NAMES[s.getUTCMonth()];
  const sDay = s.getUTCDate();
  const sYear = s.getUTCFullYear();

  const eMonth = MONTH_NAMES[e.getUTCMonth()];
  const eDay = e.getUTCDate();
  const eYear = e.getUTCFullYear();

  if (s.toISOString().split('T')[0] === e.toISOString().split('T')[0]) {
    return `${eMonth} ${eDay}, ${eYear}`;
  }

  if (sYear === eYear) {
    if (sMonth === eMonth) {
      return `${sMonth} ${sDay} – ${eDay}, ${sYear}`;
    }
    return `${sMonth} ${sDay} – ${eMonth} ${eDay}, ${sYear}`;
  }
  return `${sMonth} ${sDay}, ${sYear} – ${eMonth} ${eDay}, ${sYear}`;
}

/**
 * Generate 365 daily time series data points leading up to today.
 */
export function generateDailyTimeSeries(daysCount = 365, anchorDate = '2026-08-13') {
  const today = new Date(anchorDate.includes('T') ? anchorDate : `${anchorDate}T00:00:00Z`);
  const dailyData = [];

  let cumulativeSubs = 280000;

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayOfWeek = d.getUTCDay(); // 0 = Sun, 6 = Sat

    // Weekend multiplier (Sat/Sun get 1.25x - 1.45x, Fri gets 1.15x)
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isFriday = dayOfWeek === 5;
    const weekendMultiplier = isWeekend ? (1.30 + 0.14 * Math.sin(i * 3.7)) : isFriday ? 1.16 : 0.96;

    // Rich multi-harmonic organic fluctuations creating natural peaks, dips and day-to-day randomness
    const seasonalFactor = 1 + 0.12 * Math.sin((i / 365) * 2 * Math.PI);
    const noise = 1.0 + 0.32 * Math.sin(i * 1.83 + 0.7)
                      + 0.22 * Math.cos(i * 3.41 + 1.4)
                      + 0.16 * Math.sin(i * 7.19 + 2.3)
                      + 0.11 * Math.cos(i * 13.37 + 0.9)
                      + 0.08 * Math.sin(i * 29.17);

    // Upload day spikes
    let uploadBoost = 1.0;
    PROCESSED_VIDEOS.forEach(v => {
      if (v.publishDate === dateStr) {
        uploadBoost += 2.4;
      }
    });

    const baseDailyViews = Math.max(8000, Math.round(52000 * weekendMultiplier * seasonalFactor * noise * uploadBoost));
    const ctr = parseFloat(Math.max(4.2, (7.8 + 1.2 * Math.sin(i * 2.3 + 0.7) + 0.7 * Math.cos(i * 5.1))).toFixed(1));
    const impressions = Math.round(baseDailyViews / (ctr / 100));

    const avgDurationSecs = Math.max(60, Math.round(240 + 35 * Math.cos(i * 1.1 + 0.3) + 20 * Math.sin(i * 4.2)));
    const watchTimeHrs = parseFloat((baseDailyViews * (avgDurationSecs / 3600)).toFixed(1));

    // Daily RPM
    const rpm = parseFloat((33.64 + 2.8 * Math.sin(i * 1.9 + 1.2) + 1.4 * Math.cos(i * 4.7)).toFixed(2));
    const cpm = parseFloat((rpm * 1.72).toFixed(2));
    const revenue = parseFloat(((baseDailyViews / 1000) * rpm).toFixed(2));

    const subsGained = Math.round(baseDailyViews * 0.012 * (1.0 + 0.20 * Math.sin(i * 2.8) + 0.12 * Math.cos(i * 6.3)));
    const subsLost = Math.round(subsGained * (0.12 + 0.04 * Math.cos(i * 1.7)));
    cumulativeSubs += (subsGained - subsLost);

    const likes = Math.round(baseDailyViews * (0.044 + 0.008 * Math.sin(i * 2.1)));
    const comments = Math.round(baseDailyViews * (0.0032 + 0.0009 * Math.cos(i * 3.3)));

    dailyData.push({
      date: dateStr,
      day: `Day ${daysCount - i}`,
      views: baseDailyViews,
      impressions,
      ctr,
      watchTimeHrs,
      avgViewDurationSecs: avgDurationSecs,
      avgViewDuration: `${Math.floor(avgDurationSecs / 60)}:${(avgDurationSecs % 60).toString().padStart(2, '0')}`,
      rpm,
      cpm,
      revenue,
      subscribersGained: subsGained,
      subscribersLost: subsLost,
      subscribersNet: subsGained - subsLost,
      cumulativeSubscribers: cumulativeSubs,
      likes,
      comments
    });
  }

  return dailyData;
}

export const DAILY_SERIES = generateDailyTimeSeries(365, '2026-09-18');

/**
 * Filter daily metrics based on date range boundaries
 */
export function filterDailyMetricsByRange(dailySeries, startDateStr, endDateStr) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  end.setHours(23, 59, 59, 999);

  return dailySeries.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate >= start && itemDate <= end;
  });
}

/**
 * Calculate aggregated summary statistics for a filtered daily subset
 */
export function aggregateMetrics(filteredDaily, _videoId = null) {
  if (!filteredDaily || filteredDaily.length === 0) {
    return {
      views: 0,
      viewsFormatted: '0',
      watchTimeHrs: 0,
      watchTimeHrsFormatted: '0',
      impressions: 0,
      impressionsFormatted: '0',
      ctr: 0,
      revenue: 0,
      revenueFormatted: '₹0.00',
      subscribersGained: 0,
      subscribersLost: 0,
      subscribersNet: 0,
      subscribersNetFormatted: '+0',
      rpm: 0,
      cpm: 0,
      likes: 0,
      comments: 0
    };
  }

  const views = filteredDaily.reduce((s, d) => s + d.views, 0);
  const watchTimeHrs = filteredDaily.reduce((s, d) => s + d.watchTimeHrs, 0);
  const impressions = filteredDaily.reduce((s, d) => s + d.impressions, 0);
  const revenue = filteredDaily.reduce((s, d) => s + d.revenue, 0);
  const subscribersGained = filteredDaily.reduce((s, d) => s + d.subscribersGained, 0);
  const subscribersLost = filteredDaily.reduce((s, d) => s + d.subscribersLost, 0);
  const subscribersNet = subscribersGained - subscribersLost;
  const likes = filteredDaily.reduce((s, d) => s + d.likes, 0);
  const comments = filteredDaily.reduce((s, d) => s + d.comments, 0);

  const avgCtr = impressions > 0 ? parseFloat(((views / impressions) * 100).toFixed(1)) : 0;
  const avgRpm = views > 0 ? parseFloat(((revenue / (views / 1000))).toFixed(2)) : 0;
  const avgCpm = parseFloat((avgRpm * 1.72).toFixed(2));

  const formatCompact = (num) => {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  return {
    views,
    viewsFormatted: formatCompact(views),
    watchTimeHrs: parseFloat(watchTimeHrs.toFixed(1)),
    watchTimeHrsFormatted: `${formatCompact(Math.round(watchTimeHrs))}`,
    impressions,
    impressionsFormatted: formatCompact(impressions),
    ctr: avgCtr,
    revenue: parseFloat(revenue.toFixed(2)),
    revenueFormatted: `₹${revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    subscribersGained,
    subscribersLost,
    subscribersNet,
    subscribersNetFormatted: subscribersNet >= 0 ? `+${formatCompact(subscribersNet)}` : `-${formatCompact(Math.abs(subscribersNet))}`,
    rpm: avgRpm,
    cpm: avgCpm,
    likes,
    comments
  };
}

/**
 * Traffic sources breakdown where percentages sum to 100%
 */
export function getTrafficSources(totalViews) {
  const breakdown = [
    { source: 'Browse Features', percentage: 42.5 },
    { source: 'Suggested Videos', percentage: 28.3 },
    { source: 'YouTube Search', percentage: 14.2 },
    { source: 'External', percentage: 6.4 },
    { source: 'Notifications', percentage: 4.1 },
    { source: 'Playlists', percentage: 2.5 },
    { source: 'Channel Pages', percentage: 1.2 },
    { source: 'Shorts Feed', percentage: 0.8 }
  ];

  return breakdown.map(item => ({
    ...item,
    views: Math.round(totalViews * (item.percentage / 100))
  }));
}

/**
 * Audience Geographies, Age/Gender, Subtitles & Online Heatmap
 */
export function getAudienceBreakdown(totalViews) {
  const geographies = [
    { country: 'United States', percentage: 38.5, rpm: 48.20, views: Math.round(totalViews * 0.385) },
    { country: 'Canada', percentage: 11.2, rpm: 42.50, views: Math.round(totalViews * 0.112) },
    { country: 'United Kingdom', percentage: 9.8, rpm: 39.80, views: Math.round(totalViews * 0.098) },
    { country: 'Germany', percentage: 8.4, rpm: 38.10, views: Math.round(totalViews * 0.084) },
    { country: 'Australia', percentage: 6.5, rpm: 41.00, views: Math.round(totalViews * 0.065) },
    { country: 'India', percentage: 14.2, rpm: 4.20, views: Math.round(totalViews * 0.142) },
    { country: 'Philippines', percentage: 4.8, rpm: 5.10, views: Math.round(totalViews * 0.048) },
    { country: 'Brazil', percentage: 4.0, rpm: 6.50, views: Math.round(totalViews * 0.040) }
  ];

  const ageGender = [
    { group: '18–24 years', percentage: 22.4, male: 74, female: 26 },
    { group: '25–34 years', percentage: 48.6, male: 76, female: 24 },
    { group: '35–44 years', percentage: 18.2, male: 72, female: 28 },
    { group: '45–54 years', percentage: 7.1, male: 70, female: 30 },
    { group: '55+ years', percentage: 3.7, male: 68, female: 32 }
  ];

  const subtitleLanguages = [
    { language: 'English (Original)', percentage: 76.5 },
    { language: 'Spanish', percentage: 8.2 },
    { language: 'Hindi', percentage: 6.4 },
    { language: 'German', percentage: 4.1 },
    { language: 'No subtitles/CC', percentage: 4.8 }
  ];

  const viewerWatchBehavior = [
    { type: 'Returning viewers', percentage: 34.2, description: 'Viewers who watched your channel before and returned' },
    { type: 'New viewers', percentage: 65.8, description: 'Viewers who watched your channel for the first time' }
  ];

  // 7 days x 24 hours heatmap data for "When your viewers are on YouTube"
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const viewerHeatmap = days.map((day, dayIndex) => {
    const hours = [];
    for (let h = 0; h < 24; h++) {
      let intensity = 0; // 0 = very few, 3 = many
      if (h >= 14 && h <= 22) intensity = ((h + (dayIndex * 3)) % 3) + 1;
      else if (h >= 9 && h <= 13) intensity = 1;
      hours.push({ hour: h, intensity });
    }
    return { day, hours };
  });

  return {
    geographies,
    ageGender,
    subtitleLanguages,
    viewerWatchBehavior,
    viewerHeatmap
  };
}

/**
 * Realtime continuous data generator (Last 60 minutes & Last 48 hours)
 */
export function generateRealtimeDataset(anchorDate = '2026-09-18') {
  const last60Minutes = [];
  const now = new Date(anchorDate.includes('T') ? anchorDate : `${anchorDate}T12:00:00Z`);

  for (let i = 59; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 60 * 1000);
    const timeStr = `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
    const baseViews = Math.round(35 + Math.sin(i / 10) * 12 + ((i * 7) % 15));
    last60Minutes.push({ minute: timeStr, views: baseViews });
  }

  const last48Hours = [];
  for (let i = 47; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 3600 * 1000);
    const label = `${d.getUTCHours()}:00`;
    const hourViews = Math.round(1850 + Math.sin(i / 4) * 600 + ((i * 37) % 250));
    last48Hours.push({ hour: label, views: hourViews });
  }

  return {
    last60Minutes,
    last48Hours,
    total60MinViews: last60Minutes.reduce((s, m) => s + m.views, 0),
    total48HourViews: last48Hours.reduce((s, h) => s + h.views, 0)
  };
}

/**
 * Ticker function to update realtime dataset with continuous natural micro-fluctuations
 */
export function tickRealtimeData(currentRealtime) {
  if (!currentRealtime || !currentRealtime.last60Minutes) {
    return generateRealtimeDataset();
  }

  const new60 = [...currentRealtime.last60Minutes];
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  // Natural fluctuation on latest minute
  const lastItem = new60[new60.length - 1];
  const delta = ((now.getSeconds() % 7) - 3);
  const updatedViews = Math.max(12, lastItem.views + delta);

  if (lastItem.minute === timeStr) {
    new60[new60.length - 1] = { ...lastItem, views: updatedViews };
  } else {
    new60.shift();
    new60.push({ minute: timeStr, views: Math.round(30 + ((now.getMinutes() * 7) % 20)) });
  }

  const new48 = [...currentRealtime.last48Hours];
  const lastHourItem = new48[new48.length - 1];
  new48[new48.length - 1] = { ...lastHourItem, views: lastHourItem.views + Math.max(0, delta) };

  return {
    last60Minutes: new60,
    last48Hours: new48,
    total60MinViews: new60.reduce((s, m) => s + m.views, 0),
    total48HourViews: new48.reduce((s, h) => s + h.views, 0)
  };
}
