import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus, Search, Filter, MessageCircle, Edit, Trash2,
  ChevronLeft, ChevronRight, UserPlus, Download,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCampaign } from "@/contexts/CampaignContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate, getInitials } from "@/lib/formatters";
import { VOTER_STATUS, VOTER_ORIGIN, VOTER_GENDER, BRAZIL_STATES } from "@/lib/constants";
import { cn, whatsAppLink, getAvatarColor, debounce } from "@/lib/utils";
import { toast } from "sonner";

type Voter = {
  id: string; full_name: string; whatsapp: string | null; email: string | null;
  neighborhood: string | null; city: string | null; status: string; origin: string;
  gender: string; birth_date: string | null; tags: string[]; notes: string | null;
  consent_given: boolean; created_at: string; leader_id: string | null;
  address: string | null; cep: string | null; state: string | null;
  instagram: string | null;
};

const PAGE_SIZE = 20;

function VoterFormModal({
  open, onClose, voter, campaignId, onSaved,
}: {
  open: boolean; onClose: () => void; voter: Voter | null;
  campaignId: string; onSaved: () => void;
}) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    full_name: "", whatsapp: "", email: "", neighborhood: "", city: "", state: "",
    address: "", cep: "", status: "indeciso", origin: "outro", gender: "nao_informado",
    birth_date: "", notes: "", instagram: "", consent_given: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (voter) {
      setForm({
        full_name: voter.full_name || "", whatsapp: voter.whatsapp || "",
        email: voter.email || "", neighborhood: voter.neighborhood || "",
        city: voter.city || "", state: voter.state || "", address: voter.address || "",
        cep: voter.cep || "", status: voter.status || "indeciso",
        origin: voter.origin || "outro", gender: voter.gender || "nao_informado",
        birth_date: voter.birth_date || "", notes: voter.notes || "",
        instagram: voter.instagram || "", consent_given: voter.consent_given || false,
      });
    } else {
      setForm({
        full_name: "", whatsapp: "", email: "", neighborhood: "", city: "", state: "",
        address: "", cep: "", status: "indeciso", origin: "outro", gender: "nao_informado",
        birth_date: "", notes: "", instagram: "", consent_given: false,
      });
    }
  }, [voter, open]);

  const handleSave = async () => {
    if (!form.full_name.trim()) { toast.error("Nome obrigatório"); return; }
    if (!form.consent_given) { toast.error("Consentimento LGPD obrigatório"); return; }
    setSaving(true);
    const payload = {
      ...form,
      campaign_id: campaignId,
      captured_by: user?.id,
      consent_date: form.consent_given ? new Date().toISOString() : null,
    };
    const { error } = voter
      ? await supabase.from("voters").update(payload).eq("id", voter.id)
      : await supabase.from("voters").insert(payload);
    if (error) { toast.error("Erro ao salvar: " + error.message); }
    else { toast.success(voter ? "Eleitor atualizado!" : "Eleitor cadastrado!"); onSaved(); onClose(); }
    setSaving(false);
  };

  const f = (k: string, v: string | boolean) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{voter ? "Editar Eleitor" : "Cadastrar Novo Eleitor"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="md:col-span-2">
            <Label>Nome Completo *</Label>
            <Input value={form.full_name} onChange={e => f("full_name", e.target.value)} placeholder="Nome completo" />
          </div>
          <div>
            <Label>WhatsApp</Label>
            <Input value={form.whatsapp} onChange={e => f("whatsapp", e.target.value)} placeholder="(83) 99999-9999" />
          </div>
          <div>
            <Label>Instagram</Label>
            <Input value={form.instagram} onChange={e => f("instagram", e.target.value)} placeholder="@usuario" />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={e => f("email", e.target.value)} />
          </div>
          <div>
            <Label>Data de Nascimento</Label>
            <Input type="date" value={form.birth_date} onChange={e => f("birth_date", e.target.value)} />
          </div>
          <div>
            <Label>Gênero</Label>
            <Select value={form.gender} onValueChange={v => f("gender", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(VOTER_GENDER).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status Eleitoral</Label>
            <Select value={form.status} onValueChange={v => f("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(VOTER_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Origem</Label>
            <Select value={form.origin} onValueChange={v => f("origin", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(VOTER_ORIGIN).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Bairro</Label>
            <Input value={form.neighborhood} onChange={e => f("neighborhood", e.target.value)} placeholder="Bairro" />
          </div>
          <div>
            <Label>Cidade</Label>
            <Input value={form.city} onChange={e => f("city", e.target.value)} />
          </div>
          <div>
            <Label>Estado</Label>
            <Select value={form.state} onValueChange={v => f("state", v)}>
              <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
              <SelectContent>
                {BRAZIL_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>CEP</Label>
            <Input value={form.cep} onChange={e => f("cep", e.target.value)} placeholder="58000-000" />
          </div>
          <div className="md:col-span-2">
            <Label>Endereço</Label>
            <Input value={form.address} onChange={e => f("address", e.target.value)} placeholder="Rua, número, complemento" />
          </div>
          <div className="md:col-span-2">
            <Label>Observações</Label>
            <Textarea value={form.notes} onChange={e => f("notes", e.target.value)} rows={3} placeholder="Informações adicionais..." />
          </div>
          <div className="md:col-span-2 flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Checkbox
              id="consent" checked={form.consent_given}
              onCheckedChange={v => f("consent_given", !!v)}
            />
            <Label htmlFor="consent" className="text-sm text-blue-800 cursor-pointer">
              O eleitor autoriza o uso de seus dados para fins eleitorais (LGPD) *
            </Label>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : voter ? "Salvar" : "Cadastrar"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Voters() {
  const { campaign } = useCampaign();
  const [voters, setVoters] = useState<Voter[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVoter, setEditingVoter] = useState<Voter | null>(null);

  const fetchVoters = useCallback(async () => {
    if (!campaign?.id) return;
    setLoading(true);
    let q = supabase.from("voters").select("*", { count: "exact" })
      .eq("campaign_id", campaign.id)
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    if (search.trim()) q = q.ilike("full_name", `%${search}%`);
    const { data, count, error } = await q;
    if (!error) { setVoters(data as Voter[] || []); setTotal(count || 0); }
    setLoading(false);
  }, [campaign?.id, page, search, statusFilter]);

  useEffect(() => { fetchVoters(); }, [fetchVoters]);

  const debouncedSearch = useCallback(debounce((v: unknown) => { setSearch(v as string); setPage(0); }, 400), []);

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este eleitor?")) return;
    const { error } = await supabase.from("voters").delete().eq("id", id);
    if (error) toast.error("Erro ao remover");
    else { toast.success("Eleitor removido"); fetchVoters(); }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (!campaign) {
    return <div className="p-8 text-center text-slate-400">Selecione uma campanha para ver os eleitores.</div>;
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">CRM Eleitoral</h1>
          <p className="text-sm text-slate-500">{total} eleitores cadastrados</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline"><Download size={14} className="mr-1" /> Exportar</Button>
          <Button size="sm" onClick={() => { setEditingVoter(null); setModalOpen(true); }}>
            <UserPlus size={14} className="mr-1" /> Cadastrar Eleitor
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-52">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input className="pl-8 h-9" placeholder="Buscar por nome..." onChange={e => debouncedSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-40 h-9">
            <Filter size={13} className="mr-1 text-slate-400" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(VOTER_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Status summary */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(VOTER_STATUS).map(([k, v]) => (
          <button key={k}
            onClick={() => { setStatusFilter(statusFilter === k ? "all" : k); setPage(0); }}
            className={cn("px-3 py-1 rounded-full text-xs font-medium transition-all border",
              v.color, statusFilter === k ? "ring-2 ring-offset-1 ring-blue-400" : "border-transparent")}>
            {v.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left p-3 font-medium text-slate-600">Nome</th>
                <th className="text-left p-3 font-medium text-slate-600">Contato</th>
                <th className="text-left p-3 font-medium text-slate-600">Bairro</th>
                <th className="text-left p-3 font-medium text-slate-600">Status</th>
                <th className="text-left p-3 font-medium text-slate-600">Origem</th>
                <th className="text-left p-3 font-medium text-slate-600">Cadastro</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="p-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : voters.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-400">Nenhum eleitor encontrado</td></tr>
              ) : voters.map(voter => (
                <tr key={voter.id} className="border-b hover:bg-slate-50 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
                        getAvatarColor(voter.full_name))}>
                        {getInitials(voter.full_name)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{voter.full_name}</p>
                        {voter.instagram && <p className="text-xs text-slate-400">{voter.instagram}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="text-xs space-y-0.5">
                      {voter.whatsapp && <p className="text-slate-700">{voter.whatsapp}</p>}
                      {voter.email && <p className="text-slate-500">{voter.email}</p>}
                    </div>
                  </td>
                  <td className="p-3 text-slate-600 text-sm">{voter.neighborhood || "—"}</td>
                  <td className="p-3">
                    <Badge className={cn("text-xs", VOTER_STATUS[voter.status as keyof typeof VOTER_STATUS]?.color)}>
                      {VOTER_STATUS[voter.status as keyof typeof VOTER_STATUS]?.label || voter.status}
                    </Badge>
                  </td>
                  <td className="p-3 text-xs text-slate-500">
                    {VOTER_ORIGIN[voter.origin as keyof typeof VOTER_ORIGIN] || voter.origin}
                  </td>
                  <td className="p-3 text-xs text-slate-500">{formatDate(voter.created_at)}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {voter.whatsapp && (
                        <a href={whatsAppLink(voter.whatsapp)} target="_blank" rel="noreferrer">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600">
                            <MessageCircle size={13} />
                          </Button>
                        </a>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => { setEditingVoter(voter); setModalOpen(true); }}>
                        <Edit size={13} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500"
                        onClick={() => handleDelete(voter.id)}>
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-xs text-slate-500">
              Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft size={14} />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <VoterFormModal
        open={modalOpen} onClose={() => setModalOpen(false)}
        voter={editingVoter} campaignId={campaign.id} onSaved={fetchVoters}
      />
    </div>
  );
}
