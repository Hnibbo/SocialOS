import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Sparkles, User, Compass, PenTool, Share2, BookOpen, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';

const personaTypes = [
    {
        id: 'explorer',
        name: 'Explorer',
        description: 'Discover new places and connect with people around you',
        icon: Compass,
        color: 'from-blue-500 to-cyan-600'
    },
    {
        id: 'creator',
        name: 'Creator',
        description: 'Share your talents and build an audience',
        icon: PenTool,
        color: 'from-pink-500 to-rose-600'
    },
    {
        id: 'connector',
        name: 'Connector',
        description: 'Build meaningful relationships and grow your network',
        icon: Share2,
        color: 'from-green-500 to-emerald-600'
    },
    {
        id: 'learner',
        name: 'Learner',
        description: 'Expand your knowledge and skills',
        icon: BookOpen,
        color: 'from-purple-500 to-violet-600'
    }
];

const interests = [
    'Technology', 'Art', 'Music', 'Sports', 'Travel', 'Food', 'Reading', 'Writing',
    'Photography', 'Gaming', 'Fitness', 'Cooking', 'Fashion', 'Science', 'Nature',
    'Movies', 'Theater', 'History', 'Philosophy', 'Psychology'
];

const steps = [
    {
        title: "Welcome to Hup",
        subtitle: "The world's first Social OS. Designed for real-world autonomy.",
        icon: Sparkles,
        color: "from-violet-500 to-indigo-600",
        type: "info"
    },
    {
        title: "Choose Your Persona",
        subtitle: "Select how you want to experience Hup",
        icon: User,
        color: "from-pink-500 to-rose-600",
        type: "persona"
    },
    {
        title: "What Interests You?",
        subtitle: "Select your interests to get personalized content",
        icon: Compass,
        color: "from-blue-500 to-cyan-600",
        type: "interests"
    },
    {
        title: "Customize Your Profile",
        subtitle: "Make your profile unique and engaging",
        icon: PenTool,
        color: "from-green-500 to-emerald-600",
        type: "profile"
    },
    {
        title: "You're All Set!",
        subtitle: "Welcome to the Hup community!",
        icon: CheckCircle2,
        color: "from-yellow-500 to-orange-600",
        type: "complete"
    }
];

