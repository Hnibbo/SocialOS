import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Heart, MessageSquare, ChevronRight, Sparkles, Globe, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const steps = [
    {
        title: "Welcome to Hup",
        subtitle: "The world's first Social OS. Designed for real-world autonomy.",
        icon: Sparkles,
        color: "from-violet-500 to-indigo-600",
    },
    {
        title: "Live Social Intelligence",
        subtitle: "See who's around, where the energy is, and how to plug in.",
        icon: MapPin,
        color: "from-cyan-400 to-blue-500",
    },
    {
        title: "Meaningful Matches",
        subtitle: "Our AI doesn't just swipe. It understands compatibility.",
        icon: Heart,
        color: "from-pink-500 to-rose-600",
    },
    {
        title: "Privacy First",
        subtitle: "Your data is encrypted, your location is yours to share.",
        icon: Shield,
        color: "from-emerald-400 to-teal-500",
    }
];

export const OnboardingFlow = ({ onComplete }: { onComplete: () => void }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const navigate = useNavigate();

    const next = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    const skip = () => navigate('/signup');

    const StepIcon = steps[currentStep].icon;

    return (
        <div className="relative w-full max-w-xl mx-auto px-6 py-12">
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
                    <p className="text-lg text-muted-foreground mb-12 max-w-sm mx-auto leading-relaxed">
                        {steps[currentStep].subtitle}
                    </p>
                </motion.div>
            </AnimatePresence>

            <div className="flex flex-col gap-4">
                <Button
                    size="lg"
                    onClick={next}
                    className="w-full h-14 rounded-2xl text-lg font-bold group"
                >
                    {currentStep === steps.length - 1 ? "Get Started" : "Continue"}
                    <ChevronRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button
                    variant="ghost"
                    onClick={skip}
                    className="text-muted-foreground hover:text-foreground"
                >
                    Wait, just let me sign up
                </Button>
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
