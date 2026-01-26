import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://pltlcpqtivuvyeuywvql.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseKey) {
    console.error('Error: SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY is required');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedTestData() {
    console.log('🌱 Starting seed data creation...');

    const testUsers = [];
    const userIds = [];

    for (let i = 0; i < 20; i++) {
        const userId = uuidv4();
        userIds.push(userId);

        const cities = ['New York', 'Los Angeles', 'Chicago', 'Miami', 'San Francisco'];
        const neighborhoods = {
            'New York': ['Williamsburg', 'SoHo', 'Greenwich Village', 'Upper East Side'],
            'Los Angeles': ['Venice', 'Silver Lake', 'West Hollywood', 'Santa Monica'],
            'Chicago': ['Wicker Park', 'Lincoln Park', 'River North', 'Old Town'],
            'Miami': ['South Beach', 'Wynwood', 'Coconut Grove', 'Brickell'],
            'San Francisco': ['Mission District', 'SOMA', 'Hayes Valley', 'Marina District'],
        };

        const city = cities[Math.floor(Math.random() * cities.length)];
        const neighborhood = neighborhoods[city as keyof typeof neighborhoods][Math.floor(Math.random() * 4)];
        const energyTypes = ['party', 'calm', 'creative', 'dead', 'chaos', 'romantic', 'competitive'];
        const roles = ['connector', 'explorer', 'host', 'muse', 'catalyst', 'legend', 'ghost'];

        testUsers.push({
            id: userId,
            username: `testuser_${i + 1}`,
            display_name: `Test User ${i + 1}`,
            email: `test${i + 1}@example.com`,
            avatar_url: `https://i.pravatar.cc/150?u=${userId}`,
            location_city: city,
            location_country: 'USA',
            xp_points: Math.floor(Math.random() * 10000),
            level: Math.floor(Math.random() * 50) + 1,
            interests: ['music', 'food', 'art', 'sports', 'tech', 'outdoors'].slice(0, Math.floor(Math.random() * 4) + 1),
            created_at: new Date().toISOString(),
        });

        await supabase.from('user_profiles').upsert(testUsers[i], { onConflict: 'id' });

        await supabase.from('user_presence').upsert({
            user_id: userId,
            location: {
                type: 'Point',
                coordinates: [-74.006 + (Math.random() - 0.5) * 0.1, 40.7128 + (Math.random() - 0.5) * 0.1],
            },
            location_name: `${neighborhood}, ${city}`,
            is_visible: Math.random() > 0.2,
            availability: ['available', 'available', 'available', 'busy', 'do_not_disturb'][Math.floor(Math.random() * 5)],
            intent_icons: [energyTypes[Math.floor(Math.random() * energyTypes.length)]],
            energy_level: Math.floor(Math.random() * 100),
            last_seen: new Date().toISOString(),
        }, { onConflict: 'user_id' });

        await supabase.from('user_social_roles').upsert({
            user_id: userId,
            primary_role: roles[Math.floor(Math.random() * roles.length)],
            role_points: Math.floor(Math.random() * 1000),
            role_level: Math.floor(Math.random() * 10) + 1,
            connections_made: Math.floor(Math.random() * 100),
            events_hosted: Math.floor(Math.random() * 20),
            groups_led: Math.floor(Math.random() * 5),
            badges_earned: ['early_adopter', 'social_butterfly', 'event_horizon'].slice(0, Math.floor(Math.random() * 3)),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

        await supabase.from('social_signals').insert({
            user_id: userId,
            signal: energyTypes[Math.floor(Math.random() * energyTypes.length)],
            radius_meters: Math.floor(Math.random() * 500) + 100,
            expires_at: new Date(Date.now() + Math.random() * 3600000).toISOString(),
            is_active: true,
        });
    }

    console.log(`✅ Created ${testUsers.length} test users`);

    const businesses = [
        { name: 'The Electric Owl', category: 'bar', type: 'nightlife' },
        { name: 'Neon Garden', category: 'restaurant', type: 'food' },
        { name: 'Underground Jazz', category: 'venue', type: 'music' },
        { name: 'Skyline Rooftop', category: 'bar', type: 'nightlife' },
        { name: 'The Cellar', category: 'club', type: 'nightlife' },
        { name: 'Art House Cinema', category: 'theater', type: 'entertainment' },
        { name: 'Techno Bunker', category: 'club', type: 'nightlife' },
        { name: 'Coffee Collective', category: 'cafe', type: 'food' },
        { name: 'Retro Arcade', category: 'entertainment', type: 'entertainment' },
        { name: 'The Velvet Lounge', category: 'bar', type: 'nightlife' },
    ];

    for (let i = 0; i < businesses.length; i++) {
        const business = businesses[i];
        const businessId = uuidv4();

        await supabase.from('businesses').insert({
            id: businessId,
            owner_id: userIds[Math.floor(Math.random() * userIds.length)],
            name: business.name,
            category: business.category,
            subcategory: business.type,
            tags: [business.type, 'popular', 'trending'],
            location: {
                type: 'Point',
                coordinates: [-74.006 + (Math.random() - 0.5) * 0.05, 40.7128 + (Math.random() - 0.5) * 0.05],
            },
            address_formatted: `${100 + i * 10} Main St, New York, NY`,
            is_verified: true,
            rating_avg: 4 + Math.random(),
            rating_count: Math.floor(Math.random() * 500) + 50,
            follower_count: Math.floor(Math.random() * 2000),
            status: 'active',
            created_at: new Date().toISOString(),
        });
    }

    console.log(`✅ Created ${businesses.length} test businesses`);

    const activities = [
        { title: 'Sunset Yoga in the Park', type: 'wellness', max_attendees: 30 },
        { title: 'Tech Startup Networking', type: 'business', max_attendees: 50 },
        { title: 'Live Jazz Night', type: 'music', max_attendees: 100 },
        { title: 'Craft Beer Tasting', type: 'food', max_attendees: 25 },
        { title: 'Street Art Walking Tour', type: 'culture', max_attendees: 20 },
        { title: 'Speed Dating Event', type: 'dating', max_attendees: 40 },
        { title: 'Board Game Night', type: 'social', max_attendees: 16 },
        { title: 'Karaoke Championship', type: 'music', max_attendees: 50 },
        { title: 'Morning Run Club', type: 'fitness', max_attendees: 35 },
        { title: 'Comedy Open Mic', type: 'entertainment', max_attendees: 60 },
    ];

    for (let i = 0; i < activities.length; i++) {
        const activity = activities[i];
        const startTime = new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000);

        await supabase.from('activities').insert({
            creator_id: userIds[Math.floor(Math.random() * userIds.length)],
            title: activity.title,
            activity_type: activity.type,
            category: activity.type,
            location: {
                type: 'Point',
                coordinates: [-74.006 + (Math.random() - 0.5) * 0.03, 40.7128 + (Math.random() - 0.5) * 0.03],
            },
            location_name: `${['Central Park', 'Times Square', 'Brooklyn Bridge', 'Union Square', 'Washington Square'][Math.floor(Math.random() * 5)]}`,
            start_time: startTime.toISOString(),
            end_time: new Date(startTime.getTime() + 3 * 60 * 60 * 1000).toISOString(),
            max_attendees: activity.max_attendees,
            current_attendees: Math.floor(Math.random() * activity.max_attendees * 0.8),
            is_free: Math.random() > 0.5,
            cost_amount: Math.random() > 0.5 ? Math.floor(Math.random() * 50) + 10 : null,
            vibe_tags: ['fun', 'social', 'active'],
            interests: ['meeting_new_people', 'hobbies', 'learning'],
            is_public: true,
            status: 'active',
            moderation_status: 'approved',
            created_at: new Date().toISOString(),
        });
    }

    console.log(`✅ Created ${activities.length} test activities`);

    const groups = [
        { name: 'Night Owls NYC', category: 'nightlife' },
        { name: 'Creative Minds', category: 'art' },
        { name: 'Fitness Fanatics', category: 'health' },
        { name: 'Foodie Explorers', category: 'food' },
        { name: 'Music Lovers United', category: 'music' },
        { name: 'Tech Enthusiasts', category: 'tech' },
        { name: 'Adventure Seekers', category: 'outdoors' },
        { name: 'Book Club Monthly', category: 'culture' },
        { name: 'Networking Pros', category: 'business' },
        { name: 'Dating Over 30', category: 'dating' },
    ];

    for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        const groupId = uuidv4();

        await supabase.from('groups').insert({
            id: groupId,
            name: group.name,
            description: `A community for ${group.category} enthusiasts in NYC`,
            creator_id: userIds[Math.floor(Math.random() * userIds.length)],
            category: group.category,
            interests: [group.category, 'social', 'community'],
            location: {
                type: 'Point',
                coordinates: [-74.006 + (Math.random() - 0.5) * 0.04, 40.7128 + (Math.random() - 0.5) * 0.04],
            },
            is_public: true,
            max_members: Math.floor(Math.random() * 200) + 50,
            member_count: Math.floor(Math.random() * 150),
            last_active_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
        });

        for (let j = 0; j < Math.floor(Math.random() * 5) + 2; j++) {
            await supabase.from('group_members').insert({
                group_id: groupId,
                user_id: userIds[Math.floor(Math.random() * userIds.length)],
                role: j === 0 ? 'owner' : 'member',
                joined_at: new Date().toISOString(),
            });
        }
    }

    console.log(`✅ Created ${groups.length} test groups`);

    const dropTypes = ['flash_drinks', 'hidden_dj', 'mystery_group', 'rare_asset', 'confession_zone', 'dating_boost', 'anonymous_confession'];
    const dropTitles = {
        'flash_drinks': ['Flash Happy Hour', 'Spontaneous Cheers', 'Last Call Mystery'],
        'hidden_dj': ['Secret Set Starting', 'Underground Beats', 'Mystery DJ in Backroom'],
        'mystery_group': ['You Are Invited', 'Secret Gathering', 'Mystery Clique Forming'],
        'rare_asset': ['Limited Drop', 'Digital Treasure', 'Exclusive Collectible'],
        'confession_zone': ['Safe Space Confessions', 'Vent Hour', 'Anonymous Sharing Circle'],
        'dating_boost': ['Speed Round', 'Love Connection Event', 'Match Making Session'],
        'anonymous_confession': ['Tell Us Your Secret', 'Anonymous Truths', 'Confess and Connect'],
    };

    for (let i = 0; i < 15; i++) {
        const dropType = dropTypes[Math.floor(Math.random() * dropTypes.length)];
        const titles = dropTitles[dropType as keyof typeof dropTitles];
        const startTime = new Date(Date.now() + Math.random() * 3600000);
        const duration = [15, 30, 45, 60][Math.floor(Math.random() * 4)];

        await supabase.from('moment_drops').insert({
            creator_id: userIds[Math.floor(Math.random() * userIds.length)],
            drop_type: dropType,
            title: titles[Math.floor(Math.random() * titles.length)],
            description: 'A spontaneous moment happening now. Join the fun!',
            location_name: `${['Bar', 'Club', 'Park', 'Cafe', 'Lounge'][Math.floor(Math.random() * 5)]} ${Math.floor(Math.random() * 100) + 1}`,
            location_coords: {
                type: 'Point',
                coordinates: [-74.006 + (Math.random() - 0.5) * 0.02, 40.7128 + (Math.random() - 0.5) * 0.02],
            },
            radius_meters: Math.floor(Math.random() * 300) + 100,
            start_time: startTime.toISOString(),
            end_time: new Date(startTime.getTime() + duration * 60 * 1000).toISOString(),
            max_participants: Math.floor(Math.random() * 30) + 10,
            current_participants: Math.floor(Math.random() * 20),
            reward_xp: Math.floor(Math.random() * 500) + 100,
            reward_items: Math.random() > 0.5 ? ['digital_badge', 'avatar_item'] : [],
            is_anonymous: Math.random() > 0.7,
            is_viral: Math.random() > 0.8,
            viral_count: Math.floor(Math.random() * 100),
            created_at: new Date().toISOString(),
        });
    }

    console.log(`✅ Created 15 moment drops`);

    await supabase.from('city_energy_states').insert([
        {
            city: 'New York',
            neighborhood: 'Williamsburg',
            energy_type: 'party',
            intensity: 82,
            active_users: 156,
            events_count: 12,
            timestamp: new Date().toISOString(),
        },
        {
            city: 'New York',
            neighborhood: 'SoHo',
            energy_type: 'romantic',
            intensity: 65,
            active_users: 89,
            events_count: 5,
            timestamp: new Date().toISOString(),
        },
        {
            city: 'New York',
            neighborhood: 'Lower East Side',
            energy_type: 'chaos',
            intensity: 91,
            active_users: 203,
            events_count: 18,
            timestamp: new Date().toISOString(),
        },
        {
            city: 'Los Angeles',
            neighborhood: 'Venice',
            energy_type: 'creative',
            intensity: 74,
            active_users: 124,
            events_count: 8,
            timestamp: new Date().toISOString(),
        },
        {
            city: 'Miami',
            neighborhood: 'South Beach',
            energy_type: 'party',
            intensity: 95,
            active_users: 312,
            events_count: 25,
            timestamp: new Date().toISOString(),
        },
    ]);

    console.log(`✅ Created city energy states`);

    const contentTypes = ['reel', 'photo', 'text', 'story'];
    for (let i = 0; i < 50; i++) {
        await supabase.from('content').insert({
            creator_id: userIds[Math.floor(Math.random() * userIds.length)],
            content_type: contentTypes[Math.floor(Math.random() * contentTypes.length)],
            media_urls: Math.random() > 0.5 ? [`https://picsum.photos/seed/${i}/400/400`] : [],
            text_content: `Test content ${i + 1}: Just having an amazing time!`,
            location: {
                type: 'Point',
                coordinates: [-74.006 + (Math.random() - 0.5) * 0.05, 40.7128 + (Math.random() - 0.5) * 0.05],
            },
            visibility: 'public',
            likes_count: Math.floor(Math.random() * 500),
            comments_count: Math.floor(Math.random() * 50),
            shares_count: Math.floor(Math.random() * 30),
            views_count: Math.floor(Math.random() * 2000),
            tags: ['hup', 'nyc', 'fun', 'social'].slice(0, Math.floor(Math.random() * 3) + 1),
            moderation_status: 'approved',
            created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        });
    }

    console.log(`✅ Created 50 test content items`);

    console.log('\n🎉 Seed data complete!');
    console.log(`📊 Total created:`);
    console.log(`   - ${testUsers.length} test users`);
    console.log(`   - ${businesses.length} businesses`);
    console.log(`   - ${activities.length} activities`);
    console.log(`   - ${groups.length} groups`);
    console.log(`   - 15 moment drops`);
    console.log(`   - 5 city energy states`);
    console.log(`   - 50 content items`);
}

seedTestData().catch(console.error);
