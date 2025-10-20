import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  transaction_date: string;
  due_date?: string;
  account_id: string;
  category_id?: string;
  payment_method?: string;
  notes?: string;
}

interface Account {
  id: string;
  name: string;
  account_type: string;
}

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
}

interface TransactionFormProps {
  transaction?: Transaction | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TransactionForm({ transaction, onSuccess, onCancel }: TransactionFormProps) {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense' | 'transfer',
    status: 'pending' as 'pending' | 'paid' | 'overdue' | 'cancelled',
    transaction_date: new Date(),
    due_date: undefined as Date | undefined,
    account_id: '',
    category_id: '',
    payment_method: '',
    notes: '',
  });

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAccounts();
    loadCategories();
    
    if (transaction) {
      setFormData({
        description: transaction.description,
        amount: transaction.amount.toString(),
        type: transaction.type,
        status: transaction.status,
        transaction_date: new Date(transaction.transaction_date),
        due_date: transaction.due_date ? new Date(transaction.due_date) : undefined,
        account_id: transaction.account_id,
        category_id: transaction.category_id || '',
        payment_method: transaction.payment_method || '',
        notes: transaction.notes || '',
      });
    }
  }, [transaction]);

  const loadAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_accounts')
        .select('id, name, account_type')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_categories')
        .select('id, name, type')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      const transactionData = {
        user_id: userData.user.id,
        description: formData.description,
        amount: parseFloat(formData.amount),
        type: formData.type,
        status: formData.status,
        transaction_date: formData.transaction_date.toISOString().split('T')[0],
        due_date: formData.due_date?.toISOString().split('T')[0],
        account_id: formData.account_id,
        category_id: formData.category_id || null,
        payment_method: formData.payment_method || null,
        notes: formData.notes || null,
      };

      if (transaction) {
        const { error } = await supabase
          .from('financial_transactions')
          .update(transactionData)
          .eq('id', transaction.id);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Transação atualizada com sucesso",
        });
      } else {
        const { error } = await supabase
          .from('financial_transactions')
          .insert([transactionData]);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Transação criada com sucesso",
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a transação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(category => 
    category.type === formData.type || formData.type === 'transfer'
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="description">Descrição *</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="amount">Valor *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Tipo *</Label>
          <Select 
            value={formData.type} 
            onValueChange={(value: 'income' | 'expense' | 'transfer') => 
              setFormData({ ...formData, type: value, category_id: '' })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Receita</SelectItem>
              <SelectItem value="expense">Despesa</SelectItem>
              <SelectItem value="transfer">Transferência</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status *</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value: 'pending' | 'paid' | 'overdue' | 'cancelled') => 
              setFormData({ ...formData, status: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="overdue">Vencido</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Conta *</Label>
          <Select 
            value={formData.account_id} 
            onValueChange={(value) => setFormData({ ...formData, account_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma conta" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} ({account.account_type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Categoria</Label>
          <Select 
            value={formData.category_id} 
            onValueChange={(value) => setFormData({ ...formData, category_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {filteredCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Data da Transação *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.transaction_date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.transaction_date ? (
                  format(formData.transaction_date, "dd/MM/yyyy")
                ) : (
                  <span>Selecione uma data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.transaction_date}
                onSelect={(date) => date && setFormData({ ...formData, transaction_date: date })}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <Label>Data de Vencimento</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.due_date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.due_date ? (
                  format(formData.due_date, "dd/MM/yyyy")
                ) : (
                  <span>Selecione uma data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.due_date}
                onSelect={(date) => setFormData({ ...formData, due_date: date })}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div>
        <Label>Método de Pagamento</Label>
        <Select 
          value={formData.payment_method} 
          onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o método" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Dinheiro</SelectItem>
            <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
            <SelectItem value="debit_card">Cartão de Débito</SelectItem>
            <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
            <SelectItem value="pix">PIX</SelectItem>
            <SelectItem value="check">Cheque</SelectItem>
            <SelectItem value="other">Outros</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Observações adicionais..."
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : transaction ? 'Atualizar' : 'Criar'}
        </Button>
      </div>
    </form>
  );
}