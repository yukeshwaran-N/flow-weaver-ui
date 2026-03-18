// src/hooks/useUserRole.ts
import { useRoleContext } from '@/providers/RoleProvider'

export function useUserRole() {
    return useRoleContext();
}
