-- =============================================
-- GPD: Gestor Político Digital
-- Migration 001: Organizations (Multi-tenant)
-- =============================================

-- Tipos customizados
CREATE TYPE org_plan AS ENUM ('starter', 'pro', 'enterprise');

-- Tabela de organizações (multi-tenant)
CREATE TABLE public.organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#1d4ed8',
  secondary_color TEXT DEFAULT '#f59e0b',
  plan org_plan NOT NULL DEFAULT 'starter',
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.organizations IS 'Organizações políticas (multi-tenant root)';
COMMENT ON COLUMN public.organizations.slug IS 'Identificador único para URLs públicas';
COMMENT ON COLUMN public.organizations.plan IS 'Plano de assinatura: starter/pro/enterprise';

-- Índices
CREATE INDEX idx_organizations_owner ON public.organizations(owner_id);
CREATE INDEX idx_organizations_slug ON public.organizations(slug);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem suas organizações"
  ON public.organizations FOR SELECT
  USING (
    owner_id = auth.uid() OR
    id IN (
      SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owner pode criar organização"
  ON public.organizations FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owner pode atualizar organização"
  ON public.organizations FOR UPDATE
  USING (owner_id = auth.uid());
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
-- =============================================
-- GPD: Migration 003: User Roles
-- =============================================

CREATE TYPE user_role AS ENUM (
  'super_admin',
  'admin',
  'coordenador_geral',
  'coordenador_regional',
  'cabo_eleitoral',
  'assessor_financeiro',
  'assessor_comunicacao',
  'assessor_demandas',
  'visualizador'
);

CREATE TABLE public.user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'visualizador',
  region TEXT,
  invited_by UUID REFERENCES auth.users(id),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, organization_id, campaign_id)
);

COMMENT ON TABLE public.user_roles IS 'Perfis e permissões de acesso por campanha';
COMMENT ON COLUMN public.user_roles.region IS 'Região/bairro de atuação (para coordenadores regionais)';

CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_org ON public.user_roles(organization_id);
CREATE INDEX idx_user_roles_campaign ON public.user_roles(campaign_id);

CREATE TRIGGER user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem seus próprios roles"
  ON public.user_roles FOR SELECT
  USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    ) OR
    organization_id IN (
      SELECT organization_id FROM public.user_roles ur2
      WHERE ur2.user_id = auth.uid() AND ur2.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admin gerencia roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    ) OR
    organization_id IN (
      SELECT organization_id FROM public.user_roles ur2
      WHERE ur2.user_id = auth.uid() AND ur2.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admin atualiza roles"
  ON public.user_roles FOR UPDATE
  USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    ) OR
    organization_id IN (
      SELECT organization_id FROM public.user_roles ur2
      WHERE ur2.user_id = auth.uid() AND ur2.role IN ('super_admin', 'admin')
    )
  );

