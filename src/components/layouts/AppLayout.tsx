import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import { useUserRole } from "@/hooks/useUserRole";
import { RegistrationStatus } from "@/components/onboarding/RegistrationStatus";
import { PasswordChangeInterceptor } from "@/components/auth/PasswordChangeInterceptor";
import { useAuth } from "@/hooks/useAuth";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { role, companyStatus, subscriptionTier, isPremium, mustChangePassword, loading } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();

  // Automatic redirection based on role when hitting the root dashboard
  useEffect(() => {
    if (!loading && location.pathname === '/dashboard') {
      // Logic for dashboard is now unified, no redirection needed
    }
  }, [role, loading, location.pathname, navigate]);

  // Prevent "flash" of wrong dashboard during redirection
  const isRedirecting = location.pathname === '/dashboard' && role && role !== 'employee';

  if (loading || isRedirecting) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-6">
          <div className="relative text-primary">
            <div className="w-16 h-16 border-4 border-current opacity-20 rounded-full" />
            <div className="w-16 h-16 border-4 border-current border-t-transparent rounded-full animate-spin absolute top-0" />
          </div>
          <div className="flex flex-col items-center gap-1 text-center font-bold">
            <h2 className="text-lg text-[#0D1B2A]">Flow Weaver</h2>
            <p className="text-xs text-muted-foreground animate-pulse uppercase tracking-widest">
              Initializing Secure Workspace...
            </p>
          </div>
        </div>
      </div>
    );
  }
  // ... (rest of guards)

  // Intercept if password change is REQUIRED (First Login)
  if (mustChangePassword) {
    return <PasswordChangeInterceptor userId={user?.id} />;
  }

  // Intercept ONLY if NOT platform_admin
  if (role !== 'platform_admin') {
    // 1. Pending or Rejected status
    if (companyStatus === 'pending' || companyStatus === 'rejected') {
      return <RegistrationStatus status={companyStatus} subscriptionTier={subscriptionTier} role={role} />;
    }

    // 2. Verified but NO billing selected
    if (companyStatus === 'active' && !subscriptionTier) {
      return <RegistrationStatus status={companyStatus} subscriptionTier={subscriptionTier} role={role} />;
    }
  }

  const isWorkflowEditor = location.pathname.includes('/workflows/');

  return (
    <div className={`flex h-screen w-full overflow-hidden transition-all duration-700 ${isPremium ? 'bg-gradient-to-br from-background via-background to-amber-500/5' : 'bg-background'}`}>
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={`flex flex-1 flex-col overflow-hidden relative ${isPremium && !isWorkflowEditor ? 'm-1 lg:m-2 rounded-2xl border-2 border-amber-500/10 shadow-[0_0_40px_-15px_rgba(245,158,11,0.1)]' : ''}`}>
        {isPremium && !isWorkflowEditor && (
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-400/30 to-transparent z-50 pointer-events-none" />
        )}
        {!isWorkflowEditor && <TopBar onMenuClick={() => setSidebarOpen(true)} />}
        <main className={`flex-1 overflow-hidden flex flex-col ${!isWorkflowEditor ? 'p-4 lg:p-6 bg-content-scroll overflow-y-auto' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
