// src/providers/RoleProvider.tsx
import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from './AuthProvider'

export type UserRole = 'platform_admin' | 'company_admin' | 'manager' | 'employee' | null;

interface RoleContextType {
    role: UserRole;
    companyStatus: string | null;
    subscriptionTier: string | null;
    isPremium: boolean;
    mustChangePassword: boolean;
    loading: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
    const { user, loading: authLoading } = useAuthContext();
    const [role, setRole] = useState<UserRole>(null);
    const [companyStatus, setCompanyStatus] = useState<string | null>(null);
    const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
    const [isPremium, setIsPremium] = useState<boolean>(false);
    const [mustChangePassword, setMustChangePassword] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);
    const lastFetchedUserRef = useRef<string | null>(null);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            setRole(null);
            setCompanyStatus(null);
            setSubscriptionTier(null);
            setIsPremium(false);
            setMustChangePassword(false);
            setLoading(false);
            lastFetchedUserRef.current = null;
            return;
        }

        // Only load if user ID changed or we have no role yet
        if (user.id === lastFetchedUserRef.current && role !== null) {
            setLoading(false);
            return;
        }

        async function loadRole() {
            if (!user) return;
            setLoading(true);
            lastFetchedUserRef.current = user.id;

            try {
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('role, subscription_tier, must_change_password, is_premium, subscription_expires_at')
                    .eq('id', user.id)
                    .single();

                if (!error && profile) {
                    let currentTier = (profile as any).subscription_tier || 'free';
                    let premiumStatus = (profile as any).is_premium || false;

                    if (premiumStatus && (profile as any).subscription_expires_at) {
                        const expiresAt = new Date((profile as any).subscription_expires_at);
                        if (expiresAt < new Date()) {
                            premiumStatus = false;
                            currentTier = 'free';
                        }
                    }

                    setRole((profile as any).role as UserRole);
                    setSubscriptionTier(currentTier);
                    setIsPremium(premiumStatus);
                    setMustChangePassword((profile as any).must_change_password || false);
                    setCompanyStatus('active');
                }
            } finally {
                setLoading(false);
            }
        }

        loadRole();
    }, [user, authLoading, role]);

    return (
        <RoleContext.Provider value={{ role, companyStatus, subscriptionTier, isPremium, mustChangePassword, loading }}>
            {children}
        </RoleContext.Provider>
    );
}

export const useRoleContext = () => {
    const context = useContext(RoleContext);
    if (!context) throw new Error("useRoleContext must be used within RoleProvider");
    return context;
};