export const OnboardingFlow = ({ onComplete }: { onComplete: () => void }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [profileData, setProfileData] = useState({
        displayName: '',
        bio: '',
        avatarUrl: '',
        socialLinks: {
            twitter: '',
            instagram: '',
            linkedin: '',
            website: ''
        }
    });
    const navigate = useNavigate();

    const next = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            completeOnboarding();
        }
    };

    const previous = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const skip = () => navigate('/signup');

    const completeOnboarding = async () => {
        // Save onboarding data
        const onboardingData = {
            persona: selectedPersona,
            interests: selectedInterests,
            profile: profileData
        };
        
        console.log('Onboarding completed:', onboardingData);
        
        // Save to localStorage for quick access
        localStorage.setItem('user_persona', selectedPersona || '');
        localStorage.setItem('user_interests', JSON.stringify(selectedInterests));
        localStorage.setItem('user_profile', JSON.stringify(profileData));
        
        // Save to database if user is authenticated
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Update user profile
                const updates = {
                    display_name: profileData.displayName,
                    bio: profileData.bio,
                    avatar_url: profileData.avatarUrl,
                    interests: selectedInterests,
                    persona: selectedPersona
                };
                
                await supabase
                    .from('user_profiles')
                    .update(updates)
                    .eq('id', user.id);
                    
                // Check if user_identity exists and update or create
                const { data: identityData } = await supabase
                    .from('user_identity')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();
                    
                if (identityData) {
                    await supabase
                        .from('user_identity')
                        .update({
                            bio: profileData.bio,
                            interests: selectedInterests
                        })
                        .eq('user_id', user.id);
                } else {
                    await supabase
                        .from('user_identity')
                        .insert({
                            user_id: user.id,
                            bio: profileData.bio,
                            interests: selectedInterests
                        });
                }
                
                console.log('Onboarding data saved to database');
            }
        } catch (error) {
            console.error('Error saving onboarding data:', error);
        }
        
        onComplete();
    };

    const handlePersonaSelect = (value: string) => {
        setSelectedPersona(value);
    };

    const handleInterestToggle = (interest: string) => {
        setSelectedInterests(prev =>
            prev.includes(interest)
                ? prev.filter(i => i !== interest)
                : [...prev, interest]
        );
    };

    const handleProfileChange = (field: string, value: string) => {
        setProfileData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSocialLinkChange = (platform: string, value: string) => {
        setProfileData(prev => ({
            ...prev,
            socialLinks: {
                ...prev.socialLinks,
                [platform]: value
            }
        }));
    };

    const renderStepContent = () => {
        switch (steps[currentStep].type) {
            case 'persona':
                return (
                    <div className="max-w-2xl mx-auto">
                        <RadioGroup defaultValue={selectedPersona || ''} onValueChange={handlePersonaSelect} className="space-y-4">
                            {personaTypes.map((persona) => (
                                <div
                                    key={persona.id}
                                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                                        selectedPersona === persona.id
                                            ? 'border-primary bg-primary/5'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${persona.color} flex items-center justify-center flex-shrink-0`}>
                                            <persona.icon className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold">{persona.name}</h3>
                                            <p className="text-sm text-muted-foreground">{persona.description}</p>
                                        </div>
                                        <RadioGroupItem value={persona.id} id={persona.id} />
                                    </div>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>
                );
            case 'interests':
                return (
                    <div className="max-w-2xl mx-auto">
                        <div className="grid grid-cols-2 gap-2">
                            {interests.map((interest) => (
                                <div
                                    key={interest}
                                    className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                                        selectedInterests.includes(interest)
                                            ? 'border-primary bg-primary/5'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    onClick={() => handleInterestToggle(interest)}
                                >
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            checked={selectedInterests.includes(interest)}
                                            onCheckedChange={() => handleInterestToggle(interest)}
                                        />
                                        <Label className="text-sm font-medium">{interest}</Label>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-sm text-muted-foreground mt-4">
                            Selected: {selectedInterests.length} {selectedInterests.length === 1 ? 'interest' : 'interests'}
                        </p>
                    </div>
                );
            case 'profile':
                return (
                    <div className="max-w-xl mx-auto space-y-6">
                        {/* Avatar Upload */}
                        <div className="space-y-4">
                            <Label className="text-center block">Profile Picture</Label>
                            <div className="flex justify-center">
                                <div className="relative group">
                                    <div className={`w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200 ${profileData.avatarUrl ? 'border-primary' : 'border-gray-300'} transition-all`}>
                                        {profileData.avatarUrl ? (
                                            <img
                                                src={profileData.avatarUrl}
                                                alt="Avatar"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                <User className="w-10 h-10 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => {
                                            // Simple random avatar generator for demo purposes
                                            const randomAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random().toString(36).substr(2, 9)}`;
                                            handleProfileChange('avatarUrl', randomAvatar);
                                        }}
                                        className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary/80 transition-colors shadow-lg"
                                    >
                                        <PenTool className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground text-center">
                                Click the edit icon to generate a random avatar
                            </p>
                        </div>

                        {/* Display Name */}
                        <div className="space-y-2">
                            <Label htmlFor="displayName">Display Name</Label>
                            <Input
                                id="displayName"
                                value={profileData.displayName}
                                onChange={(e) => handleProfileChange('displayName', e.target.value)}
                                placeholder="Enter your display name"
                                className="bg-white/50 dark:bg-gray-800"
                            />
                        </div>

                        {/* Bio */}
                        <div className="space-y-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea
                                id="bio"
                                value={profileData.bio}
                                onChange={(e) => handleProfileChange('bio', e.target.value)}
                                placeholder="Tell us about yourself in a few words"
                                rows={3}
                                className="bg-white/50 dark:bg-gray-800 resize-none"
                            />
                        </div>

                        {/* Social Links */}
                        <div className="space-y-4 mt-6">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                <Share2 className="w-4 h-4" />
                                Social Links (Optional)
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                                <div className="space-y-1">
                                    <Label htmlFor="twitter" className="text-xs text-muted-foreground">Twitter</Label>
                                    <Input
                                        id="twitter"
                                        value={profileData.socialLinks.twitter}
                                        onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                                        placeholder="@yourhandle"
                                        className="bg-white/30 dark:bg-gray-800"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="instagram" className="text-xs text-muted-foreground">Instagram</Label>
                                    <Input
                                        id="instagram"
                                        value={profileData.socialLinks.instagram}
                                        onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                                        placeholder="@yourhandle"
                                        className="bg-white/30 dark:bg-gray-800"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="linkedin" className="text-xs text-muted-foreground">LinkedIn</Label>
                                    <Input
                                        id="linkedin"
                                        value={profileData.socialLinks.linkedin}
                                        onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                                        placeholder="/in/yourname"
                                        className="bg-white/30 dark:bg-gray-800"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="website" className="text-xs text-muted-foreground">Website</Label>
                                    <Input
                                        id="website"
                                        value={profileData.socialLinks.website}
                                        onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                                        placeholder="https://yourwebsite.com"
                                        className="bg-white/30 dark:bg-gray-800"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'complete':
                return (
                    <div className="max-w-2xl mx-auto text-center">
                        <div className="space-y-4">
                            <div className="flex justify-center gap-2 flex-wrap">
                                {selectedPersona && (
                                    <div className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                                        {personaTypes.find(p => p.id === selectedPersona)?.name}
                                    </div>
                                )}
                                {selectedInterests.slice(0, 3).map(interest => (
                                    <div key={interest} className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                                        {interest}
                                    </div>
                                ))}
                                {selectedInterests.length > 3 && (
                                    <div className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                                        +{selectedInterests.length - 3} more
                                    </div>
                                )}
                            </div>
                            <p className="text-muted-foreground">
                                We've customized your experience based on your preferences. You can always update these later in settings.
                            </p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const StepIcon = steps[currentStep].icon;

    return (
        <div className="relative w-full max-w-2xl mx-auto px-6 py-12">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="text-center"
                >
                    <div className={`mx-auto w-24 h-24 rounded-3xl bg-gradient-to-br ${steps[currentStep].color} flex items-center justify-center mb-8 shadow-lg shadow-primary/20`}>
                        <StepIcon className="w-12 h-12 text-white" />
                    </div>

                    <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
                        {steps[currentStep].title}
                    </h2>
                    <p className="text-lg text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
                        {steps[currentStep].subtitle}
                    </p>

                    {renderStepContent()}
                </motion.div>
            </AnimatePresence>

            <div className="flex flex-col gap-4 mt-8">
                <div className="flex gap-4">
                    {currentStep > 0 && (
                        <Button
                            variant="secondary"
                            onClick={previous}
                            className="flex-1 h-14 rounded-2xl text-lg font-bold"
                        >
                            Previous
                        </Button>
                    )}
                    <Button
                        size="lg"
                        onClick={next}
                        className={`h-14 rounded-2xl text-lg font-bold group ${
                            currentStep > 0 ? 'flex-1' : 'w-full'
                        }`}
                        disabled={
                            (steps[currentStep].type === 'persona' && !selectedPersona) ||
                            (steps[currentStep].type === 'interests' && selectedInterests.length === 0) ||
                            (steps[currentStep].type === 'profile' && !profileData.displayName)
                        }
                    >
                        {currentStep === steps.length - 1 ? "Get Started" : "Continue"}
                        <ChevronRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                </div>
                {currentStep === 0 && (
                    <Button
                        variant="ghost"
                        onClick={skip}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        Skip to Sign Up
                    </Button>
                )}
            </div>

            <div className="flex justify-center gap-2 mt-8">
                {steps.map((_, i) => (
                    <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? "w-8 bg-primary" : "w-2 bg-primary/20"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};