-- Profiles table to store user metadata
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  whatsapp TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Perfil público dos usuários';

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê seu perfil"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Usuário atualiza seu perfil"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Usuário cria seu perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Trigger para criar perfil automaticamente no cadastro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles(id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
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
-- =============================================
-- GPD: Migration 007: Finances (Controle Financeiro)
-- =============================================

CREATE TYPE budget_category_type AS ENUM ('gasto', 'receita');

CREATE TABLE public.budget_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  planned_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  type budget_category_type NOT NULL DEFAULT 'gasto',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.budget_categories IS 'Categorias orçamentárias da campanha';

CREATE INDEX idx_budget_categories_campaign ON public.budget_categories(campaign_id);
CREATE TRIGGER budget_categories_updated_at
  BEFORE UPDATE ON public.budget_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem categorias"
  ON public.budget_categories FOR SELECT
  USING (campaign_id IN (
    SELECT c.id FROM public.campaigns c
    JOIN public.organizations o ON o.id = c.organization_id
    WHERE o.owner_id = auth.uid()
    UNION
    SELECT campaign_id FROM public.user_roles WHERE user_id = auth.uid() AND campaign_id IS NOT NULL
    UNION
    SELECT c.id FROM public.campaigns c
    JOIN public.user_roles ur ON ur.organization_id = c.organization_id
    WHERE ur.user_id = auth.uid()
  ));

CREATE POLICY "Financeiro gerencia categorias"
  ON public.budget_categories FOR INSERT
  WITH CHECK (campaign_id IN (
    SELECT c.id FROM public.campaigns c
    JOIN public.organizations o ON o.id = c.organization_id
    WHERE o.owner_id = auth.uid()
    UNION
    SELECT c.id FROM public.campaigns c
    JOIN public.user_roles ur ON ur.organization_id = c.organization_id
    WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin', 'admin', 'assessor_financeiro')
  ));

CREATE POLICY "Financeiro atualiza categorias"
  ON public.budget_categories FOR UPDATE
  USING (campaign_id IN (
    SELECT c.id FROM public.campaigns c
    JOIN public.organizations o ON o.id = c.organization_id
    WHERE o.owner_id = auth.uid()
    UNION
    SELECT c.id FROM public.campaigns c
    JOIN public.user_roles ur ON ur.organization_id = c.organization_id
    WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin', 'admin', 'assessor_financeiro')
  ));

-- Gastos
CREATE TABLE public.expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.budget_categories(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  payment_method TEXT,
  receipt_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.expenses IS 'Gastos da campanha';

CREATE INDEX idx_expenses_campaign ON public.expenses(campaign_id);
CREATE INDEX idx_expenses_category ON public.expenses(category_id);
CREATE INDEX idx_expenses_date ON public.expenses(date DESC);

CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem gastos"
  ON public.expenses FOR SELECT
  USING (campaign_id IN (
    SELECT c.id FROM public.campaigns c
    JOIN public.organizations o ON o.id = c.organization_id
    WHERE o.owner_id = auth.uid()
    UNION
    SELECT campaign_id FROM public.user_roles WHERE user_id = auth.uid() AND campaign_id IS NOT NULL
    UNION
    SELECT c.id FROM public.campaigns c
    JOIN public.user_roles ur ON ur.organization_id = c.organization_id
    WHERE ur.user_id = auth.uid()
  ));

CREATE POLICY "Financeiro registra gastos"
  ON public.expenses FOR INSERT
  WITH CHECK (campaign_id IN (
    SELECT c.id FROM public.campaigns c
    JOIN public.organizations o ON o.id = c.organization_id
    WHERE o.owner_id = auth.uid()
    UNION
    SELECT c.id FROM public.campaigns c
    JOIN public.user_roles ur ON ur.organization_id = c.organization_id
    WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin', 'admin', 'coordenador_geral', 'assessor_financeiro')
  ));

CREATE POLICY "Financeiro atualiza gastos"
  ON public.expenses FOR UPDATE
  USING (campaign_id IN (
    SELECT c.id FROM public.campaigns c
    JOIN public.organizations o ON o.id = c.organization_id
    WHERE o.owner_id = auth.uid()
    UNION
    SELECT c.id FROM public.campaigns c
    JOIN public.user_roles ur ON ur.organization_id = c.organization_id
    WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin', 'admin', 'coordenador_geral', 'assessor_financeiro')
  ));

-- Doações
CREATE TABLE public.donations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  donor_name TEXT NOT NULL,
  donor_cpf_encrypted BYTEA,
  amount NUMERIC(12,2) NOT NULL,
  date DATE NOT NULL,
  receipt_number TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.donations IS 'Doações recebidas pela campanha';

CREATE INDEX idx_donations_campaign ON public.donations(campaign_id);
CREATE INDEX idx_donations_date ON public.donations(date DESC);

CREATE TRIGGER donations_updated_at
  BEFORE UPDATE ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem doações"
  ON public.donations FOR SELECT
  USING (campaign_id IN (
    SELECT c.id FROM public.campaigns c
    JOIN public.organizations o ON o.id = c.organization_id
    WHERE o.owner_id = auth.uid()
    UNION
    SELECT campaign_id FROM public.user_roles WHERE user_id = auth.uid() AND campaign_id IS NOT NULL
    UNION
    SELECT c.id FROM public.campaigns c
    JOIN public.user_roles ur ON ur.organization_id = c.organization_id
    WHERE ur.user_id = auth.uid()
  ));

CREATE POLICY "Financeiro registra doações"
  ON public.donations FOR INSERT
  WITH CHECK (campaign_id IN (
    SELECT c.id FROM public.campaigns c
    JOIN public.organizations o ON o.id = c.organization_id
    WHERE o.owner_id = auth.uid()
    UNION
    SELECT c.id FROM public.campaigns c
    JOIN public.user_roles ur ON ur.organization_id = c.organization_id
    WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin', 'admin', 'assessor_financeiro')
  ));
-- =============================================
-- GPD: Migration 008: Events & Materials
-- =============================================

CREATE TYPE event_type AS ENUM ('visita', 'reuniao', 'comicio', 'caminhada', 'evento_beneficente', 'debate', 'sessao', 'pessoal', 'outro');
CREATE TYPE event_status AS ENUM ('planejado', 'confirmado', 'realizado', 'cancelado');

-- Eventos / Agenda
CREATE TABLE public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type event_type NOT NULL DEFAULT 'outro',
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ,
  location_text TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  status event_status NOT NULL DEFAULT 'planejado',
  responsible_id UUID REFERENCES auth.users(id),
  notes TEXT,
  post_event_notes TEXT,
  recurrence_rule TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.events IS 'Agenda de eventos e compromissos da campanha';

CREATE INDEX idx_events_campaign ON public.events(campaign_id);
CREATE INDEX idx_events_start ON public.events(start_datetime);
CREATE INDEX idx_events_status ON public.events(status);

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem eventos"
  ON public.events FOR SELECT
  USING (campaign_id IN (
    SELECT c.id FROM public.campaigns c
    JOIN public.organizations o ON o.id = c.organization_id
    WHERE o.owner_id = auth.uid()
    UNION
    SELECT campaign_id FROM public.user_roles WHERE user_id = auth.uid() AND campaign_id IS NOT NULL
    UNION
    SELECT c.id FROM public.campaigns c
    JOIN public.user_roles ur ON ur.organization_id = c.organization_id
    WHERE ur.user_id = auth.uid()
  ));

CREATE POLICY "Membros criam eventos"
  ON public.events FOR INSERT
  WITH CHECK (campaign_id IN (
    SELECT c.id FROM public.campaigns c
    JOIN public.organizations o ON o.id = c.organization_id
    WHERE o.owner_id = auth.uid()
    UNION
    SELECT campaign_id FROM public.user_roles WHERE user_id = auth.uid() AND campaign_id IS NOT NULL
    UNION
    SELECT c.id FROM public.campaigns c
    JOIN public.user_roles ur ON ur.organization_id = c.organization_id
    WHERE ur.user_id = auth.uid()
  ));

CREATE POLICY "Membros atualizam eventos"
  ON public.events FOR UPDATE
  USING (campaign_id IN (
    SELECT c.id FROM public.campaigns c
    JOIN public.organizations o ON o.id = c.organization_id
    WHERE o.owner_id = auth.uid()
    UNION
    SELECT campaign_id FROM public.user_roles WHERE user_id = auth.uid() AND campaign_id IS NOT NULL
    UNION
    SELECT c.id FROM public.campaigns c
    JOIN public.user_roles ur ON ur.organization_id = c.organization_id
    WHERE ur.user_id = auth.uid()
  ));

-- Participantes de eventos
CREATE TABLE public.event_attendees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  voter_id UUID REFERENCES public.voters(id) ON DELETE CASCADE,
  confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_event_attendees_event ON public.event_attendees(event_id);

ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem participantes"
  ON public.event_attendees FOR SELECT
  USING (event_id IN (SELECT id FROM public.events));

CREATE POLICY "Membros gerenciam participantes"
  ON public.event_attendees FOR INSERT
  WITH CHECK (event_id IN (SELECT id FROM public.events));

-- Materiais de campanha
CREATE TABLE public.materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity_produced INTEGER NOT NULL DEFAULT 0,
  unit_cost NUMERIC(10,2) DEFAULT 0,
  quantity_distributed INTEGER NOT NULL DEFAULT 0,
  distribution_log JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.materials IS 'Materiais de campanha (santinhos, camisetas, etc.)';

CREATE INDEX idx_materials_campaign ON public.materials(campaign_id);

CREATE TRIGGER materials_updated_at
  BEFORE UPDATE ON public.materials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem materiais"
  ON public.materials FOR SELECT
  USING (campaign_id IN (
    SELECT c.id FROM public.campaigns c
    JOIN public.organizations o ON o.id = c.organization_id
    WHERE o.owner_id = auth.uid()
    UNION
    SELECT campaign_id FROM public.user_roles WHERE user_id = auth.uid() AND campaign_id IS NOT NULL
    UNION
    SELECT c.id FROM public.campaigns c
    JOIN public.user_roles ur ON ur.organization_id = c.organization_id
    WHERE ur.user_id = auth.uid()
  ));

CREATE POLICY "Admin gerencia materiais"
  ON public.materials FOR INSERT
  WITH CHECK (campaign_id IN (
    SELECT c.id FROM public.campaigns c
    JOIN public.organizations o ON o.id = c.organization_id
    WHERE o.owner_id = auth.uid()
    UNION
    SELECT c.id FROM public.campaigns c
    JOIN public.user_roles ur ON ur.organization_id = c.organization_id
    WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin', 'admin', 'coordenador_geral')
  ));

CREATE POLICY "Admin atualiza materiais"
  ON public.materials FOR UPDATE
  USING (campaign_id IN (
    SELECT c.id FROM public.campaigns c
    JOIN public.organizations o ON o.id = c.organization_id
    WHERE o.owner_id = auth.uid()
    UNION
    SELECT c.id FROM public.campaigns c
    JOIN public.user_roles ur ON ur.organization_id = c.organization_id
    WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin', 'admin', 'coordenador_geral')
  ));
-- =============================================
-- GPD: Migration 009: Content, Surveys, Territories
-- =============================================

-- Calendário Editorial
CREATE TYPE content_platform AS ENUM ('instagram', 'tiktok', 'facebook', 'youtube', 'outro');
CREATE TYPE content_post_type AS ENUM ('reels', 'carrossel', 'stories', 'live', 'post', 'outro');
CREATE TYPE content_status AS ENUM ('ideia', 'roteirizado', 'em_producao', 'agendado', 'publicado');
CREATE TYPE content_phase AS ENUM ('pre_campanha', 'campanha_quente', 'ato_final', 'mandato');

CREATE TABLE public.content_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  platform content_platform NOT NULL DEFAULT 'instagram',
  post_type content_post_type NOT NULL DEFAULT 'post',
  hook TEXT,
  caption TEXT,
  hashtags TEXT[] DEFAULT '{}',
  cta TEXT,
  status content_status NOT NULL DEFAULT 'ideia',
  scheduled_date TIMESTAMPTZ,
  published_date TIMESTAMPTZ,
  campaign_phase content_phase DEFAULT 'pre_campanha',
  assigned_to UUID REFERENCES auth.users(id),
  media_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_content_posts_campaign ON public.content_posts(campaign_id);
CREATE INDEX idx_content_posts_status ON public.content_posts(status);
CREATE INDEX idx_content_posts_scheduled ON public.content_posts(scheduled_date);

CREATE TRIGGER content_posts_updated_at
  BEFORE UPDATE ON public.content_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.content_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem posts"
  ON public.content_posts FOR SELECT
  USING (campaign_id IN (
    SELECT c.id FROM public.campaigns c
    JOIN public.organizations o ON o.id = c.organization_id
    WHERE o.owner_id = auth.uid()
    UNION
    SELECT campaign_id FROM public.user_roles WHERE user_id = auth.uid() AND campaign_id IS NOT NULL
    UNION
    SELECT c.id FROM public.campaigns c
    JOIN public.user_roles ur ON ur.organization_id = c.organization_id
    WHERE ur.user_id = auth.uid()
  ));

CREATE POLICY "Membros criam posts"
  ON public.content_posts FOR INSERT
  WITH CHECK (campaign_id IN (
    SELECT c.id FROM public.campaigns c
    JOIN public.organizations o ON o.id = c.organization_id
    WHERE o.owner_id = auth.uid()
    UNION
    SELECT campaign_id FROM public.user_roles WHERE user_id = auth.uid() AND campaign_id IS NOT NULL
    UNION
    SELECT c.id FROM public.campaigns c
    JOIN public.user_roles ur ON ur.organization_id = c.organization_id
    WHERE ur.user_id = auth.uid()
  ));

CREATE POLICY "Membros atualizam posts"
  ON public.content_posts FOR UPDATE
  USING (campaign_id IN (
    SELECT c.id FROM public.campaigns c
    JOIN public.organizations o ON o.id = c.organization_id
    WHERE o.owner_id = auth.uid()
    UNION
    SELECT campaign_id FROM public.user_roles WHERE user_id = auth.uid() AND campaign_id IS NOT NULL
    UNION
    SELECT c.id FROM public.campaigns c
    JOIN public.user_roles ur ON ur.organization_id = c.organization_id
    WHERE ur.user_id = auth.uid()
  ));

-- Pesquisas
CREATE TYPE survey_type AS ENUM ('intencao_voto', 'satisfacao', 'plano_governo', 'personalizada');
CREATE TYPE question_type AS ENUM ('multipla_escolha', 'escala', 'texto_livre');

CREATE TABLE public.surveys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type survey_type NOT NULL DEFAULT 'personalizada',
  active BOOLEAN NOT NULL DEFAULT true,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_surveys_campaign ON public.surveys(campaign_id);

CREATE TRIGGER surveys_updated_at
  BEFORE UPDATE ON public.surveys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem pesquisas"
  ON public.surveys FOR SELECT
  USING (campaign_id IN (
    SELECT c.id FROM public.campaigns c
    JOIN public.organizations o ON o.id = c.organization_id
    WHERE o.owner_id = auth.uid()
    UNION
    SELECT campaign_id FROM public.user_roles WHERE user_id = auth.uid() AND campaign_id IS NOT NULL
    UNION
    SELECT c.id FROM public.campaigns c
    JOIN public.user_roles ur ON ur.organization_id = c.organization_id
    WHERE ur.user_id = auth.uid()
  ));

CREATE POLICY "Membros criam pesquisas"
  ON public.surveys FOR INSERT
  WITH CHECK (campaign_id IN (
    SELECT c.id FROM public.campaigns c
    JOIN public.organizations o ON o.id = c.organization_id
    WHERE o.owner_id = auth.uid()
    UNION
    SELECT campaign_id FROM public.user_roles WHERE user_id = auth.uid() AND campaign_id IS NOT NULL
    UNION
    SELECT c.id FROM public.campaigns c
    JOIN public.user_roles ur ON ur.organization_id = c.organization_id
    WHERE ur.user_id = auth.uid()
  ));

CREATE TABLE public.survey_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  type question_type NOT NULL DEFAULT 'multipla_escolha',
  options JSONB DEFAULT '[]',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_survey_questions_survey ON public.survey_questions(survey_id);

ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem perguntas"
  ON public.survey_questions FOR SELECT
  USING (survey_id IN (SELECT id FROM public.surveys));

CREATE POLICY "Membros criam perguntas"
  ON public.survey_questions FOR INSERT
  WITH CHECK (survey_id IN (SELECT id FROM public.surveys));

CREATE TABLE public.survey_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.survey_questions(id) ON DELETE CASCADE,
  respondent_voter_id UUID REFERENCES public.voters(id) ON DELETE SET NULL,
  answer JSONB NOT NULL,
  responded_at TIMESTAMPTZ DEFAULT now(),
  location_neighborhood TEXT
);

CREATE INDEX idx_survey_responses_question ON public.survey_responses(question_id);

ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem respostas"
  ON public.survey_responses FOR SELECT
  USING (question_id IN (SELECT id FROM public.survey_questions));

CREATE POLICY "Qualquer um pode responder pesquisa"
  ON public.survey_responses FOR INSERT
  WITH CHECK (true);

-- Territórios
CREATE TYPE territory_classification AS ENUM ('forte', 'medio', 'fraco');

CREATE TABLE public.territories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  neighborhood TEXT NOT NULL,
  city TEXT,
  total_voters INTEGER DEFAULT 0,
  confirmed_voters INTEGER DEFAULT 0,
  classification territory_classification DEFAULT 'medio',
  recommended_action TEXT,
  coordinates JSONB,
  leader_id UUID REFERENCES public.leaders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_territories_campaign ON public.territories(campaign_id);

CREATE TRIGGER territories_updated_at
  BEFORE UPDATE ON public.territories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.territories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem territórios"
  ON public.territories FOR SELECT
  USING (campaign_id IN (
    SELECT c.id FROM public.campaigns c
    JOIN public.organizations o ON o.id = c.organization_id
    WHERE o.owner_id = auth.uid()
    UNION
    SELECT campaign_id FROM public.user_roles WHERE user_id = auth.uid() AND campaign_id IS NOT NULL
    UNION
    SELECT c.id FROM public.campaigns c
    JOIN public.user_roles ur ON ur.organization_id = c.organization_id
    WHERE ur.user_id = auth.uid()
  ));

CREATE POLICY "Admin gerencia territórios"
  ON public.territories FOR INSERT
  WITH CHECK (campaign_id IN (
    SELECT c.id FROM public.campaigns c
    JOIN public.organizations o ON o.id = c.organization_id
    WHERE o.owner_id = auth.uid()
    UNION
    SELECT campaign_id FROM public.user_roles WHERE user_id = auth.uid() AND campaign_id IS NOT NULL
    UNION
    SELECT c.id FROM public.campaigns c
    JOIN public.user_roles ur ON ur.organization_id = c.organization_id
    WHERE ur.user_id = auth.uid()
  ));

CREATE POLICY "Admin atualiza territórios"
  ON public.territories FOR UPDATE
  USING (campaign_id IN (
    SELECT c.id FROM public.campaigns c
    JOIN public.organizations o ON o.id = c.organization_id
    WHERE o.owner_id = auth.uid()
    UNION
    SELECT campaign_id FROM public.user_roles WHERE user_id = auth.uid() AND campaign_id IS NOT NULL
    UNION
    SELECT c.id FROM public.campaigns c
    JOIN public.user_roles ur ON ur.organization_id = c.organization_id
    WHERE ur.user_id = auth.uid()
  ));
-- =============================================
-- GPD: Migration 010: Opponents, Documents, Notifications
-- =============================================

-- Adversários
CREATE TYPE impact_level AS ENUM ('alto', 'medio', 'baixo');

CREATE TABLE public.opponents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  party TEXT,
  office TEXT,
  strengths TEXT,
  weaknesses TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_opponents_campaign ON public.opponents(campaign_id);
CREATE TRIGGER opponents_updated_at
  BEFORE UPDATE ON public.opponents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.opponents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem adversários"
  ON public.opponents FOR SELECT
  USING (campaign_id IN (
    SELECT c.id FROM public.campaigns c
    JOIN public.organizations o ON o.id = c.organization_id
    WHERE o.owner_id = auth.uid()
    UNION
    SELECT campaign_id FROM public.user_roles WHERE user_id = auth.uid() AND campaign_id IS NOT NULL
    UNION
    SELECT c.id FROM public.campaigns c
    JOIN public.user_roles ur ON ur.organization_id = c.organization_id
    WHERE ur.user_id = auth.uid()
  ));

CREATE POLICY "Admin gerencia adversários"
  ON public.opponents FOR INSERT
  WITH CHECK (campaign_id IN (
    SELECT c.id FROM public.campaigns c
    JOIN public.organizations o ON o.id = c.organization_id
    WHERE o.owner_id = auth.uid()
    UNION
    SELECT campaign_id FROM public.user_roles WHERE user_id = auth.uid() AND campaign_id IS NOT NULL
    UNION
    SELECT c.id FROM public.campaigns c
    JOIN public.user_roles ur ON ur.organization_id = c.organization_id
    WHERE ur.user_id = auth.uid()
  ));

CREATE POLICY "Admin atualiza adversários"
  ON public.opponents FOR UPDATE
  USING (campaign_id IN (
    SELECT c.id FROM public.campaigns c
    JOIN public.organizations o ON o.id = c.organization_id
    WHERE o.owner_id = auth.uid()
    UNION
    SELECT campaign_id FROM public.user_roles WHERE user_id = auth.uid() AND campaign_id IS NOT NULL
    UNION
    SELECT c.id FROM public.campaigns c
    JOIN public.user_roles ur ON ur.organization_id = c.organization_id
    WHERE ur.user_id = auth.uid()
  ));

CREATE TABLE public.opponent_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  opponent_id UUID NOT NULL REFERENCES public.opponents(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  source TEXT,
  impact_level impact_level DEFAULT 'medio',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_opponent_activities_opponent ON public.opponent_activities(opponent_id);

ALTER TABLE public.opponent_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem atividades adversários"
  ON public.opponent_activities FOR SELECT
  USING (opponent_id IN (SELECT id FROM public.opponents));

CREATE POLICY "Admin registra atividades adversários"
  ON public.opponent_activities FOR INSERT
  WITH CHECK (opponent_id IN (SELECT id FROM public.opponents));

-- Documentos de gabinete
CREATE TYPE document_type AS ENUM ('oficio', 'requerimento', 'indicacao', 'projeto_lei', 'emenda', 'outro');
CREATE TYPE document_status AS ENUM ('rascunho', 'enviado', 'tramitando', 'aprovado', 'rejeitado', 'arquivado');

CREATE TABLE public.documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  type document_type NOT NULL DEFAULT 'outro',
  doc_number TEXT,
  title TEXT NOT NULL,
  content TEXT,
  status document_status NOT NULL DEFAULT 'rascunho',
  related_demand_id UUID REFERENCES public.demands(id) ON DELETE SET NULL,
  file_url TEXT,
  sent_to TEXT,
  sent_date DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_documents_campaign ON public.documents(campaign_id);
CREATE INDEX idx_documents_status ON public.documents(status);
CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem documentos"
  ON public.documents FOR SELECT
  USING (campaign_id IN (
    SELECT c.id FROM public.campaigns c
    JOIN public.organizations o ON o.id = c.organization_id
    WHERE o.owner_id = auth.uid()
    UNION
    SELECT campaign_id FROM public.user_roles WHERE user_id = auth.uid() AND campaign_id IS NOT NULL
    UNION
    SELECT c.id FROM public.campaigns c
    JOIN public.user_roles ur ON ur.organization_id = c.organization_id
    WHERE ur.user_id = auth.uid()
  ));

CREATE POLICY "Membros criam documentos"
  ON public.documents FOR INSERT
  WITH CHECK (campaign_id IN (
    SELECT c.id FROM public.campaigns c
    JOIN public.organizations o ON o.id = c.organization_id
    WHERE o.owner_id = auth.uid()
    UNION
    SELECT campaign_id FROM public.user_roles WHERE user_id = auth.uid() AND campaign_id IS NOT NULL
    UNION
    SELECT c.id FROM public.campaigns c
    JOIN public.user_roles ur ON ur.organization_id = c.organization_id
    WHERE ur.user_id = auth.uid()
  ));

CREATE POLICY "Membros atualizam documentos"
  ON public.documents FOR UPDATE
  USING (campaign_id IN (
    SELECT c.id FROM public.campaigns c
    JOIN public.organizations o ON o.id = c.organization_id
    WHERE o.owner_id = auth.uid()
    UNION
    SELECT campaign_id FROM public.user_roles WHERE user_id = auth.uid() AND campaign_id IS NOT NULL
    UNION
    SELECT c.id FROM public.campaigns c
    JOIN public.user_roles ur ON ur.organization_id = c.organization_id
    WHERE ur.user_id = auth.uid()
  ));

-- Notificações internas
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê suas notificações"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Sistema cria notificações"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Usuário marca como lida"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());
-- =============================================
-- GPD: Dados de Demonstração
-- Campanha: Maria Silva - Vereadora João Pessoa/PB 2026
-- =============================================
-- IMPORTANTE: Execute após aplicar todas as migrations.
-- Este seed cria um usuário demo e dados realistas.

DO $$
DECLARE
  v_user_id    UUID := '00000000-0000-0000-0000-000000000001';
  v_org_id     UUID := '11111111-0000-0000-0000-000000000001';
  v_campaign_id UUID := '22222222-0000-0000-0000-000000000001';
  -- Leaders
  v_leader1    UUID := gen_random_uuid();
  v_leader2    UUID := gen_random_uuid();
  v_leader3    UUID := gen_random_uuid();
  v_leader4    UUID := gen_random_uuid();
  v_leader5    UUID := gen_random_uuid();
BEGIN

-- Organização demo
INSERT INTO public.organizations (id, name, slug, primary_color, secondary_color, plan, owner_id)
VALUES (v_org_id, 'Campanha Maria Silva 2026', 'maria-silva-2026', '#1d4ed8', '#f59e0b', 'pro', v_user_id)
ON CONFLICT (id) DO NOTHING;

-- Role do owner
INSERT INTO public.user_roles (user_id, organization_id, role, accepted_at)
VALUES (v_user_id, v_org_id, 'admin', now())
ON CONFLICT DO NOTHING;

-- Campanha
INSERT INTO public.campaigns (id, organization_id, name, type, office, city, state, year, mode, vote_goal, start_date)
VALUES (v_campaign_id, v_org_id, 'Maria Silva - Vereadora JP 2026', 'campanha', 'vereador', 'João Pessoa', 'PB', 2026, 'pre_campanha', 3000, '2026-01-01')
ON CONFLICT (id) DO NOTHING;

-- ===== LIDERANÇAS =====
INSERT INTO public.leaders (id, campaign_id, full_name, whatsapp, neighborhoods, vote_goal, score, active)
VALUES
  (v_leader1, v_campaign_id, 'Carlos Mendes',    '83991110001', ARRAY['Manaíra', 'Tambaú'],          600, 420, true),
  (v_leader2, v_campaign_id, 'Ana Paula Souza',  '83991110002', ARRAY['Mangabeira', 'Valentina'],     500, 380, true),
  (v_leader3, v_campaign_id, 'João Ferreira',    '83991110003', ARRAY['Bancários', 'Cristo Redentor'], 400, 290, true),
  (v_leader4, v_campaign_id, 'Fátima Oliveira',  '83991110004', ARRAY['Torre', 'Bessa'],              350, 210, true),
  (v_leader5, v_campaign_id, 'Pedro Cavalcante', '83991110005', ARRAY['Alto do Mateus', 'Gramame'],   400, 155, true);

-- ===== ELEITORES =====
INSERT INTO public.voters (campaign_id, full_name, whatsapp, neighborhood, city, state, status, origin, gender, consent_given, consent_date, leader_id, captured_by)
VALUES
  (v_campaign_id,'Ana Beatriz Santos',  '83991120001','Manaíra',          'João Pessoa','PB','confirmado','evento',        'feminino',true,now(),v_leader1,v_user_id),
  (v_campaign_id,'Carlos Eduardo Lima', '83991120002','Tambaú',           'João Pessoa','PB','confirmado','indicacao',     'masculino',true,now(),v_leader1,v_user_id),
  (v_campaign_id,'Márcia Pereira',      '83991120003','Mangabeira',       'João Pessoa','PB','provavel',  'redes_sociais', 'feminino',true,now(),v_leader2,v_user_id),
  (v_campaign_id,'Roberto Alves',       '83991120004','Valentina',        'João Pessoa','PB','confirmado','indicacao',     'masculino',true,now(),v_leader2,v_user_id),
  (v_campaign_id,'Juliana Costa',       '83991120005','Bancários',        'João Pessoa','PB','indeciso',  'visita',        'feminino',true,now(),v_leader3,v_user_id),
  (v_campaign_id,'Francisco Neto',      '83991120006','Cristo Redentor',  'João Pessoa','PB','confirmado','evento',        'masculino',true,now(),v_leader3,v_user_id),
  (v_campaign_id,'Luciana Rodrigues',   '83991120007','Torre',            'João Pessoa','PB','provavel',  'captacao_publica','feminino',true,now(),v_leader4,v_user_id),
  (v_campaign_id,'André Moreira',       '83991120008','Bessa',            'João Pessoa','PB','indeciso',  'redes_sociais', 'masculino',true,now(),v_leader4,v_user_id),
  (v_campaign_id,'Simone Barbosa',      '83991120009','Alto do Mateus',   'João Pessoa','PB','confirmado','indicacao',     'feminino',true,now(),v_leader5,v_user_id),
  (v_campaign_id,'Márcio Gomes',        '83991120010','Gramame',          'João Pessoa','PB','neutro',    'outro',         'masculino',true,now(),v_leader5,v_user_id),
  (v_campaign_id,'Patrícia Sousa',      '83991120011','Manaíra',          'João Pessoa','PB','confirmado','evento',        'feminino',true,now(),v_leader1,v_user_id),
  (v_campaign_id,'Rodrigo Carvalho',    '83991120012','Tambaú',           'João Pessoa','PB','provavel',  'indicacao',     'masculino',true,now(),v_leader1,v_user_id),
  (v_campaign_id,'Tatiana Ferreira',    '83991120013','Mangabeira',       'João Pessoa','PB','oposicao',  'outro',         'feminino',true,now(),v_leader2,v_user_id),
  (v_campaign_id,'Wagner Dantas',       '83991120014','Valentina',        'João Pessoa','PB','confirmado','visita',        'masculino',true,now(),v_leader2,v_user_id),
  (v_campaign_id,'Renata Melo',         '83991120015','Bancários',        'João Pessoa','PB','provavel',  'redes_sociais', 'feminino',true,now(),v_leader3,v_user_id),
  (v_campaign_id,'Leandro Borges',      '83991120016','Cristo Redentor',  'João Pessoa','PB','indeciso',  'captacao_publica','masculino',true,now(),v_leader3,v_user_id),
  (v_campaign_id,'Cristiane Lopes',     '83991120017','Torre',            'João Pessoa','PB','confirmado','evento',        'feminino',true,now(),v_leader4,v_user_id),
  (v_campaign_id,'Sandro Araújo',       '83991120018','Bessa',            'João Pessoa','PB','neutro',    'outro',         'masculino',true,now(),v_leader4,v_user_id),
  (v_campaign_id,'Vanessa Cunha',       '83991120019','Manaíra',          'João Pessoa','PB','provavel',  'indicacao',     'feminino',true,now(),v_leader1,v_user_id),
  (v_campaign_id,'Fábio Nascimento',    '83991120020','Mangabeira',       'João Pessoa','PB','confirmado','evento',        'masculino',true,now(),v_leader2,v_user_id);

-- ===== DEMANDAS =====
INSERT INTO public.demands (campaign_id, requester_name, type, description, priority, status, target_agency, deadline, created_by)
VALUES
  (v_campaign_id,'Ana Beatriz Santos',  'saude',          'Solicitar ampliação das vagas no PSF Manaíra.',       'alta',   'aberta',      'Secretaria de Saúde',       now()::date + 15, v_user_id),
  (v_campaign_id,'Carlos Eduardo Lima', 'infraestrutura', 'Buraco na Av. Epitácio Pessoa esquina com R. Firmino.','alta',  'em_andamento','EMLUR / SEINFRA',           now()::date + 7,  v_user_id),
  (v_campaign_id,'Márcia Pereira',      'educacao',       'Falta de professores na E.M. Mangabeira III.',        'media',  'aberta',      'Secretaria de Educação',    now()::date + 30, v_user_id),
  (v_campaign_id,'Roberto Alves',       'emprego',        'Encaminhamento para vagas no PAT.',                   'baixa',  'resolvida',   'SINE João Pessoa',          now()::date - 5,  v_user_id),
  (v_campaign_id,'Juliana Costa',       'social',         'Auxílio para benefício do CRAS.',                     'alta',   'em_andamento','CRAS Bancários',            now()::date + 10, v_user_id),
  (v_campaign_id,'Francisco Neto',      'infraestrutura', 'Iluminação pública inexistente no Cristo.',           'media',  'aberta',      'ENERGISA',                  now()::date + 20, v_user_id),
  (v_campaign_id,'Luciana Rodrigues',   'saude',          'Demora no agendamento de consulta especializada.',    'alta',   'aberta',      'HCSC',                      now()::date + 5,  v_user_id),
  (v_campaign_id,'André Moreira',       'juridico',       'Orientação sobre divórcio consensual.',               'media',  'resolvida',   'Defensoria Pública',        null,             v_user_id),
  (v_campaign_id,'Simone Barbosa',      'infraestrutura', 'Calçadas irregulares no Alto do Mateus.',             'baixa',  'aberta',      'SEINFRA',                   now()::date + 45, v_user_id),
  (v_campaign_id,'Márcio Gomes',        'saude',          'Medicação em falta na UBS Gramame.',                  'alta',   'em_andamento','Secretaria de Saúde',       now()::date + 3,  v_user_id),
  (v_campaign_id,'Patrícia Sousa',      'educacao',       'Reforma urgente na E.M. João XXIII.',                 'alta',   'aberta',      'Secretaria de Educação',    now()::date + 14, v_user_id),
  (v_campaign_id,'Rodrigo Carvalho',    'social',         'Inscrição no programa Bolsa Família.',                'media',  'resolvida',   'CRAS Tambaú',               null,             v_user_id),
  (v_campaign_id,'Wagner Dantas',       'infraestrutura', 'Asfalto destruído na R. das Trincheiras.',            'media',  'aberta',      'SEINFRA',                   now()::date + 30, v_user_id),
  (v_campaign_id,'Renata Melo',         'saude',          'Solicitação de cadeira de rodas via CNES.',           'media',  'em_andamento','SMS JP',                    now()::date + 21, v_user_id),
  (v_campaign_id,'Leandro Borges',      'emprego',        'Encaminhamento para curso de qualificação.',          'baixa',  'aberta',      'SENAI / SENAC',             now()::date + 60, v_user_id);

-- ===== CATEGORIAS ORÇAMENTÁRIAS =====
INSERT INTO public.budget_categories (campaign_id, name, planned_amount, type)
VALUES
  (v_campaign_id,'Material Gráfico',   15000, 'gasto'),
  (v_campaign_id,'Transporte',          8000, 'gasto'),
  (v_campaign_id,'Alimentação Eventos', 6000, 'gasto'),
  (v_campaign_id,'Redes Sociais / Ads', 5000, 'gasto'),
  (v_campaign_id,'Infraestrutura',      4000, 'gasto'),
  (v_campaign_id,'Doações Recebidas',  50000, 'receita');

-- ===== GASTOS =====
WITH cats AS (SELECT id, name FROM public.budget_categories WHERE campaign_id = v_campaign_id)
INSERT INTO public.expenses (campaign_id, category_id, amount, description, date, payment_method, created_by)
SELECT
  v_campaign_id,
  (SELECT id FROM cats WHERE name = cat_name LIMIT 1),
  amt, desc_, date_, method, v_user_id
FROM (VALUES
  ('Material Gráfico',   3200.00, 'Santinhos 10.000 unidades',     now()::date - 20, 'PIX'),
  ('Material Gráfico',   1500.00, 'Camisetas 150 unidades',        now()::date - 15, 'PIX'),
  ('Transporte',          450.00, 'Combustível - semana 1',        now()::date - 28, 'Cartão de Débito'),
  ('Transporte',          520.00, 'Combustível - semana 2',        now()::date - 21, 'Cartão de Débito'),
  ('Alimentação Eventos',1200.00, 'Almoço de integração líderes',  now()::date - 10, 'PIX'),
  ('Redes Sociais / Ads', 800.00, 'Impulsionamento Instagram/Meta',now()::date - 7,  'Cartão de Crédito'),
  ('Infraestrutura',      650.00, 'Aluguel sala reunião - jan',    now()::date - 35, 'Transferência Bancária'),
  ('Material Gráfico',   2100.00, 'Adesivos e banners',            now()::date - 5,  'PIX')
) AS t(cat_name, amt, desc_, date_, method);

-- ===== DOAÇÕES =====
INSERT INTO public.donations (campaign_id, donor_name, amount, date, receipt_number, created_by)
VALUES
  (v_campaign_id,'José Alves Construção', 5000.00, now()::date - 30, 'REC-001', v_user_id),
  (v_campaign_id,'Farmácia São João',     2000.00, now()::date - 25, 'REC-002', v_user_id),
  (v_campaign_id,'Transportes Paraíba',   3500.00, now()::date - 18, 'REC-003', v_user_id),
  (v_campaign_id,'Mercado Boa Vista',     1500.00, now()::date - 12, 'REC-004', v_user_id),
  (v_campaign_id,'Clínica Saúde Total',  2500.00, now()::date - 5,  'REC-005', v_user_id);

-- ===== EVENTOS =====
INSERT INTO public.events (campaign_id, title, type, start_datetime, end_datetime, location_text, status)
VALUES
  (v_campaign_id,'Caminhada Manaíra',              'caminhada',  now() + interval '5 days',   now() + interval '5 days 3 hours',  'Praia de Manaíra, João Pessoa','confirmado'),
  (v_campaign_id,'Reunião de Lideranças',           'reuniao',    now() + interval '2 days',   now() + interval '2 days 2 hours',  'Sede da Campanha',             'confirmado'),
  (v_campaign_id,'Visita às escolas de Mangabeira', 'visita',     now() + interval '8 days',   now() + interval '8 days 4 hours',  'E.M. Mangabeira III',          'planejado'),
  (v_campaign_id,'Debate Comunitário Cristo',       'debate',     now() + interval '12 days',  now() + interval '12 days 3 hours', 'Praça do Cristo Redentor',     'planejado'),
  (v_campaign_id,'Churrasco de Captação Torre',     'comicio',    now() + interval '18 days',  now() + interval '18 days 5 hours', 'Clube dos Bancários',          'planejado'),
  (v_campaign_id,'Reunião Financeiro Campanha',     'reuniao',    now() - interval '5 days',   now() - interval '5 days' + interval '2 hours', 'Sede',            'realizado'),
  (v_campaign_id,'Caminhada Bancários',             'caminhada',  now() - interval '10 days',  now() - interval '10 days' + interval '3 hours','Av. dos Bancários','realizado'),
  (v_campaign_id,'Evento Comunitário Valentina',    'evento_beneficente', now() - interval '15 days', now() - interval '15 days' + interval '4 hours', 'Praça de Valentina', 'realizado');

-- ===== MATERIAIS =====
INSERT INTO public.materials (campaign_id, name, quantity_produced, unit_cost, quantity_distributed)
VALUES
  (v_campaign_id,'Santinho A6 (frente/verso)', 10000, 0.32,  7200),
  (v_campaign_id,'Camiseta Campanha',            150, 18.50,  95),
  (v_campaign_id,'Banner Lona 2x1m',              30, 85.00,  22),
  (v_campaign_id,'Adesivo Carro 30cm',           500, 1.20,   380);

-- ===== CALENDÁRIO EDITORIAL =====
INSERT INTO public.content_posts (campaign_id, title, platform, post_type, hook, caption, status, campaign_phase, scheduled_date)
VALUES
  (v_campaign_id,'Saúde em João Pessoa',         'instagram','reels',   'Você sabia que falta médico em 60% dos PSFs da cidade?','Precisamos mudar isso juntos! 💙',           'agendado',    'pre_campanha', now() + interval '3 days'),
  (v_campaign_id,'Minha história na educação',   'instagram','carrossel','Estudei em escola pública, sei o valor da educação.',   'Invista no futuro das nossas crianças.',     'roteirizado', 'pre_campanha', now() + interval '7 days'),
  (v_campaign_id,'Caminhada Manaíra - vem!',     'instagram','stories', 'Sábado tem caminhada! Me acompanha?',                   'Vote, participe, transforme!',               'ideia',       'campanha_quente', null),
  (v_campaign_id,'Proposta Infraestrutura',      'facebook', 'post',    '5 propostas para ruas melhores em JP.',                 'Confira nosso plano de obras.',              'publicado',   'pre_campanha', now() - interval '3 days'),
  (v_campaign_id,'Live no Instagram - Perguntas','instagram','live',    'Tenho 30 minutos para responder suas perguntas.',       'Às 19h hoje! Participe.',                    'agendado',    'pre_campanha', now() + interval '1 day'),
  (v_campaign_id,'Reels: dia a dia da campanha', 'tiktok',   'reels',   'Como é um dia na vida de uma candidata?',               'Transparência do início ao fim.',            'em_producao', 'pre_campanha', null),
  (v_campaign_id,'Carrossel Propostas Saúde',    'instagram','carrossel','10 propostas para saúde pública em JP.',               'Deslize para ver tudo →',                    'ideia',       'campanha_quente', null),
  (v_campaign_id,'Vídeo: Depoimento apoiadores', 'youtube',  'post',    'Por que eles acreditam em Maria Silva?',                'Ouça quem acredita nessa causa.',            'roteirizado', 'pre_campanha', now() + interval '14 days');

-- ===== TERRITÓRIOS =====
INSERT INTO public.territories (campaign_id, neighborhood, city, total_voters, confirmed_voters, classification, recommended_action, leader_id)
VALUES
  (v_campaign_id,'Manaíra',          'João Pessoa', 4200, 320, 'forte',  'Manter presença e ampliar captação.',         v_leader1),
  (v_campaign_id,'Tambaú',           'João Pessoa', 3800, 285, 'forte',  'Focar em eventos de rua.',                    v_leader1),
  (v_campaign_id,'Mangabeira',       'João Pessoa', 8500, 410, 'medio',  'Visitas porta a porta prioritárias.',         v_leader2),
  (v_campaign_id,'Valentina',        'João Pessoa', 6200, 295, 'medio',  'Aumentar presença nas escolas.',              v_leader2),
  (v_campaign_id,'Bancários',        'João Pessoa', 5100, 280, 'forte',  'Consolidar base com eventos.',                v_leader3),
  (v_campaign_id,'Cristo Redentor',  'João Pessoa', 7300, 190, 'fraco',  'Priorizar visitas e mitigar oposição.',       v_leader3),
  (v_campaign_id,'Torre',            'João Pessoa', 3900, 215, 'medio',  'Ampliar rede de cabo eleitoral.',             v_leader4),
  (v_campaign_id,'Bessa',            'João Pessoa', 4600, 180, 'fraco',  'Investir em eventos comunitários.',           v_leader4),
  (v_campaign_id,'Alto do Mateus',   'João Pessoa', 9200, 320, 'medio',  'Aumentar número de lideranças.',              v_leader5),
  (v_campaign_id,'Gramame',          'João Pessoa', 7800, 255, 'fraco',  'Iniciar trabalho de base zerado.',            v_leader5);

END $$;
