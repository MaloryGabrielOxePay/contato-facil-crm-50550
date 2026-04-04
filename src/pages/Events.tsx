import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, CalendarDays, MapPin, Clock, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCampaign } from "@/contexts/CampaignContext";
import { formatDateTime, formatDate } from "@/lib/formatters";
import { EVENT_STATUS, EVENT_TYPE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Event = {
  id: string; title: string; type: string; start_datetime: string;
  end_datetime: string | null; location_text: string | null;
  status: string; notes: string | null;
};

function EventModal({ open, onClose, event, campaignId, onSaved }: {
  open: boolean; onClose: () => void; event: Event | null; campaignId: string; onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: "", type: "outro", start_datetime: "", end_datetime: "",
    location_text: "", status: "planejado", notes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (event) setForm({
      title: event.title, type: event.type, status: event.status,
      start_datetime: event.start_datetime?.slice(0, 16) || "",
      end_datetime: event.end_datetime?.slice(0, 16) || "",
      location_text: event.location_text || "", notes: event.notes || "",
    });
    else {
      const now = new Date(); now.setMinutes(0, 0, 0);
      setForm({ title: "", type: "outro", start_datetime: now.toISOString().slice(0, 16), end_datetime: "", location_text: "", status: "planejado", notes: "" });
    }
  }, [event, open]);

  const handleSave = async () => {
    if (!form.title || !form.start_datetime) { toast.error("Título e data de início são obrigatórios"); return; }
    setSaving(true);
    const payload = { ...form, campaign_id: campaignId, end_datetime: form.end_datetime || null, location_text: form.location_text || null, notes: form.notes || null };
    const { error } = event ? await supabase.from("events").update(payload).eq("id", event.id) : await supabase.from("events").insert(payload);
    if (error) toast.error("Erro: " + error.message);
    else { toast.success("Evento salvo!"); onSaved(); onClose(); }
    setSaving(false);
  };

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{event ? "Editar Evento" : "Novo Evento"}</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-4">
          <div><Label>Título *</Label><Input value={form.title} onChange={e => f("title", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Tipo</Label>
              <Select value={form.type} onValueChange={v => f("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(EVENT_TYPE).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={v => f("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(EVENT_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Início *</Label><Input type="datetime-local" value={form.start_datetime} onChange={e => f("start_datetime", e.target.value)} /></div>
            <div><Label>Fim</Label><Input type="datetime-local" value={form.end_datetime} onChange={e => f("end_datetime", e.target.value)} /></div>
          </div>
          <div><Label>Local</Label><Input value={form.location_text} onChange={e => f("location_text", e.target.value)} placeholder="Endereço ou local do evento" /></div>
          <div><Label>Observações</Label><Textarea value={form.notes} onChange={e => f("notes", e.target.value)} rows={3} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Events() {
  const { campaign } = useCampaign();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!campaign?.id) return;
    setLoading(true);
    let q = supabase.from("events").select("*").eq("campaign_id", campaign.id).order("start_datetime", { ascending: true });
    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    const { data, error } = await q;
    if (!error) setEvents(data as Event[] || []);
    setLoading(false);
  }, [campaign?.id, statusFilter]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este evento?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) toast.error("Erro ao remover");
    else { toast.success("Evento removido"); fetchEvents(); }
  };

  const upcoming = events.filter(e => new Date(e.start_datetime) >= new Date() && e.status !== "cancelado");
  const past = events.filter(e => new Date(e.start_datetime) < new Date() || e.status === "realizado" || e.status === "cancelado");

  const EventCard = ({ ev }: { ev: Event }) => {
    const statusInfo = EVENT_STATUS[ev.status as keyof typeof EVENT_STATUS];
    const typeLabel = EVENT_TYPE[ev.type as keyof typeof EVENT_TYPE] || ev.type;
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px]">{typeLabel}</Badge>
                <Badge className={cn("text-[10px]", statusInfo?.color)}>{statusInfo?.label || ev.status}</Badge>
              </div>
              <h3 className="font-semibold text-slate-900 text-sm truncate">{ev.title}</h3>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Clock size={10} />{formatDateTime(ev.start_datetime)}</span>
                {ev.location_text && <span className="flex items-center gap-1 truncate"><MapPin size={10} />{ev.location_text}</span>}
              </div>
              {ev.notes && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{ev.notes}</p>}
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(ev); setModalOpen(true); }}>
                <Edit size={13} />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDelete(ev.id)}>
                <Trash2 size={13} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!campaign) return <div className="p-8 text-center text-slate-400">Selecione uma campanha.</div>;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Agenda e Eventos</h1>
          <p className="text-sm text-slate-500">{events.length} evento(s)</p>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(EVENT_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus size={14} className="mr-1" /> Novo Evento
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Card key={i}><CardContent className="p-4"><div className="h-16 bg-slate-100 rounded animate-pulse" /></CardContent></Card>)}
        </div>
      ) : events.length === 0 ? (
        <Card><CardContent className="p-12 text-center">
          <CalendarDays size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nenhum evento cadastrado</p>
          <Button className="mt-4" onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus size={14} className="mr-1" /> Criar Evento
          </Button>
        </CardContent></Card>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" /> Próximos ({upcoming.length})
              </h2>
              <div className="space-y-2">
                {upcoming.map(ev => <EventCard key={ev.id} ev={ev} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-500 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-400" /> Passados ({past.length})
              </h2>
              <div className="space-y-2 opacity-75">
                {past.map(ev => <EventCard key={ev.id} ev={ev} />)}
              </div>
            </div>
          )}
        </div>
      )}

      <EventModal open={modalOpen} onClose={() => setModalOpen(false)}
        event={editing} campaignId={campaign.id} onSaved={fetchEvents} />
    </div>
  );
}
