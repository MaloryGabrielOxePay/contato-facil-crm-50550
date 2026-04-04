import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, ShieldCheck } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
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

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, 'Informe seu nome completo (mínimo 2 caracteres)'),
    email: z
      .string()
      .min(1, 'O e-mail é obrigatório')
      .email('Informe um e-mail válido'),
    password: z
      .string()
      .min(6, 'A senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme sua senha'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setIsSubmitting(true);
    try {
      const { error } = await signUp(
        values.email,
        values.password,
        values.fullName
      );

      if (error) {
        if (error.message.toLowerCase().includes('already registered')) {
          toast.error('E-mail já cadastrado', {
            description: 'Tente fazer login ou use outro e-mail.',
          });
        } else {
          toast.error('Erro ao criar conta', { description: error.message });
        }
        return;
      }

      toast.success('Conta criada com sucesso!', {
        description: 'Vamos configurar seu espaço agora.',
      });
      navigate('/onboarding');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Shared field error styling
  const fieldClass = (hasError: boolean) =>
    `h-11 ${
      hasError
        ? 'border-red-400 focus-visible:ring-red-400'
        : 'border-gray-200 focus-visible:ring-blue-500'
    }`;

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

      <div className="relative w-full max-w-md space-y-8">
        {/* Brand */}
        <div className="text-center select-none">
          <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20 shadow-xl">
            <ShieldCheck className="h-8 w-8 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-5xl font-black tracking-tight text-white drop-shadow">
            GPD
          </h1>
          <p className="mt-1 text-sm font-medium tracking-widest text-blue-200 uppercase">
            Gestor Político Digital
          </p>
        </div>

        {/* Card */}
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-md">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Criar conta
            </CardTitle>
            <CardDescription className="text-gray-500">
              Comece a gerenciar sua campanha hoje mesmo
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <CardContent className="space-y-4">
              {/* Full name */}
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-gray-700 font-medium">
                  Nome Completo
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Maria da Silva"
                  autoComplete="name"
                  className={fieldClass(!!errors.fullName)}
                  {...register('fullName')}
                />
                {errors.fullName && (
                  <p className="text-xs text-red-500">{errors.fullName.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  className={fieldClass(!!errors.email)}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  className={fieldClass(!!errors.password)}
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="confirmPassword"
                  className="text-gray-700 font-medium"
                >
                  Confirmar Senha
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repita a senha"
                  autoComplete="new-password"
                  className={fieldClass(!!errors.confirmPassword)}
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 text-base font-semibold bg-blue-700 hover:bg-blue-800 active:bg-blue-900 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  'Criar conta'
                )}
              </Button>

              <p className="text-sm text-gray-500 text-center">
                Já tem conta?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-blue-700 hover:text-blue-900 hover:underline transition-colors"
                >
                  Entrar
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

        {/* Footer note */}
        <p className="text-center text-xs text-blue-300/70 select-none">
          &copy; {new Date().getFullYear()} GPD — Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
