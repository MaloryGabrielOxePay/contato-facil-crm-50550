
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Plus, 
  DollarSign, 
  Calendar, 
  User, 
  TrendingUp,
  MoreHorizontal,
  Eye,
  Edit
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data
const deals = [
  {
    id: 1,
    title: "Sistema CRM - TechCorp",
    company: "TechCorp",
    contact: "Maria Santos",
    value: 45000,
    stage: "Proposta",
    probability: 75,
    expectedClose: "2024-02-15",
    daysInStage: 5
  },
  {
    id: 2,
    title: "Consultoria Digital - Inovação",
    company: "Inovação Ltda",
    contact: "João Silva",
    value: 25000,
    stage: "Negociação",
    probability: 60,
    expectedClose: "2024-02-28",
    daysInStage: 12
  },
  {
    id: 3,
    title: "Desenvolvimento App - StartupXYZ",
    company: "StartupXYZ",
    contact: "Ana Costa",
    value: 80000,
    stage: "Qualificado",
    probability: 40,
    expectedClose: "2024-03-10",
    daysInStage: 3
  },
  {
    id: 4,
    title: "Treinamento Equipe - ABC",
    company: "Consultoria ABC",
    contact: "Pedro Lima",
    value: 15000,
    stage: "Fechado Ganho",
    probability: 100,
    expectedClose: "2024-01-20",
    daysInStage: 0
  }
];

const stages = [
  { name: "Lead", color: "bg-gray-100 text-gray-800" },
  { name: "Qualificado", color: "bg-blue-100 text-blue-800" },
  { name: "Proposta", color: "bg-yellow-100 text-yellow-800" },
  { name: "Negociação", color: "bg-orange-100 text-orange-800" },
  { name: "Fechado Ganho", color: "bg-green-100 text-green-800" },
  { name: "Fechado Perdido", color: "bg-red-100 text-red-800" }
];

export default function Deals() {
  const [selectedStage, setSelectedStage] = useState("Todos");

  const filteredDeals = selectedStage === "Todos" 
    ? deals 
    : deals.filter(deal => deal.stage === selectedStage);

  const totalValue = filteredDeals.reduce((sum, deal) => sum + deal.value, 0);
  const weightedValue = filteredDeals.reduce((sum, deal) => sum + (deal.value * deal.probability / 100), 0);

  const getStageBadge = (stage: string) => {
    const stageConfig = stages.find(s => s.name === stage);
    return (
      <Badge className={stageConfig?.color || "bg-gray-100 text-gray-800"}>
        {stage}
      </Badge>
    );
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pipeline de Vendas</h1>
          <p className="text-muted-foreground mt-2">Gerencie suas oportunidades de negócio</p>
        </div>
        <Button className="gap-2">
          <Plus size={16} />
          Novo Negócio
        </Button>
      </div>

      {/* Pipeline Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total do Pipeline</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {filteredDeals.length} negócios ativos
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Ponderado</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {Math.round(weightedValue).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Baseado na probabilidade
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Últimos 30 dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stage Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedStage === "Todos" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStage("Todos")}
            >
              Todos ({deals.length})
            </Button>
            {stages.map((stage) => {
              const count = deals.filter(deal => deal.stage === stage.name).length;
              return (
                <Button
                  key={stage.name}
                  variant={selectedStage === stage.name ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStage(stage.name)}
                >
                  {stage.name} ({count})
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Deals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDeals.map((deal) => (
          <Card key={deal.id} className="hover-lift">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold leading-tight">
                    {deal.title}
                  </CardTitle>
                  <p className="text-muted-foreground text-sm mt-1">{deal.company}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye size={14} className="mr-2" />
                      Ver Detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit size={14} className="mr-2" />
                      Editar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Value and Probability */}
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-primary">
                  R$ {deal.value.toLocaleString()}
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{deal.probability}%</div>
                  <div className="text-xs text-muted-foreground">probabilidade</div>
                </div>
              </div>

              {/* Stage */}
              <div>
                {getStageBadge(deal.stage)}
                {deal.daysInStage > 0 && (
                  <span className="text-xs text-muted-foreground ml-2">
                    {deal.daysInStage} dias neste estágio
                  </span>
                )}
              </div>

              {/* Contact */}
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getInitials(deal.contact)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <User size={12} />
                  {deal.contact}
                </div>
              </div>

              {/* Expected Close Date */}
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar size={12} />
                Fechamento previsto: {new Date(deal.expectedClose).toLocaleDateString('pt-BR')}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDeals.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-muted-foreground text-center">
              <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Nenhum negócio encontrado</h3>
              <p className="text-sm">Não há negócios para o filtro selecionado.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
