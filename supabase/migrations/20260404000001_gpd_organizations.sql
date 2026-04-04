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
