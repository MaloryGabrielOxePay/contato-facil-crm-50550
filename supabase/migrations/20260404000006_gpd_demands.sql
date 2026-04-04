-- =============================================
-- GPD: Migration 006: Demands (Demandas)
-- =============================================

CREATE TYPE demand_type AS ENUM ('saude', 'educacao', 'infraestrutura', 'emprego', 'social', 'juridico', 'outro');
CREATE TYPE demand_priority AS ENUM ('alta', 'media', 'baixa');
CREATE TYPE demand_status AS ENUM ('aberta', 'em_andamento', 'resolvida', 'cancelada');

CREATE TABLE public.demands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  voter_id UUID REFERENCES public.voters(id) ON DELETE SET NULL,
  requester_name TEXT NOT NULL,
  type demand_type NOT NULL DEFAULT 'outro',
  description TEXT NOT NULL,
  priority demand_priority NOT NULL DEFAULT 'media',
  status demand_status NOT NULL DEFAULT 'aberta',
  assigned_to UUID REFERENCES auth.users(id),
  target_agency TEXT,
  deadline DATE,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.demands IS 'Demandas e solicitações de eleitores';
COMMENT ON COLUMN public.demands.target_agency IS 'Órgão responsável pela resolução';

CREATE INDEX idx_demands_campaign ON public.demands(campaign_id);
CREATE INDEX idx_demands_status ON public.demands(status);
CREATE INDEX idx_demands_priority ON public.demands(priority);
CREATE INDEX idx_demands_assigned ON public.demands(assigned_to);
CREATE INDEX idx_demands_deadline ON public.demands(deadline);
CREATE INDEX idx_demands_voter ON public.demands(voter_id);

CREATE TRIGGER demands_updated_at
  BEFORE UPDATE ON public.demands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem demandas"
  ON public.demands FOR SELECT
  USING (
    campaign_id IN (
      SELECT c.id FROM public.campaigns c
      JOIN public.organizations o ON o.id = c.organization_id
      WHERE o.owner_id = auth.uid()
      UNION
      SELECT campaign_id FROM public.user_roles WHERE user_id = auth.uid() AND campaign_id IS NOT NULL
      UNION
      SELECT c.id FROM public.campaigns c
      JOIN public.user_roles ur ON ur.organization_id = c.organization_id
      WHERE ur.user_id = auth.uid()
    )
  );

CREATE POLICY "Membros criam demandas"
  ON public.demands FOR INSERT
  WITH CHECK (
    campaign_id IN (
      SELECT c.id FROM public.campaigns c
      JOIN public.organizations o ON o.id = c.organization_id
      WHERE o.owner_id = auth.uid()
      UNION
      SELECT campaign_id FROM public.user_roles WHERE user_id = auth.uid() AND campaign_id IS NOT NULL
      UNION
      SELECT c.id FROM public.campaigns c
      JOIN public.user_roles ur ON ur.organization_id = c.organization_id
      WHERE ur.user_id = auth.uid()
    )
  );

CREATE POLICY "Membros atualizam demandas"
  ON public.demands FOR UPDATE
  USING (
    campaign_id IN (
      SELECT c.id FROM public.campaigns c
      JOIN public.organizations o ON o.id = c.organization_id
      WHERE o.owner_id = auth.uid()
      UNION
      SELECT campaign_id FROM public.user_roles WHERE user_id = auth.uid() AND campaign_id IS NOT NULL
      UNION
      SELECT c.id FROM public.campaigns c
      JOIN public.user_roles ur ON ur.organization_id = c.organization_id
      WHERE ur.user_id = auth.uid()
    )
  );

-- Atualizações de demandas
CREATE TABLE public.demand_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  demand_id UUID NOT NULL REFERENCES public.demands(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.demand_updates IS 'Histórico de atualizações de demandas';

CREATE INDEX idx_demand_updates_demand ON public.demand_updates(demand_id);

ALTER TABLE public.demand_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem atualizações"
  ON public.demand_updates FOR SELECT
  USING (demand_id IN (SELECT id FROM public.demands));

CREATE POLICY "Membros adicionam atualizações"
  ON public.demand_updates FOR INSERT
  WITH CHECK (user_id = auth.uid());
