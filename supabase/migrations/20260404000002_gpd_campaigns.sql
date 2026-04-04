-- =============================================
-- GPD: Migration 002: Campaigns
-- =============================================

CREATE TYPE campaign_type AS ENUM ('campanha', 'mandato');
CREATE TYPE campaign_office AS ENUM ('vereador', 'prefeito', 'dep_estadual', 'dep_federal', 'senador', 'governador');
CREATE TYPE campaign_mode AS ENUM ('pre_campanha', 'campanha', 'mandato');

CREATE TABLE public.campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type campaign_type NOT NULL DEFAULT 'campanha',
  office campaign_office NOT NULL DEFAULT 'vereador',
  city TEXT NOT NULL,
  state CHAR(2) NOT NULL,
  year SMALLINT NOT NULL,
  mode campaign_mode NOT NULL DEFAULT 'pre_campanha',
  vote_goal INTEGER,
  start_date DATE,
  end_date DATE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.campaigns IS 'Campanhas eleitorais e mandatos';
COMMENT ON COLUMN public.campaigns.vote_goal IS 'Meta de votos para a eleição';
COMMENT ON COLUMN public.campaigns.mode IS 'Fase atual: pré-campanha, campanha ou mandato';

CREATE INDEX idx_campaigns_organization ON public.campaigns(organization_id);
CREATE INDEX idx_campaigns_active ON public.campaigns(active);

CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem campanhas da organização"
  ON public.campaigns FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
    ) OR
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Admin cria campanhas"
  ON public.campaigns FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    ) OR
    organization_id IN (
      SELECT organization_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admin atualiza campanhas"
  ON public.campaigns FOR UPDATE
  USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    ) OR
    organization_id IN (
      SELECT organization_id FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );
