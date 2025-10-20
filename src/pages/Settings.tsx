
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { 
  Save, 
  User, 
  Building, 
  Bell, 
  Shield,
  Palette,
  Database,
  Mail,
  Smartphone
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Settings() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          <p className="text-muted-foreground mt-2">Gerencie suas preferências e configurações do sistema</p>
        </div>
        <Button className="gap-2">
          <Save size={16} />
          Salvar Alterações
        </Button>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-muted p-1">
          <TabsTrigger value="profile" className="gap-2">
            <User size={16} />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="company" className="gap-2">
            <Building size={16} />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell size={16} />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield size={16} />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Database size={16} />
            Integrações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    JS
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">Alterar Foto</Button>
                  <p className="text-sm text-muted-foreground mt-1">
                    JPG, PNG ou GIF. Máximo 2MB.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome</Label>
                  <Input id="firstName" defaultValue="João" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Sobrenome</Label>
                  <Input id="lastName" defaultValue="Silva" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" defaultValue="joao@empresa.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" defaultValue="(11) 99999-9999" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Cargo</Label>
                <Input id="position" defaultValue="Gerente de Vendas" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Biografia</Label>
                <Textarea 
                  id="bio" 
                  placeholder="Conte um pouco sobre você..."
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome da Empresa</Label>
                  <Input id="companyName" defaultValue="Minha Empresa Ltda" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input id="cnpj" defaultValue="12.345.678/0001-90" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input id="address" defaultValue="Rua das Empresas, 123" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input id="city" defaultValue="São Paulo" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input id="state" defaultValue="SP" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">CEP</Label>
                  <Input id="zipCode" defaultValue="01234-567" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Telefone</Label>
                  <Input id="companyPhone" defaultValue="(11) 3333-3333" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" defaultValue="www.minhaempresa.com" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>E-mail</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber notificações por e-mail
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificações no navegador
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Novos Leads</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificar quando um novo lead for criado
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Negócios Fechados</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificar quando um negócio for fechado
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Tarefas em Atraso</Label>
                    <p className="text-sm text-muted-foreground">
                      Lembrete de tarefas vencidas
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Relatórios Semanais</Label>
                    <p className="text-sm text-muted-foreground">
                      Resumo semanal de atividades
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Segurança da Conta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Senha Atual</Label>
                  <Input id="currentPassword" type="password" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input id="newPassword" type="password" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <Input id="confirmPassword" type="password" />
                </div>

                <Button className="w-full">Alterar Senha</Button>
              </div>

              <hr />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Autenticação de Dois Fatores</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber código por SMS
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Aplicativo Autenticador</Label>
                    <p className="text-sm text-muted-foreground">
                      Usar Google Authenticator ou similar
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integrações Disponíveis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail size={24} className="text-blue-600" />
                    <div>
                      <div className="font-medium">Gmail</div>
                      <div className="text-sm text-muted-foreground">Sincronizar e-mails</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Conectar</Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail size={24} className="text-blue-800" />
                    <div>
                      <div className="font-medium">Outlook</div>
                      <div className="text-sm text-muted-foreground">Sincronizar e-mails</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Conectar</Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone size={24} className="text-green-600" />
                    <div>
                      <div className="font-medium">WhatsApp Business</div>
                      <div className="text-sm text-muted-foreground">Mensagens e contatos</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Conectar</Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Database size={24} className="text-purple-600" />
                    <div>
                      <div className="font-medium">Zapier</div>
                      <div className="text-sm text-muted-foreground">Automações</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Conectar</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações de API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">Chave da API</Label>
                <div className="flex gap-2">
                  <Input id="apiKey" defaultValue="sk-1234567890abcdef" readOnly />
                  <Button variant="outline" size="sm">Copiar</Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Use esta chave para integrar com sistemas externos
                </p>
              </div>

              <Button variant="outline">Gerar Nova Chave</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
