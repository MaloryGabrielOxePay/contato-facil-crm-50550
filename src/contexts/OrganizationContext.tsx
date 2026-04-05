import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  plan: string | null;
  owner_id: string;
}

interface OrganizationContextValue {
  organization: Organization | null;
  organizations: Organization[];
  loading: boolean;
  setActiveOrganization: (org: Organization) => void;
  refreshOrganizations: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'gpd_active_org_id';

function persistOrgId(id: string | null) {
  if (id) {
    localStorage.setItem(STORAGE_KEY, id);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function getPersistedOrgId(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export const OrganizationContext = createContext<
  OrganizationContextValue | undefined
>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function OrganizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch all organizations the user belongs to (as owner or via user_roles)
  const fetchOrganizations = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      // Organizations owned by the user
      const { data: owned, error: ownedErr } = await supabase
        .from('organizations')
        .select(
          'id, name, slug, logo_url, primary_color, secondary_color, plan, owner_id'
        )
        .eq('owner_id', userId);

      if (ownedErr) {
        console.error('[OrganizationContext] fetchOwned error:', ownedErr.message);
      }

      // Organizations where the user has a role
      const { data: roleRows, error: roleErr } = await supabase
        .from('user_roles')
        .select('organization_id')
        .eq('user_id', userId);

      if (roleErr) {
        console.error('[OrganizationContext] fetchRoles error:', roleErr.message);
      }

      let roleOrgs: Organization[] = [];
      if (roleRows && roleRows.length > 0) {
        const orgIds = roleRows.map((r) => r.organization_id);
        const { data: byRole, error: byRoleErr } = await supabase
          .from('organizations')
          .select(
            'id, name, slug, logo_url, primary_color, secondary_color, plan, owner_id'
          )
          .in('id', orgIds);

        if (byRoleErr) {
          console.error(
            '[OrganizationContext] fetchByRole error:',
            byRoleErr.message
          );
        }
        roleOrgs = byRole ?? [];
      }

      // Merge, deduplicate by id
      const merged = [
        ...(owned ?? []),
        ...roleOrgs.filter((r) => !(owned ?? []).some((o) => o.id === r.id)),
      ] as Organization[];

      setOrganizations(merged);

      // Restore persisted active org or default to first
      const persistedId = getPersistedOrgId();
      const active =
        merged.find((o) => o.id === persistedId) ?? merged[0] ?? null;
      setOrganization(active);
      persistOrgId(active?.id ?? null);
    } catch (err) {
      console.error('[OrganizationContext] unexpected error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchOrganizations(user.id);
    } else {
      setOrganizations([]);
      setOrganization(null);
      persistOrgId(null);
    }
  }, [user, fetchOrganizations]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const setActiveOrganization = useCallback((org: Organization) => {
    setOrganization(org);
    persistOrgId(org.id);
  }, []);

  const refreshOrganizations = useCallback(async () => {
    if (user) {
      await fetchOrganizations(user.id);
    }
  }, [user, fetchOrganizations]);

  // ---------------------------------------------------------------------------
  // Context value
  // ---------------------------------------------------------------------------

  const value: OrganizationContextValue = {
    organization,
    organizations,
    loading,
    setActiveOrganization,
    refreshOrganizations,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useOrganization(): OrganizationContextValue {
  const ctx = useContext(OrganizationContext);
  if (!ctx) {
    throw new Error('useOrganization must be used inside <OrganizationProvider>');
  }
  return ctx;
}
