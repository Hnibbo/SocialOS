import React from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { ElectricButton } from '@/components/ui/electric-button';
import { PricingSection } from '@/components/monetization/PricingSection';
import {
  MapPin,
  Video,
  Heart,
  Zap,
  Users,
  Shield,
  Sparkles,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <MapPin className="w-8 h-8" />,
      title: 'Location-First Discovery',
      description: 'Find people, events, and experiences happening around you in real-time',
    },
    {
      icon: <Video className="w-8 h-8" />,
      title: 'Live Streaming',
      description: 'Broadcast your moments and connect with your community instantly',
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: 'Smart Matching',
      description: 'AI-powered connections based on interests, location, and vibe',
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Real-Time Everything',
      description: 'WebSocket-powered instant updates across all features',
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Community Events',
      description: 'Create and join local events, challenges, and group activities',
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Privacy First',
      description: 'Full control over your visibility, data, and connections',
    },
  ];

  const stats = [
    { value: '10K+', label: 'Active Users' },
    { value: '50K+', label: 'Matches Made' },
    { value: '1M+', label: 'Messages Sent' },
    { value: '500+', label: 'Live Events' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[128px] animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-accent/10 rounded-full blur-[128px] animate-float" style={{ animationDelay: '4s' }} />
        </div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-8 animate-slide-up">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm">The Future of Social Connection</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-6xl md:text-8xl font-bold mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <span className="text-gradient-electric">
              Connect.
            </span>
            <br />
            <span className="text-gradient-electric">
              Discover.
            </span>
            <br />
            <span className="text-gradient-electric">
              Experience.
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            The world's first location-powered social OS. Find your people, share your moments, and experience life together.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <ElectricButton
              variant="primary"
              size="lg"
              glow
              onClick={() => navigate('/signup')}
              className="min-w-[200px]"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </ElectricButton>
            <ElectricButton
              variant="secondary"
              size="lg"
              onClick={() => navigate('/map')}
              className="min-w-[200px]"
            >
              Explore Map
              <MapPin className="w-5 h-5" />
            </ElectricButton>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto animate-slide-up" style={{ animationDelay: '0.4s' }}>
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl font-bold text-gradient-electric mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-4 relative">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold mb-4 text-gradient-electric">
              Everything You Need
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to bring people together
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <GlassCard
                key={i}
                className="p-8 group"
                hover
                glow
              >
                <div className="text-primary mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* CTA Section */}
      <section className="py-32 px-4 relative">
        <div className="max-w-4xl mx-auto text-center">
          <GlassCard className="p-16" glow>
            <h2 className="text-5xl font-bold mb-6 text-gradient-electric">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Join thousands of people already connecting, discovering, and experiencing life together on Hup.
            </p>
            <ElectricButton
              variant="primary"
              size="lg"
              glow
              onClick={() => navigate('/signup')}
              className="min-w-[250px]"
            >
              Create Your Account
              <ArrowRight className="w-5 h-5" />
            </ElectricButton>
          </GlassCard>
        </div>
      </section>
    </div>
  );
};

export default Index;
