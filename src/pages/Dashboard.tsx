import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Users, UserCheck, ClipboardList, DollarSign,
  CalendarDays, TrendingUp, AlertTriangle, Star,
  ArrowUp, ArrowDown, Plus,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useCampaign } from "@/contexts/CampaignContext";
import { formatCurrency, formatDate, formatNumber } from "@/lib/formatters";
import { VOTER_STATUS, EVENT_STATUS } from "@/lib/constants";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const VOTER_COLORS: Record<string, string> = {
  confirmado: "#16a34a", provavel: "#2563eb",
  indeciso: "#d97706", oposicao: "#dc2626", neutro: "#94a3b8",
};

function KPICard({
  title, value, subtitle, icon: Icon, color = "blue", onClick,
}: {
  title: string; value: string | number; subtitle?: string;
  icon: React.ElementType; color?: string; onClick?: () => void;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600", green: "bg-green-50 text-green-600",
    yellow: "bg-yellow-50 text-yellow-600", red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600", indigo: "bg-indigo-50 text-indigo-600",
  };
  return (
    <Card
      className={cn("transition-shadow", onClick && "cursor-pointer hover:shadow-md hover:border-blue-200")}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-slate-500 font-medium">{title}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {typeof value === "number" ? formatNumber(value) : value}
            </p>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <div className={cn("p-2.5 rounded-xl", colors[color])}>
            <Icon size={20} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { campaign } = useCampaign();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalVoters: 0, confirmed: 0, totalLeaders: 0, openDemands: 0,
    urgentDemands: 0, totalExpenses: 0, totalDonations: 0,
    upcomingEvents: [] as { id: string; title: string; start_datetime: string; status: string }[],
    urgentDemandsList: [] as { id: string; requester_name: string; type: string; created_at: string }[],
    topLeaders: [] as { id: string; full_name: string; score: number; vote_goal: number; voterCount: number }[],
    votersByStatus: [] as { name: string; value: number; color: string }[],
    votersTrend: [] as { date: string; total: number }[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!campaign?.id) { setLoading(false); return; }
    fetchStats();
  }, [campaign?.id]);

  async function fetchStats() {
    setLoading(true);
    const cid = campaign!.id;

    const [
      { count: totalVoters },
      votersRes,
      { count: totalLeaders },
      demandsRes,
      expensesRes,
      donationsRes,
      eventsRes,
      leadersRes,
    ] = await Promise.all([
      supabase.from("voters").select("*", { count: "exact", head: true }).eq("campaign_id", cid),
      supabase.from("voters").select("status, created_at").eq("campaign_id", cid),
      supabase.from("leaders").select("*", { count: "exact", head: true }).eq("campaign_id", cid).eq("active", true),
      supabase.from("demands").select("id, requester_name, type, priority, status, created_at").eq("campaign_id", cid),
      supabase.from("expenses").select("amount").eq("campaign_id", cid),
      supabase.from("donations").select("amount").eq("campaign_id", cid),
      supabase.from("events").select("id, title, start_datetime, status")
        .eq("campaign_id", cid).gte("start_datetime", new Date().toISOString())
        .order("start_datetime").limit(5),
      supabase.from("leaders").select("id, full_name, score, vote_goal")
        .eq("campaign_id", cid).eq("active", true).order("score", { ascending: false }).limit(5),
    ]);

    const voters = votersRes.data || [];
    const demands = demandsRes.data || [];

    const byStatus: Record<string, number> = {};
    voters.forEach(v => { byStatus[v.status] = (byStatus[v.status] || 0) + 1; });

    const votersByStatus = Object.entries(VOTER_STATUS)
      .map(([k, v]) => ({ name: v.label, value: byStatus[k] || 0, color: VOTER_COLORS[k] }))
      .filter(x => x.value > 0);

    const now = new Date();
    const trendMap: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      trendMap[d.toISOString().slice(0, 10)] = 0;
    }
    let running = 0;
    [...voters].sort((a, b) => a.created_at > b.created_at ? 1 : -1).forEach(v => {
      running++;
      const day = (v.created_at || "").slice(0, 10);
      if (day in trendMap) trendMap[day] = running;
    });
    let last = 0;
    const votersTrend = Object.entries(trendMap).map(([date, val]) => {
      if (val > 0) last = val; else val = last;
      return { date: date.slice(5), total: val };
    });

    const totalExpenses = (expensesRes.data || []).reduce((s, e) => s + (e.amount || 0), 0);
    const totalDonations = (donationsRes.data || []).reduce((s, d) => s + (d.amount || 0), 0);
    const openDemands = demands.filter(d => d.status === "aberta" || d.status === "em_andamento").length;
    const urgentDemandsList = demands.filter(d => d.priority === "alta" && (d.status === "aberta" || d.status === "em_andamento")).slice(0, 5);

    const leaderIds = (leadersRes.data || []).map(l => l.id);
    const voterCounts: Record<string, number> = {};
    if (leaderIds.length) {
      const { data: lv } = await supabase.from("voters").select("leader_id").eq("campaign_id", cid).in("leader_id", leaderIds);
      (lv || []).forEach(v => { if (v.leader_id) voterCounts[v.leader_id] = (voterCounts[v.leader_id] || 0) + 1; });
    }
    const topLeaders = (leadersRes.data || []).map(l => ({ ...l, voterCount: voterCounts[l.id] || 0 }));

    setStats({
      totalVoters: totalVoters || 0, confirmed: byStatus["confirmado"] || 0,
      totalLeaders: totalLeaders || 0, openDemands,
      urgentDemands: urgentDemandsList.length, totalExpenses, totalDonations,
      upcomingEvents: eventsRes.data || [], urgentDemandsList, topLeaders,
      votersByStatus, votersTrend,
    });
    setLoading(false);
  }

  const voteGoal = campaign?.vote_goal || 0;
  const confirmedPct = voteGoal ? Math.min(100, Math.round((stats.confirmed / voteGoal) * 100)) : 0;

  if (!campaign) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-96 text-center">
        <div className="text-5xl mb-4">🗳️</div>
        <h2 className="text-xl font-semibold text-slate-700">Nenhuma campanha selecionada</h2>
        <p className="text-slate-500 mt-2 mb-6">Crie ou selecione uma campanha para ver o dashboard.</p>
        <Button onClick={() => navigate("/onboarding")}>Criar Campanha</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{campaign.name}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{campaign.city} · {campaign.state} · {campaign.year}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate("/eleitores")}>
            <Plus size={14} className="mr-1" /> Novo Eleitor
          </Button>
          <Button size="sm" onClick={() => navigate("/demandas")}>
            <Plus size={14} className="mr-1" /> Nova Demanda
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <KPICard title="Total de Eleitores" value={stats.totalVoters} icon={Users}
          subtitle={voteGoal ? `Meta: ${formatNumber(voteGoal)}` : undefined}
          color="blue" onClick={() => navigate("/eleitores")} />
        <KPICard title="Confirmados" value={stats.confirmed} icon={UserCheck}
          subtitle={`${confirmedPct}% da meta`} color="green" onClick={() => navigate("/eleitores")} />
        <KPICard title="Lideranças" value={stats.totalLeaders} icon={Star}
          color="purple" onClick={() => navigate("/liderancas")} />
        <KPICard title="Demandas Abertas" value={stats.openDemands} icon={ClipboardList}
          subtitle={stats.urgentDemands > 0 ? `${stats.urgentDemands} urgentes` : undefined}
          color={stats.urgentDemands > 0 ? "red" : "yellow"} onClick={() => navigate("/demandas")} />
        <KPICard title="Saldo Financeiro" value={formatCurrency(stats.totalDonations - stats.totalExpenses)}
          icon={DollarSign} subtitle={`Gastos: ${formatCurrency(stats.totalExpenses)}`}
          color="indigo" onClick={() => navigate("/financeiro")} />
      </div>

      {voteGoal > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <TrendingUp size={16} className="text-blue-600" /> Meta de Votos
              </div>
              <span className="text-sm font-bold text-blue-600">{confirmedPct}% atingido</span>
            </div>
            <Progress value={confirmedPct} className="h-3" />
            <div className="flex justify-between mt-1.5 text-xs text-slate-500">
              <span>{formatNumber(stats.confirmed)} confirmados</span>
              <span>Meta: {formatNumber(voteGoal)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">Eleitores por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.votersByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={stats.votersByStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                    {stats.votersByStatus.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatNumber(v)} />
                  <Legend iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Nenhum eleitor cadastrado</div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">Evolução de Eleitores (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats.votersTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v: number) => formatNumber(v)} />
                <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} dot={false} name="Eleitores" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <CalendarDays size={14} className="text-blue-600" /> Próximos Eventos
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-blue-600 h-6 px-2" onClick={() => navigate("/agenda")}>Ver todos</Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.upcomingEvents.length === 0
              ? <p className="text-xs text-slate-400 text-center py-4">Nenhum evento próximo</p>
              : stats.upcomingEvents.map(ev => (
                <div key={ev.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                  <CalendarDays size={13} className="text-blue-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">{ev.title}</p>
                    <p className="text-[10px] text-slate-500">{formatDate(ev.start_datetime)}</p>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px] shrink-0 px-1.5",
                    EVENT_STATUS[ev.status as keyof typeof EVENT_STATUS]?.color)}>
                    {EVENT_STATUS[ev.status as keyof typeof EVENT_STATUS]?.label || ev.status}
                  </Badge>
                </div>
              ))
            }
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-500" /> Demandas Urgentes
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-blue-600 h-6 px-2" onClick={() => navigate("/demandas")}>Ver todas</Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.urgentDemandsList.length === 0
              ? <p className="text-xs text-slate-400 text-center py-4">Sem demandas urgentes</p>
              : stats.urgentDemandsList.map(d => (
                <div key={d.id} className="flex items-start gap-2 p-2 rounded-lg bg-red-50">
                  <AlertTriangle size={13} className="text-red-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">{d.requester_name}</p>
                    <p className="text-[10px] text-slate-500 capitalize">{d.type} · {formatDate(d.created_at)}</p>
                  </div>
                </div>
              ))
            }
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Star size={14} className="text-yellow-500" /> Top Lideranças
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-blue-600 h-6 px-2" onClick={() => navigate("/liderancas")}>Ver todas</Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.topLeaders.length === 0
              ? <p className="text-xs text-slate-400 text-center py-4">Nenhuma liderança cadastrada</p>
              : stats.topLeaders.map((l, i) => (
                <div key={l.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
                  <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    i === 0 ? "bg-yellow-400 text-yellow-900" : i === 1 ? "bg-slate-300 text-slate-700" : i === 2 ? "bg-orange-300 text-orange-900" : "bg-slate-100 text-slate-600")}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">{l.full_name}</p>
                    <p className="text-[10px] text-slate-500">{l.voterCount} eleitores</p>
                  </div>
                  <span className="text-xs font-bold text-blue-600">{l.score}pts</span>
                </div>
              ))
            }
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
