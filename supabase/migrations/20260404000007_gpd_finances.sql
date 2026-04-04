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
