
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Briefcase, 
  DollarSign, 
  TrendingUp,
  Calendar,
  Phone,
  Mail,
  Plus,
  ArrowUp,
  ArrowDown,
  Clock
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Mock data
const salesData = [
  { name: 'Jan', value: 12000 },
  { name: 'Fev', value: 19000 },
  { name: 'Mar', value: 15000 },
  { name: 'Abr', value: 25000 },
  { name: 'Mai', value: 22000 },
  { name: 'Jun', value: 30000 },
];

const pipelineData = [
  { stage: 'Lead', count: 45 },
  { stage: 'Qualificado', count: 32 },
  { stage: 'Proposta', count: 18 },
  { stage: 'Negociação', count: 12 },
  { stage: 'Fechado', count: 8 },
];

const recentActivities = [
  { type: 'call', contact: 'Maria Santos', time: '10:30', description: 'Ligação sobre proposta' },
  { type: 'meeting', contact: 'João Silva', time: '14:00', description: 'Reunião de negociação' },
  { type: 'email', contact: 'Ana Costa', time: '16:45', description: 'Envio de contrato' },
  { type: 'task', contact: 'Pedro Lima', time: '09:15', description: 'Follow-up agendado' },
];

const upcomingTasks = [
  { id: 1, title: 'Ligar para Maria Santos', time: '10:00', priority: 'high' },
  { id: 2, title: 'Enviar proposta para TechCorp', time: '14:30', priority: 'medium' },
  { id: 3, title: 'Reunião com equipe de vendas', time: '16:00', priority: 'low' },
  { id: 4, title: 'Follow-up com cliente ABC', time: '17:30', priority: 'high' },
];

export default function Dashboard() {
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bom dia, João! 👋</h1>
          <p className="text-muted-foreground mt-2">{currentDate}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Calendar size={16} />
            Ver Agenda
          </Button>
          <Button className="gap-2">
            <Plus size={16} />
            Novo Negócio
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Contatos</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,284</div>
            <div className="flex items-center text-xs text-success mt-1">
              <ArrowUp size={12} className="mr-1" />
              +12% este mês
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negócios Ativos</CardTitle>
            <Briefcase className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">67</div>
            <div className="flex items-center text-xs text-success mt-1">
              <ArrowUp size={12} className="mr-1" />
              +8% este mês
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 45.200</div>
            <div className="flex items-center text-xs text-destructive mt-1">
              <ArrowDown size={12} className="mr-1" />
              -3% este mês
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24%</div>
            <div className="flex items-center text-xs text-success mt-1">
              <ArrowUp size={12} className="mr-1" />
              +5% este mês
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle>Tendência de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`R$ ${value.toLocaleString()}`, 'Vendas']} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pipeline Chart */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle>Pipeline de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {activity.type === 'call' && <Phone size={14} className="text-primary" />}
                    {activity.type === 'meeting' && <Calendar size={14} className="text-primary" />}
                    {activity.type === 'email' && <Mail size={14} className="text-primary" />}
                    {activity.type === 'task' && <Clock size={14} className="text-primary" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{activity.contact}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">{activity.time}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle>Próximas Tarefas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className={`w-3 h-3 rounded-full ${
                    task.priority === 'high' ? 'bg-red-500' : 
                    task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.time}</p>
                  </div>
                  <Badge variant={
                    task.priority === 'high' ? 'destructive' : 
                    task.priority === 'medium' ? 'secondary' : 'default'
                  }>
                    {task.priority === 'high' ? 'Alta' : 
                     task.priority === 'medium' ? 'Média' : 'Baixa'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
