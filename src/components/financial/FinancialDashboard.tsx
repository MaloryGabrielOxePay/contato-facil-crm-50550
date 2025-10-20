import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, CreditCard, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface FinancialSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  pendingTransactions: number;
  overdueInvoices: number;
}

interface RecentTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  status: string;
  transaction_date: string;
}

interface Budget {
  id: string;
  name: string;
  amount: number;
  spent_amount: number;
  category: { name: string; color?: string } | null;
}

export function FinancialDashboard() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Buscar resumo financeiro
      const { data: accounts } = await supabase
        .from('financial_accounts')
        .select('current_balance')
        .eq('is_active', true);

      const totalBalance = accounts?.reduce((sum, account) => sum + Number(account.current_balance), 0) || 0;

      // Buscar transações do mês atual
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: transactions } = await supabase
        .from('financial_transactions')
        .select('*')
        .gte('transaction_date', startOfMonth.toISOString().split('T')[0])
        .eq('status', 'paid');

      const monthlyIncome = transactions?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      
      const monthlyExpenses = transactions?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Buscar transações pendentes
      const { data: pendingData } = await supabase
        .from('financial_transactions')
        .select('id')
        .eq('status', 'pending');

      // Buscar faturas vencidas
      const today = new Date().toISOString().split('T')[0];
      const { data: overdueData } = await supabase
        .from('financial_invoices')
        .select('id')
        .lt('due_date', today)
        .in('status', ['sent', 'draft']);

      // Buscar transações recentes
      const { data: recentData } = await supabase
        .from('financial_transactions')
        .select('*')
        .order('transaction_date', { ascending: false })
        .limit(5);

      // Buscar orçamentos
      const { data: budgetData } = await supabase
        .from('financial_budgets')
        .select(`
          *,
          category:financial_categories(name, color)
        `)
        .eq('is_active', true)
        .limit(5);

      setSummary({
        totalBalance,
        monthlyIncome,
        monthlyExpenses,
        pendingTransactions: pendingData?.length || 0,
        overdueInvoices: overdueData?.length || 0
      });

      setRecentTransactions(recentData || []);
      setBudgets(budgetData || []);

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-[120px]" />
              <Skeleton className="h-3 w-[80px] mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalBalance)}</div>
            <p className="text-xs text-muted-foreground">
              Saldo das contas ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.monthlyIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              Receitas confirmadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas do Mês</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summary.monthlyExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              Despesas pagas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendências</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {summary.pendingTransactions + summary.overdueInvoices}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.pendingTransactions} transações + {summary.overdueInvoices} faturas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Transações Recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Transações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-medium">{transaction.description}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(transaction.transaction_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={transaction.status === 'paid' ? 'default' : 'secondary'}>
                        {transaction.status === 'paid' ? 'Pago' : 'Pendente'}
                      </Badge>
                      <span className={`font-medium ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Nenhuma transação encontrada
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status dos Orçamentos */}
        <Card>
          <CardHeader>
            <CardTitle>Status dos Orçamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {budgets.length > 0 ? (
                budgets.map((budget) => {
                  const percentage = budget.amount > 0 ? (budget.spent_amount / budget.amount) * 100 : 0;
                  const isOverBudget = percentage > 100;
                  
                  return (
                    <div key={budget.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {budget.category?.color && (
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: budget.category.color }}
                            />
                          )}
                          <span className="font-medium">{budget.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(budget.spent_amount)} / {formatCurrency(budget.amount)}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(percentage, 100)} 
                        className={`h-2 ${isOverBudget ? 'bg-red-100' : ''}`}
                      />
                      {isOverBudget && (
                        <p className="text-xs text-red-600">
                          Excedeu em {formatCurrency(budget.spent_amount - budget.amount)}
                        </p>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum orçamento configurado
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}