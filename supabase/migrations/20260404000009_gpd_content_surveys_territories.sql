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
