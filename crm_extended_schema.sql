-- ============================================================================
-- Extended CRM Tables for InsForge Backend
-- ============================================================================

-- 1. crm_comments Table
CREATE TABLE IF NOT EXISTS crm_comments (
    id VARCHAR(50) PRIMARY KEY,
    video_id VARCHAR(50),
    author VARCHAR(255) NOT NULL,
    author_avatar TEXT DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    text TEXT NOT NULL,
    likes BIGINT DEFAULT 0,
    heart BOOLEAN DEFAULT false,
    user_liked BOOLEAN DEFAULT false,
    time VARCHAR(50) DEFAULT '2 hours ago',
    status VARCHAR(50) DEFAULT 'Published',
    replies JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. crm_playlists Table
CREATE TABLE IF NOT EXISTS crm_playlists (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    video_count INTEGER DEFAULT 0,
    visibility VARCHAR(50) DEFAULT 'Public',
    last_updated VARCHAR(50) DEFAULT 'Just now',
    videos JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. crm_settings Table
CREATE TABLE IF NOT EXISTS crm_settings (
    key VARCHAR(50) PRIMARY KEY DEFAULT 'app_settings',
    currency VARCHAR(50) DEFAULT 'INR - Indian Rupee',
    theme VARCHAR(50) DEFAULT 'Dark',
    country VARCHAR(100) DEFAULT 'United States',
    keywords TEXT DEFAULT 'AI, Autonomous Agents, Software Engineering, React, Node.js, System Design',
    default_visibility VARCHAR(50) DEFAULT 'Public',
    default_category VARCHAR(100) DEFAULT 'Entertainment',
    blocked_words TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. crm_subtitles Table
CREATE TABLE IF NOT EXISTS crm_subtitles (
    id VARCHAR(50) PRIMARY KEY,
    video_id VARCHAR(50),
    video_title TEXT,
    languages JSONB DEFAULT '["English (Automatic)"]'::jsonb,
    modified VARCHAR(50) DEFAULT '2026-08-12',
    title_description_state VARCHAR(50) DEFAULT 'Published',
    subtitles_state VARCHAR(50) DEFAULT 'Published',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. crm_audio_library Table
CREATE TABLE IF NOT EXISTS crm_audio_library (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    duration VARCHAR(20) DEFAULT '3:45',
    genre VARCHAR(100) DEFAULT 'Electronic',
    mood VARCHAR(100) DEFAULT 'Dramatic',
    starred BOOLEAN DEFAULT false,
    audio_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Triggers for automatic updated_at
DROP TRIGGER IF EXISTS trg_crm_comments_updated_at ON crm_comments;
CREATE TRIGGER trg_crm_comments_updated_at BEFORE UPDATE ON crm_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_crm_playlists_updated_at ON crm_playlists;
CREATE TRIGGER trg_crm_playlists_updated_at BEFORE UPDATE ON crm_playlists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_crm_settings_updated_at ON crm_settings;
CREATE TRIGGER trg_crm_settings_updated_at BEFORE UPDATE ON crm_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_crm_subtitles_updated_at ON crm_subtitles;
CREATE TRIGGER trg_crm_subtitles_updated_at BEFORE UPDATE ON crm_subtitles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_crm_audio_library_updated_at ON crm_audio_library;
CREATE TRIGGER trg_crm_audio_library_updated_at BEFORE UPDATE ON crm_audio_library FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed initial records for new tables
INSERT INTO crm_comments (id, video_id, author, author_avatar, text, likes, heart, user_liked, time, status, replies) VALUES
('c_1', 'VID001', 'Alex Tech', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80', 'This video is incredible! The animation and storytelling are top notch.', 342, true, false, '2 hours ago', 'Published', '[]'::jsonb),
('c_2', 'VID002', 'DevGirl_99', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80', 'The AI workflow explained here saved me so much time 🤯 great tutorial!', 189, false, false, '5 hours ago', 'Published', '[]'::jsonb),
('c_3', 'VID003', 'CodeMaster', 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80', 'Best animation and kids content guide on YouTube. Period.', 512, true, false, '1 day ago', 'Published', '[]'::jsonb),
('c_4', 'VID001', 'SpamUser123', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', 'Check out my profile for free promo link!', 0, false, false, '3 days ago', 'Held for review', '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO crm_playlists (id, title, video_count, visibility, last_updated, videos) VALUES
('pl_01', 'AI & Autonomous Agents Masterclass', 4, 'Public', '3 days ago', '["VID001", "VID002", "VID006", "VID010"]'::jsonb),
('pl_02', 'Full Stack Animation Engineering', 3, 'Public', '1 week ago', '["VID003", "VID004", "VID008"]'::jsonb),
('pl_03', 'Creator Business & Growth Secrets', 3, 'Public', '2 weeks ago', '["VID005", "VID007", "VID009"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO crm_settings (key, currency, theme, country, keywords, default_visibility, default_category, blocked_words) VALUES
('app_settings', 'INR - Indian Rupee', 'Dark', 'United States', 'AI, Autonomous Agents, Software Engineering, React, Node.js, System Design', 'Public', 'Entertainment', 'spam, scam, promo')
ON CONFLICT (key) DO NOTHING;

INSERT INTO crm_audio_library (id, title, artist, duration, genre, mood, starred, audio_url) VALUES
('track_1', 'Synthwave Dreams', 'Axiom Audio', '3:45', 'Electronic', 'Dramatic', true, ''),
('track_2', 'Lofi Study Beats', 'Chillhop Lab', '2:30', 'Lofi', 'Calm', false, ''),
('track_3', 'Cinematic Horizon', 'Epic Soundscapes', '4:12', 'Cinematic', 'Inspirational', true, ''),
('track_4', 'Upbeat Future Bass', 'Neon Beats', '2:50', 'Dance', 'Happy', false, '')
ON CONFLICT (id) DO NOTHING;
