import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, TrendingUp, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Budget {
  id: string;
  name: string;
  amount: number;
  spent_amount: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  end_date: string;
  is_active: boolean;
  category: { name: string; color?: string } | null;
}

export function BudgetsList() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('financial_budgets')
        .select(`
          *,
          category:financial_categories(name, color)
        `)
        .order('name');

      if (error) throw error;
      setBudgets(data || []);
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os orçamentos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este orçamento?")) return;

    try {
      const { error } = await supabase
        .from('financial_budgets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Orçamento excluído com sucesso",
      });
      
      loadBudgets();
    } catch (error) {
      console.error('Erro ao excluir orçamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o orçamento",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getPeriodLabel = (period: string) => {
    const periodMap = {
      monthly: 'Mensal',
      quarterly: 'Trimestral',
      yearly: 'Anual'
    };
    return periodMap[period as keyof typeof periodMap] || period;
  };

  const getBudgetStatus = (spent: number, total: number) => {
    const percentage = total > 0 ? (spent / total) * 100 : 0;
    
    if (percentage >= 100) return { status: 'exceeded', color: 'text-red-600', bgColor: 'bg-red-100' };
    if (percentage >= 80) return { status: 'warning', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    if (percentage >= 50) return { status: 'good', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    return { status: 'excellent', color: 'text-green-600', bgColor: 'bg-green-100' };
  };

  const isExpired = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Orçamentos</h2>
          <p className="text-muted-foreground">
            Controle seus gastos com orçamentos por categoria
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Orçamento
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-2 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum orçamento cadastrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crie orçamentos para controlar seus gastos por categoria
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Orçamento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => {
            const percentage = budget.amount > 0 ? (budget.spent_amount / budget.amount) * 100 : 0;
            const status = getBudgetStatus(budget.spent_amount, budget.amount);
            const expired = isExpired(budget.end_date);
            
            return (
              <Card key={budget.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {budget.category?.color && (
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: budget.category.color }}
                        />
                      )}
                      <div>
                        <CardTitle className="text-base">{budget.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {budget.category?.name || 'Sem categoria'} • {getPeriodLabel(budget.period)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {expired && (
                        <Badge variant="destructive" className="text-xs">
                          Expirado
                        </Badge>
                      )}
                      {percentage >= 100 && !expired && (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                      <Badge variant={budget.is_active ? "default" : "secondary"}>
                        {budget.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span>Progresso</span>
                        <span className={`font-medium ${status.color}`}>
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(percentage, 100)} 
                        className={`h-2 ${percentage >= 100 ? 'bg-red-100' : ''}`}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Gasto:</span>
                        <span className={`font-medium ${
                          budget.spent_amount > budget.amount ? 'text-red-600' : 'text-gray-900'
                        }`}>
                          {formatCurrency(budget.spent_amount)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Orçamento:</span>
                        <span className="font-medium">{formatCurrency(budget.amount)}</span>
                      </div>
                      {budget.spent_amount > budget.amount && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-red-600">Excesso:</span>
                          <span className="font-medium text-red-600">
                            {formatCurrency(budget.spent_amount - budget.amount)}
                          </span>
                        </div>
                      )}
                      {budget.spent_amount <= budget.amount && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-green-600">Disponível:</span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(budget.amount - budget.spent_amount)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>{formatDate(budget.start_date)}</span>
                      <span>até</span>
                      <span className={expired ? 'text-red-600 font-medium' : ''}>
                        {formatDate(budget.end_date)}
                      </span>
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBudget(budget.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}