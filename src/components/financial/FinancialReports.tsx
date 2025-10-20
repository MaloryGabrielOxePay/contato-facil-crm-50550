import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Download, TrendingUp, TrendingDown, DollarSign, PieChart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { cn } from "@/lib/utils";

interface ReportData {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  transactionCount: number;
  categoriesBreakdown: { category: string; amount: number; count: number; color?: string }[];
  monthlyTrends: { month: string; income: number; expenses: number }[];
  accountsBalance: { account: string; balance: number; type: string }[];
}

export function FinancialReports() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState("this_month");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const { toast } = useToast();

  useEffect(() => {
    loadReportData();
  }, [period, customStartDate, customEndDate]);

  const getDateRange = () => {
    const now = new Date();
    
    switch (period) {
      case "this_month":
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
      case "last_month":
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return {
          start: startOfMonth(lastMonth),
          end: endOfMonth(lastMonth)
        };
      case "this_year":
        return {
          start: startOfYear(now),
          end: endOfYear(now)
        };
      case "last_year":
        const lastYear = new Date(now.getFullYear() - 1, 0, 1);
        return {
          start: startOfYear(lastYear),
          end: endOfYear(lastYear)
        };
      case "custom":
        return {
          start: customStartDate || startOfMonth(now),
          end: customEndDate || endOfMonth(now)
        };
      default:
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
    }
  };

  const loadReportData = async () => {
    try {
      setLoading(true);
      const { start, end } = getDateRange();
      
      const startDate = start.toISOString().split('T')[0];
      const endDate = end.toISOString().split('T')[0];

      // Buscar transações do período
      const { data: transactions, error: transError } = await supabase
        .from('financial_transactions')
        .select(`
          *,
          category:financial_categories(name, color),
          account:financial_accounts(name, account_type)
        `)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .eq('status', 'paid');

      if (transError) throw transError;

      // Buscar saldos das contas
      const { data: accounts, error: accountsError } = await supabase
        .from('financial_accounts')
        .select('name, current_balance, account_type')
        .eq('is_active', true);

      if (accountsError) throw accountsError;

      // Processar dados
      const totalIncome = transactions?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      
      const totalExpenses = transactions?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Breakdown por categorias
      const categoriesMap = new Map();
      transactions?.forEach(transaction => {
        if (transaction.category) {
          const key = transaction.category.name;
          if (!categoriesMap.has(key)) {
            categoriesMap.set(key, {
              category: key,
              amount: 0,
              count: 0,
              color: transaction.category.color
            });
          }
          const existing = categoriesMap.get(key);
          existing.amount += Number(transaction.amount);
          existing.count += 1;
        }
      });

      const categoriesBreakdown = Array.from(categoriesMap.values())
        .sort((a, b) => b.amount - a.amount);

      // Saldos das contas
      const accountsBalance = accounts?.map(account => ({
        account: account.name,
        balance: Number(account.current_balance),
        type: account.account_type
      })) || [];

      setReportData({
        totalIncome,
        totalExpenses,
        netIncome: totalIncome - totalExpenses,
        transactionCount: transactions?.length || 0,
        categoriesBreakdown,
        monthlyTrends: [], // Implementar se necessário
        accountsBalance
      });

    } catch (error) {
      console.error('Erro ao carregar dados do relatório:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do relatório",
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

  const exportReport = () => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "A exportação de relatórios será implementada em breve",
    });
  };

  const getAccountTypeLabel = (type: string) => {
    const typeMap = {
      checking: 'Conta Corrente',
      savings: 'Poupança',
      credit_card: 'Cartão de Crédito',
      investment: 'Investimento',
      cash: 'Dinheiro'
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };

  return (
    <div className="space-y-6">
      {/* Controles do Relatório */}
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Financeiros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Período</label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this_month">Este Mês</SelectItem>
                  <SelectItem value="last_month">Mês Passado</SelectItem>
                  <SelectItem value="this_year">Este Ano</SelectItem>
                  <SelectItem value="last_year">Ano Passado</SelectItem>
                  <SelectItem value="custom">Período Customizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {period === "custom" && (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">Data Inicial</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[200px] justify-start text-left font-normal",
                          !customStartDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {customStartDate ? (
                          format(customStartDate, "dd/MM/yyyy")
                        ) : (
                          <span>Selecione a data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={customStartDate}
                        onSelect={setCustomStartDate}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Data Final</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[200px] justify-start text-left font-normal",
                          !customEndDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {customEndDate ? (
                          format(customEndDate, "dd/MM/yyyy")
                        ) : (
                          <span>Selecione a data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={customEndDate}
                        onSelect={setCustomEndDate}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}

            <Button onClick={exportReport} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-8">Carregando relatório...</div>
      ) : reportData ? (
        <>
          {/* Resumo Executivo */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Receitas</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(reportData.totalIncome)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Despesas</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(reportData.totalExpenses)}
                    </p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Resultado</p>
                    <p className={`text-2xl font-bold ${
                      reportData.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(reportData.netIncome)}
                    </p>
                  </div>
                  <DollarSign className={`h-8 w-8 ${
                    reportData.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
                  }`} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Transações</p>
                    <p className="text-2xl font-bold">
                      {reportData.transactionCount}
                    </p>
                  </div>
                  <PieChart className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Gastos por Categoria */}
            <Card>
              <CardHeader>
                <CardTitle>Gastos por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.categoriesBreakdown.length > 0 ? (
                    reportData.categoriesBreakdown.slice(0, 10).map((category, index) => (
                      <div key={category.category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="text-sm font-medium">#{index + 1}</div>
                          {category.color && (
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: category.color }}
                            />
                          )}
                          <span className="font-medium">{category.category}</span>
                          <Badge variant="secondary" className="ml-auto">
                            {category.count} transações
                          </Badge>
                        </div>
                        <span className="font-semibold">
                          {formatCurrency(category.amount)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhuma categoria encontrada no período
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Saldo das Contas */}
            <Card>
              <CardHeader>
                <CardTitle>Saldo das Contas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.accountsBalance.length > 0 ? (
                    reportData.accountsBalance.map((account, index) => (
                      <div key={account.account} className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="font-medium">{account.account}</span>
                          <span className="text-sm text-muted-foreground">
                            {getAccountTypeLabel(account.type)}
                          </span>
                        </div>
                        <span className={`font-semibold ${
                          account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(account.balance)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhuma conta encontrada
                    </p>
                  )}
                  
                  {reportData.accountsBalance.length > 0 && (
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between font-semibold">
                        <span>Total Geral</span>
                        <span className={
                          reportData.accountsBalance.reduce((sum, acc) => sum + acc.balance, 0) >= 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }>
                          {formatCurrency(
                            reportData.accountsBalance.reduce((sum, acc) => sum + acc.balance, 0)
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <p>Erro ao carregar dados do relatório</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}