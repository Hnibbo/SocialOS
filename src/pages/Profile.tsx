import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ProfileDiscovery } from '@/components/profile/ProfileDiscovery';
import { ProfileEditor } from '@/components/profile/ProfileEditor';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Edit2, Eye } from 'lucide-react';

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const [viewMode, setViewMode] = useState<'view' | 'edit'>('view');
  const isOwnProfile = !userId || userId === currentUser?.id;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              {isOwnProfile ? 'Your Profile' : 'User Profile'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isOwnProfile 
                ? 'Manage your public identity and settings' 
                : 'View user profile and activity'
              }
            </p>
          </div>
          
          {isOwnProfile && (
            <Button
              variant={viewMode === 'edit' ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => setViewMode(viewMode === 'edit' ? 'view' : 'edit')}
              className="gap-2"
            >
              {viewMode === 'edit' ? (
                <>
                  <Eye className="w-4 h-4" />
                  View Profile
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </>
              )}
            </Button>
          )}
        </div>

        {/* Profile Content */}
        {viewMode === 'edit' ? (
          <ProfileEditor userId={userId} />
        ) : (
          <ProfileDiscovery userId={userId} />
        )}
      </div>
    </div>
  );
}
