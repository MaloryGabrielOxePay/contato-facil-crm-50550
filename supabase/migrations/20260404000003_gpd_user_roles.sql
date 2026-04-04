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
