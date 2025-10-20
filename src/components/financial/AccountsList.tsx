import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, CreditCard, Wallet, PiggyBank, TrendingUp, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AccountForm } from "./AccountForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Account {
  id: string;
  name: string;
  account_type: 'checking' | 'savings' | 'credit_card' | 'investment' | 'cash';
  bank_name?: string;
  account_number?: string;
  initial_balance: number;
  current_balance: number;
  currency: string;
  is_active: boolean;
}

export function AccountsList() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('financial_accounts')
        .select('*')
        .order('name');

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as contas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita.")) return;

    try {
      const { error } = await supabase
        .from('financial_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Conta excluída com sucesso",
      });
      
      loadAccounts();
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a conta. Verifique se não existem transações vinculadas.",
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

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking':
        return <DollarSign className="h-5 w-5" />;
      case 'savings':
        return <PiggyBank className="h-5 w-5" />;
      case 'credit_card':
        return <CreditCard className="h-5 w-5" />;
      case 'investment':
        return <TrendingUp className="h-5 w-5" />;
      case 'cash':
        return <Wallet className="h-5 w-5" />;
      default:
        return <DollarSign className="h-5 w-5" />;
    }
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

  const getBalanceColor = (balance: number, type: string) => {
    if (type === 'credit_card') {
      return balance < 0 ? 'text-red-600' : 'text-gray-600';
    }
    return balance >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Contas</h2>
          <p className="text-muted-foreground">
            Gerencie suas contas bancárias e cartões
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingAccount(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Conta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAccount ? 'Editar Conta' : 'Nova Conta'}
              </DialogTitle>
            </DialogHeader>
            <AccountForm
              account={editingAccount}
              onSuccess={() => {
                setIsFormOpen(false);
                setEditingAccount(null);
                loadAccounts();
              }}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingAccount(null);
              }}
            />
          </DialogContent>
        </Dialog>
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
                <div className="h-6 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma conta cadastrada</h3>
            <p className="text-muted-foreground text-center mb-4">
              Comece criando sua primeira conta para gerenciar suas finanças
            </p>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeira Conta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getAccountIcon(account.account_type)}
                    <div>
                      <CardTitle className="text-base">{account.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {getAccountTypeLabel(account.account_type)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={account.is_active ? "default" : "secondary"}>
                      {account.is_active ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Saldo Atual:</span>
                    <span className={`font-semibold ${getBalanceColor(account.current_balance, account.account_type)}`}>
                      {formatCurrency(account.current_balance)}
                    </span>
                  </div>
                  
                  {account.bank_name && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Banco:</span>
                      <span className="text-sm">{account.bank_name}</span>
                    </div>
                  )}
                  
                  {account.account_number && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Número:</span>
                      <span className="text-sm font-mono">
                        ****{account.account_number.slice(-4)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingAccount(account);
                        setIsFormOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAccount(account.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}