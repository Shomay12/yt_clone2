import React, { useState, useEffect } from 'react';
import { useStore, formatINR } from '../store/useStore';
import './Earn.css';

const Earn = () => {
  const { channelInfo, earnConfig = {}, crmUpdateEarnConfig, showToast } = useStore();
  const [watchPageAds, setWatchPageAds] = useState(earnConfig?.watchPageAds !== false);
  const [shortsAds, setShortsAds] = useState(earnConfig?.shortsAds !== false);
  const [memberships, setMemberships] = useState(earnConfig?.memberships !== false);
  const [supers, setSupers] = useState(earnConfig?.supers !== false);
  const [shopping, setShopping] = useState(earnConfig?.shopping !== false);

  useEffect(() => {
    if (earnConfig) {
      if (earnConfig.watchPageAds !== undefined) setWatchPageAds(earnConfig.watchPageAds);
      if (earnConfig.shortsAds !== undefined) setShortsAds(earnConfig.shortsAds);
      if (earnConfig.memberships !== undefined) setMemberships(earnConfig.memberships);
      if (earnConfig.supers !== undefined) setSupers(earnConfig.supers);
      if (earnConfig.shopping !== undefined) setShopping(earnConfig.shopping);
    }
  }, [earnConfig]);

  return (
    <div className="dashboard-container earn-page">
      <div className="earn-header">
        <h1 className="dashboard-title">Earn on YouTube</h1>
        <div className="ypp-badge">
          <span className="material-symbols-outlined check-badge-icon">verified</span>
          <span>YouTube Partner Program Active</span>
        </div>
      </div>

      {/* Main Status Hero */}
      <div className="earn-hero-card">
        <div className="hero-left">
          <h2>You are a YouTube Partner</h2>
          <p className="hero-sub">You have access to monetization features, creator support, and Copyright Match Tool.</p>
          <div className="hero-stats-row">
            <div>
              <span className="h-stat">{channelInfo.subscribersFormatted}</span>
              <p className="h-label">Subscribers (10K required)</p>
            </div>
            <div>
              <span className="h-stat">{channelInfo.watchTimeLast28DaysFormatted}</span>
              <p className="h-label">Public watch hours (4K required)</p>
            </div>
          </div>
        </div>
        <div className="hero-right">
          <div className="rev-est-box">
            <p className="rev-label">Estimated 28-day Earnings</p>
            <p className="rev-value">{formatINR(channelInfo.revenueLast28DaysFormatted || channelInfo.revenueLast28Days || 0)}</p>
          </div>
        </div>
      </div>

      {/* Ways to Earn Cards */}
      <h3 className="section-subtitle">Ways to earn</h3>
      <div className="earn-streams-grid">
        <div className="earn-stream-card">
          <div className="stream-header">
            <span className="material-symbols-outlined stream-icon">play_circle</span>
            <h4>Watch Page Ads</h4>
          </div>
          <p className="stream-desc">Earn from ads and YouTube Premium on the Watch Page.</p>
          <div className="stream-toggle-row">
            <span>Status: <strong>Active</strong></span>
            <button 
              className={`toggle-btn ${watchPageAds ? 'active' : ''}`}
              onClick={() => { setWatchPageAds(!watchPageAds); showToast(`Watch Page Ads ${!watchPageAds ? 'enabled' : 'disabled'}`, "info"); }}
            >
              {watchPageAds ? 'ACTIVE' : 'OFF'}
            </button>
          </div>
        </div>

        <div className="earn-stream-card">
          <div className="stream-header">
            <span className="material-symbols-outlined stream-icon">bolt</span>
            <h4>Shorts Feed Ads</h4>
          </div>
          <p className="stream-desc">Earn from ads viewed in between videos in the Shorts Feed.</p>
          <div className="stream-toggle-row">
            <span>Status: <strong>Active</strong></span>
            <button 
              className={`toggle-btn ${shortsAds ? 'active' : ''}`}
              onClick={() => { setShortsAds(!shortsAds); showToast(`Shorts Feed Ads ${!shortsAds ? 'enabled' : 'disabled'}`, "info"); }}
            >
              {shortsAds ? 'ACTIVE' : 'OFF'}
            </button>
          </div>
        </div>

        <div className="earn-stream-card">
          <div className="stream-header">
            <span className="material-symbols-outlined stream-icon">card_membership</span>
            <h4>Memberships</h4>
          </div>
          <p className="stream-desc">Create a club of members paying monthly for exclusive perks.</p>
          <div className="stream-toggle-row">
            <span>Status: <strong>Active</strong> (14,210 Members)</span>
            <button 
              className={`toggle-btn ${memberships ? 'active' : ''}`}
              onClick={() => { setMemberships(!memberships); showToast(`Memberships updated`, "info"); }}
            >
              MANAGE
            </button>
          </div>
        </div>

        <div className="earn-stream-card">
          <div className="stream-header">
            <span className="material-symbols-outlined stream-icon">favorite</span>
            <h4>Supers</h4>
          </div>
          <p className="stream-desc">Engage with fans who support you through Super Chats & Super Thanks.</p>
          <div className="stream-toggle-row">
            <span>Status: <strong>Active</strong></span>
            <button 
              className={`toggle-btn ${supers ? 'active' : ''}`}
              onClick={() => { setSupers(!supers); showToast(`Supers updated`, "info"); }}
            >
              MANAGE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Earn;
