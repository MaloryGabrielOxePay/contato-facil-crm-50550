import {
  LayoutDashboard,
  Users,
  UserCheck,
  ClipboardList,
  DollarSign,
  CalendarDays,
  Package,
  Map,
  Megaphone,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Swords,
  Settings,
  Vote,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const navMain = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Eleitores (CRM)", url: "/eleitores", icon: Users },
  { title: "Lideranças", url: "/liderancas", icon: UserCheck },
  { title: "Demandas", url: "/demandas", icon: ClipboardList },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign },
  { title: "Agenda", url: "/agenda", icon: CalendarDays },
  { title: "Materiais", url: "/materiais", icon: Package },
];

const navGrowth = [
  { title: "Território", url: "/territorio", icon: Map },
  { title: "Editorial", url: "/editorial", icon: Megaphone },
  { title: "Pesquisas", url: "/pesquisas", icon: BarChart2 },
  { title: "Adversários", url: "/adversarios", icon: Swords },
  { title: "Documentos", url: "/documentos", icon: FileText },
  { title: "Relatórios", url: "/relatorios", icon: BarChart2 },
];

const navBottom = [
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const { state, setOpen } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/dashboard" && (location.pathname === "/" || location.pathname === "/dashboard")) return true;
    if (path !== "/dashboard" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navCls = (path: string) =>
    cn(
      "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 text-sm font-medium w-full",
      isActive(path)
        ? "bg-blue-600 text-white shadow-sm"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    );

  const NavItem = ({ item }: { item: { title: string; url: string; icon: React.ElementType } }) => (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <NavLink to={item.url} className={navCls(item.url)} title={collapsed ? item.title : undefined}>
          <item.icon size={18} className="shrink-0" />
          {!collapsed && <span>{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar className={cn("border-r bg-white flex flex-col", collapsed ? "w-16" : "w-64")} collapsible="icon">
      {/* Brand */}
      <div className={cn("flex items-center border-b p-4 h-16", collapsed ? "justify-center" : "justify-between")}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <Vote size={16} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 leading-tight">GPD</div>
              <div className="text-[10px] text-slate-500 leading-tight">Gestor Político Digital</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Vote size={16} className="text-white" />
          </div>
        )}
        {!collapsed && (
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-md hover:bg-slate-100 text-slate-400"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          onClick={() => setOpen(true)}
          className="mx-auto mt-2 p-1 rounded-md hover:bg-slate-100 text-slate-400"
        >
          <ChevronRight size={16} />
        </button>
      )}

      <SidebarContent className="flex-1 overflow-y-auto py-3 px-2">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="px-1 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Principal
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {navMain.map((item) => <NavItem key={item.url} item={item} />)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          {!collapsed && (
            <SidebarGroupLabel className="px-1 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Estratégia
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {navGrowth.map((item) => <NavItem key={item.url} item={item} />)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Bottom */}
      <div className="border-t p-2">
        <SidebarMenu>
          {navBottom.map((item) => <NavItem key={item.url} item={item} />)}
        </SidebarMenu>
      </div>
    </Sidebar>
  );
}
