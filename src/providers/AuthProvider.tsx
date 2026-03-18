// src/providers/AuthProvider.tsx
import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types'

interface AuthContextType {
    user: User | null;
    loading: boolean;
    profileLoading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [profileLoading, setProfileLoading] = useState(false)
    const sessionRef = useRef<string | null>(null);

    useEffect(() => {
        const getProfile = async (userId: string) => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('full_name, avatar_url')
                    .eq('id', userId)
                    .single()
                if (error) return null;
                return data as any
            } catch (err) {
                return null
            }
        }

        const handleSessionUpdate = async (session: any) => {
            const currentUserId = session?.user?.id;

            // Only trigger full update if user session changed or we have no user
            if (currentUserId === sessionRef.current && user) return;
            sessionRef.current = currentUserId;

            if (!session?.user) {
                setUser(null);
                setLoading(false);
                return;
            }

            const initialUser: User = {
                id: session.user.id,
                email: session.user.email!,
                full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
                avatar_url: session.user.user_metadata?.avatar_url,
                created_at: session.user.created_at,
            }
            setUser(initialUser);
            setLoading(false);

            setProfileLoading(true);
            try {
                const profile = await getProfile(session.user.id);
                if (profile) {
                    setUser(prev => prev && prev.id === session.user.id ? {
                        ...prev,
                        full_name: profile.full_name || prev.full_name,
                        avatar_url: profile.avatar_url || prev.avatar_url
                    } : prev);
                }
            } finally {
                setProfileLoading(false);
            }
        };

        // Initial check
        supabase.auth.getSession().then(({ data: { session } }) => {
            handleSessionUpdate(session);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT') {
                sessionRef.current = null;
                setUser(null);
                setLoading(false);
            } else if (session) {
                handleSessionUpdate(session);
            }
        });

        return () => subscription.unsubscribe();
    }, [user])

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, profileLoading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuthContext must be used within AuthProvider");
    return context;
};
