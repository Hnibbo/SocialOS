import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface AdminRouteProps {
  children?: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading: authLoading, profile } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const location = useLocation();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Additional security checks for admin access
  const hasAdminRole = isAdmin || (profile?.role === 'admin') || (user.user_metadata?.role === 'admin');
  
  if (!hasAdminRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children || <Outlet />;
}
