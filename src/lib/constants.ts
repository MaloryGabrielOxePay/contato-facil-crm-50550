// =============================================
// GPD: Constantes e Enums
// =============================================

export const VOTER_STATUS = {
  confirmado: { label: 'Confirmado', color: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
  provavel: { label: 'Provável', color: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
  indeciso: { label: 'Indeciso', color: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' },
  oposicao: { label: 'Oposição', color: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
  neutro: { label: 'Neutro', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
} as const;

export const VOTER_ORIGIN = {
  indicacao: 'Indicação',
  evento: 'Evento',
  redes_sociais: 'Redes Sociais',
  visita: 'Visita',
  captacao_publica: 'Captação Pública',
  outro: 'Outro',
} as const;

export const VOTER_GENDER = {
  masculino: 'Masculino',
  feminino: 'Feminino',
  outro: 'Outro',
  nao_informado: 'Não Informado',
} as const;

export const DEMAND_STATUS = {
  aberta: { label: 'Aberta', color: 'bg-blue-100 text-blue-800', kanban: 'border-blue-300' },
  em_andamento: { label: 'Em Andamento', color: 'bg-yellow-100 text-yellow-800', kanban: 'border-yellow-300' },
  resolvida: { label: 'Resolvida', color: 'bg-green-100 text-green-800', kanban: 'border-green-300' },
  cancelada: { label: 'Cancelada', color: 'bg-red-100 text-red-800', kanban: 'border-red-300' },
} as const;

export const DEMAND_PRIORITY = {
  alta: { label: 'Alta', color: 'bg-red-100 text-red-700' },
  media: { label: 'Média', color: 'bg-yellow-100 text-yellow-700' },
  baixa: { label: 'Baixa', color: 'bg-green-100 text-green-700' },
} as const;

export const DEMAND_TYPE = {
  saude: 'Saúde',
  educacao: 'Educação',
  infraestrutura: 'Infraestrutura',
  emprego: 'Emprego',
  social: 'Social',
  juridico: 'Jurídico',
  outro: 'Outro',
} as const;

export const EVENT_STATUS = {
  planejado: { label: 'Planejado', color: 'bg-blue-100 text-blue-800' },
  confirmado: { label: 'Confirmado', color: 'bg-green-100 text-green-800' },
  realizado: { label: 'Realizado', color: 'bg-gray-100 text-gray-700' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
} as const;

export const EVENT_TYPE = {
  visita: 'Visita',
  reuniao: 'Reunião',
  comicio: 'Comício',
  caminhada: 'Caminhada',
  evento_beneficente: 'Evento Beneficente',
  debate: 'Debate',
  sessao: 'Sessão',
  pessoal: 'Pessoal',
  outro: 'Outro',
} as const;

export const CONTENT_STATUS = {
  ideia: { label: 'Ideia', color: 'bg-gray-100 text-gray-600' },
  roteirizado: { label: 'Roteirizado', color: 'bg-yellow-100 text-yellow-700' },
  em_producao: { label: 'Em Produção', color: 'bg-blue-100 text-blue-700' },
  agendado: { label: 'Agendado', color: 'bg-purple-100 text-purple-700' },
  publicado: { label: 'Publicado', color: 'bg-green-100 text-green-700' },
} as const;

export const CONTENT_PLATFORM = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  youtube: 'YouTube',
  outro: 'Outro',
} as const;

export const CAMPAIGN_OFFICE = {
  vereador: 'Vereador(a)',
  prefeito: 'Prefeito(a)',
  dep_estadual: 'Dep. Estadual',
  dep_federal: 'Dep. Federal',
  senador: 'Senador(a)',
  governador: 'Governador(a)',
} as const;

export const CAMPAIGN_MODE = {
  pre_campanha: 'Pré-Campanha',
  campanha: 'Campanha',
  mandato: 'Mandato',
} as const;

export const USER_ROLES = {
  super_admin: 'Super Admin',
  admin: 'Administrador',
  coordenador_geral: 'Coordenador Geral',
  coordenador_regional: 'Coordenador Regional',
  cabo_eleitoral: 'Cabo Eleitoral',
  assessor_financeiro: 'Assessor Financeiro',
  assessor_comunicacao: 'Assessor de Comunicação',
  assessor_demandas: 'Assessor de Demandas',
  visualizador: 'Visualizador',
} as const;

export const TERRITORY_CLASSIFICATION = {
  forte: { label: 'Forte', color: 'bg-green-100 text-green-800', mapColor: '#16a34a' },
  medio: { label: 'Médio', color: 'bg-yellow-100 text-yellow-800', mapColor: '#ca8a04' },
  fraco: { label: 'Fraco', color: 'bg-red-100 text-red-800', mapColor: '#dc2626' },
} as const;

export const INTERACTION_TYPE = {
  visita: 'Visita',
  ligacao: 'Ligação',
  whatsapp: 'WhatsApp',
  evento: 'Evento',
  atendimento: 'Atendimento',
  outro: 'Outro',
} as const;

export const PAYMENT_METHODS = [
  'Dinheiro',
  'PIX',
  'Transferência Bancária',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Cheque',
  'Outro',
] as const;

export const BRAZIL_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;
