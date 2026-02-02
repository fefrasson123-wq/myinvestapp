import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { TrendingUp, Mail, Lock, User, ArrowLeft, Eye, EyeOff, Loader2, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

const signupSchema = z.object({
  username: z.string().min(3, 'Nome de usuário deve ter pelo menos 3 caracteres').max(50),
  email: z.string().email('E-mail inválido'),
  whatsapp: z.string().min(10, 'Celular deve ter pelo menos 10 dígitos').max(15, 'Celular deve ter no máximo 15 dígitos').regex(/^[0-9]+$/, 'Celular deve conter apenas números'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

const resetPasswordSchema = z.object({
  email: z.string().email('E-mail inválido'),
});

const newPasswordSchema = z.object({
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type AuthMode = 'login' | 'signup' | 'forgot-password' | 'reset-password';

// Format phone number with mask: (11) 99999-9999
const formatPhoneDisplay = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

export default function Auth() {
  const [searchParams] = useSearchParams();
  
  // Determine initial mode based on URL params
  const getInitialMode = (): AuthMode => {
    const modeParam = searchParams.get('mode');
    if (modeParam === 'signup') return 'signup';
    if (modeParam === 'reset') return 'reset-password';
    return 'login';
  };
  
  const [mode, setMode] = useState<AuthMode>(getInitialMode());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isRecoverySession, setIsRecoverySession] = useState(false);
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check for password recovery session (user clicked email link)
  useEffect(() => {
    const handleRecoverySession = async () => {
      // Check if we have hash params from the recovery link
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');
      
      if (accessToken && type === 'recovery') {
        setMode('reset-password');
        setIsRecoverySession(true);
        
        // The session should be set automatically by Supabase
        // Clear the hash from URL for cleaner appearance
        window.history.replaceState(null, '', window.location.pathname + '?mode=reset');
      }
    };

    handleRecoverySession();
  }, []);

  // Redirect if already logged in (except in reset-password mode with recovery session)
  useEffect(() => {
    if (user && mode !== 'reset-password') {
      navigate('/');
    }
  }, [user, navigate, mode]);

  const clearErrors = () => setErrors({});

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    setIsSubmitting(true);

    try {
      const result = resetPasswordSchema.safeParse({ email });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }

      // Use the Supabase built-in password reset which handles the token
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao enviar email',
          description: error.message,
        });
      } else {
        // Send custom styled password reset email
        try {
          await supabase.functions.invoke('send-email', {
            body: {
              type: 'password-reset',
              to: email,
              data: {
                username: 'Investidor',
                resetUrl: `${window.location.origin}/auth?mode=reset`,
                expiresIn: '1 hora'
              }
            }
          });
        } catch (emailError) {
          console.error('Failed to send custom reset email:', emailError);
        }

        toast({
          title: 'Email enviado!',
          description: 'Verifique sua caixa de entrada para redefinir sua senha.',
        });
        setMode('login');
        setEmail('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    setIsSubmitting(true);

    try {
      const result = newPasswordSchema.safeParse({ password, confirmPassword });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao redefinir senha',
          description: error.message,
        });
      } else {
        toast({
          title: 'Senha redefinida!',
          description: 'Sua senha foi alterada com sucesso. Você já está logado.',
        });
        setIsRecoverySession(false);
        navigate('/');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const result = loginSchema.safeParse({ email, password });
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setIsSubmitting(false);
          return;
        }

        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              variant: 'destructive',
              title: 'Erro no login',
              description: 'E-mail ou senha incorretos.',
            });
          } else {
            toast({
              variant: 'destructive',
              title: 'Erro no login',
              description: error.message,
            });
          }
        } else {
          toast({
            title: 'Login realizado!',
            description: 'Bem-vindo de volta!',
          });
          navigate('/');
        }
      } else if (mode === 'signup') {
        const result = signupSchema.safeParse({ username, email, whatsapp, password, confirmPassword });
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setIsSubmitting(false);
          return;
        }

        const { error } = await signUp(email, password, username, whatsapp);
        if (error) {
          if (error.message.includes('User already registered')) {
            toast({
              variant: 'destructive',
              title: 'Erro no cadastro',
              description: 'Este e-mail já está cadastrado.',
            });
          } else {
            toast({
              variant: 'destructive',
              title: 'Erro no cadastro',
              description: error.message,
            });
          }
        } else {
          toast({
            title: 'Conta criada!',
            description: 'Seu cadastro foi realizado com sucesso.',
          });
          navigate('/');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPageTitle = () => {
    switch (mode) {
      case 'login': return 'Login';
      case 'signup': return 'Cadastro';
      case 'forgot-password': return 'Recuperar Senha';
      case 'reset-password': return 'Nova Senha';
      default: return 'Login';
    }
  };

  return (
    <>
      <Helmet>
        <title>{getPageTitle()} - My Invest</title>
        <meta name="description" content="Faça login ou crie sua conta no My Invest para gerenciar seus investimentos." />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/80 backdrop-blur-md relative z-30">
          <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-primary/20 glow-primary">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-primary text-glow tracking-tight">
                    My Invest
                  </h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">Gerencie seus investimentos</p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md lg:max-w-2xl">
            <div className="bg-card border border-border rounded-xl shadow-2xl p-6 sm:p-8 lg:p-10 animate-scale-in">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-card-foreground mb-2">
                  {mode === 'login' && 'Bem-vindo de volta!'}
                  {mode === 'signup' && 'Crie sua conta'}
                  {mode === 'forgot-password' && 'Recuperar senha'}
                  {mode === 'reset-password' && 'Criar nova senha'}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {mode === 'login' && 'Entre com suas credenciais para continuar'}
                  {mode === 'signup' && 'Preencha os dados abaixo para começar'}
                  {mode === 'forgot-password' && 'Informe seu e-mail para receber o link de recuperação'}
                  {mode === 'reset-password' && 'Digite sua nova senha abaixo'}
                </p>
              </div>

              {/* Reset Password Form (new password after clicking email link) */}
              {mode === 'reset-password' ? (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                      Nova senha
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-card-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-destructive">{errors.password}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                      Confirmar nova senha
                    </Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={errors.confirmPassword ? 'border-destructive' : ''}
                    />
                    {errors.confirmPassword && (
                      <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar nova senha'
                    )}
                  </Button>

                  {!isRecoverySession && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        setMode('login');
                        clearErrors();
                        setPassword('');
                        setConfirmPassword('');
                      }}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Voltar ao login
                    </Button>
                  )}
                </form>
              ) : mode === 'forgot-password' ? (
                /* Forgot Password Form */
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      E-mail
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      'Enviar link de recuperação'
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setMode('login');
                      clearErrors();
                    }}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar ao login
                  </Button>
                </form>
              ) : (
                /* Login / Signup Form */
                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === 'signup' && (
                    <div className="space-y-2">
                      <Label htmlFor="username" className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        Nome de usuário
                      </Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="Seu nome de usuário"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className={errors.username ? 'border-destructive' : ''}
                      />
                      {errors.username && (
                        <p className="text-xs text-destructive">{errors.username}</p>
                      )}
                    </div>
                  )}

                  {mode === 'signup' && (
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp" className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        Celular
                      </Label>
                      <Input
                        id="whatsapp"
                        type="tel"
                        placeholder="(11) 99999-9999"
                        value={formatPhoneDisplay(whatsapp)}
                        onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                        className={errors.whatsapp ? 'border-destructive' : ''}
                        maxLength={16}
                      />
                      {errors.whatsapp && (
                        <p className="text-xs text-destructive">{errors.whatsapp}</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      E-mail
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                      Senha
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-card-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-destructive">{errors.password}</p>
                    )}
                  </div>

                  {mode === 'signup' && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-muted-foreground" />
                        Confirmar senha
                      </Label>
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={errors.confirmPassword ? 'border-destructive' : ''}
                      />
                      {errors.confirmPassword && (
                        <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                      )}
                    </div>
                  )}

                  {mode === 'login' && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot-password');
                          clearErrors();
                        }}
                        className="text-sm text-primary hover:underline"
                      >
                        Esqueceu sua senha?
                      </button>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Carregando...
                      </>
                    ) : mode === 'login' ? (
                      'Entrar'
                    ) : (
                      'Criar conta'
                    )}
                  </Button>
                </form>
              )}

              {(mode === 'login' || mode === 'signup') && (
                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    {mode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                    <button
                      type="button"
                      onClick={() => {
                        setMode(mode === 'login' ? 'signup' : 'login');
                        clearErrors();
                      }}
                      className="ml-1 text-primary hover:underline font-medium"
                    >
                      {mode === 'login' ? 'Cadastre-se' : 'Faça login'}
                    </button>
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}