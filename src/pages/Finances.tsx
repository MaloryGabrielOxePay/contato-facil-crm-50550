import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Plus, TrendingDown, TrendingUp, DollarSign, AlertTriangle } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useCampaign } from "@/contexts/CampaignContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, formatDate, formatNumber } from "@/lib/formatters";
import { PAYMENT_METHODS } from "@/lib/constants";
import { cn, safePct } from "@/lib/utils";
import { toast } from "sonner";

type Expense = { id: string; description: string; amount: number; date: string; payment_method: string | null; category_id: string | null };
type Donation = { id: string; donor_name: string; amount: number; date: string; receipt_number: string | null };
type Category = { id: string; name: string; planned_amount: number; type: string };

const CHART_COLORS = ["#2563eb", "#7c3aed", "#059669", "#d97706", "#dc2626", "#0891b2", "#84cc16"];

function ExpenseModal({ open, onClose, campaignId, categories, onSaved }: {
  open: boolean; onClose: () => void; campaignId: string; categories: Category[]; onSaved: () => void;
}) {
  const { user } = useAuth();
  const [form, setForm] = useState({ description: "", amount: "", date: new Date().toISOString().slice(0, 10), payment_method: "PIX", category_id: "" });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.description || !form.amount) { toast.error("Preencha todos os campos"); return; }
    setSaving(true);
    const { error } = await supabase.from("expenses").insert({
      description: form.description, amount: parseFloat(form.amount),
      date: form.date, payment_method: form.payment_method,
      category_id: form.category_id || null,
      campaign_id: campaignId, created_by: user?.id,
    });
    if (error) toast.error("Erro: " + error.message);
    else { toast.success("Gasto registrado!"); onSaved(); onClose(); }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Registrar Gasto</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-4">
          <div><Label>Descrição *</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Valor (R$) *</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
            <div><Label>Data *</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
          </div>
          <div><Label>Forma de Pagamento</Label>
            <Select value={form.payment_method} onValueChange={v => setForm(f => ({ ...f, payment_method: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {categories.filter(c => c.type === "gasto").length > 0 && (
            <div><Label>Categoria</Label>
              <Select value={form.category_id} onValueChange={v => setForm(f => ({ ...f, category_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Sem categoria" /></SelectTrigger>
                <SelectContent>{categories.filter(c => c.type === "gasto").map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Registrar"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DonationModal({ open, onClose, campaignId, onSaved }: {
  open: boolean; onClose: () => void; campaignId: string; onSaved: () => void;
}) {
  const { user } = useAuth();
  const [form, setForm] = useState({ donor_name: "", amount: "", date: new Date().toISOString().slice(0, 10), receipt_number: "" });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.donor_name || !form.amount) { toast.error("Preencha nome e valor"); return; }
    setSaving(true);
    const { error } = await supabase.from("donations").insert({
      donor_name: form.donor_name, amount: parseFloat(form.amount),
      date: form.date, receipt_number: form.receipt_number || null,
      campaign_id: campaignId, created_by: user?.id,
    });
    if (error) toast.error("Erro: " + error.message);
    else { toast.success("Doação registrada!"); onSaved(); onClose(); }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Registrar Doação</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-4">
          <div><Label>Nome do Doador *</Label><Input value={form.donor_name} onChange={e => setForm(f => ({ ...f, donor_name: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Valor (R$) *</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
            <div><Label>Data</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
          </div>
          <div><Label>Número do Recibo</Label><Input value={form.receipt_number} onChange={e => setForm(f => ({ ...f, receipt_number: e.target.value }))} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Registrar"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Finances() {
  const { campaign } = useCampaign();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expenseModal, setExpenseModal] = useState(false);
  const [donationModal, setDonationModal] = useState(false);

  const fetchData = useCallback(async () => {
    if (!campaign?.id) return;
    setLoading(true);
    const [expRes, donRes, catRes] = await Promise.all([
      supabase.from("expenses").select("*").eq("campaign_id", campaign.id).order("date", { ascending: false }),
      supabase.from("donations").select("*").eq("campaign_id", campaign.id).order("date", { ascending: false }),
      supabase.from("budget_categories").select("*").eq("campaign_id", campaign.id),
    ]);
    setExpenses(expRes.data as Expense[] || []);
    setDonations(donRes.data as Donation[] || []);
    setCategories(catRes.data as Category[] || []);
    setLoading(false);
  }, [campaign?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalDonations = donations.reduce((s, d) => s + d.amount, 0);
  const balance = totalDonations - totalExpenses;

  // Category spending
  const categorySpend: Record<string, number> = {};
  expenses.forEach(e => { if (e.category_id) categorySpend[e.category_id] = (categorySpend[e.category_id] || 0) + e.amount; });
  const catData = categories.filter(c => c.type === "gasto").map((c, i) => ({
    name: c.name, gasto: categorySpend[c.id] || 0, planejado: c.planned_amount,
    fill: CHART_COLORS[i % CHART_COLORS.length],
    pct: safePct(categorySpend[c.id] || 0, c.planned_amount),
  }));

  if (!campaign) return <div className="p-8 text-center text-slate-400">Selecione uma campanha.</div>;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Controle Financeiro</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setDonationModal(true)}>
            <TrendingUp size={14} className="mr-1 text-green-600" /> Registrar Doação
          </Button>
          <Button size="sm" onClick={() => setExpenseModal(true)}>
            <TrendingDown size={14} className="mr-1" /> Registrar Gasto
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50"><TrendingUp size={20} className="text-green-600" /></div>
            <div>
              <p className="text-sm text-slate-500">Total Arrecadado</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalDonations)}</p>
              <p className="text-xs text-slate-400">{formatNumber(donations.length)} doações</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-50"><TrendingDown size={20} className="text-red-500" /></div>
            <div>
              <p className="text-sm text-slate-500">Total Gasto</p>
              <p className="text-2xl font-bold text-red-500">{formatCurrency(totalExpenses)}</p>
              <p className="text-xs text-slate-400">{formatNumber(expenses.length)} registros</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className={cn("p-3 rounded-xl", balance >= 0 ? "bg-blue-50" : "bg-orange-50")}>
              <DollarSign size={20} className={balance >= 0 ? "text-blue-600" : "text-orange-500"} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Saldo Atual</p>
              <p className={cn("text-2xl font-bold", balance >= 0 ? "text-blue-600" : "text-orange-500")}>{formatCurrency(balance)}</p>
              <p className="text-xs text-slate-400">{balance >= 0 ? "Positivo" : "Negativo"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget by category */}
      {catData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">Orçamento por Categoria</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {catData.map(c => (
                <div key={c.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{c.name}</span>
                    <span className={cn("font-semibold", c.pct >= 100 ? "text-red-500" : c.pct >= 80 ? "text-orange-500" : "text-slate-600")}>
                      {formatCurrency(c.gasto)} / {formatCurrency(c.planejado)} ({c.pct}%)
                    </span>
                  </div>
                  <Progress value={c.pct} className={cn("h-2", c.pct >= 100 ? "[&>*]:bg-red-500" : c.pct >= 80 ? "[&>*]:bg-orange-400" : "")} />
                  {c.pct >= 80 && (
                    <p className={cn("text-[10px] mt-0.5 flex items-center gap-1", c.pct >= 100 ? "text-red-500" : "text-orange-500")}>
                      <AlertTriangle size={9} />{c.pct >= 100 ? "Orçamento estourado!" : "Atingindo limite (80%)"}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="expenses">
        <TabsList>
          <TabsTrigger value="expenses">Gastos ({formatNumber(expenses.length)})</TabsTrigger>
          <TabsTrigger value="donations">Arrecadação ({formatNumber(donations.length)})</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses">
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-slate-50">
                  <th className="text-left p-3 font-medium text-slate-600">Descrição</th>
                  <th className="text-left p-3 font-medium text-slate-600">Categoria</th>
                  <th className="text-left p-3 font-medium text-slate-600">Data</th>
                  <th className="text-left p-3 font-medium text-slate-600">Pagamento</th>
                  <th className="text-right p-3 font-medium text-slate-600">Valor</th>
                </tr></thead>
                <tbody>
                  {loading ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b">{Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="p-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                    ))}</tr>
                  )) : expenses.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-400">Nenhum gasto registrado</td></tr>
                  ) : expenses.map(e => {
                    const cat = categories.find(c => c.id === e.category_id);
                    return (
                      <tr key={e.id} className="border-b hover:bg-slate-50">
                        <td className="p-3 font-medium text-slate-800">{e.description}</td>
                        <td className="p-3 text-slate-500 text-xs">{cat?.name || "—"}</td>
                        <td className="p-3 text-slate-500 text-xs">{formatDate(e.date)}</td>
                        <td className="p-3"><Badge variant="outline" className="text-[10px]">{e.payment_method || "—"}</Badge></td>
                        <td className="p-3 text-right font-semibold text-red-600">{formatCurrency(e.amount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                {expenses.length > 0 && (
                  <tfoot><tr className="bg-slate-50 font-semibold">
                    <td colSpan={4} className="p-3 text-slate-700">Total</td>
                    <td className="p-3 text-right text-red-600">{formatCurrency(totalExpenses)}</td>
                  </tr></tfoot>
                )}
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="donations">
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-slate-50">
                  <th className="text-left p-3 font-medium text-slate-600">Doador</th>
                  <th className="text-left p-3 font-medium text-slate-600">Data</th>
                  <th className="text-left p-3 font-medium text-slate-600">Recibo</th>
                  <th className="text-right p-3 font-medium text-slate-600">Valor</th>
                </tr></thead>
                <tbody>
                  {loading ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b">{Array.from({ length: 4 }).map((_, j) => (
                      <td key={j} className="p-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                    ))}</tr>
                  )) : donations.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-slate-400">Nenhuma doação registrada</td></tr>
                  ) : donations.map(d => (
                    <tr key={d.id} className="border-b hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-800">{d.donor_name}</td>
                      <td className="p-3 text-slate-500 text-xs">{formatDate(d.date)}</td>
                      <td className="p-3 text-slate-500 text-xs">{d.receipt_number || "—"}</td>
                      <td className="p-3 text-right font-semibold text-green-600">{formatCurrency(d.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                {donations.length > 0 && (
                  <tfoot><tr className="bg-slate-50 font-semibold">
                    <td colSpan={3} className="p-3 text-slate-700">Total Arrecadado</td>
                    <td className="p-3 text-right text-green-600">{formatCurrency(totalDonations)}</td>
                  </tr></tfoot>
                )}
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <ExpenseModal open={expenseModal} onClose={() => setExpenseModal(false)}
        campaignId={campaign.id} categories={categories} onSaved={fetchData} />
      <DonationModal open={donationModal} onClose={() => setDonationModal(false)}
        campaignId={campaign.id} onSaved={fetchData} />
    </div>
  );
}
