
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  TrendingUp, 
  Users, 
  DollarSign,
  Briefcase,
  Calendar,
  Mail,
  Phone
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

// Mock data
const salesPerformanceData = [
  { month: 'Jan', vendas: 45000, meta: 50000 },
  { month: 'Fev', vendas: 52000, meta: 50000 },
  { month: 'Mar', vendas: 48000, meta: 55000 },
  { month: 'Abr', vendas: 61000, meta: 55000 },
  { month: 'Mai', vendas: 55000, meta: 60000 },
  { month: 'Jun', vendas: 67000, meta: 60000 },
];

const conversionData = [
  { stage: 'Leads', count: 150, percentage: 100 },
  { stage: 'Qualificados', count: 75, percentage: 50 },
  { stage: 'Propostas', count: 45, percentage: 30 },
  { stage: 'Negociações', count: 30, percentage: 20 },
  { stage: 'Fechados', count: 18, percentage: 12 },
];

const sourceData = [
  { name: 'Website', value: 35, color: '#3b82f6' },
  { name: 'LinkedIn', value: 25, color: '#10b981' },
  { name: 'Indicações', value: 20, color: '#f59e0b' },
  { name: 'Eventos', value: 15, color: '#8b5cf6' },
  { name: 'Outros', value: 5, color: '#6b7280' },
];

const teamPerformance = [
  { name: 'João Silva', deals: 12, revenue: 145000, conversion: 24 },
  { name: 'Maria Santos', deals: 8, revenue: 98000, conversion: 18 },
  { name: 'Pedro Lima', deals: 10, revenue: 120000, conversion: 22 },
  { name: 'Ana Costa', deals: 6, revenue: 75000, conversion: 15 },
];

export default function Reports() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-muted-foreground mt-2">Análise de performance e métricas de vendas</p>
        </div>
        <Button className="gap-2">
          <Download size={16} />
          Exportar Relatórios
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas do Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 67.000</div>
            <div className="flex items-center text-xs text-success mt-1">
              <TrendingUp size={12} className="mr-1" />
              +12% vs mês anterior
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos Contatos</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <div className="flex items-center text-xs text-success mt-1">
              <TrendingUp size={12} className="mr-1" />
              +8% vs mês anterior
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negócios Fechados</CardTitle>
            <Briefcase className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <div className="flex items-center text-xs text-success mt-1">
              <TrendingUp size={12} className="mr-1" />
              +15% vs mês anterior
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12%</div>
            <div className="flex items-center text-xs text-success mt-1">
              <TrendingUp size={12} className="mr-1" />
              +2% vs mês anterior
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Performance Chart */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle>Performance de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value, name) => [
                  `R$ ${value.toLocaleString()}`, 
                  name === 'vendas' ? 'Vendas' : 'Meta'
                ]} />
                <Line 
                  type="monotone" 
                  dataKey="vendas" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  name="vendas"
                />
                <Line 
                  type="monotone" 
                  dataKey="meta" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="meta"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle>Funil de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conversionData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="stage" />
                <Tooltip formatter={(value) => [value, 'Quantidade']} />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Sources */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle>Fontes de Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, 'Porcentagem']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {sourceData.map((source, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: source.color }}
                    />
                    <span className="text-sm">{source.name}: {source.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Performance */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle>Performance da Equipe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamPerformance.map((member, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {member.deals} negócios • R$ {member.revenue.toLocaleString()}
                    </div>
                  </div>
                  <Badge className="bg-primary/10 text-primary">
                    {member.conversion}% conversão
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <Card className="hover-lift">
        <CardHeader>
          <CardTitle>Resumo de Atividades - Último Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-full bg-blue-100">
                <Mail size={24} className="text-blue-600" />
              </div>
              <div className="text-2xl font-bold">342</div>
              <div className="text-sm text-muted-foreground">Emails Enviados</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-full bg-green-100">
                <Phone size={24} className="text-green-600" />
              </div>
              <div className="text-2xl font-bold">156</div>
              <div className="text-sm text-muted-foreground">Ligações Feitas</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-full bg-purple-100">
                <Calendar size={24} className="text-purple-600" />
              </div>
              <div className="text-2xl font-bold">89</div>
              <div className="text-sm text-muted-foreground">Reuniões Realizadas</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-full bg-yellow-100">
                <Users size={24} className="text-yellow-600" />
              </div>
              <div className="text-2xl font-bold">124</div>
              <div className="text-sm text-muted-foreground">Novos Contatos</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
