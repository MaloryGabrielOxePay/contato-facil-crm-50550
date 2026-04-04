import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Campaign {
  id: string;
  name: string;
  type: string | null;
  office: string | null;
  city: string | null;
  state: string | null;
  year: number | null;
  mode: string | null;
  vote_goal: number | null;
  organization_id: string;
}

interface CampaignContextValue {
  campaign: Campaign | null;
  campaigns: Campaign[];
  loading: boolean;
  setActiveCampaign: (campaign: Campaign) => void;
  refreshCampaigns: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'gpd_active_campaign_id';

function persistCampaignId(id: string | null) {
  if (id) {
    localStorage.setItem(STORAGE_KEY, id);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function getPersistedCampaignId(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export const CampaignContext = createContext<CampaignContextValue | undefined>(
  undefined
);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function CampaignProvider({ children }: { children: React.ReactNode }) {
  const { organization } = useOrganization();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch campaigns for the active organization
  const fetchCampaigns = useCallback(async (organizationId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select(
          'id, name, type, office, city, state, year, mode, vote_goal, organization_id'
        )
        .eq('organization_id', organizationId)
        .order('year', { ascending: false });

      if (error) {
        console.error('[CampaignContext] fetchCampaigns error:', error.message);
        setCampaigns([]);
        setCampaign(null);
        return;
      }

      const list = (data ?? []) as Campaign[];
      setCampaigns(list);

      // Restore persisted active campaign or default to first
      const persistedId = getPersistedCampaignId();
      const active =
        list.find((c) => c.id === persistedId) ?? list[0] ?? null;
      setCampaign(active);
      persistCampaignId(active?.id ?? null);
    } catch (err) {
      console.error('[CampaignContext] unexpected error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (organization) {
      fetchCampaigns(organization.id);
    } else {
      setCampaigns([]);
      setCampaign(null);
      persistCampaignId(null);
    }
  }, [organization, fetchCampaigns]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const setActiveCampaign = useCallback((c: Campaign) => {
    setCampaign(c);
    persistCampaignId(c.id);
  }, []);

  const refreshCampaigns = useCallback(async () => {
    if (organization) {
      await fetchCampaigns(organization.id);
    }
  }, [organization, fetchCampaigns]);

  // ---------------------------------------------------------------------------
  // Context value
  // ---------------------------------------------------------------------------

  const value: CampaignContextValue = {
    campaign,
    campaigns,
    loading,
    setActiveCampaign,
    refreshCampaigns,
  };

  return (
    <CampaignContext.Provider value={value}>{children}</CampaignContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCampaign(): CampaignContextValue {
  const ctx = useContext(CampaignContext);
  if (!ctx) {
    throw new Error('useCampaign must be used inside <CampaignProvider>');
  }
  return ctx;
}
