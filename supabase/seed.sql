-- =============================================
-- GPD: Dados de Demonstração
-- Campanha: Maria Silva - Vereadora João Pessoa/PB 2026
-- =============================================
-- IMPORTANTE: Execute APÓS criar sua conta no app.
-- Este seed busca automaticamente o primeiro usuário cadastrado.

DO $$
DECLARE
  v_user_id     UUID;
  v_org_id      UUID := '11111111-0000-0000-0000-000000000001';
  v_campaign_id UUID := '22222222-0000-0000-0000-000000000001';
  v_leader1     UUID := gen_random_uuid();
  v_leader2     UUID := gen_random_uuid();
  v_leader3     UUID := gen_random_uuid();
  v_leader4     UUID := gen_random_uuid();
  v_leader5     UUID := gen_random_uuid();
BEGIN

  -- Busca o primeiro usuário real cadastrado no Supabase Auth
  SELECT id INTO v_user_id FROM auth.users ORDER BY created_at LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION
      'ERRO: Nenhum usuário encontrado. Crie uma conta no app (https://maloygabrieloxepay.github.io/contato-facil-crm-50550/) e execute este seed novamente.';
  END IF;

  RAISE NOTICE 'Usando usuário: %', v_user_id;

-- ===== ORGANIZAÇÃO =====
INSERT INTO public.organizations (id, name, slug, primary_color, secondary_color, plan, owner_id)
VALUES (v_org_id, 'Campanha Maria Silva 2026', 'maria-silva-2026', '#1d4ed8', '#f59e0b', 'pro', v_user_id)
ON CONFLICT (id) DO NOTHING;

-- Role do owner
INSERT INTO public.user_roles (user_id, organization_id, role, accepted_at)
VALUES (v_user_id, v_org_id, 'admin', now())
ON CONFLICT DO NOTHING;

-- ===== CAMPANHA =====
INSERT INTO public.campaigns (id, organization_id, name, type, office, city, state, year, mode, vote_goal, start_date)
VALUES (v_campaign_id, v_org_id, 'Maria Silva - Vereadora JP 2026', 'campanha', 'vereador', 'João Pessoa', 'PB', 2026, 'pre_campanha', 3000, '2026-01-01')
ON CONFLICT (id) DO NOTHING;

-- ===== LIDERANÇAS =====
INSERT INTO public.leaders (id, campaign_id, full_name, whatsapp, neighborhoods, vote_goal, score, active)
VALUES
  (v_leader1, v_campaign_id, 'Carlos Mendes',    '83991110001', ARRAY['Manaíra', 'Tambaú'],           600, 420, true),
  (v_leader2, v_campaign_id, 'Ana Paula Souza',  '83991110002', ARRAY['Mangabeira', 'Valentina'],      500, 380, true),
  (v_leader3, v_campaign_id, 'João Ferreira',    '83991110003', ARRAY['Bancários', 'Cristo Redentor'], 400, 290, true),
  (v_leader4, v_campaign_id, 'Fátima Oliveira',  '83991110004', ARRAY['Torre', 'Bessa'],               350, 210, true),
  (v_leader5, v_campaign_id, 'Pedro Cavalcante', '83991110005', ARRAY['Alto do Mateus', 'Gramame'],    400, 155, true);

