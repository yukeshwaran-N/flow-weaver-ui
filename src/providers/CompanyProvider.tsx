// src/providers/CompanyProvider.tsx
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from './AuthProvider'
import type { Company } from '@/types'

interface CompanyContextType {
    company: Company | null;
    loading: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
    const { user, loading: authLoading } = useAuthContext();
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            setCompany(null);
            setLoading(false);
            return;
        }

        async function loadCompany() {
            if (!user?.id) return;
            setLoading(true);
            try {
                const { data: companyUser, error: cuError } = await supabase
                    .from('company_users')
                    .select('company_id')
                    .eq('user_id', user.id)
                    .single() as any;

                if (cuError || !companyUser) {
                    setCompany(null);
                    return;
                }

                const { data: companyData, error: cError } = await supabase
                    .from('companies')
                    .select('id, name, status, subscription_tier, admin_email, created_at')
                    .eq('id', companyUser.company_id)
                    .single();

                if (!cError && companyData) {
                    setCompany(companyData as Company);
                }
            } finally {
                setLoading(false);
            }
        }

        loadCompany();
    }, [user, authLoading]);

    return (
        <CompanyContext.Provider value={{ company, loading }}>
            {children}
        </CompanyContext.Provider>
    );
}

export const useCompanyContext = () => {
    const context = useContext(CompanyContext);
    if (!context) throw new Error("useCompanyContext must be used within CompanyProvider");
    return context;
};
