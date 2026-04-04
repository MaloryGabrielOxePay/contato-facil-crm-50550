import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, AlertTriangle, Clock, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCampaign } from "@/contexts/CampaignContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/lib/formatters";
import { DEMAND_STATUS, DEMAND_PRIORITY, DEMAND_TYPE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Demand = {
  id: string; requester_name: string; type: string; description: string;
  priority: string; status: string; deadline: string | null; created_at: string;
  voter_id: string | null; assigned_to: string | null; target_agency: string | null;
};

const COLUMNS: { key: string; label: string }[] = [
  { key: "aberta", label: "Aberta" },
  { key: "em_andamento", label: "Em Andamento" },
  { key: "resolvida", label: "Resolvida" },
  { key: "cancelada", label: "Cancelada" },
];

function DemandModal({
  open, onClose, campaignId, onSaved,
}: { open: boolean; onClose: () => void; campaignId: string; onSaved: () => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    requester_name: "", type: "outro", description: "", priority: "media",
    status: "aberta", deadline: "", target_agency: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm({ requester_name: "", type: "outro", description: "", priority: "media", status: "aberta", deadline: "", target_agency: "" });
  }, [open]);

  const handleSave = async () => {
    if (!form.requester_name.trim() || !form.description.trim()) { toast.error("Preencha nome e descrição"); return; }
    setSaving(true);
    const { error } = await supabase.from("demands").insert({
      ...form, campaign_id: campaignId, created_by: user?.id,
      deadline: form.deadline || null, target_agency: form.target_agency || null,
    });
    if (error) toast.error("Erro: " + error.message);
    else { toast.success("Demanda criada!"); onSaved(); onClose(); }
    setSaving(false);
  };

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Nova Demanda</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-4">
          <div><Label>Nome do Solicitante *</Label>
            <Input value={form.requester_name} onChange={e => f("requester_name", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Tipo</Label>
              <Select value={form.type} onValueChange={v => f("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(DEMAND_TYPE).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Prioridade</Label>
              <Select value={form.priority} onValueChange={v => f("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(DEMAND_PRIORITY).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Descrição *</Label>
            <Textarea value={form.description} onChange={e => f("description", e.target.value)} rows={3} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Prazo</Label>
              <Input type="date" value={form.deadline} onChange={e => f("deadline", e.target.value)} /></div>
            <div><Label>Órgão Responsável</Label>
              <Input value={form.target_agency} onChange={e => f("target_agency", e.target.value)} placeholder="Ex: Prefeitura" /></div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Criando..." : "Criar Demanda"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DemandCard({ demand, onStatusChange }: { demand: Demand; onStatusChange: (id: string, status: string) => void }) {
  const isOverdue = demand.deadline && new Date(demand.deadline) < new Date() && demand.status !== "resolvida";
  return (
    <div className={cn("bg-white rounded-lg border p-3 shadow-sm hover:shadow-md transition-shadow",
      isOverdue && "border-l-2 border-l-red-400")}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="font-medium text-sm text-slate-900 leading-snug">{demand.requester_name}</p>
        <Badge className={cn("text-[10px] shrink-0", DEMAND_PRIORITY[demand.priority as keyof typeof DEMAND_PRIORITY]?.color)}>
          {DEMAND_PRIORITY[demand.priority as keyof typeof DEMAND_PRIORITY]?.label || demand.priority}
        </Badge>
      </div>
      <p className="text-xs text-slate-500 mb-2 line-clamp-2">{demand.description}</p>
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-[10px] capitalize">{DEMAND_TYPE[demand.type as keyof typeof DEMAND_TYPE] || demand.type}</Badge>
        {demand.deadline && (
          <span className={cn("flex items-center gap-0.5 text-[10px]", isOverdue ? "text-red-500" : "text-slate-400")}>
            {isOverdue && <AlertTriangle size={9} />}
            <Clock size={9} />{formatDate(demand.deadline)}
          </span>
        )}
      </div>
      <div className="mt-2 pt-2 border-t">
        <Select value={demand.status} onValueChange={v => onStatusChange(demand.id, v)}>
          <SelectTrigger className="h-6 text-[11px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {COLUMNS.map(c => <SelectItem key={c.key} value={c.key} className="text-xs">{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default function Demands() {
  const { campaign } = useCampaign();
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState("all");

  const fetchDemands = useCallback(async () => {
    if (!campaign?.id) return;
    setLoading(true);
    let q = supabase.from("demands").select("*").eq("campaign_id", campaign.id).order("created_at", { ascending: false });
    if (priorityFilter !== "all") q = q.eq("priority", priorityFilter);
    const { data, error } = await q;
    if (!error) setDemands(data as Demand[] || []);
    setLoading(false);
  }, [campaign?.id, priorityFilter]);

  useEffect(() => { fetchDemands(); }, [fetchDemands]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("demands").update({
      status,
      resolved_at: status === "resolvida" ? new Date().toISOString() : null,
    }).eq("id", id);
    if (error) toast.error("Erro ao atualizar");
    else {
      setDemands(prev => prev.map(d => d.id === id ? { ...d, status } : d));
      toast.success("Status atualizado");
    }
  };

  if (!campaign) return <div className="p-8 text-center text-slate-400">Selecione uma campanha.</div>;

  const byStatus = COLUMNS.reduce((acc, col) => {
    acc[col.key] = demands.filter(d => d.status === col.key);
    return acc;
  }, {} as Record<string, Demand[]>);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Demandas</h1>
          <p className="text-sm text-slate-500">{demands.length} demandas no total</p>
        </div>
        <div className="flex gap-2">
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Prioridade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(DEMAND_PRIORITY).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus size={14} className="mr-1" /> Nova Demanda
          </Button>
        </div>
      </div>

      {/* Summary badges */}
      <div className="flex gap-3 flex-wrap">
        {COLUMNS.map(col => (
          <div key={col.key} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium", DEMAND_STATUS[col.key as keyof typeof DEMAND_STATUS]?.color)}>
            {col.label}: <span className="font-bold">{byStatus[col.key]?.length || 0}</span>
          </div>
        ))}
      </div>

      {/* Kanban */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map(col => (
            <div key={col.key} className="bg-slate-50 rounded-xl p-3 space-y-2">
              <div className="h-5 bg-slate-200 rounded animate-pulse w-24" />
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-slate-200 rounded animate-pulse" />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map(col => (
            <div key={col.key} className={cn("rounded-xl p-3 min-h-96", DEMAND_STATUS[col.key as keyof typeof DEMAND_STATUS]?.kanban, "border bg-slate-50/60")}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-slate-700">{col.label}</h3>
                <Badge variant="outline" className="text-xs">{byStatus[col.key]?.length || 0}</Badge>
              </div>
              <div className="space-y-2">
                {byStatus[col.key]?.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">Nenhuma demanda</p>
                )}
                {byStatus[col.key]?.map(demand => (
                  <DemandCard key={demand.id} demand={demand} onStatusChange={updateStatus} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <DemandModal open={modalOpen} onClose={() => setModalOpen(false)}
        campaignId={campaign.id} onSaved={fetchDemands} />
    </div>
  );
}