-- ===== ELEITORES =====
INSERT INTO public.voters (campaign_id, full_name, whatsapp, neighborhood, city, state, status, origin, gender, consent_given, consent_date, leader_id, captured_by)
VALUES
  (v_campaign_id,'Ana Beatriz Santos',  '83991120001','Manaíra',         'João Pessoa','PB','confirmado','evento',          'feminino', true,now(),v_leader1,v_user_id),
  (v_campaign_id,'Carlos Eduardo Lima', '83991120002','Tambaú',          'João Pessoa','PB','confirmado','indicacao',       'masculino',true,now(),v_leader1,v_user_id),
  (v_campaign_id,'Márcia Pereira',      '83991120003','Mangabeira',      'João Pessoa','PB','provavel',  'redes_sociais',   'feminino', true,now(),v_leader2,v_user_id),
  (v_campaign_id,'Roberto Alves',       '83991120004','Valentina',       'João Pessoa','PB','confirmado','indicacao',       'masculino',true,now(),v_leader2,v_user_id),
  (v_campaign_id,'Juliana Costa',       '83991120005','Bancários',       'João Pessoa','PB','indeciso',  'visita',          'feminino', true,now(),v_leader3,v_user_id),
  (v_campaign_id,'Francisco Neto',      '83991120006','Cristo Redentor', 'João Pessoa','PB','confirmado','evento',          'masculino',true,now(),v_leader3,v_user_id),
  (v_campaign_id,'Luciana Rodrigues',   '83991120007','Torre',           'João Pessoa','PB','provavel',  'captacao_publica','feminino', true,now(),v_leader4,v_user_id),
  (v_campaign_id,'André Moreira',       '83991120008','Bessa',           'João Pessoa','PB','indeciso',  'redes_sociais',   'masculino',true,now(),v_leader4,v_user_id),
  (v_campaign_id,'Simone Barbosa',      '83991120009','Alto do Mateus',  'João Pessoa','PB','confirmado','indicacao',       'feminino', true,now(),v_leader5,v_user_id),
  (v_campaign_id,'Márcio Gomes',        '83991120010','Gramame',         'João Pessoa','PB','neutro',    'outro',           'masculino',true,now(),v_leader5,v_user_id),
  (v_campaign_id,'Patrícia Sousa',      '83991120011','Manaíra',         'João Pessoa','PB','confirmado','evento',          'feminino', true,now(),v_leader1,v_user_id),
  (v_campaign_id,'Rodrigo Carvalho',    '83991120012','Tambaú',          'João Pessoa','PB','provavel',  'indicacao',       'masculino',true,now(),v_leader1,v_user_id),
  (v_campaign_id,'Tatiana Ferreira',    '83991120013','Mangabeira',      'João Pessoa','PB','oposicao',  'outro',           'feminino', true,now(),v_leader2,v_user_id),
  (v_campaign_id,'Wagner Dantas',       '83991120014','Valentina',       'João Pessoa','PB','confirmado','visita',          'masculino',true,now(),v_leader2,v_user_id),
  (v_campaign_id,'Renata Melo',         '83991120015','Bancários',       'João Pessoa','PB','provavel',  'redes_sociais',   'feminino', true,now(),v_leader3,v_user_id),
  (v_campaign_id,'Leandro Borges',      '83991120016','Cristo Redentor', 'João Pessoa','PB','indeciso',  'captacao_publica','masculino',true,now(),v_leader3,v_user_id),
  (v_campaign_id,'Cristiane Lopes',     '83991120017','Torre',           'João Pessoa','PB','confirmado','evento',          'feminino', true,now(),v_leader4,v_user_id),
  (v_campaign_id,'Sandro Araújo',       '83991120018','Bessa',           'João Pessoa','PB','neutro',    'outro',           'masculino',true,now(),v_leader4,v_user_id),
  (v_campaign_id,'Vanessa Cunha',       '83991120019','Manaíra',         'João Pessoa','PB','provavel',  'indicacao',       'feminino', true,now(),v_leader1,v_user_id),
  (v_campaign_id,'Fábio Nascimento',    '83991120020','Mangabeira',      'João Pessoa','PB','confirmado','evento',          'masculino',true,now(),v_leader2,v_user_id);

-- ===== DEMANDAS =====
INSERT INTO public.demands (campaign_id, requester_name, type, description, priority, status, target_agency, deadline, created_by)
VALUES
  (v_campaign_id,'Ana Beatriz Santos',  'saude',          'Solicitar ampliação das vagas no PSF Manaíra.',        'alta',  'aberta',      'Secretaria de Saúde',    now()::date + 15, v_user_id),
  (v_campaign_id,'Carlos Eduardo Lima', 'infraestrutura', 'Buraco na Av. Epitácio Pessoa esquina com R. Firmino.','alta',  'em_andamento','EMLUR / SEINFRA',        now()::date + 7,  v_user_id),
  (v_campaign_id,'Márcia Pereira',      'educacao',       'Falta de professores na E.M. Mangabeira III.',         'media', 'aberta',      'Secretaria de Educação', now()::date + 30, v_user_id),
  (v_campaign_id,'Roberto Alves',       'emprego',        'Encaminhamento para vagas no PAT.',                    'baixa', 'resolvida',   'SINE João Pessoa',       now()::date - 5,  v_user_id),
  (v_campaign_id,'Juliana Costa',       'social',         'Auxílio para benefício do CRAS.',                      'alta',  'em_andamento','CRAS Bancários',         now()::date + 10, v_user_id),
  (v_campaign_id,'Francisco Neto',      'infraestrutura', 'Iluminação pública inexistente no Cristo.',            'media', 'aberta',      'ENERGISA',               now()::date + 20, v_user_id),
  (v_campaign_id,'Luciana Rodrigues',   'saude',          'Demora no agendamento de consulta especializada.',     'alta',  'aberta',      'HCSC',                   now()::date + 5,  v_user_id),
  (v_campaign_id,'André Moreira',       'juridico',       'Orientação sobre divórcio consensual.',                'media', 'resolvida',   'Defensoria Pública',     null,             v_user_id),
  (v_campaign_id,'Simone Barbosa',      'infraestrutura', 'Calçadas irregulares no Alto do Mateus.',              'baixa', 'aberta',      'SEINFRA',                now()::date + 45, v_user_id),
  (v_campaign_id,'Márcio Gomes',        'saude',          'Medicação em falta na UBS Gramame.',                   'alta',  'em_andamento','Secretaria de Saúde',    now()::date + 3,  v_user_id),
  (v_campaign_id,'Patrícia Sousa',      'educacao',       'Reforma urgente na E.M. João XXIII.',                  'alta',  'aberta',      'Secretaria de Educação', now()::date + 14, v_user_id),
  (v_campaign_id,'Rodrigo Carvalho',    'social',         'Inscrição no programa Bolsa Família.',                 'media', 'resolvida',   'CRAS Tambaú',            null,             v_user_id),
  (v_campaign_id,'Wagner Dantas',       'infraestrutura', 'Asfalto destruído na R. das Trincheiras.',             'media', 'aberta',      'SEINFRA',                now()::date + 30, v_user_id),
  (v_campaign_id,'Renata Melo',         'saude',          'Solicitação de cadeira de rodas via CNES.',            'media', 'em_andamento','SMS JP',                 now()::date + 21, v_user_id),
  (v_campaign_id,'Leandro Borges',      'emprego',        'Encaminhamento para curso de qualificação.',           'baixa', 'aberta',      'SENAI / SENAC',          now()::date + 60, v_user_id);

