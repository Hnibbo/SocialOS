// Hup - Core TypeScript Types
// Auto-generated from database schema

export type UserAvailability = 'available' | 'busy' | 'invisible' | 'do_not_disturb';
export type ContentType = 'reel' | 'photo' | 'text' | 'story' | 'live';
export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged';
export type SubscriptionTier = 'free' | 'basic' | 'premium' | 'creator' | 'business';

// User Profile
export interface UserProfile {
    id: string;
    username: string | null;
    display_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
    avatar_3d_config: Record<string, unknown>;
    cover_url: string | null;
    bio: string | null;
    interests: string[];
    vibe_tags: string[];
    date_of_birth: string | null;
    gender: string | null;
    location_city: string | null;
    location_country: string | null;
    location_timezone: string | null;

    // Creator mode
    is_creator: boolean;
    creator_handle: string | null;
    creator_bio: string | null;
    creator_categories: string[];
    creator_verified: boolean;
    creator_monetization_enabled: boolean;

    // Social stats
    follower_count: number;
    following_count: number;

    // Subscription
    subscription_tier: SubscriptionTier;
    subscription_expires_at: string | null;
    stripe_customer_id: string | null;

    // Gamification
    badges: string[];
    achievements: Record<string, unknown>;
    digital_assets: Record<string, unknown>;
    xp_points: number;
    level: number;

    // Privacy
    privacy_settings: PrivacySettings;

    // Dating
    dating_enabled: boolean;
    dating_preferences: Record<string, unknown>;

    // Status
    verified: boolean;
    banned: boolean;
    ban_reason: string | null;
    banned_until: string | null;

    // Metadata
    last_active: string;
    created_at: string;
    updated_at: string;
}

export interface PrivacySettings {
    profile_visible: boolean;
    location_visible: boolean;
    online_status_visible: boolean;
    allow_messages_from: 'everyone' | 'followers' | 'none';
    allow_follows: boolean;
    show_age: boolean;
    show_distance: boolean;
}

// User Presence
export interface UserPresence {
    user_id: string;
    location: GeoPoint | null;
    location_name: string | null;
    heading: number | null;
    speed: number | null;
    accuracy: number | null;
    altitude: number | null;

    is_visible: boolean;
    visibility_radius: number;
    visibility_mode: string;
    anonymous_mode: boolean;

    availability: UserAvailability;
    status_text: string | null;
    status_emoji: string | null;

    intent_icons: string[];
    mood: string | null;
    energy_level: number | null;
    looking_for: string[];

    current_activity_id: string | null;
    current_group_id: string | null;

    last_location_update: string;
    last_seen: string;
    presence_expires_at: string | null;
}

export interface GeoPoint {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
}

// Group
export interface Group {
    id: string;
    name: string;
    description: string | null;
    avatar_url: string | null;
    cover_url: string | null;
    creator_id: string | null;

    location: GeoPoint | null;
    location_name: string | null;
    is_moving: boolean;

    is_public: boolean;
    is_verified: boolean;
    join_approval_required: boolean;
    invite_only: boolean;

    member_count: number;
    max_members: number;

    chat_enabled: boolean;
    dating_enabled: boolean;
    activities_enabled: boolean;
    content_enabled: boolean;

    vibe_tags: string[];
    category: string | null;
    interests: string[];

    moderation_level: string;

    last_activity: string;
    created_at: string;
    updated_at: string;
    expires_at: string | null;
}

export interface GroupMember {
    group_id: string;
    user_id: string;
    role: 'owner' | 'admin' | 'member';
    nickname: string | null;
    notifications_enabled: boolean;
    joined_at: string;
    invited_by: string | null;
}

// Activity
export interface Activity {
    id: string;
    creator_id: string | null;
    group_id: string | null;
    business_id: string | null;

    title: string;
    description: string | null;
    cover_url: string | null;
    activity_type: string;
    category: string | null;

    location: GeoPoint | null;
    location_name: string | null;
    location_address: Record<string, unknown> | null;
    is_virtual: boolean;
    virtual_link: string | null;

