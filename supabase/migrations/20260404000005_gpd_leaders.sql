-- =============================================
-- GPD: Migration 005: Leaders (Lideranças)
-- =============================================

CREATE TYPE leader_goal_type AS ENUM ('eleitores', 'visitas', 'eventos');

CREATE TABLE public.leaders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  whatsapp TEXT,
  photo_url TEXT,
  neighborhoods TEXT[] DEFAULT '{}',
  vote_goal INTEGER DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.leaders IS 'Lideranças políticas da campanha';
COMMENT ON COLUMN public.leaders.score IS 'Pontuação gamificada da liderança';
COMMENT ON COLUMN public.leaders.neighborhoods IS 'Bairros de atuação da liderança';

CREATE INDEX idx_leaders_campaign ON public.leaders(campaign_id);
CREATE INDEX idx_leaders_active ON public.leaders(active);
CREATE INDEX idx_leaders_score ON public.leaders(score DESC);

CREATE TRIGGER leaders_updated_at
  BEFORE UPDATE ON public.leaders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- FK de voters.leader_id
ALTER TABLE public.voters
  ADD CONSTRAINT fk_voters_leader
  FOREIGN KEY (leader_id) REFERENCES public.leaders(id) ON DELETE SET NULL;

ALTER TABLE public.leaders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem lideranças"
  ON public.leaders FOR SELECT
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

CREATE POLICY "Admin gerencia lideranças"
  ON public.leaders FOR INSERT
  WITH CHECK (
    campaign_id IN (
      SELECT c.id FROM public.campaigns c
      JOIN public.organizations o ON o.id = c.organization_id
      WHERE o.owner_id = auth.uid()
      UNION
      SELECT c.id FROM public.campaigns c
      JOIN public.user_roles ur ON ur.organization_id = c.organization_id
      WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin', 'admin', 'coordenador_geral')
    )
  );

CREATE POLICY "Admin atualiza lideranças"
  ON public.leaders FOR UPDATE
  USING (
    campaign_id IN (
      SELECT c.id FROM public.campaigns c
      JOIN public.organizations o ON o.id = c.organization_id
      WHERE o.owner_id = auth.uid()
      UNION
      SELECT c.id FROM public.campaigns c
      JOIN public.user_roles ur ON ur.organization_id = c.organization_id
      WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin', 'admin', 'coordenador_geral')
    )
  );

-- Metas de lideranças
CREATE TABLE public.leader_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  leader_id UUID NOT NULL REFERENCES public.leaders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_value INTEGER NOT NULL DEFAULT 0,
  current_value INTEGER NOT NULL DEFAULT 0,
  type leader_goal_type NOT NULL DEFAULT 'eleitores',
  deadline DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.leader_goals IS 'Metas SMART para lideranças';

CREATE INDEX idx_leader_goals_leader ON public.leader_goals(leader_id);

CREATE TRIGGER leader_goals_updated_at
  BEFORE UPDATE ON public.leader_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.leader_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem metas"
  ON public.leader_goals FOR SELECT
  USING (
    leader_id IN (SELECT id FROM public.leaders)
  );

CREATE POLICY "Admin gerencia metas"
  ON public.leader_goals FOR INSERT
  WITH CHECK (
    leader_id IN (SELECT id FROM public.leaders)
  );

CREATE POLICY "Admin atualiza metas"
  ON public.leader_goals FOR UPDATE
  USING (
    leader_id IN (SELECT id FROM public.leaders)
  );
