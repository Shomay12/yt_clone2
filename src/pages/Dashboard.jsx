import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore, formatINR } from '../store/useStore';
import { StudioCheckBadge, StudioUpBadge, StudioDownBadge } from '../components/StudioBadges';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { videos = [], comments = [], channelInfo = {}, analytics = {}, spreadsheetWarnings = [], showToast } = useStore();

  const latestVideo = (videos && videos.length > 0) ? videos[0] : null;
  const recentComments = (comments || []).filter(c => c && c.status !== 'Held for review').slice(0, 3);
  const recentSubscribers = analytics?.subscribers || [];

  const [ideasIdx, setIdeasIdx] = useState(0);
  const [creatorIdx, setCreatorIdx] = useState(0);

  useEffect(() => {
    console.info('[Spreadsheet] Dashboard Rendered', { videos: videos.length });
  }, [videos.length]);

  // Static "Ideas for you" cards matching the screenshot
  const ideasCards = [
    {
      title: 'Apply for channel verification',
      desc: 'You are eligible to apply for channel verification. If approved, you will receive a verification badge next to your channel name indicating that it\'s your official channel.',
      btnLabel: 'Apply now',
      img: 'https://www.gstatic.com/youtube/img/creator/channel_verification_illustration.svg',
      imgFallback: null,
    },
    {
      title: 'Turn on Super Thanks',
      desc: 'Increase your earnings potential and better connect with fans. Purchasers get a comment that stands out.',
      btnLabel: 'Enable now',
      img: null,
      imgFallback: '🎉',
    }
  ];

  const creatorVideos = [
    {
      title: 'YouTube: Creator vs Influencer',
      desc: 'Doctor Mike and Rene Ritchie discuss balancing education with entertainment, avoiding viral traps, and staying healthy in demanding careers.',
      thumb: 'https://i.ytimg.com/vi/h5sW12TFO0g/hqdefault.jpg',
      url: 'https://www.youtube.com/watch?v=h5sW12TFO0g',
    },
    {
      title: 'How to Grow on YouTube in 2026',
      desc: 'The YouTube team discusses what\'s working in 2026, from Shorts strategy to long-form content optimization.',
      thumb: 'https://i.ytimg.com/vi/A0Ks5q1pj2M/hqdefault.jpg',
      url: 'https://www.youtube.com/watch?v=A0Ks5q1pj2M',
    },
    {
      title: 'Inside YouTube Studio Updates',
      desc: 'A deep dive into the newest YouTube Studio features including improved analytics and community tools.',
      thumb: 'https://i.ytimg.com/vi/VtF9yTFMHFM/hqdefault.jpg',
      url: 'https://www.youtube.com/watch?v=VtF9yTFMHFM',
    },
  ];

  const whatsNew = [
    'Increasing Shorts length',
    'Expansion of channel permissions',
    'Upcoming changes to Community Guidelines warnings',
  ];

  const shoppingItems = [
    {
      title: 'Good news for Furniture Commissions: you now get paid more for products you promote',
      ends: 'Ends Aug 31, 11:59PM',
      thumb: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=80&auto=format&fit=crop&q=80',
    },
    {
      title: 'Good news for Fashion Commissions: you now get paid more for products you promote',
      ends: 'Ends Aug 31, 11:59PM',
      thumb: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=80&auto=format&fit=crop&q=80',
    },
  ];

  const pollOptions = [
    { label: '15 Se kam', pct: 8 },
    { label: '15 se 24', pct: 36 },
    { label: '25 se 35', pct: 44 },
    { label: '35 +', pct: 13 },
  ];

  const totalIdeas = ideasCards.length;
  const totalCreator = creatorVideos.length;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header-row">
        <h1 className="dashboard-title">Channel dashboard</h1>
        <div className="dashboard-header-actions">
          <button className="dash-icon-btn" title="Upload video" onClick={() => showToast("Click CREATE at top-right to upload", "info")}>
            <span className="material-symbols-outlined">upload</span>
          </button>
          <button className="dash-icon-btn" title="Go live" onClick={() => showToast("Simulated Live Stream initiated", "info")}>
            <span className="material-symbols-outlined">sensors</span>
          </button>
          <button className="dash-icon-btn" title="Create post" onClick={() => showToast("Create post opened", "info")}>
            <span className="material-symbols-outlined">edit_note</span>
          </button>
        </div>
      </div>

      {spreadsheetWarnings && spreadsheetWarnings.length > 0 && (
        <div style={{ backgroundColor: 'rgba(255,171,0,0.1)', border: '1px solid #ffab00', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#ffc400', fontSize: '13px' }}>
          <strong>Spreadsheet CMS Status:</strong>
          <ul style={{ margin: '4px 0 0 20px', padding: 0 }}>
            {spreadsheetWarnings.map((warn, i) => (<li key={i}>{warn}</li>))}
          </ul>
        </div>
      )}

      <div className="dashboard-grid">

        {/* ── LEFT COL ── */}

        {/* 1. Latest video performance */}
        <div className="dashboard-card latest-video-card">
          <div className="card-header"><h2>Latest video performance</h2></div>
          <div className="card-content">
            {latestVideo ? (
              <>
                <div className="video-thumbnail" onClick={() => navigate(`/channel/UCqpdVWIzEQUcbf4pAxlneOQ/video/${latestVideo.id}`)}>
                  <img src={latestVideo.thumbnail} alt="Video thumbnail" />
                  <div className="video-duration">{latestVideo.duration}</div>
                </div>
                <div className="video-stats-summary">
                  <p className="video-title" onClick={() => navigate(`/channel/UCqpdVWIzEQUcbf4pAxlneOQ/video/${latestVideo.id}`)}>
                    {latestVideo.title}
                  </p>
                  {/* Mini icon stats bar */}
                  <div className="lv-mini-bar">
                    <span className="lv-mini-item">
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#aaa' }}>insert_chart</span>
                      {latestVideo.viewsFormatted || latestVideo.views?.toLocaleString() || '0'}
                    </span>
                    <span className="lv-mini-item">
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#aaa' }}>comment</span>
                      {latestVideo.comments?.toLocaleString() || '0'}
                    </span>
                    <span className="lv-mini-item">
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#aaa' }}>thumb_up</span>
                      {latestVideo.likes?.toLocaleString() || '0'}
                    </span>
                    <span className="lv-mini-expand">
                      <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#aaa' }}>expand_less</span>
                    </span>
                  </div>
                  <div className="lv-period-label">First 15 days 5 hours</div>
                  <div className="stat-row">
                    <span className="stat-label">Ranking by views</span>
                    <span className="stat-value lv-rank-val">3 of 10
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', verticalAlign: 'middle', color: '#aaa' }}>chevron_right</span>
                    </span>
                  </div>
                  <div className="stat-row lv-highlight-row">
                    <span className="stat-label lv-hl-label">Views</span>
                    <span className="stat-value lv-hl-val">
                      {latestVideo.viewsFormatted || (latestVideo.views ? (latestVideo.views >= 1000 ? `${(latestVideo.views / 1000).toFixed(1)}K` : String(latestVideo.views)) : '45.1K')}
                      <StudioUpBadge style={{ marginLeft: '6px' }} />
                    </span>
                  </div>
                  <div className="stat-row lv-highlight-row">
                    <span className="stat-label lv-hl-label">Impressions click-through rate</span>
                    <span className="stat-value lv-hl-val">
                      {latestVideo.ctr ? `${latestVideo.ctr}%` : '9.0%'}
                      <StudioUpBadge style={{ marginLeft: '6px' }} />
                    </span>
                  </div>
                  <div className="stat-row lv-highlight-row">
                    <span className="stat-label lv-hl-label">Average view duration</span>
                    <span className="stat-value lv-hl-val">
                      {latestVideo.avgViewDuration || latestVideo.avd || '19:41'}
                      <StudioDownBadge color="#aaaaaa" style={{ marginLeft: '6px' }} />
                    </span>
                  </div>
                  {/* Catch me up row */}
                  <div className="lv-catch-row">
                    <button className="lv-catch-btn">
                      <span style={{ fontSize: '16px' }}>✦</span> Catch me up on this video
                    </button>
                    <Link to={`/channel/UCqpdVWIzEQUcbf4pAxlneOQ/analytics/tab-overview/period-last-28-days?video=${latestVideo.id}`} className="lv-action-icon-btn" title="Analytics">
                      <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#ccc' }}>insert_chart</span>
                    </Link>
                    <Link to="/channel/UCqpdVWIzEQUcbf4pAxlneOQ/community/comments" className="lv-action-icon-btn" title="Comments">
                      <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#ccc' }}>chat_bubble_outline</span>
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <p style={{ color: 'var(--text-secondary)', padding: '24px 0' }}>No recent video uploads found.</p>
            )}
          </div>
        </div>

        {/* 2. Channel analytics */}
        <div className="dashboard-card analytics-card">
          <div className="card-header"><h2>Channel analytics</h2></div>
          <div className="card-content">
            <div className="current-subs">
              <h3>Current subscribers</h3>
              <div className="sub-count">{channelInfo?.subscribersFormatted || channelInfo?.subscribers?.toLocaleString() || '0'}</div>
              <div className="sub-change">{channelInfo?.subscribersGainedLast28DaysFormatted || '+0'} in last 28 days</div>
            </div>
            <div className="summary-section">
              <h3>Summary</h3>
              <p className="summary-period">Last 28 days</p>
              <div className="stat-row">
                <span className="stat-label">Views</span>
                <span className="stat-value ana-stat-val">
                  {channelInfo?.viewsLast28DaysFormatted || '0'}
                  <StudioCheckBadge style={{ marginLeft: '6px' }} />
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Watch time (hours)</span>
                <span className="stat-value ana-stat-val">
                  {(channelInfo?.watchTimeLast28DaysFormatted || '0').replace(/\s*hrs\s*/gi, '')}
                  <StudioCheckBadge style={{ marginLeft: '6px' }} />
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Estimated revenue</span>
                <span className="stat-value ana-stat-val">
                  {formatINR(channelInfo?.revenueLast28DaysFormatted || channelInfo?.revenueLast28Days || 0)}
                  <StudioUpBadge style={{ marginLeft: '6px' }} />
                </span>
              </div>
            </div>
            <div className="top-videos-section">
              <h3>Top content</h3>
              <p className="summary-period">Last 48 hours · Views</p>
              {(videos || []).slice(0, 3).map(v => (
                <div className="top-video-item" key={v.id} onClick={() => navigate(`/channel/UCqpdVWIzEQUcbf4pAxlneOQ/video/${v.id}`)}>
                  <span className="video-name">{v.title}</span>
                  <span className="video-views">{v.viewsFormatted}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card-footer">
            <Link to="/channel/UCqpdVWIzEQUcbf4pAxlneOQ/analytics/tab-overview/period-last-28-days">Go to channel analytics</Link>
          </div>
        </div>

        {/* 3. Ideas for you */}
        <div className="dashboard-card ideas-card">
          <div className="card-header ideas-header">
            <h2>Ideas for you</h2>
            <div className="card-nav-arrows">
              <button onClick={() => setIdeasIdx(i => (i - 1 + totalIdeas) % totalIdeas)} disabled={ideasIdx === 0}>
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <span className="card-nav-counter">{ideasIdx + 1} / {totalIdeas}</span>
              <button onClick={() => setIdeasIdx(i => (i + 1) % totalIdeas)} disabled={ideasIdx === totalIdeas - 1}>
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
          <div className="card-content ideas-content">
            <div className="ideas-inner">
              <div className="ideas-text">
                <h4>{ideasCards[ideasIdx].title}</h4>
                <p className="news-desc">{ideasCards[ideasIdx].desc}</p>
                <div className="ideas-actions">
                  <button className="yt-sync-btn" onClick={() => showToast(`${ideasCards[ideasIdx].btnLabel} clicked!`, 'success')}>
                    {ideasCards[ideasIdx].btnLabel}
                  </button>
                  <button className="ideas-more-btn" title="More options">
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                </div>
              </div>
              {ideasCards[ideasIdx].img ? (
                <img src={ideasCards[ideasIdx].img} alt="ideas" className="ideas-img" onError={e => { e.target.style.display = 'none'; }} />
              ) : (
                <div className="ideas-emoji">{ideasCards[ideasIdx].imgFallback}</div>
              )}
            </div>
          </div>
        </div>

        {/* 4. Published videos */}
        <div className="dashboard-card published-card">
          <div className="card-header"><h2>Published videos</h2></div>
          <div className="card-content">
            {videos.slice(0, 4).map(video => (
              <div className="published-video-row" key={video.id} onClick={() => navigate(`/channel/UCqpdVWIzEQUcbf4pAxlneOQ/video/${video.id}`)}>
                <img src={video.thumbnail} alt="" />
                <div>
                  <b>{video.title}</b>
                  <span>
                    <span className="pub-stat"><span className="material-symbols-outlined" style={{ fontSize: '13px' }}>bar_chart</span> {video.viewsFormatted || video.views?.toLocaleString() || '0'}</span>
                    <span className="pub-stat"><span className="material-symbols-outlined" style={{ fontSize: '13px' }}>comment</span> {video.comments?.toLocaleString() || 0}</span>
                    <span className="pub-stat"><span className="material-symbols-outlined" style={{ fontSize: '13px' }}>thumb_up</span> {video.likes?.toLocaleString() || 0}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="card-footer">
            <Link to="/channel/UCqpdVWIzEQUcbf4pAxlneOQ/content/videos">Go to videos</Link>
          </div>
        </div>

        {/* 5. Comments */}
        <div className="dashboard-card comments-card">
          <div className="card-header"><h2>Comments</h2></div>
          <div className="card-content">
            <p className="summary-period">Last 48 hours</p>
            {recentComments.map(c => (
              <div className="comment-item" key={c.id} onClick={() => navigate('/channel/UCqpdVWIzEQUcbf4pAxlneOQ/community/comments')}>
                <img src={c.authorAvatar} alt="User" className="comment-avatar" />
                <div className="comment-details">
                  <div className="comment-meta">
                    <span className="comment-author">@{c.author?.replace('@', '')}</span>
                    <span className="comment-time">{c.time}</span>
                    {c.status === 'Published' && <span className="comment-badge">• Post</span>}
                  </div>
                  <p className="comment-text">{c.text}</p>
                </div>
                {c.videoThumb && <img src={c.videoThumb} alt="" className="comment-video-thumb" />}
              </div>
            ))}
          </div>
          <div className="card-footer">
            <Link to="/channel/UCqpdVWIzEQUcbf4pAxlneOQ/community/comments">View more</Link>
          </div>
        </div>

        {/* 6. Creator Insider */}
        <div className="dashboard-card creator-insider-card">
          <div className="card-header ideas-header">
            <h2>Creator Insider</h2>
            <div className="card-nav-arrows">
              <button onClick={() => setCreatorIdx(i => (i - 1 + totalCreator) % totalCreator)} disabled={creatorIdx === 0}>
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <span className="card-nav-counter">{creatorIdx + 1} / {totalCreator}</span>
              <button onClick={() => setCreatorIdx(i => (i + 1) % totalCreator)} disabled={creatorIdx === totalCreator - 1}>
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
          <div className="card-content">
            <div className="news-item">
              <img src={creatorVideos[creatorIdx].thumb} alt="Creator Insider" className="news-thumb"
                onError={e => { e.target.src = 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=400&q=80'; }} />
              <h4>{creatorVideos[creatorIdx].title}</h4>
              <p className="news-desc">{creatorVideos[creatorIdx].desc}</p>
            </div>
          </div>
          <div className="card-footer">
            <a href={creatorVideos[creatorIdx].url} target="_blank" rel="noreferrer">Watch on YouTube</a>
          </div>
        </div>

        {/* 7. Shopping */}
        <div className="dashboard-card shopping-card">
          <div className="card-header"><h2>Shopping</h2></div>
          <div className="card-content">
            <p className="summary-period">Latest affiliate offers</p>
            {shoppingItems.map((item, i) => (
              <div className="shopping-item" key={i}>
                <img src={item.thumb} alt="" className="shopping-thumb"
                  onError={e => { e.target.src = 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=80&auto=format&fit=crop&q=80'; }} />
                <div className="shopping-info">
                  <span className="shopping-ends">{item.ends}</span>
                  <span className="shopping-title">{item.title}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="card-footer">
            <span className="footer-action-link" onClick={() => showToast('Opening shopping...', 'info')}>Go to shopping</span>
          </div>
        </div>

        {/* 8. Recent subscribers */}
        <div className="dashboard-card subscribers-card">
          <div className="card-header"><h2>Recent subscribers</h2></div>
          <div className="card-content">
            <p className="summary-period">Last 90 days</p>
            <div className="recent-sub-list">
              {recentSubscribers.length > 0 ? (
                recentSubscribers.slice(0, 3).map((sub, idx) => (
                  <div className="sub-item" key={idx}>
                    <img src={sub.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(sub.name || 'U')}&background=333&color=fff`} alt="Sub" className="sub-avatar" />
                    <div className="sub-info">
                      <span className="sub-name">{sub.name}</span>
                      <span className="sub-count-meta">{sub.subscribers ? `${Number(sub.subscribers).toLocaleString()} subscribers` : sub.date}</span>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {[
                    { name: 'Lik07 Nitin Lakhera', subs: '479K' },
                    { name: 'Real Sato', subs: '349K' },
                    { name: 'Ai Story Nexa', subs: '285K' },
                  ].map((s, idx) => (
                    <div className="sub-item" key={idx}>
                      <div className="sub-avatar-placeholder">{s.name[0]}</div>
                      <div className="sub-info">
                        <span className="sub-name">{s.name}</span>
                        <span className="sub-count-meta">{s.subs} subscribers</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
          <div className="card-footer">
            <span className="footer-action-link" onClick={() => showToast('Showing all recent subscribers', 'info')}>See all</span>
          </div>
        </div>

        {/* 9. What's new in Studio */}
        <div className="dashboard-card whats-new-card">
          <div className="card-header"><h2>What's new in Studio</h2></div>
          <div className="card-content">
            {whatsNew.map((item, i) => (
              <div className="whats-new-item" key={i} onClick={() => showToast(item, 'info')}>
                <span>{item}</span>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#aaa' }}>chevron_right</span>
              </div>
            ))}
          </div>
        </div>

        {/* 10. Latest post */}
        <div className="dashboard-card latest-post-card">
          <div className="card-header"><h2>Latest post</h2></div>
          <div className="card-content">
            <div className="post-meta">
              <img src={channelInfo?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(channelInfo?.name || 'C')}&background=333&color=fff`} alt="Channel" className="post-avatar" />
              <div>
                <span className="post-channel">{channelInfo?.name || 'Your Channel'}</span>
                <span className="post-date"> • Aug 6, 2026</span>
              </div>
            </div>
            <p className="post-question">what's your age ?</p>
            <div className="poll-options">
              {pollOptions.map((opt, i) => (
                <div className="poll-option" key={i}>
                  <div className="poll-bar-wrap">
                    <span className="poll-label">{opt.label}</span>
                    <div className="poll-bar-track">
                      <div className="poll-bar-fill" style={{ width: `${opt.pct}%` }}></div>
                    </div>
                    <span className="poll-pct">{opt.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="post-stats">
              <span><strong>Votes</strong><br />132</span>
              <span><strong>Comments</strong><br />1</span>
              <span><strong>Likes</strong><br />4</span>
            </div>
            <p className="post-tip">Leave a heart and reply on your post to show you care!</p>
          </div>
          <div className="card-footer">
            <Link to="/channel/UCqpdVWIzEQUcbf4pAxlneOQ/community/comments">Go to Posts tab</Link>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="dashboard-footer">
        <a href="https://youtube.com" target="_blank" rel="noreferrer">Terms of use</a>
        <a href="https://youtube.com" target="_blank" rel="noreferrer">Privacy policy</a>
        <a href="https://youtube.com" target="_blank" rel="noreferrer">Policies &amp; Safety</a>
      </div>
    </div>
  );
};

export default Dashboard;
