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
