import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useCampaign } from "@/contexts/CampaignContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CAMPAIGN_MODE, CAMPAIGN_OFFICE } from "@/lib/constants";
import { formatDate } from "@/lib/formatters";
import { User, Building2, Vote, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getInitials, getAvatarColor } from "@/lib/utils";

export default function Settings() {
  const { user, profile, signOut } = useAuth();
  const { organization } = useOrganization();
  const { campaign } = useCampaign();
  const navigate = useNavigate();

  const displayName = profile?.full_name || user?.email || "Usuário";

  const handleSignOut = async () => { await signOut(); navigate("/login"); };

  return (
    <div className="p-6 space-y-5 max-w-2xl">
      <h1 className="text-xl font-bold text-slate-900">Configurações</h1>

      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold flex items-center gap-2"><User size={15} />Meu Perfil</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${getAvatarColor(displayName)}`}>
              {getInitials(displayName)}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{displayName}</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-slate-500">Cadastrado em:</span> <span className="font-medium">{formatDate(user?.created_at || "")}</span></div>
          </div>
        </CardContent>
      </Card>

      {organization && (
        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold flex items-center gap-2"><Building2 size={15} />Organização</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Nome:</span>
              <span className="font-medium">{organization.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Slug:</span>
              <code className="text-xs bg-slate-100 px-2 py-0.5 rounded">{organization.slug}</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Plano:</span>
              <Badge variant="outline" className="capitalize">{organization.plan}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {campaign && (
        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold flex items-center gap-2"><Vote size={15} />Campanha Ativa</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Campanha:</span>
              <span className="font-medium">{campaign.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Cargo:</span>
              <span className="font-medium">{CAMPAIGN_OFFICE[campaign.office as keyof typeof CAMPAIGN_OFFICE] || campaign.office}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Localidade:</span>
              <span className="font-medium">{campaign.city} - {campaign.state}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Fase:</span>
              <Badge variant="outline">{CAMPAIGN_MODE[campaign.mode as keyof typeof CAMPAIGN_MODE] || campaign.mode}</Badge>
            </div>
            {campaign.vote_goal && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Meta de votos:</span>
                <span className="font-semibold text-blue-600">{campaign.vote_goal.toLocaleString("pt-BR")}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-red-100">
        <CardContent className="p-5">
          <Button variant="destructive" className="w-full" onClick={handleSignOut}>
            <LogOut size={14} className="mr-2" /> Sair da conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
