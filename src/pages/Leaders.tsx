import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Edit, MessageCircle, Star, Target, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCampaign } from "@/contexts/CampaignContext";
import { formatNumber, getInitials } from "@/lib/formatters";
import { cn, whatsAppLink, getAvatarColor, safePct } from "@/lib/utils";
import { toast } from "sonner";

type Leader = {
  id: string; full_name: string; whatsapp: string | null; photo_url: string | null;
  neighborhoods: string[]; vote_goal: number; score: number; active: boolean;
  voterCount?: number;
};

function LeaderModal({
  open, onClose, leader, campaignId, onSaved,
}: { open: boolean; onClose: () => void; leader: Leader | null; campaignId: string; onSaved: () => void }) {
  const [form, setForm] = useState({ full_name: "", whatsapp: "", neighborhoods: "", vote_goal: "0" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (leader) setForm({
      full_name: leader.full_name, whatsapp: leader.whatsapp || "",
      neighborhoods: (leader.neighborhoods || []).join(", "), vote_goal: String(leader.vote_goal || 0),
    });
    else setForm({ full_name: "", whatsapp: "", neighborhoods: "", vote_goal: "0" });
  }, [leader, open]);

  const handleSave = async () => {
    if (!form.full_name.trim()) { toast.error("Nome obrigatório"); return; }
    setSaving(true);
    const payload = {
      full_name: form.full_name, whatsapp: form.whatsapp,
      neighborhoods: form.neighborhoods.split(",").map(s => s.trim()).filter(Boolean),
      vote_goal: parseInt(form.vote_goal) || 0, campaign_id: campaignId,
    };
    const { error } = leader
      ? await supabase.from("leaders").update(payload).eq("id", leader.id)
      : await supabase.from("leaders").insert(payload);
    if (error) toast.error("Erro ao salvar: " + error.message);
    else { toast.success("Salvo!"); onSaved(); onClose(); }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{leader ? "Editar Liderança" : "Nova Liderança"}</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-4">
          <div><Label>Nome Completo *</Label>
            <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} /></div>
          <div><Label>WhatsApp</Label>
            <Input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="(83) 99999-9999" /></div>
          <div><Label>Bairros de Atuação</Label>
            <Input value={form.neighborhoods} onChange={e => setForm(f => ({ ...f, neighborhoods: e.target.value }))} placeholder="Manaíra, Tambaú, Bancários" />
            <p className="text-xs text-slate-400 mt-1">Separe os bairros por vírgula</p>
          </div>
          <div><Label>Meta de Votos</Label>
            <Input type="number" value={form.vote_goal} onChange={e => setForm(f => ({ ...f, vote_goal: e.target.value }))} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Leaders() {
  const { campaign } = useCampaign();
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Leader | null>(null);

  const fetchLeaders = useCallback(async () => {
    if (!campaign?.id) return;
    setLoading(true);
    const { data, error } = await supabase.from("leaders").select("*")
      .eq("campaign_id", campaign.id).eq("active", true).order("score", { ascending: false });
    if (error) { setLoading(false); return; }
    const leaderList = data as Leader[];

    // Fetch voter counts per leader
    if (leaderList.length) {
      const ids = leaderList.map(l => l.id);
      const { data: voterData } = await supabase.from("voters").select("leader_id")
        .eq("campaign_id", campaign.id).in("leader_id", ids);
      const counts: Record<string, number> = {};
      (voterData || []).forEach(v => { if (v.leader_id) counts[v.leader_id] = (counts[v.leader_id] || 0) + 1; });
      setLeaders(leaderList.map(l => ({ ...l, voterCount: counts[l.id] || 0 })));
    } else setLeaders([]);
    setLoading(false);
  }, [campaign?.id]);

  useEffect(() => { fetchLeaders(); }, [fetchLeaders]);

  const medalColor = (i: number) =>
    i === 0 ? "bg-yellow-400 text-yellow-900 border-yellow-500" :
    i === 1 ? "bg-slate-300 text-slate-700 border-slate-400" :
    i === 2 ? "bg-orange-300 text-orange-900 border-orange-400" :
    "bg-slate-100 text-slate-600 border-slate-200";

  if (!campaign) return <div className="p-8 text-center text-slate-400">Selecione uma campanha.</div>;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Lideranças</h1>
          <p className="text-sm text-slate-500">{leaders.length} lideranças ativas</p>
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setModalOpen(true); }}>
          <Plus size={14} className="mr-1" /> Nova Liderança
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5 space-y-3">
              {Array.from({ length: 4 }).map((_, j) => <div key={j} className="h-4 bg-slate-100 rounded animate-pulse" />)}
            </CardContent></Card>
          ))}
        </div>
      ) : leaders.length === 0 ? (
        <Card><CardContent className="p-12 text-center">
          <Users size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nenhuma liderança cadastrada</p>
          <p className="text-sm text-slate-400 mt-1">Adicione lideranças para organizar sua rede política.</p>
          <Button className="mt-4" onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus size={14} className="mr-1" /> Cadastrar Liderança
          </Button>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {leaders.map((leader, i) => {
            const pct = safePct(leader.voterCount || 0, leader.vote_goal);
            return (
              <Card key={leader.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0", getAvatarColor(leader.full_name))}>
                          {getInitials(leader.full_name)}
                        </div>
                        <div className={cn("absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold", medalColor(i))}>
                          {i + 1}
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{leader.full_name}</p>
                        {leader.neighborhoods?.length > 0 && (
                          <p className="text-xs text-slate-500 mt-0.5 truncate max-w-36">{leader.neighborhoods.join(", ")}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {leader.whatsapp && (
                        <a href={whatsAppLink(leader.whatsapp)} target="_blank" rel="noreferrer">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600">
                            <MessageCircle size={13} />
                          </Button>
                        </a>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => { setEditing(leader); setModalOpen(true); }}>
                        <Edit size={13} />
                      </Button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-2 bg-slate-50 rounded-lg">
                      <p className="text-lg font-bold text-blue-600">{formatNumber(leader.voterCount || 0)}</p>
                      <p className="text-[10px] text-slate-500">Eleitores</p>
                    </div>
                    <div className="text-center p-2 bg-slate-50 rounded-lg">
                      <p className="text-lg font-bold text-slate-700">{formatNumber(leader.vote_goal)}</p>
                      <p className="text-[10px] text-slate-500">Meta</p>
                    </div>
                    <div className="text-center p-2 bg-yellow-50 rounded-lg">
                      <p className="text-lg font-bold text-yellow-600">{leader.score}</p>
                      <p className="text-[10px] text-slate-500 flex items-center justify-center gap-0.5"><Star size={8} />pts</p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span className="flex items-center gap-1"><Target size={10} /> Meta de eleitores</span>
                      <span className="font-medium text-blue-600">{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <LeaderModal open={modalOpen} onClose={() => setModalOpen(false)}
        leader={editing} campaignId={campaign.id} onSaved={fetchLeaders} />
    </div>
  );
}
