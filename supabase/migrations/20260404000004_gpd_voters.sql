-- =============================================
-- GPD: Migration 004: Voters (CRM Eleitoral)
-- =============================================

CREATE TYPE voter_gender AS ENUM ('masculino', 'feminino', 'outro', 'nao_informado');
CREATE TYPE voter_status AS ENUM ('confirmado', 'provavel', 'indeciso', 'oposicao', 'neutro');
CREATE TYPE voter_origin AS ENUM ('indicacao', 'evento', 'redes_sociais', 'visita', 'captacao_publica', 'outro');
CREATE TYPE interaction_type AS ENUM ('visita', 'ligacao', 'whatsapp', 'evento', 'atendimento', 'outro');

CREATE TABLE public.voters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  cpf_encrypted BYTEA,
  birth_date DATE,
  gender voter_gender DEFAULT 'nao_informado',
  whatsapp TEXT,
  phone TEXT,
  email TEXT,
  instagram TEXT,
  cep CHAR(8),
  address TEXT,
  neighborhood TEXT,
  city TEXT,
  state CHAR(2),
  electoral_zone TEXT,
  electoral_section TEXT,
  status voter_status NOT NULL DEFAULT 'indeciso',
  origin voter_origin DEFAULT 'outro',
  leader_id UUID, -- FK para leaders, adicionada depois
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  consent_given BOOLEAN NOT NULL DEFAULT false,
  consent_date TIMESTAMPTZ,
  captured_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.voters IS 'CRM Eleitoral — cadastro de eleitores';
COMMENT ON COLUMN public.voters.cpf_encrypted IS 'CPF criptografado (LGPD)';
COMMENT ON COLUMN public.voters.consent_given IS 'Consentimento LGPD registrado';
COMMENT ON COLUMN public.voters.tags IS 'Tags livres para segmentação';

CREATE INDEX idx_voters_campaign ON public.voters(campaign_id);
CREATE INDEX idx_voters_status ON public.voters(status);
CREATE INDEX idx_voters_neighborhood ON public.voters(neighborhood);
CREATE INDEX idx_voters_leader ON public.voters(leader_id);
CREATE INDEX idx_voters_whatsapp ON public.voters(whatsapp);
CREATE INDEX idx_voters_full_name ON public.voters USING gin(to_tsvector('portuguese', full_name));

CREATE TRIGGER voters_updated_at
  BEFORE UPDATE ON public.voters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.voters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros da campanha veem eleitores"
  ON public.voters FOR SELECT
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

CREATE POLICY "Membros cadastram eleitores"
  ON public.voters FOR INSERT
  WITH CHECK (
    campaign_id IN (
      SELECT c.id FROM public.campaigns c
      JOIN public.organizations o ON o.id = c.organization_id
      WHERE o.owner_id = auth.uid()
      UNION
      SELECT campaign_id FROM public.user_roles WHERE user_id = auth.uid()
      UNION
      SELECT c.id FROM public.campaigns c
      JOIN public.user_roles ur ON ur.organization_id = c.organization_id
      WHERE ur.user_id = auth.uid()
    )
  );

CREATE POLICY "Membros atualizam eleitores"
  ON public.voters FOR UPDATE
  USING (
    campaign_id IN (
      SELECT c.id FROM public.campaigns c
      JOIN public.organizations o ON o.id = c.organization_id
      WHERE o.owner_id = auth.uid()
      UNION
      SELECT campaign_id FROM public.user_roles WHERE user_id = auth.uid()
      UNION
      SELECT c.id FROM public.campaigns c
      JOIN public.user_roles ur ON ur.organization_id = c.organization_id
      WHERE ur.user_id = auth.uid()
    )
  );

-- Histórico de interações com eleitores
CREATE TABLE public.voter_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  voter_id UUID NOT NULL REFERENCES public.voters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type interaction_type NOT NULL DEFAULT 'outro',
  description TEXT,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.voter_interactions IS 'Histórico de interações com eleitores';

CREATE INDEX idx_voter_interactions_voter ON public.voter_interactions(voter_id);
CREATE INDEX idx_voter_interactions_date ON public.voter_interactions(date DESC);

ALTER TABLE public.voter_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem interações"
  ON public.voter_interactions FOR SELECT
  USING (
    voter_id IN (SELECT id FROM public.voters)
  );

CREATE POLICY "Membros registram interações"
  ON public.voter_interactions FOR INSERT
  WITH CHECK (user_id = auth.uid());
