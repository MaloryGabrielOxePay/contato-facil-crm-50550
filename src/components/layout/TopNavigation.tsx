import { Bell, ChevronDown, LogOut, Settings, User, Vote } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCampaign } from "@/contexts/CampaignContext";
import { getInitials } from "@/lib/formatters";

export function TopNavigation() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { campaign, campaigns, setActiveCampaign } = useCampaign();

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Usuário";

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <header className="h-16 bg-white border-b px-6 flex items-center justify-between shrink-0">
      {/* Campaign Selector */}
      <div className="flex items-center gap-3">
        {campaigns.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 max-w-xs">
                <Vote size={14} className="text-blue-600 shrink-0" />
                <span className="truncate font-medium text-sm">
                  {campaign?.name ?? "Selecionar campanha"}
                </span>
                <ChevronDown size={14} className="shrink-0 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
              {campaigns.map((c) => (
                <DropdownMenuItem
                  key={c.id}
                  onClick={() => setActiveCampaign(c)}
                  className={campaign?.id === c.id ? "bg-blue-50 text-blue-700" : ""}
                >
                  <div>
                    <div className="font-medium text-sm">{c.name}</div>
                    <div className="text-xs text-slate-500">{c.city} - {c.state} · {c.year}</div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <span className="text-sm text-slate-500">Nenhuma campanha</span>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Bell size={18} className="text-slate-500" />
          </Button>
          <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center p-0 text-[10px] bg-red-500 border-white border">
            3
          </Badge>
        </div>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 h-9 px-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-blue-600 text-white text-xs font-semibold">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden md:block">
                <div className="text-xs font-semibold text-slate-800 leading-tight">{displayName}</div>
                <div className="text-[10px] text-slate-400 leading-tight">{user?.email}</div>
              </div>
              <ChevronDown size={14} className="text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => navigate("/configuracoes")}>
              <User className="mr-2 h-4 w-4" />
              Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/configuracoes")}>
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
