import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

interface AccountFormProps {
  account?: Account | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AccountForm({ account, onSuccess, onCancel }: AccountFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    account_type: 'checking' as 'checking' | 'savings' | 'credit_card' | 'investment' | 'cash',
    bank_name: '',
    account_number: '',
    initial_balance: '',
    currency: 'BRL',
    is_active: true,
  });

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        account_type: account.account_type,
        bank_name: account.bank_name || '',
        account_number: account.account_number || '',
        initial_balance: account.initial_balance.toString(),
        currency: account.currency,
        is_active: account.is_active,
      });
    }
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      const accountData = {
        user_id: userData.user.id,
        name: formData.name,
        account_type: formData.account_type,
        bank_name: formData.bank_name || null,
        account_number: formData.account_number || null,
        initial_balance: parseFloat(formData.initial_balance),
        current_balance: account ? account.current_balance : parseFloat(formData.initial_balance),
        currency: formData.currency,
        is_active: formData.is_active,
      };

      if (account) {
        // Atualizar conta existente
        const { error } = await supabase
          .from('financial_accounts')
          .update(accountData)
          .eq('id', account.id);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Conta atualizada com sucesso",
        });
      } else {
        // Criar nova conta
        const { error } = await supabase
          .from('financial_accounts')
          .insert([accountData]);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Conta criada com sucesso",
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a conta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="name">Nome da Conta *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Conta Corrente Banco do Brasil"
            required
          />
        </div>

        <div>
          <Label>Tipo de Conta *</Label>
          <Select 
            value={formData.account_type} 
            onValueChange={(value: typeof formData.account_type) => 
              setFormData({ ...formData, account_type: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="checking">Conta Corrente</SelectItem>
              <SelectItem value="savings">Poupança</SelectItem>
              <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
              <SelectItem value="investment">Investimento</SelectItem>
              <SelectItem value="cash">Dinheiro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="bank_name">Nome do Banco</Label>
          <Input
            id="bank_name"
            value={formData.bank_name}
            onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
            placeholder="Ex: Banco do Brasil"
          />
        </div>

        <div>
          <Label htmlFor="account_number">Número da Conta</Label>
          <Input
            id="account_number"
            value={formData.account_number}
            onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
            placeholder="Ex: 12345-6"
          />
        </div>

        <div>
          <Label htmlFor="initial_balance">
            {account ? 'Saldo Inicial' : 'Saldo Inicial *'}
          </Label>
          <Input
            id="initial_balance"
            type="number"
            step="0.01"
            value={formData.initial_balance}
            onChange={(e) => setFormData({ ...formData, initial_balance: e.target.value })}
            placeholder="0.00"
            required={!account}
            disabled={!!account}
          />
          {account && (
            <p className="text-xs text-muted-foreground mt-1">
              O saldo inicial não pode ser alterado após a criação da conta
            </p>
          )}
        </div>

        <div>
          <Label>Moeda</Label>
          <Select 
            value={formData.currency} 
            onValueChange={(value) => setFormData({ ...formData, currency: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BRL">Real (BRL)</SelectItem>
              <SelectItem value="USD">Dólar (USD)</SelectItem>
              <SelectItem value="EUR">Euro (EUR)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label htmlFor="is_active">Conta ativa</Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : account ? 'Atualizar' : 'Criar'}
        </Button>
      </div>
    </form>
  );
}