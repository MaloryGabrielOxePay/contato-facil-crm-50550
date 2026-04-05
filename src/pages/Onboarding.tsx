import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Building2,
  Flag,
  CheckCircle2,
  Loader2,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { slugify } from '@/lib/utils';
import { BRAZIL_STATES, CAMPAIGN_OFFICE } from '@/lib/constants';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const orgSchema = z.object({
  name: z.string().min(2, 'Informe o nome da organização (mínimo 2 caracteres)'),
  slug: z
    .string()
    .min(2, 'O slug deve ter no mínimo 2 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hífens'),
});

type OrgFormValues = z.infer<typeof orgSchema>;

const campaignSchema = z.object({
  name: z.string().min(2, 'Informe o nome da campanha'),
  office: z.string().min(1, 'Selecione o cargo'),
  city: z.string().min(2, 'Informe a cidade'),
  state: z.string().min(2, 'Selecione o estado'),
  year: z
    .number({ invalid_type_error: 'Informe o ano da eleição' })
    .int()
    .min(2024, 'Ano inválido')
    .max(2050, 'Ano inválido'),
  vote_goal: z
    .number({ invalid_type_error: 'Informe a meta de votos' })
    .int()
    .min(1, 'A meta deve ser maior que zero'),
});

type CampaignFormValues = z.infer<typeof campaignSchema>;

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

