// =============================================
// GPD: Sistema de Permissões
// =============================================

type Permission = string;
type Role = keyof typeof PERMISSIONS;

const PERMISSIONS = {
  super_admin: ['*'],
  admin: ['*'],
  coordenador_geral: [
    'dashboard:read', 'voters:*', 'leaders:*', 'demands:*',
    'events:*', 'materials:read', 'content:*', 'surveys:*',
    'reports:read', 'finances:read', 'territory:read',
  ],
  coordenador_regional: [
    'dashboard:read', 'voters:crud', 'demands:crud',
    'events:read', 'surveys:apply', 'leaders:read',
  ],
  cabo_eleitoral: [
    'dashboard:read', 'voters:create', 'voters:read',
    'demands:create', 'events:read', 'surveys:apply',
  ],
  assessor_financeiro: [
    'dashboard:read', 'finances:*', 'materials:read',
    'reports:read',
  ],
  assessor_comunicacao: [
    'dashboard:read', 'content:*', 'events:read',
  ],
  assessor_demandas: [
    'dashboard:read', 'demands:*', 'voters:read',
  ],
  visualizador: [
    'dashboard:read', 'voters:read', 'leaders:read',
    'demands:read', 'events:read', 'finances:read',
    'materials:read', 'reports:read', 'territory:read',
  ],
} as const;

export function hasPermission(role: string, permission: Permission): boolean {
  const perms = PERMISSIONS[role as Role];
  if (!perms) return false;

  // wildcard total
  if ((perms as readonly string[]).includes('*')) return true;

  // wildcard por módulo (ex: "voters:*")
  const [module] = permission.split(':');
  if ((perms as readonly string[]).includes(`${module}:*`)) return true;

  // permissão exata
  return (perms as readonly string[]).includes(permission);
}

export function canRead(role: string, module: string): boolean {
  return hasPermission(role, `${module}:read`) || hasPermission(role, `${module}:*`);
}

export function canCreate(role: string, module: string): boolean {
  return hasPermission(role, `${module}:create`) || hasPermission(role, `${module}:*`) ||
    hasPermission(role, `${module}:crud`);
}

export function canUpdate(role: string, module: string): boolean {
  return hasPermission(role, `${module}:update`) || hasPermission(role, `${module}:*`) ||
    hasPermission(role, `${module}:crud`);
}

export function canDelete(role: string, module: string): boolean {
  return hasPermission(role, `${module}:delete`) || hasPermission(role, `${module}:*`);
}

export function isAdmin(role: string): boolean {
  return role === 'super_admin' || role === 'admin';
}

export function getModulePermissions(role: string) {
  return {
    voters: {
      read: canRead(role, 'voters'),
      create: canCreate(role, 'voters'),
      update: canUpdate(role, 'voters'),
      delete: canDelete(role, 'voters'),
    },
    leaders: {
      read: canRead(role, 'leaders'),
      create: canCreate(role, 'leaders'),
      update: canUpdate(role, 'leaders'),
      delete: canDelete(role, 'leaders'),
    },
    demands: {
      read: canRead(role, 'demands'),
      create: canCreate(role, 'demands'),
      update: canUpdate(role, 'demands'),
      delete: canDelete(role, 'demands'),
    },
    finances: {
      read: canRead(role, 'finances'),
      create: canCreate(role, 'finances'),
      update: canUpdate(role, 'finances'),
      delete: canDelete(role, 'finances'),
    },
    events: {
      read: canRead(role, 'events'),
      create: canCreate(role, 'events'),
      update: canUpdate(role, 'events'),
      delete: canDelete(role, 'events'),
    },
    content: {
      read: canRead(role, 'content'),
      create: canCreate(role, 'content'),
      update: canUpdate(role, 'content'),
      delete: canDelete(role, 'content'),
    },
    materials: {
      read: canRead(role, 'materials'),
      create: canCreate(role, 'materials'),
      update: canUpdate(role, 'materials'),
      delete: canDelete(role, 'materials'),
    },
    reports: {
      read: canRead(role, 'reports'),
    },
    territory: {
      read: canRead(role, 'territory'),
    },
  };
}
