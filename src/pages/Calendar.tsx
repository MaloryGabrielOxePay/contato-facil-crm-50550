
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  Video
} from "lucide-react";

// Mock data for events
const events = [
  {
    id: 1,
    title: "Reunião com TechCorp",
    type: "meeting",
    date: "2024-01-16",
    time: "10:00",
    duration: "1h",
    contact: "Maria Santos",
    description: "Apresentação da proposta CRM"
  },
  {
    id: 2,
    title: "Ligação - Follow-up",
    type: "call",
    date: "2024-01-16",
    time: "14:30",
    duration: "30min",
    contact: "João Silva",
    description: "Acompanhar negociação"
  },
  {
    id: 3,
    title: "Demo StartupXYZ",
    type: "demo",
    date: "2024-01-17",
    time: "16:00",
    duration: "2h",
    contact: "Ana Costa",
    description: "Demonstração do produto"
  },
  {
    id: 4,
    title: "Reunião de equipe",
    type: "internal",
    date: "2024-01-18",
    time: "09:00",
    duration: "1h",
    contact: "Equipe Vendas",
    description: "Planejamento semanal"
  }
];

export default function Calendar() {
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case "call":
        return <Phone size={14} className="text-blue-600" />;
      case "meeting":
        return <User size={14} className="text-green-600" />;
      case "demo":
        return <Video size={14} className="text-purple-600" />;
      default:
        return <CalendarIcon size={14} className="text-gray-600" />;
    }
  };

  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case "call":
        return <Badge className="bg-blue-100 text-blue-800">Ligação</Badge>;
      case "meeting":
        return <Badge className="bg-green-100 text-green-800">Reunião</Badge>;
      case "demo":
        return <Badge className="bg-purple-100 text-purple-800">Demo</Badge>;
      case "internal":
        return <Badge className="bg-gray-100 text-gray-800">Interno</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  // Generate calendar days for current month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getEventsForDay = (day: number) => {
    const dateStr = `2024-01-${day.toString().padStart(2, '0')}`;
    return events.filter(event => event.date === dateStr);
  };

  const isToday = (day: number) => {
    return day === currentDate.getDate();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendário</h1>
          <p className="text-muted-foreground mt-2">Gerencie seus compromissos e reuniões</p>
        </div>
        <Button className="gap-2">
          <Plus size={16} />
          Novo Evento
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="capitalize">{currentMonth}</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <ChevronLeft size={16} />
                </Button>
                <Button variant="outline" size="sm">
                  Hoje
                </Button>
                <Button variant="outline" size="sm">
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {weekDays.map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                const dayEvents = day ? getEventsForDay(day) : [];
                return (
                  <div
                    key={index}
                    className={`min-h-[80px] p-2 border rounded-lg ${
                      day ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                    } ${day && isToday(day) ? 'bg-blue-50 border-blue-200' : ''}`}
                  >
                    {day && (
                      <>
                        <div className={`text-sm font-medium mb-1 ${
                          isToday(day) ? 'text-blue-600' : 'text-gray-900'
                        }`}>
                          {day}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 2).map((event) => (
                            <div
                              key={event.id}
                              className="text-xs p-1 rounded bg-primary/10 text-primary truncate"
                            >
                              {event.time} {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{dayEvents.length - 2} mais
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Próximos Eventos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {events.slice(0, 4).map((event) => (
                <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="mt-0.5">
                    {getEventTypeIcon(event.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="font-medium text-sm">{event.title}</div>
                    <div className="text-xs text-muted-foreground">{event.description}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock size={12} />
                      {new Date(event.date).toLocaleDateString('pt-BR')} às {event.time}
                    </div>
                    <div className="flex items-center gap-2">
                      {getEventTypeBadge(event.type)}
                      <span className="text-xs text-muted-foreground">{event.duration}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Phone size={16} />
                Agendar Ligação
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <User size={16} />
                Nova Reunião
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Video size={16} />
                Demo Produto
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <CalendarIcon size={16} />
                Evento Personalizado
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
