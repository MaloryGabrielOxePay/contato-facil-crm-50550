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
