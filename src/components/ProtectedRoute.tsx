import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useUserRole } from '@/hooks/useUserRole'

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireRole?: string;
}

export const ProtectedRoute = ({ children, requireRole }: ProtectedRouteProps) => {
    const { user, loading } = useAuth();
    const { role } = useUserRole();
    const location = useLocation();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
            <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium animate-pulse text-muted-foreground">Initializing session...</p>
            </div>
        </div>;
    }

    if (!user) {
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    if (requireRole && role !== requireRole) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}