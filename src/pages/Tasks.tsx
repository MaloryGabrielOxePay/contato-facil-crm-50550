
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, 
  Calendar, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  MoreHorizontal,
  Edit,
  Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data
const tasks = [
  {
    id: 1,
    title: "Ligar para Maria Santos - TechCorp",
    description: "Acompanhar proposta de sistema CRM",
    priority: "alta",
    status: "pendente",
    dueDate: "2024-01-16",
    dueTime: "10:00",
    contact: "Maria Santos",
    deal: "Sistema CRM - TechCorp",
    completed: false
  },
  {
    id: 2,
    title: "Enviar proposta para StartupXYZ",
    description: "Elaborar proposta de desenvolvimento de app",
    priority: "alta",
    status: "pendente",
    dueDate: "2024-01-16",
    dueTime: "14:30",
    contact: "Ana Costa",
    deal: "Desenvolvimento App - StartupXYZ",
    completed: false
  },
  {
    id: 3,
    title: "Reunião de negociação - Inovação Ltda",
    description: "Apresentar condições finais do contrato",
    priority: "media",
    status: "pendente",
    dueDate: "2024-01-17",
    dueTime: "16:00",
    contact: "João Silva",
    deal: "Consultoria Digital - Inovação",
    completed: false
  },
  {
    id: 4,
    title: "Follow-up com cliente ABC",
    description: "Verificar satisfação com o treinamento",
    priority: "baixa",
    status: "concluida",
    dueDate: "2024-01-15",
    dueTime: "17:30",
    contact: "Pedro Lima",
    deal: "Treinamento Equipe - ABC",
    completed: true
  },
  {
    id: 5,
    title: "Preparar apresentação para novo prospect",
    description: "Criar slides personalizados para demonstração",
    priority: "media",
    status: "atrasada",
    dueDate: "2024-01-14",
    dueTime: "09:00",
    contact: "Carlos Oliveira",
    deal: null,
    completed: false
  }
];

export default function Tasks() {
  const [selectedFilter, setSelectedFilter] = useState("todas");
  const [taskList, setTaskList] = useState(tasks);

  const filteredTasks = taskList.filter(task => {
    switch (selectedFilter) {
      case "pendentes":
        return task.status === "pendente";
      case "atrasadas":
        return task.status === "atrasada";
      case "concluidas":
        return task.status === "concluida";
      case "hoje":
        const today = new Date().toISOString().split('T')[0];
        return task.dueDate === today;
      default:
        return true;
    }
  });

  const toggleTaskCompletion = (taskId: number) => {
    setTaskList(prev => prev.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            completed: !task.completed,
            status: !task.completed ? "concluida" : "pendente"
          }
        : task
    ));
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "alta":
        return <Badge className="bg-red-100 text-red-800">Alta</Badge>;
      case "media":
        return <Badge className="bg-yellow-100 text-yellow-800">Média</Badge>;
      case "baixa":
        return <Badge className="bg-green-100 text-green-800">Baixa</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "concluida":
        return <CheckCircle2 size={16} className="text-green-600" />;
      case "atrasada":
        return <AlertCircle size={16} className="text-red-600" />;
      default:
        return <Clock size={16} className="text-yellow-600" />;
    }
  };

  const isOverdue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    return due < today;
  };

  const counts = {
    todas: taskList.length,
    pendentes: taskList.filter(t => t.status === "pendente").length,
    atrasadas: taskList.filter(t => t.status === "atrasada").length,
    concluidas: taskList.filter(t => t.status === "concluida").length,
    hoje: taskList.filter(t => t.dueDate === new Date().toISOString().split('T')[0]).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tarefas</h1>
          <p className="text-muted-foreground mt-2">Gerencie suas atividades e follow-ups</p>
        </div>
        <Button className="gap-2">
          <Plus size={16} />
          Nova Tarefa
        </Button>
      </div>

      {/* Task Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedFilter === "todas" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter("todas")}
            >
              Todas ({counts.todas})
            </Button>
            <Button
              variant={selectedFilter === "hoje" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter("hoje")}
            >
              Hoje ({counts.hoje})
            </Button>
            <Button
              variant={selectedFilter === "pendentes" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter("pendentes")}
            >
              Pendentes ({counts.pendentes})
            </Button>
            <Button
              variant={selectedFilter === "atrasadas" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter("atrasadas")}
            >
              Atrasadas ({counts.atrasadas})
            </Button>
            <Button
              variant={selectedFilter === "concluidas" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter("concluidas")}
            >
              Concluídas ({counts.concluidas})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <Card key={task.id} className={`hover-lift ${task.completed ? 'opacity-75' : ''}`}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => toggleTaskCompletion(task.id)}
                  className="mt-1"
                />

                {/* Task Content */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className={`font-semibold ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit size={14} className="mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 size={14} className="mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    {/* Status Icon */}
                    <div className="flex items-center gap-1">
                      {getStatusIcon(task.status)}
                      <span className="capitalize">{task.status}</span>
                    </div>

                    {/* Priority */}
                    <div>{getPriorityBadge(task.priority)}</div>

                    {/* Due Date */}
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar size={14} />
                      <span className={isOverdue(task.dueDate) && !task.completed ? 'text-red-600' : ''}>
                        {new Date(task.dueDate).toLocaleDateString('pt-BR')} às {task.dueTime}
                      </span>
                    </div>

                    {/* Contact */}
                    {task.contact && (
                      <div className="text-muted-foreground">
                        Contato: {task.contact}
                      </div>
                    )}

                    {/* Deal */}
                    {task.deal && (
                      <div className="text-muted-foreground">
                        Negócio: {task.deal}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-muted-foreground text-center">
              <CheckCircle2 size={48} className="mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Nenhuma tarefa encontrada</h3>
              <p className="text-sm">Não há tarefas para o filtro selecionado.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
