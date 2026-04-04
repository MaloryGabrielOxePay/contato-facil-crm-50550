-- Criar tabelas para o módulo financeiro

-- Tabela de categorias financeiras
CREATE TABLE public.financial_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  color TEXT,
  icon TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de contas bancárias/financeiras
CREATE TABLE public.financial_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings', 'credit_card', 'investment', 'cash')),
  bank_name TEXT,
  account_number TEXT,
  initial_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  current_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BRL',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de transações financeiras
CREATE TABLE public.financial_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES public.financial_accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.financial_categories(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  amount DECIMAL(15,2) NOT NULL,
  description TEXT NOT NULL,
  transaction_date DATE NOT NULL,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  payment_method TEXT CHECK (payment_method IN ('cash', 'credit_card', 'debit_card', 'bank_transfer', 'pix', 'check', 'other')),
  reference_number TEXT,
  notes TEXT,
  tags TEXT[],
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurring_frequency TEXT CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  recurring_end_date DATE,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de faturas/invoices
CREATE TABLE public.financial_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  payment_terms TEXT,
  notes TEXT,
  payment_method TEXT,
  paid_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de itens de fatura
CREATE TABLE public.financial_invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.financial_invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(15,2) NOT NULL,
  total_price DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de orçamentos
CREATE TABLE public.financial_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category_id UUID REFERENCES public.financial_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('monthly', 'quarterly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  spent_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para todas as tabelas
ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_budgets ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para financial_categories
CREATE POLICY "Users can view their own financial categories" 
ON public.financial_categories 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own financial categories" 
ON public.financial_categories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own financial categories" 
ON public.financial_categories 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own financial categories" 
ON public.financial_categories 
FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas RLS para financial_accounts
CREATE POLICY "Users can view their own financial accounts" 
ON public.financial_accounts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own financial accounts" 
ON public.financial_accounts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own financial accounts" 
ON public.financial_accounts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own financial accounts" 
ON public.financial_accounts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas RLS para financial_transactions
CREATE POLICY "Users can view their own financial transactions" 
ON public.financial_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own financial transactions" 
ON public.financial_transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own financial transactions" 
ON public.financial_transactions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own financial transactions" 
ON public.financial_transactions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas RLS para financial_invoices
CREATE POLICY "Users can view their own financial invoices" 
ON public.financial_invoices 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own financial invoices" 
ON public.financial_invoices 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own financial invoices" 
ON public.financial_invoices 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own financial invoices" 
ON public.financial_invoices 
FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas RLS para financial_invoice_items
CREATE POLICY "Users can view invoice items through invoice ownership" 
ON public.financial_invoice_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.financial_invoices 
  WHERE id = invoice_id AND user_id = auth.uid()
));

CREATE POLICY "Users can create invoice items for their invoices" 
ON public.financial_invoice_items 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.financial_invoices 
  WHERE id = invoice_id AND user_id = auth.uid()
));

CREATE POLICY "Users can update invoice items for their invoices" 
ON public.financial_invoice_items 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.financial_invoices 
  WHERE id = invoice_id AND user_id = auth.uid()
));

CREATE POLICY "Users can delete invoice items for their invoices" 
ON public.financial_invoice_items 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.financial_invoices 
  WHERE id = invoice_id AND user_id = auth.uid()
));

-- Políticas RLS para financial_budgets
CREATE POLICY "Users can view their own financial budgets" 
ON public.financial_budgets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own financial budgets" 
ON public.financial_budgets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own financial budgets" 
ON public.financial_budgets 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own financial budgets" 
ON public.financial_budgets 
FOR DELETE 
USING (auth.uid() = user_id);

-- Função para atualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at automaticamente
CREATE TRIGGER update_financial_categories_updated_at
  BEFORE UPDATE ON public.financial_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financial_accounts_updated_at
  BEFORE UPDATE ON public.financial_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financial_transactions_updated_at
  BEFORE UPDATE ON public.financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financial_invoices_updated_at
  BEFORE UPDATE ON public.financial_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financial_budgets_updated_at
  BEFORE UPDATE ON public.financial_budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para atualizar saldo da conta após transação
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'paid' THEN
      IF NEW.type = 'income' THEN
        UPDATE public.financial_accounts 
        SET current_balance = current_balance + NEW.amount 
        WHERE id = NEW.account_id;
      ELSIF NEW.type = 'expense' THEN
        UPDATE public.financial_accounts 
        SET current_balance = current_balance - NEW.amount 
        WHERE id = NEW.account_id;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Se o status mudou para paid
    IF OLD.status != 'paid' AND NEW.status = 'paid' THEN
      IF NEW.type = 'income' THEN
        UPDATE public.financial_accounts 
        SET current_balance = current_balance + NEW.amount 
        WHERE id = NEW.account_id;
      ELSIF NEW.type = 'expense' THEN
        UPDATE public.financial_accounts 
        SET current_balance = current_balance - NEW.amount 
        WHERE id = NEW.account_id;
      END IF;
    -- Se o status mudou de paid para outro
    ELSIF OLD.status = 'paid' AND NEW.status != 'paid' THEN
      IF OLD.type = 'income' THEN
        UPDATE public.financial_accounts 
        SET current_balance = current_balance - OLD.amount 
        WHERE id = OLD.account_id;
      ELSIF OLD.type = 'expense' THEN
        UPDATE public.financial_accounts 
        SET current_balance = current_balance + OLD.amount 
        WHERE id = OLD.account_id;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status = 'paid' THEN
      IF OLD.type = 'income' THEN
        UPDATE public.financial_accounts 
        SET current_balance = current_balance - OLD.amount 
        WHERE id = OLD.account_id;
      ELSIF OLD.type = 'expense' THEN
        UPDATE public.financial_accounts 
        SET current_balance = current_balance + OLD.amount 
        WHERE id = OLD.account_id;
      END IF;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar saldo automaticamente
CREATE TRIGGER financial_transactions_balance_update
  AFTER INSERT OR UPDATE OR DELETE ON public.financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_account_balance();

-- Índices para melhor performance
CREATE INDEX idx_financial_transactions_user_id ON public.financial_transactions(user_id);
CREATE INDEX idx_financial_transactions_account_id ON public.financial_transactions(account_id);
CREATE INDEX idx_financial_transactions_category_id ON public.financial_transactions(category_id);
CREATE INDEX idx_financial_transactions_transaction_date ON public.financial_transactions(transaction_date);
CREATE INDEX idx_financial_transactions_status ON public.financial_transactions(status);
CREATE INDEX idx_financial_invoices_user_id ON public.financial_invoices(user_id);
CREATE INDEX idx_financial_invoices_contact_id ON public.financial_invoices(contact_id);
CREATE INDEX idx_financial_invoices_status ON public.financial_invoices(status);