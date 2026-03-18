// src/hooks/useCompany.ts
import { useCompanyContext } from '@/providers/CompanyProvider'

export function useCompany() {
    return useCompanyContext();
}