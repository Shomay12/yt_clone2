-- ============================================================================
-- Insforge Database Structure Schema (insforge_schema.sql)
-- Database: PostgreSQL (Insforge BaaS)
-- Backend URL: https://zt9vsanb.ap-southeast.insforge.app
-- Purpose: Permanent CRM Storage, Channel Analytics, Video Performance & AVD
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. crm_channel Table
CREATE TABLE IF NOT EXISTS crm_channel (
    channel_id VARCHAR(50) PRIMARY KEY DEFAULT 'UCqpdVWIzEQUcbf4pAxlneOQ',
    name VARCHAR(255) NOT NULL DEFAULT 'Kids Toon',
    handle VARCHAR(100) DEFAULT '@kidstoon',
    avatar TEXT DEFAULT '/channel-avatar.png',
    banner TEXT DEFAULT 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    country VARCHAR(100) DEFAULT 'United States',
    subscribers BIGINT DEFAULT 412850,
    subscribers_formatted VARCHAR(50) DEFAULT '412.9K',
    subscribers_gained_last_28_days BIGINT DEFAULT 214,
    subscribers_gained_last_28_days_formatted VARCHAR(50) DEFAULT '+214',
    views_last_28_days BIGINT DEFAULT 1250000,
    views_last_28_days_formatted VARCHAR(50) DEFAULT '1.3M',
    watch_time_last_28_days NUMERIC(15, 2) DEFAULT 1383.80,
    watch_time_last_28_days_formatted VARCHAR(50) DEFAULT '1.4K hrs',
    revenue_last_28_days NUMERIC(15, 2) DEFAULT 42050.00,
    revenue_last_28_days_formatted VARCHAR(50) DEFAULT '₹42,050.00',
    total_views BIGINT DEFAULT 21450000,
    total_revenue NUMERIC(15, 2) DEFAULT 721577.00,
    total_revenue_formatted VARCHAR(50) DEFAULT '₹7,21,577.00',
    currency VARCHAR(10) DEFAULT 'INR',
    has_explicit_channel_metrics BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. crm_videos Table
CREATE TABLE IF NOT EXISTS crm_videos (
    id VARCHAR(50) PRIMARY KEY,
    channel_id VARCHAR(50) DEFAULT 'UCqpdVWIzEQUcbf4pAxlneOQ',
    title TEXT NOT NULL,
    description TEXT,
    thumbnail TEXT,
    duration VARCHAR(20) DEFAULT '10:18',
    duration_secs INTEGER DEFAULT 618,
    avg_view_duration VARCHAR(20) DEFAULT '1:45',
    avg_view_duration_secs INTEGER DEFAULT 105,
    views BIGINT DEFAULT 0,
    views_formatted VARCHAR(50) DEFAULT '0',
    likes BIGINT DEFAULT 0,
    comments BIGINT DEFAULT 0,
    rpm NUMERIC(10, 2) DEFAULT 33.64,
    cpm NUMERIC(10, 2) DEFAULT 58.00,
    ctr NUMERIC(6, 2) DEFAULT 8.90,
    revenue NUMERIC(15, 2) DEFAULT 0.00,
    revenue_formatted VARCHAR(50) DEFAULT '₹0.00',
    subscribers_gained BIGINT DEFAULT 0,
    subscribers_lost BIGINT DEFAULT 0,
    net_subscribers BIGINT DEFAULT 0,
    watch_time_hrs NUMERIC(15, 2) DEFAULT 0.00,
    impressions BIGINT DEFAULT 0,
    visibility VARCHAR(20) DEFAULT 'Public',
    monetization BOOLEAN DEFAULT true,
    restrictions VARCHAR(50) DEFAULT 'None',
    category VARCHAR(50) DEFAULT 'Entertainment',
    publish_date VARCHAR(30) DEFAULT '2026-02-14',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. crm_state Table
CREATE TABLE IF NOT EXISTS crm_state (
    key VARCHAR(50) PRIMARY KEY DEFAULT 'current_state',
    state_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_crm_videos_channel_id ON crm_videos (channel_id);
CREATE INDEX IF NOT EXISTS idx_crm_videos_views ON crm_videos (views DESC);
CREATE INDEX IF NOT EXISTS idx_crm_videos_revenue ON crm_videos (revenue DESC);
CREATE INDEX IF NOT EXISTS idx_crm_videos_sort_order ON crm_videos (sort_order ASC);