-- ===== CATEGORIAS ORÇAMENTÁRIAS =====
INSERT INTO public.budget_categories (campaign_id, name, planned_amount, type)
VALUES
  (v_campaign_id,'Material Gráfico',    15000, 'gasto'),
  (v_campaign_id,'Transporte',           8000, 'gasto'),
  (v_campaign_id,'Alimentação Eventos',  6000, 'gasto'),
  (v_campaign_id,'Redes Sociais / Ads',  5000, 'gasto'),
  (v_campaign_id,'Infraestrutura',       4000, 'gasto'),
  (v_campaign_id,'Doações Recebidas',   50000, 'receita');

-- ===== GASTOS =====
WITH cats AS (SELECT id, name FROM public.budget_categories WHERE campaign_id = v_campaign_id)
INSERT INTO public.expenses (campaign_id, category_id, amount, description, date, payment_method, created_by)
SELECT
  v_campaign_id,
  (SELECT id FROM cats WHERE name = cat_name LIMIT 1),
  amt, desc_, date_, method, v_user_id
FROM (VALUES
  ('Material Gráfico',   3200.00, 'Santinhos 10.000 unidades',      now()::date - 20, 'PIX'),
  ('Material Gráfico',   1500.00, 'Camisetas 150 unidades',         now()::date - 15, 'PIX'),
  ('Transporte',          450.00, 'Combustível - semana 1',         now()::date - 28, 'Cartão de Débito'),
  ('Transporte',          520.00, 'Combustível - semana 2',         now()::date - 21, 'Cartão de Débito'),
  ('Alimentação Eventos',1200.00, 'Almoço de integração líderes',   now()::date - 10, 'PIX'),
  ('Redes Sociais / Ads', 800.00, 'Impulsionamento Instagram/Meta', now()::date - 7,  'Cartão de Crédito'),
  ('Infraestrutura',      650.00, 'Aluguel sala reunião - jan',     now()::date - 35, 'Transferência Bancária'),
  ('Material Gráfico',   2100.00, 'Adesivos e banners',             now()::date - 5,  'PIX')
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
  (v_campaign_id,'Caminhada Manaíra',              'caminhada',        now() + interval '5 days',  now() + interval '5 days 3 hours',   'Praia de Manaíra, João Pessoa',  'confirmado'),
  (v_campaign_id,'Reunião de Lideranças',           'reuniao',          now() + interval '2 days',  now() + interval '2 days 2 hours',   'Sede da Campanha',               'confirmado'),
  (v_campaign_id,'Visita às escolas de Mangabeira', 'visita',           now() + interval '8 days',  now() + interval '8 days 4 hours',   'E.M. Mangabeira III',            'planejado'),
  (v_campaign_id,'Debate Comunitário Cristo',       'debate',           now() + interval '12 days', now() + interval '12 days 3 hours',  'Praça do Cristo Redentor',       'planejado'),
  (v_campaign_id,'Churrasco de Captação Torre',     'comicio',          now() + interval '18 days', now() + interval '18 days 5 hours',  'Clube dos Bancários',            'planejado'),
  (v_campaign_id,'Reunião Financeiro Campanha',     'reuniao',          now() - interval '5 days',  now() - interval '5 days 2 hours',   'Sede',                           'realizado'),
  (v_campaign_id,'Caminhada Bancários',             'caminhada',        now() - interval '10 days', now() - interval '10 days 3 hours',  'Av. dos Bancários',              'realizado'),
  (v_campaign_id,'Evento Comunitário Valentina',    'evento_beneficente',now() - interval '15 days',now() - interval '15 days 4 hours',  'Praça de Valentina',             'realizado');

-- ===== MATERIAIS =====
INSERT INTO public.materials (campaign_id, name, quantity_produced, unit_cost, quantity_distributed)
VALUES
  (v_campaign_id,'Santinho A6 (frente/verso)', 10000, 0.32,  7200),
  (v_campaign_id,'Camiseta Campanha',            150,  18.50,  95),
  (v_campaign_id,'Banner Lona 2x1m',              30,  85.00,  22),
  (v_campaign_id,'Adesivo Carro 30cm',           500,   1.20, 380);

-- ===== CALENDÁRIO EDITORIAL =====
INSERT INTO public.content_posts (campaign_id, title, platform, post_type, hook, caption, status, campaign_phase, scheduled_date)
VALUES
  (v_campaign_id,'Saúde em João Pessoa',         'instagram','reels',    'Você sabia que falta médico em 60% dos PSFs?', 'Precisamos mudar isso juntos!',        'agendado',    'pre_campanha',   now() + interval '3 days'),
  (v_campaign_id,'Minha história na educação',   'instagram','carrossel','Estudei em escola pública.',                  'Invista no futuro das crianças.',      'roteirizado', 'pre_campanha',   now() + interval '7 days'),
  (v_campaign_id,'Caminhada Manaíra - vem!',     'instagram','stories',  'Sábado tem caminhada!',                       'Vote, participe, transforme!',         'ideia',       'campanha_quente',null),
  (v_campaign_id,'Proposta Infraestrutura',      'facebook', 'post',     '5 propostas para ruas melhores em JP.',       'Confira nosso plano de obras.',        'publicado',   'pre_campanha',   now() - interval '3 days'),
  (v_campaign_id,'Live no Instagram - Perguntas','instagram','live',     'Tenho 30 minutos para suas perguntas.',       'Às 19h hoje! Participe.',              'agendado',    'pre_campanha',   now() + interval '1 day'),
  (v_campaign_id,'Reels: dia a dia da campanha', 'tiktok',   'reels',    'Como é um dia na vida de uma candidata?',    'Transparência do início ao fim.',      'em_producao', 'pre_campanha',   null),
  (v_campaign_id,'Carrossel Propostas Saúde',    'instagram','carrossel','10 propostas para saúde pública em JP.',     'Deslize para ver tudo →',              'ideia',       'campanha_quente',null),
  (v_campaign_id,'Vídeo: Depoimento apoiadores', 'youtube',  'post',     'Por que eles acreditam em Maria Silva?',     'Ouça quem acredita nessa causa.',      'roteirizado', 'pre_campanha',   now() + interval '14 days');

-- ===== TERRITÓRIOS =====
INSERT INTO public.territories (campaign_id, neighborhood, city, total_voters, confirmed_voters, classification, recommended_action, leader_id)
VALUES
  (v_campaign_id,'Manaíra',         'João Pessoa', 4200, 320, 'forte', 'Manter presença e ampliar captação.',  v_leader1),
  (v_campaign_id,'Tambaú',          'João Pessoa', 3800, 285, 'forte', 'Focar em eventos de rua.',             v_leader1),
  (v_campaign_id,'Mangabeira',      'João Pessoa', 8500, 410, 'medio', 'Visitas porta a porta prioritárias.',  v_leader2),
  (v_campaign_id,'Valentina',       'João Pessoa', 6200, 295, 'medio', 'Aumentar presença nas escolas.',       v_leader2),
  (v_campaign_id,'Bancários',       'João Pessoa', 5100, 280, 'forte', 'Consolidar base com eventos.',         v_leader3),
  (v_campaign_id,'Cristo Redentor', 'João Pessoa', 7300, 190, 'fraco', 'Priorizar visitas e mitigar oposição.',v_leader3),
  (v_campaign_id,'Torre',           'João Pessoa', 3900, 215, 'medio', 'Ampliar rede de cabo eleitoral.',      v_leader4),
  (v_campaign_id,'Bessa',           'João Pessoa', 4600, 180, 'fraco', 'Investir em eventos comunitários.',    v_leader4),
  (v_campaign_id,'Alto do Mateus',  'João Pessoa', 9200, 320, 'medio', 'Aumentar número de lideranças.',       v_leader5),
  (v_campaign_id,'Gramame',         'João Pessoa', 7800, 255, 'fraco', 'Iniciar trabalho de base zerado.',     v_leader5);

END $$;
