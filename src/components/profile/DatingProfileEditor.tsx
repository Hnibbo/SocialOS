import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { ElectricButton } from '@/components/ui/electric-button';
import { supabase } from '@/integrations/supabase/client';
import { 
  Camera, 
  Edit2, 
  Save, 
  X, 
  Heart, 
  MapPin, 
  Users, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface DatingProfile {
  id: string;
  user_id: string;
  age: number;
  bio: string;
  photos: string[];
  interests: string[];
  location_lat: number;
  location_lng: number;
  is_visible: boolean;
  is_verified: boolean;
  looking_for: string;
  relationship_goal: string;
  height: number;
  body_type: string;
  smoke: string;
  drink: string;
  education: string;
  occupation: string;
}

export const DatingProfileEditor: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [profile, setProfile] = useState<DatingProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<DatingProfile>>({});
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (currentUser?.id) {
      loadProfile();
    }
  }, [currentUser]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('dating_profiles')
        .select('*')
        .eq('user_id', currentUser?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
        setFormData(data);
      } else {
        // Create a default profile if none exists
        const defaultProfile: Partial<DatingProfile> = {
          user_id: currentUser?.id,
          age: 25,
          bio: '',
          photos: [],
          interests: [],
          is_visible: true,
          is_verified: false,
          looking_for: '',
          relationship_goal: '',
          height: 0,
          body_type: '',
          smoke: '',
          drink: '',
          education: '',
          occupation: ''
        };
        setFormData(defaultProfile);
      }
    } catch (error) {
      console.error('Error loading dating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof DatingProfile, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPhotoFiles(files);
    
    // Create previews
    const previews: string[] = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push(reader.result as string);
        if (previews.length === files.length) {
          setPhotoPreviews(prev => [...prev, ...previews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const uploadPhoto = async (file: File, fileName: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const filePath = `dating_photos/${fileName}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('user_media')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: publicUrl } = supabase.storage
      .from('user_media')
      .getPublicUrl(filePath);

    return publicUrl.publicUrl;
  };

  const handleSave = async () => {
    if (!currentUser) return;

    setSaving(true);
    try {
      const updates: any = { ...formData };

      // Handle photo uploads
      if (photoFiles.length > 0) {
        const uploadedPhotos: string[] = [];
        for (let i = 0; i < photoFiles.length; i++) {
          const photoUrl = await uploadPhoto(photoFiles[i], `${currentUser.id}_${Date.now()}_${i}`);
          uploadedPhotos.push(photoUrl);
        }
        updates.photos = [...(formData.photos || []), ...uploadedPhotos];
      }

      if (profile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('dating_profiles')
          .update(updates)
          .eq('id', profile.id);

        if (updateError) throw updateError;
      } else {
        // Create new profile
        const { error: createError } = await supabase
          .from('dating_profiles')
          .insert(updates);

        if (createError) throw createError;
      }

      // Refresh profile data
      await loadProfile();
      setEditing(false);
      setPhotoFiles([]);
      setPhotoPreviews([]);
      
      if (onClose) {
        onClose();
      }
    } catch (error: any) {
      console.error('Error saving dating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="p-8 text-center">
      <Sparkles className="w-12 h-12 mx-auto animate-spin text-primary opacity-50" />
      <p className="mt-4 font-bold uppercase tracking-widest text-xs opacity-50">Loading Dating Profile...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-primary" />
            <h2 className="text-2xl font-black tracking-tighter italic">Dating Profile</h2>
            {formData.is_visible && <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-500" />}
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <ElectricButton 
                  variant="ghost" 
                  size="md"
                  onClick={() => {
                    setEditing(false);
                    setFormData(profile || {});
                    setPhotoFiles([]);
                    setPhotoPreviews([]);
                  }}
                >
                  <X className="w-4 h-4" />
                  Cancel
                </ElectricButton>
                <ElectricButton 
                  variant="primary" 
                  size="md"
                  disabled={saving}
                  onClick={handleSave}
                >
                  {saving ? <Sparkles className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving...' : 'Save'}
                </ElectricButton>
              </>
            ) : (
              <ElectricButton 
                variant="primary" 
                size="md"
                onClick={() => setEditing(true)}
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </ElectricButton>
            )}
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest opacity-30">Age</label>
              {editing ? (
                <input
                  type="number"
                  value={formData.age || ''}
                  onChange={(e) => handleInputChange('age', parseInt(e.target.value))}
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm focus:border-primary/50 focus:outline-none"
                  min="18"
                  max="100"
                />
              ) : (
                <p className="text-lg">{formData.age} years old</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest opacity-30">Looking For</label>
              {editing ? (
                <select
                  value={formData.looking_for || ''}
                  onChange={(e) => handleInputChange('looking_for', e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm focus:border-primary/50 focus:outline-none"
                >
                  <option value="">Select...</option>
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="everyone">Everyone</option>
                </select>
              ) : (
                <p className="text-lg">{formData.looking_for || 'Not specified'}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest opacity-30">Relationship Goal</label>
              {editing ? (
                <select
                  value={formData.relationship_goal || ''}
                  onChange={(e) => handleInputChange('relationship_goal', e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm focus:border-primary/50 focus:outline-none"
                >
                  <option value="">Select...</option>
                  <option value="casual">Casual dating</option>
                  <option value="serious">Serious relationship</option>
                  <option value="friends">Just friends</option>
                </select>
              ) : (
                <p className="text-lg">{formData.relationship_goal || 'Not specified'}</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest opacity-30">Occupation</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.occupation || ''}
                  onChange={(e) => handleInputChange('occupation', e.target.value)}
                  placeholder="Your occupation"
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm focus:border-primary/50 focus:outline-none"
                />
              ) : (
                <p className="text-lg">{formData.occupation || 'Not specified'}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest opacity-30">Education</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.education || ''}
                  onChange={(e) => handleInputChange('education', e.target.value)}
                  placeholder="Your education"
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm focus:border-primary/50 focus:outline-none"
                />
              ) : (
                <p className="text-lg">{formData.education || 'Not specified'}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest opacity-30">Profile Visibility</label>
              {editing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_visible || false}
                    onChange={(e) => handleInputChange('is_visible', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm">Visible to others</span>
                </div>
              ) : (
                <p className="text-lg">{formData.is_visible ? 'Visible' : 'Hidden'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest opacity-30">Bio</label>
          {editing ? (
            <textarea
              value={formData.bio || ''}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell others about yourself..."
              className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-sm leading-relaxed focus:border-primary/50 focus:outline-none resize-none"
              rows={4}
            />
          ) : (
            <p className="text-lg leading-relaxed">{formData.bio || 'No bio yet'}</p>
          )}
        </div>

        {/* Photos */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest opacity-30">Photos</label>
          <div className="flex flex-wrap gap-4">
            {(formData.photos || []).map((photo, index) => (
              <div key={index} className="relative w-24 h-24 rounded-xl overflow-hidden border border-white/10">
                <img 
                  src={photo} 
                  alt={`Photo ${index + 1}`} 
                  className="w-full h-full object-cover"
                />
                {editing && (
                  <button
                    onClick={() => {
                      const newPhotos = [...(formData.photos || [])];
                      newPhotos.splice(index, 1);
                      handleInputChange('photos', newPhotos);
                    }}
                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            {editing && (
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center hover:border-primary/50 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  id="photo-upload"
                  onChange={handlePhotoChange}
                />
                <label htmlFor="photo-upload" className="flex flex-col items-center gap-1">
                  <Camera className="w-6 h-6 opacity-50" />
                  <span className="text-xs opacity-50">Add Photos</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Interests */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest opacity-30">Interests</label>
          {editing ? (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Add interests separated by commas"
                value={formData.interests?.join(', ') || ''}
                onChange={(e) => handleInputChange('interests', e.target.value.split(',').map(i => i.trim()).filter(i => i))}
                className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm focus:border-primary/50 focus:outline-none"
              />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {formData.interests?.length > 0 ? formData.interests.map((interest, index) => (
                <div key={index} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 cursor-pointer transition-all flex items-center gap-2">
                  <span className="text-xs font-bold">{interest}</span>
                </div>
              )) : (
                <p className="text-xs opacity-50 italic">No interests added yet.</p>
              )}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};
