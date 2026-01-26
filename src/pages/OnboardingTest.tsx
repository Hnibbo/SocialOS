import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export default function OnboardingTest() {
  const handleComplete = () => {
    console.log("Onboarding completed!");
  };

  return (
    <div className="min-h-screen bg-black">
      <OnboardingFlow onComplete={handleComplete} />
    </div>
  );
}
