import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AuthLayout from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Mail, Lock, User, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { Confetti } from "@/components/ui/Confetti";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  // Consent states - required for free accounts
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [analyticsConsent, setAnalyticsConsent] = useState(true);
  const [thirdPartyConsent, setThirdPartyConsent] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (!termsAccepted) {
      toast.error("You must accept the Terms of Service and Privacy Policy");
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, name);

      // Store consent records after signup
      localStorage.setItem("pendingConsents", JSON.stringify({
        marketing: marketingConsent,
        analytics: analyticsConsent,
        third_party: thirdPartyConsent,
        terms_accepted: termsAccepted,
        timestamp: new Date().toISOString(),
      }));

      setShowConfetti(true);
      toast.success("Account created! Please check your email to verify your account.");

      // Delay navigation to let confetti play
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create account";
      toast.error(message);
    } finally {
      if (!showConfetti) setLoading(false);
    }
  };

  return (
    <>
      <AuthLayout
        title="Create Your Account"
        subtitle="Start your journey with Hup today"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 transition-all focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 transition-all focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 transition-all focus:ring-2 focus:ring-primary/20"
                  required
                  minLength={6}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Must be at least 6 characters
              </p>
            </div>

            {/* Consent Checkboxes */}
            <div className="space-y-3 p-4 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-sm font-medium text-foreground">Data & Communications Preferences</p>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="marketing"
                  checked={marketingConsent}
                  onCheckedChange={(checked) => setMarketingConsent(checked as boolean)}
                />
                <label htmlFor="marketing" className="text-sm text-muted-foreground cursor-pointer">
                  <span className="font-medium text-foreground">Marketing Communications</span>
                  <br />
                  Receive product updates, tips, and promotional offers via email.
                </label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="analytics"
                  checked={analyticsConsent}
                  onCheckedChange={(checked) => setAnalyticsConsent(checked as boolean)}
                />
                <label htmlFor="analytics" className="text-sm text-muted-foreground cursor-pointer">
                  <span className="font-medium text-foreground">Analytics & Improvements</span>
                  <br />
                  Allow us to collect usage data to improve our services.
                </label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="thirdparty"
                  checked={thirdPartyConsent}
                  onCheckedChange={(checked) => setThirdPartyConsent(checked as boolean)}
                />
                <label htmlFor="thirdparty" className="text-sm text-muted-foreground cursor-pointer">
                  <span className="font-medium text-foreground">Third-Party Integrations</span>
                  <br />
                  Share data with trusted partners for enhanced features.
                </label>
              </div>

              <div className="border-t border-border/50 pt-3 mt-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                    required
                  />
                  <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                    I agree to the{" "}
                    <Link to="/terms" className="text-primary hover:underline" target="_blank">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="text-primary hover:underline" target="_blank">
                      Privacy Policy
                    </Link>
                    <span className="text-destructive">*</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {["Full access to social features", "Encrypted real-time messaging", "No credit card required"].map((benefit) => (
                <div key={benefit} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-success" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:opacity-90 transition-all shadow-lg hover:shadow-primary/20"
              size="lg"
              disabled={loading || !termsAccepted}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary hover:text-primary/80 transition-colors font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
          </form>
        </motion.div>
      </AuthLayout>
      <Confetti active={showConfetti} />
    </>
  );
}