    start_time: string;
    end_time: string | null;
    timezone: string;
    is_recurring: boolean;
    recurrence_rule: string | null;

    max_attendees: number | null;
    current_attendees: number;
    waitlist_enabled: boolean;
    waitlist_count: number;
    rsvp_required: boolean;

    is_free: boolean;
    cost_amount: number | null;
    cost_currency: string;

    vibe_tags: string[];
    interests: string[];

    age_min: number;
    age_max: number;
    gender_filter: string | null;

    is_public: boolean;
    is_anonymous: boolean;
    allow_dating: boolean;
    chat_enabled: boolean;

    status: 'active' | 'cancelled' | 'completed';
    moderation_status: ModerationStatus;

    created_at: string;
    updated_at: string;
}

// Dating
export interface DatingProfile {
    user_id: string;
    is_active: boolean;
    modes_enabled: string[];

    age_min: number;
    age_max: number;
    gender_preference: string[];
    distance_max_km: number;

    show_photos: boolean;
    show_last_name: boolean;
    show_age: boolean;
    show_distance: boolean;

    prompts: DatingPrompt[];
    photos: string[];
    interests: string[];
    looking_for: string[];
    deal_breakers: string[];

    height_cm: number | null;
    relationship_type: string | null;

    last_active: string;
    created_at: string;
    updated_at: string;
}

export interface DatingPrompt {
    question: string;
    answer: string;
}

export interface DatingMatch {
    id: string;
    user1_id: string;
    user2_id: string;
    matched_at: string;
    context: string;
    context_id: string | null;

    is_anonymous: boolean;
    user1_revealed: boolean;
    user2_revealed: boolean;

    chat_started: boolean;
    first_message_at: string | null;
    status: 'active' | 'unmatched';
}

// Content
export interface Content {
    id: string;
    creator_id: string;
    content_type: ContentType;

    media_urls: string[];
    thumbnail_url: string | null;
    text_content: string | null;

    location: GeoPoint | null;
    location_name: string | null;
    is_local: boolean;

    visibility: 'public' | 'followers' | 'private';

    likes_count: number;
    comments_count: number;
    shares_count: number;
    views_count: number;
    saves_count: number;

    tags: string[];
    mentions: string[];
    hashtags: string[];

    moderation_status: ModerationStatus;

    is_pinned: boolean;
    is_deleted: boolean;

    expires_at: string | null;
    created_at: string;
    updated_at: string;
}

// Live Streaming
export interface LiveStream {
    id: string;
    host_id: string;

    title: string | null;
    description: string | null;
    thumbnail_url: string | null;

    stream_type: 'place' | 'solo' | 'random_connect' | 'group' | 'activity';

    location: GeoPoint | null;
    location_name: string | null;

    webrtc_room_id: string | null;

    is_active: boolean;
    is_anonymous: boolean;
    visibility: 'public' | 'followers' | 'private';

    viewer_count: number;
    peak_viewers: number;
    total_views: number;
    likes_count: number;

    started_at: string;
    ended_at: string | null;
}

// Business
export interface Business {
    id: string;
    owner_id: string | null;

    name: string;
    slug: string | null;
    description: string | null;
    short_description: string | null;

    logo_url: string | null;
    cover_url: string | null;
    photos: string[];

    category: string;
    subcategory: string | null;
    tags: string[];

    location: GeoPoint | null;
    address: BusinessAddress | null;
    address_formatted: string | null;

    phone: string | null;
    email: string | null;
    website: string | null;
    social_links: Record<string, string>;

    hours: BusinessHours;
    is_open_now: boolean;

    is_verified: boolean;
    is_premium: boolean;

    can_book: boolean;
    can_order: boolean;
    proximity_ads_enabled: boolean;

    rating_avg: number;
    rating_count: number;
    review_count: number;
    follower_count: number;

    status: 'pending' | 'active' | 'suspended';

    created_at: string;
    updated_at: string;
}

export interface BusinessAddress {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
}