const STEPS = [
  { number: 1, label: 'Organização', icon: Building2 },
  { number: 2, label: 'Campanha', icon: Flag },
  { number: 3, label: 'Conclusão', icon: CheckCircle2 },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8 select-none">
      {STEPS.map((step, index) => {
        const Icon = step.icon;
        const isCompleted = current > step.number;
        const isActive = current === step.number;

        return (
          <div key={step.number} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`
                  flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300
                  ${
                    isCompleted
                      ? 'bg-blue-700 border-blue-700 text-white shadow-md'
                      : isActive
                      ? 'bg-white border-blue-700 text-blue-700 shadow-lg ring-4 ring-blue-100'
                      : 'bg-white border-gray-300 text-gray-400'
                  }
                `}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              <span
                className={`text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-blue-700'
                    : isCompleted
                    ? 'text-blue-600'
                    : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line between steps */}
            {index < STEPS.length - 1 && (
              <div
                className={`
                  mx-2 mb-5 h-0.5 w-16 sm:w-24 transition-colors duration-300
                  ${current > step.number ? 'bg-blue-700' : 'bg-gray-200'}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Create Organization
// ---------------------------------------------------------------------------

function StepOrganization({
  onNext,
}: {
  onNext: (orgId: string, orgName: string) => void;
}) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OrgFormValues>({
    resolver: zodResolver(orgSchema),
    defaultValues: { name: '', slug: '' },
  });

  // Auto-generate slug from name
  const nameValue = watch('name');
  useEffect(() => {
    if (nameValue) {
      setValue('slug', slugify(nameValue), { shouldValidate: false });
    }
  }, [nameValue, setValue]);

  const onSubmit = async (values: OrgFormValues) => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      // Insert organization
      const { data: orgData, error: orgError } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('organizations' as any)
        .insert({
          name: values.name,
          slug: values.slug,
          owner_id: user.id,
        })
        .select('id, name')
        .single();

      if (orgError) {
        if (orgError.code === '23505') {
          toast.error('Slug já em uso', {
            description: 'Escolha um nome/slug diferente para sua organização.',
          });
        } else {
          toast.error('Erro ao criar organização', {
            description: orgError.message,
          });
        }
        return;
      }

      // Insert user_roles record (admin)
      const { error: roleError } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('user_roles' as any)
        .insert({
          user_id: user.id,
          organization_id: orgData.id,
          role: 'admin',
        });

      if (roleError) {
        console.error('[Onboarding] user_roles insert error:', roleError.message);
        // Non-fatal: continue even if role insert fails
      }

      toast.success('Organização criada!');
      onNext(orgData.id, orgData.name);
    } catch (err) {
      console.error('[Onboarding] unexpected error:', err);
      toast.error('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClass = (hasError: boolean) =>
    `h-11 ${
      hasError
        ? 'border-red-400 focus-visible:ring-red-400'
        : 'border-gray-200 focus-visible:ring-blue-500'
    }`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <CardContent className="space-y-5">
        <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-700">
          Uma <strong>organização</strong> agrupa sua equipe, campanhas e dados.
          Você poderá convidar membros depois.
        </div>

        {/* Organization name */}
        <div className="space-y-1.5">
          <Label htmlFor="org-name" className="text-gray-700 font-medium">
            Nome da Organização
          </Label>
          <Input
            id="org-name"
            type="text"
            placeholder="Ex: Comitê Maria Silva 2026"
            autoComplete="off"
            className={fieldClass(!!errors.name)}
            {...register('name')}
          />
          {errors.name && (
            <p className="text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* Slug */}
        <div className="space-y-1.5">
          <Label htmlFor="org-slug" className="text-gray-700 font-medium">
            Identificador (slug)
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">
              gpd.app/
            </span>
            <Input
              id="org-slug"
              type="text"
              placeholder="comite-maria-silva-2026"
              autoComplete="off"
              className={`pl-[72px] ${fieldClass(!!errors.slug)}`}
              {...register('slug')}
            />
          </div>
          {errors.slug ? (
            <p className="text-xs text-red-500">{errors.slug.message}</p>
          ) : (
            <p className="text-xs text-gray-400">
              Gerado automaticamente. Pode ser editado.
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 text-base font-semibold bg-blue-700 hover:bg-blue-800 active:bg-blue-900 transition-colors"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Criando organização...
            </>
          ) : (
            <>
              Continuar
              <ChevronRight className="ml-1.5 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Create Campaign
// ---------------------------------------------------------------------------

function StepCampaign({
  organizationId,
  onNext,
}: {
  organizationId: string;
  onNext: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: '',
      office: '',
      city: '',
      state: '',
      year: new Date().getFullYear() % 2 === 0
        ? new Date().getFullYear()
        : new Date().getFullYear() + 1,
      vote_goal: undefined,
    },
  });

  const officeValue = watch('office');
  const stateValue = watch('state');

  const onSubmit = async (values: CampaignFormValues) => {
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('campaigns' as any)
        .insert({
          name: values.name,
          office: values.office,
          city: values.city,
          state: values.state,
          year: values.year,
          vote_goal: values.vote_goal,
          organization_id: organizationId,
          mode: 'pre_campanha',
        });

      if (error) {
        toast.error('Erro ao criar campanha', { description: error.message });
        return;
      }

      toast.success('Campanha criada!');
      onNext();
    } catch (err) {
      console.error('[Onboarding] campaign insert error:', err);
      toast.error('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClass = (hasError: boolean) =>
    `h-11 ${
      hasError
        ? 'border-red-400 focus-visible:ring-red-400'
        : 'border-gray-200 focus-visible:ring-blue-500'
    }`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-700">
          Defina os dados básicos da sua <strong>campanha eleitoral</strong>.
          Você poderá ajustá-los depois nas configurações.
        </div>

        {/* Campaign name */}
        <div className="space-y-1.5">
          <Label htmlFor="camp-name" className="text-gray-700 font-medium">
            Nome da Campanha
          </Label>
          <Input
            id="camp-name"
            type="text"
            placeholder="Ex: Maria Silva Vereadora 2026"
            autoComplete="off"
            className={fieldClass(!!errors.name)}
            {...register('name')}
          />
          {errors.name && (
            <p className="text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* Office */}
        <div className="space-y-1.5">
          <Label className="text-gray-700 font-medium">Cargo Disputado</Label>
          <Select
            value={officeValue}
            onValueChange={(val) =>
              setValue('office', val, { shouldValidate: true })
            }
          >
            <SelectTrigger
              className={`h-11 ${
                errors.office
                  ? 'border-red-400 focus:ring-red-400'
                  : 'border-gray-200'
              }`}
            >
              <SelectValue placeholder="Selecione o cargo" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CAMPAIGN_OFFICE).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.office && (
            <p className="text-xs text-red-500">{errors.office.message}</p>
          )}
        </div>

        {/* City + State row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="camp-city" className="text-gray-700 font-medium">
              Cidade
            </Label>
            <Input
              id="camp-city"
              type="text"
              placeholder="Ex: São Paulo"
              autoComplete="off"
              className={fieldClass(!!errors.city)}
              {...register('city')}
            />
            {errors.city && (
              <p className="text-xs text-red-500">{errors.city.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-gray-700 font-medium">Estado</Label>
            <Select
              value={stateValue}
              onValueChange={(val) =>
                setValue('state', val, { shouldValidate: true })
              }
            >
              <SelectTrigger
                className={`h-11 ${
                  errors.state
                    ? 'border-red-400 focus:ring-red-400'
                    : 'border-gray-200'
                }`}
              >
                <SelectValue placeholder="UF" />
              </SelectTrigger>
              <SelectContent>
                {BRAZIL_STATES.map((uf) => (
                  <SelectItem key={uf} value={uf}>
                    {uf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.state && (
              <p className="text-xs text-red-500">{errors.state.message}</p>
            )}
          </div>
        </div>

        {/* Year + Vote goal row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="camp-year" className="text-gray-700 font-medium">
              Ano da Eleição
            </Label>
            <Input
              id="camp-year"
              type="number"
              placeholder="2026"
              min={2024}
              max={2050}
              className={fieldClass(!!errors.year)}
              {...register('year', { valueAsNumber: true })}
            />
            {errors.year && (
              <p className="text-xs text-red-500">{errors.year.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="camp-votes" className="text-gray-700 font-medium">
              Meta de Votos
            </Label>
            <Input
              id="camp-votes"
              type="number"
              placeholder="Ex: 5000"
              min={1}
              className={fieldClass(!!errors.vote_goal)}
              {...register('vote_goal', { valueAsNumber: true })}
            />
            {errors.vote_goal && (
              <p className="text-xs text-red-500">{errors.vote_goal.message}</p>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 text-base font-semibold bg-blue-700 hover:bg-blue-800 active:bg-blue-900 transition-colors"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Criando campanha...
            </>
          ) : (
            <>
              Continuar
              <ChevronRight className="ml-1.5 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Conclusion
// ---------------------------------------------------------------------------

function StepConclusion({ orgName }: { orgName: string }) {
  const navigate = useNavigate();
  const { refreshOrganizations } = useOrganization();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoToDashboard = async () => {
    setIsLoading(true);
    try {
      await refreshOrganizations();
    } catch {
      // silently ignore
    } finally {
      setIsLoading(false);
      navigate('/dashboard');
    }
  };

  return (
    <>
      <CardContent className="flex flex-col items-center text-center space-y-6 py-6">
        {/* Celebration icon */}
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 ring-8 ring-green-50">
            <CheckCircle2 className="h-10 w-10 text-green-600" strokeWidth={1.5} />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-gray-900">
            Tudo pronto, bem-vindo(a) ao GPD!
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
            Sua organização <strong className="text-gray-700">{orgName}</strong> e
            sua campanha foram configuradas com sucesso. Agora você pode gerenciar
            eleitores, demandas, equipe e muito mais.
          </p>
        </div>

        {/* Feature highlights */}
        <div className="w-full grid grid-cols-2 gap-2 text-left">
          {[
            { label: 'Eleitores', desc: 'Cadastre e gerencie apoiadores' },
            { label: 'Demandas', desc: 'Acompanhe pedidos da comunidade' },
            { label: 'Financeiro', desc: 'Controle receitas e despesas' },
            { label: 'Comunicação', desc: 'Planeje conteúdo e eventos' },
          ].map((feat) => (
            <div
              key={feat.label}
              className="rounded-lg bg-gray-50 border border-gray-100 p-3"
            >
              <p className="text-xs font-semibold text-blue-700">{feat.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{feat.desc}</p>
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        <Button
          onClick={handleGoToDashboard}
          disabled={isLoading}
          className="w-full h-11 text-base font-semibold bg-blue-700 hover:bg-blue-800 active:bg-blue-900 transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Carregando...
            </>
          ) : (
            'Ir para o Dashboard'
          )}
        </Button>
      </CardFooter>
    </>
  );
}

// ---------------------------------------------------------------------------
// Main Onboarding page
// ---------------------------------------------------------------------------

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [orgId, setOrgId] = useState('');
  const [orgName, setOrgName] = useState('');

  const handleOrgNext = (id: string, name: string) => {
    setOrgId(id);
    setOrgName(name);
    setStep(2);
  };

  const handleCampaignNext = () => {
    setStep(3);
  };

  const STEP_TITLES: Record<number, { title: string; description: string }> = {
    1: {
      title: 'Criar Organização',
      description: 'Configure o espaço da sua equipe de campanha',
    },
    2: {
      title: 'Criar Campanha',
      description: 'Defina os dados da sua disputa eleitoral',
    },
    3: {
      title: 'Configuração Concluída',
      description: 'Sua plataforma está pronta para uso',
    },
  };

  const currentMeta = STEP_TITLES[step];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 px-4 py-12">
      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-lg space-y-6">
        {/* Brand header */}
        <div className="text-center select-none">
          <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20 shadow-xl">
            <ShieldCheck className="h-6 w-6 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white drop-shadow">
            GPD
          </h1>
          <p className="text-xs font-medium tracking-widest text-blue-200 uppercase mt-0.5">
            Gestor Político Digital
          </p>
        </div>

        {/* Card */}
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-md">
          <CardHeader className="space-y-1 pb-2">
            {/* Step indicator */}
            <StepIndicator current={step} />

            <CardTitle className="text-xl font-bold text-gray-900 text-center">
              {currentMeta.title}
            </CardTitle>
            <CardDescription className="text-gray-500 text-center">
              {currentMeta.description}
            </CardDescription>
          </CardHeader>

          {step === 1 && <StepOrganization onNext={handleOrgNext} />}
          {step === 2 && (
            <StepCampaign organizationId={orgId} onNext={handleCampaignNext} />
          )}
          {step === 3 && <StepConclusion orgName={orgName} />}
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-blue-300/70 select-none">
          &copy; {new Date().getFullYear()} GPD — Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
