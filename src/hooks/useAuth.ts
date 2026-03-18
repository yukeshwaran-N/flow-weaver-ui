// src/hooks/useAuth.ts
import { useAuthContext } from '@/providers/AuthProvider'

// Forward the context values so existing components don't need to change
export function useAuth() {
    return useAuthContext();
}