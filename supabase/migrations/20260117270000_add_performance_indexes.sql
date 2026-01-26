-- Add performance indexes for commonly queried columns

-- Notifications index for user queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
ON notifications(user_id, created_at DESC)
WHERE is_read = false;

-- Stream messages index for real-time chat
CREATE INDEX IF NOT EXISTS idx_stream_messages_stream_created
ON stream_messages(stream_id, created_at DESC);

-- Dating matches index for speed
CREATE INDEX IF NOT EXISTS idx_dating_matches_users_status
ON dating_matches(user1_id, user2_id, status)
WHERE status = 'active';

-- Content visibility index for feed queries
CREATE INDEX IF NOT EXISTS idx_content_visibility_moderation
ON content(creator_id, moderation_status, created_at DESC)
WHERE moderation_status = 'approved';

-- Wallet transactions index for history
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_created
ON transactions(wallet_id, created_at DESC);

-- User metrics index for profile views
CREATE INDEX IF NOT EXISTS idx_user_metrics_user
ON user_metrics(user_id);

-- Location history index for trail queries (using recorded_at instead)
CREATE INDEX IF NOT EXISTS idx_location_history_user_recorded
ON location_history(user_id, recorded_at DESC);

-- Activity attendees index for count queries
CREATE INDEX IF NOT EXISTS idx_activity_attendees_activity
ON activity_attendees(activity_id, user_id);

-- Content likes index for duplicate prevention
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_likes_content_user
ON content_likes(content_id, user_id);

-- Group messages index for chat
CREATE INDEX IF NOT EXISTS idx_group_messages_group_created
ON group_messages(group_id, created_at DESC);

-- Messages index for conversation queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
ON messages(conversation_id, created_at DESC);

-- Digital assets index for marketplace (commented out - column names may vary)
-- CREATE INDEX IF NOT EXISTS idx_digital_assets_creator_active
-- ON digital_assets(creator_id, is_active, created_at DESC);

-- User social roles index for progression (commented - column name verification needed)
-- CREATE INDEX IF NOT EXISTS idx_user_social_roles_user
-- ON user_social_roles(user_id, role_level DESC);

-- Conversation participants index for lookup (table might not exist in schema)
-- CREATE INDEX IF NOT EXISTS idx_conversation_participants_user
-- ON conversation_participants(conversation_id, user_id);

-- Reports index for admin dashboard (column name may differ)
-- CREATE INDEX IF NOT EXISTS idx_reports_status_created
-- ON reports(moderation_status, created_at DESC);

-- Leaderboard entries index for rankings
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_score
ON leaderboard_entries(leaderboard_id, score DESC);

-- Presence index for nearby queries (composite with active flag)
CREATE INDEX IF NOT EXISTS idx_user_presence_visible_location
ON user_presence(is_visible, last_known_location)
WHERE is_visible = true;

-- Crossed paths index for historical connections (column name verification needed)
-- CREATE INDEX IF NOT EXISTS idx_crossed_paths_users_created
-- ON crossed_paths(user1_id, user2_id, created_at DESC);

-- Panic events index for safety (table may not exist or column differs)
-- CREATE INDEX IF NOT EXISTS idx_panic_events_user_created
-- ON panic_events(user_id, created_at DESC);

-- Audit log index for compliance
CREATE INDEX IF NOT EXISTS idx_audit_log_user_created
ON audit_log(user_id, action, created_at DESC);

-- Escrow agreements index for transactions (table may not exist)
-- CREATE INDEX IF NOT EXISTS idx_escrow_agreements_status
-- ON escrow_agreements(status, created_at DESC)
-- WHERE status IN ('pending', 'active');

-- Random chat sessions index for matching (table may not exist)
-- CREATE INDEX IF NOT EXISTS idx_random_chats_status_created
-- ON random_chats(status, created_at DESC);

-- Loneliness detection index for interventions (table may not exist)
-- CREATE INDEX IF NOT EXISTS idx_loneliness_detection_user_score
-- ON loneliness_detection(user_id, isolation_score DESC)
-- WHERE needs_intervention = true;
