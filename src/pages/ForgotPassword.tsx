import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AuthLayout from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await resetPassword(email);
      setSent(true);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to send reset email";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout
        title="Check Your Email"
        subtitle="We've sent you a password reset link"
      >
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-success/20 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>

          <p className="text-muted-foreground">
            We've sent a password reset link to <strong className="text-foreground">{email}</strong>.
            Please check your inbox and follow the instructions.
          </p>

          <div className="pt-4">
            <Link to="/login">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot Password?"
      subtitle="No worries, we'll send you reset instructions"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
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
              className="pl-10"
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
          size="lg"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Send Reset Link"
          )}
        </Button>

        <Link to="/login" className="block">
          <Button variant="ghost" className="w-full">
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Sign In
          </Button>
        </Link>
      </form>
    </AuthLayout>
  );
}
