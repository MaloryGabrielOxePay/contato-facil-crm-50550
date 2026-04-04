import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, TrendingDown, CreditCard, FileText, PieChart } from "lucide-react";
import { FinancialDashboard } from "@/components/financial/FinancialDashboard";
import { TransactionsList } from "@/components/financial/TransactionsList";
import { AccountsList } from "@/components/financial/AccountsList";
import { InvoicesList } from "@/components/financial/InvoicesList";
import { BudgetsList } from "@/components/financial/BudgetsList";
import { FinancialReports } from "@/components/financial/FinancialReports";

export default function Financial() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">
            Gerencie suas finanças, transações e relatórios
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Transações
          </TabsTrigger>
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Contas
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Faturas
          </TabsTrigger>
          <TabsTrigger value="budgets" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Orçamentos
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <FinancialDashboard />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <TransactionsList />
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          <AccountsList />
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <InvoicesList />
        </TabsContent>

        <TabsContent value="budgets" className="space-y-4">
          <BudgetsList />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <FinancialReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}