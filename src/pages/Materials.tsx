import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Package, AlertTriangle, Edit } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useCampaign } from "@/contexts/CampaignContext";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { safePct } from "@/lib/utils";
import { toast } from "sonner";

type Material = { id: string; name: string; quantity_produced: number; unit_cost: number; quantity_distributed: number };

function MaterialModal({ open, onClose, material, campaignId, onSaved }: {
  open: boolean; onClose: () => void; material: Material | null; campaignId: string; onSaved: () => void;
}) {
  const [form, setForm] = useState({ name: "", quantity_produced: "0", unit_cost: "0", quantity_distributed: "0" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (material) setForm({ name: material.name, quantity_produced: String(material.quantity_produced), unit_cost: String(material.unit_cost), quantity_distributed: String(material.quantity_distributed) });
    else setForm({ name: "", quantity_produced: "0", unit_cost: "0", quantity_distributed: "0" });
  }, [material, open]);

  const handleSave = async () => {
    if (!form.name) { toast.error("Nome obrigatório"); return; }
    setSaving(true);
    const payload = { name: form.name, quantity_produced: parseInt(form.quantity_produced), unit_cost: parseFloat(form.unit_cost), quantity_distributed: parseInt(form.quantity_distributed), campaign_id: campaignId };
    const { error } = material ? await supabase.from("materials").update(payload).eq("id", material.id) : await supabase.from("materials").insert(payload);
    if (error) toast.error("Erro: " + error.message);
    else { toast.success("Salvo!"); onSaved(); onClose(); }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{material ? "Editar Material" : "Novo Material"}</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-4">
          <div><Label>Nome do Material *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Santinho A4" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Qtd. Produzida</Label><Input type="number" value={form.quantity_produced} onChange={e => setForm(f => ({ ...f, quantity_produced: e.target.value }))} /></div>
            <div><Label>Custo Unitário (R$)</Label><Input type="number" step="0.01" value={form.unit_cost} onChange={e => setForm(f => ({ ...f, unit_cost: e.target.value }))} /></div>
          </div>
          <div><Label>Qtd. Distribuída</Label><Input type="number" value={form.quantity_distributed} onChange={e => setForm(f => ({ ...f, quantity_distributed: e.target.value }))} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Materials() {
  const { campaign } = useCampaign();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);

  const fetchMaterials = useCallback(async () => {
    if (!campaign?.id) return;
    setLoading(true);
    const { data, error } = await supabase.from("materials").select("*").eq("campaign_id", campaign.id).order("name");
    if (!error) setMaterials(data as Material[] || []);
    setLoading(false);
  }, [campaign?.id]);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  const chartData = materials.map(m => ({
    name: m.name.length > 12 ? m.name.slice(0, 12) + "…" : m.name,
    Produzido: m.quantity_produced, Distribuído: m.quantity_distributed,
    Estoque: Math.max(0, m.quantity_produced - m.quantity_distributed),
  }));

  if (!campaign) return <div className="p-8 text-center text-slate-400">Selecione uma campanha.</div>;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Controle de Materiais</h1>
          <p className="text-sm text-slate-500">{materials.length} itens cadastrados</p>
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setModalOpen(true); }}>
          <Plus size={14} className="mr-1" /> Novo Material
        </Button>
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">Produção vs Distribuição</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Produzido" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Distribuído" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Estoque" fill="#d97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="p-5"><div className="h-24 bg-slate-100 rounded animate-pulse" /></CardContent></Card>)}
        </div>
      ) : materials.length === 0 ? (
        <Card><CardContent className="p-12 text-center">
          <Package size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nenhum material cadastrado</p>
          <Button className="mt-4" onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus size={14} className="mr-1" /> Cadastrar Material
          </Button>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {materials.map(m => {
            const stock = Math.max(0, m.quantity_produced - m.quantity_distributed);
            const distPct = safePct(m.quantity_distributed, m.quantity_produced);
            const lowStock = stock > 0 && safePct(stock, m.quantity_produced) < 10;
            const totalCost = m.quantity_produced * m.unit_cost;
            return (
              <Card key={m.id} className={cn("hover:shadow-md transition-shadow", lowStock && "border-orange-200")}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{m.name}</h3>
                      {m.unit_cost > 0 && <p className="text-xs text-slate-500">Custo total: {formatCurrency(totalCost)}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      {lowStock && <AlertTriangle size={14} className="text-orange-500" />}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(m); setModalOpen(true); }}>
                        <Edit size={13} />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[["Produzido", m.quantity_produced, "text-blue-600"],
                      ["Distribuído", m.quantity_distributed, "text-green-600"],
                      ["Estoque", stock, lowStock ? "text-orange-500" : "text-slate-700"]].map(([l, v, c]) => (
                      <div key={l as string} className="text-center p-1.5 bg-slate-50 rounded">
                        <p className={`text-base font-bold ${c}`}>{formatNumber(v as number)}</p>
                        <p className="text-[10px] text-slate-500">{l}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Distribuição</span><span>{distPct}%</span>
                    </div>
                    <Progress value={distPct} className="h-2" />
                  </div>
                  {lowStock && <p className="text-[10px] text-orange-500 mt-2 flex items-center gap-1"><AlertTriangle size={9} />Estoque baixo!</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <MaterialModal open={modalOpen} onClose={() => setModalOpen(false)}
        material={editing} campaignId={campaign.id} onSaved={fetchMaterials} />
    </div>
  );
}