export interface BusinessHours {
    monday?: DayHours;
    tuesday?: DayHours;
    wednesday?: DayHours;
    thursday?: DayHours;
    friday?: DayHours;
    saturday?: DayHours;
    sunday?: DayHours;
}

export interface DayHours {
    open: string;
    close: string;
    closed?: boolean;
}

// Proximity Ad
export interface ProximityAd {
    id: string;
    business_id: string;

    title: string;
    description: string | null;
    image_url: string | null;
    cta_text: string;
    cta_url: string | null;

    offer_type: string | null;
    discount_amount: number | null;
    discount_type: 'percent' | 'fixed' | null;
    promo_code: string | null;

    radius_meters: number;

    start_time: string;
    end_time: string;

    impressions_count: number;
    clicks_count: number;
    claims_count: number;

    is_active: boolean;
    is_approved: boolean;
}

// Notifications
export interface Notification {
    id: string;
    user_id: string;

    notification_type: string;
    category: string | null;

    title: string;
    body: string | null;
    image_url: string | null;
    data: Record<string, unknown>;

    action_url: string | null;
    action_type: string | null;

    related_id: string | null;
    related_type: string | null;
    sender_id: string | null;

    is_read: boolean;
    read_at: string | null;
    is_pushed: boolean;
    pushed_at: string | null;

    created_at: string;
}

// AI Config
export interface AIConfig {
    id: string;
    feature: string;
    display_name: string;
    description: string | null;

    enabled: boolean;

    provider: string;
    model: string;
    system_prompt: string | null;
    temperature: number;
    max_tokens: number;

    fallback_enabled: boolean;
    fallback_behavior: Record<string, unknown>;

    rate_limit_per_minute: number;
    rate_limit_per_day: number;

    cost_tracking: boolean;
    max_cost_per_day: number;
}

// Platform Config
export interface PlatformConfig {
    key: string;
    value: unknown;
    value_type: string;
    category: string;
    subcategory: string | null;
    display_name: string | null;
    description: string | null;

    is_secret: boolean;
    is_env_var: boolean;

    can_edit_live: boolean;
    requires_restart: boolean;
}

// Feature Flag
export interface FeatureFlag {
    name: string;
    enabled: boolean;
    rollout_percentage: number;
    user_whitelist: string[];
    user_blacklist: string[];
    countries: string[];
    subscription_tiers: string[];
    description: string | null;
    category: string | null;
}

// Subscription Plan
export interface SubscriptionPlan {
    id: string;
    name: string;
    tier: SubscriptionTier;
    description: string | null;

    price_monthly: number;
    price_yearly: number | null;
    currency: string;

    features: Record<string, boolean>;
    limits: Record<string, number>;

    is_popular: boolean;
    is_active: boolean;
}

// Map Display Types
export interface MapMarker {
    id: string;
    type: 'user' | 'group' | 'activity' | 'business' | 'stream' | 'content';
    coordinates: [number, number];
    data: UserPresence | Group | Activity | Business | LiveStream | Content;
}

export interface NearbyUser {
    user_id: string;
    distance_meters: number;
    display_name: string | null;
    avatar_url: string | null;
    availability: UserAvailability;
    intent_icons: string[];
    anonymous_mode: boolean;
}

// Agent Marketplace
export interface MarketplaceAgent {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    category: string;
    developer_name: string | null;
    icon_url: string | null;
    price_xp: number;
    price_hup: number;
    default_config: Record<string, unknown>;
    system_prompt_template: string | null;
    is_active: boolean;
    is_featured: boolean;
    created_at: string;
    updated_at: string;
}

export interface UserInstalledAgent {
    id: string;
    user_id: string;
    agent_id: string;
    is_enabled: boolean;
    custom_config: Record<string, unknown>;
    last_run_at: string | null;
    total_runs: number;
    installed_at: string;

    // Joined data
    agent?: MarketplaceAgent;
}

export interface AgentTrace {
    id: string;
    user_id: string | null;
    agent_id: string | null;
    action_name: string;
    thought_process: string | null;
    observation: string | null;
    result: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
}
