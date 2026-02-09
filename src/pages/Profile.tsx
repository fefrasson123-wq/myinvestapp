import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { TrendingUp, ArrowLeft, User, Edit2, Save, X, LogOut, DollarSign, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useValuesVisibility } from '@/contexts/ValuesVisibilityContext';
import { PortfolioAllocationSettings } from '@/components/PortfolioAllocationSettings';
import { useInvestments } from '@/hooks/useInvestments';
import { PassiveIncome } from '@/components/PassiveIncome';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Profile {
  username: string | null;
  display_name: string | null;
}

export default function Profile() {
  const { user, signOut, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    displayCurrency, 
    setDisplayCurrency, 
    formatCurrencyValue, 
    usdBrlRate, 
    isRateLoading, 
    rateLastUpdated 
  } = useValuesVisibility();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Load investments for allocation settings
  const { investments } = useInvestments();

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Load profile
  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username, display_name')
          .eq('user_id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error('Error loading profile:', error);
        }
        
        if (data) {
          setProfile(data);
          setEditUsername(data.username || data.display_name || '');
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: editUsername, display_name: editUsername })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setProfile(prev => prev ? { ...prev, username: editUsername, display_name: editUsername } : null);
      setIsEditing(false);
      toast({
        title: 'Perfil atualizado',
        description: 'Suas alterações foram salvas.',
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: err.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Logout realizado',
      description: 'Você saiu da sua conta.',
    });
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-account');
      
      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || 'Falha ao excluir conta');
      }
      
      // Sign out locally after deletion
      await signOut();
      
      toast({
        title: 'Conta excluída',
        description: 'Sua conta e todos os dados foram removidos permanentemente.',
      });
      
      navigate('/');
    } catch (err: any) {
      console.error('Error deleting account:', err);
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir conta',
        description: err.message || 'Não foi possível excluir sua conta. Tente novamente.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary animate-pulse text-glow">Carregando...</div>
      </div>
    );
  }

  if (!user) return null;

  const displayName = profile?.display_name || profile?.username || user.email?.split('@')[0] || 'Usuário';

  return (
    <>
      <Helmet>
        <title>Meu Perfil - My Invest</title>
        <meta name="description" content="Visualize e edite seu perfil no My Invest." />
      </Helmet>

      <div className="min-h-screen bg-background w-full max-w-full">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/80 backdrop-blur-md">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="mr-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="p-2 rounded-lg bg-primary/20 glow-primary">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary text-glow tracking-tight">
                  Meu Perfil
                </h1>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - Layout responsivo como o Dashboard */}
        <main className="w-full max-w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-7xl mx-auto">
            {/* Coluna da esquerda - Profile Card */}
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="bg-card border border-border rounded-xl shadow-lg p-6 animate-smooth-appear">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center glow-primary">
                    <User className="w-10 h-10 text-primary" />
                  </div>
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Label htmlFor="username">Nome de usuário</Label>
                        <div className="flex gap-2">
                          <Input
                            id="username"
                            value={editUsername}
                            onChange={(e) => setEditUsername(e.target.value)}
                            placeholder="Seu nome"
                          />
                          <Button size="icon" onClick={handleSaveProfile} disabled={isSaving}>
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setIsEditing(false)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl font-bold text-card-foreground">{displayName}</h2>
                          <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    Conta criada em {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              {/* Passive Income Component */}
              <div className="animate-smooth-appear" style={{ animationDelay: '50ms' }}>
                <PassiveIncome />
              </div>
            </div>

            {/* Coluna da direita no desktop */}
            <div className="space-y-6">
              {/* Portfolio Allocation Settings */}
              <div className="animate-smooth-appear" style={{ animationDelay: '100ms' }}>
                <PortfolioAllocationSettings investments={investments} />
              </div>

              {/* Currency Preference Card - Moved below Portfolio Allocation */}
              <div className="bg-card border border-border rounded-xl shadow-lg p-6 animate-smooth-appear" style={{ animationDelay: '150ms' }}>
                <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Moeda de Exibição
                </h3>
                
                <p className="text-sm text-muted-foreground mb-4">
                  Escolha a moeda para exibir seus saldos e valores no app.
                </p>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Button
                    variant={displayCurrency === 'BRL' ? 'default' : 'outline'}
                    className="w-full h-16 flex flex-col items-center justify-center gap-1"
                    onClick={() => setDisplayCurrency('BRL')}
                  >
                    <span className="text-lg font-bold">R$</span>
                    <span className="text-xs">Real Brasileiro</span>
                  </Button>
                  <Button
                    variant={displayCurrency === 'USD' ? 'default' : 'outline'}
                    className="w-full h-16 flex flex-col items-center justify-center gap-1"
                    onClick={() => setDisplayCurrency('USD')}
                  >
                    <span className="text-lg font-bold">$</span>
                    <span className="text-xs">Dólar Americano</span>
                  </Button>
                </div>

                {/* Exchange rate info */}
                <div className="bg-background/50 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Cotação atual</p>
                    <p className="text-sm font-semibold text-card-foreground">
                      {isRateLoading ? (
                        <span className="animate-pulse">Carregando...</span>
                      ) : (
                        <>1 USD = R$ {usdBrlRate.toFixed(4)}</>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                      <RefreshCw className="w-3 h-3" />
                      Tempo real
                    </p>
                    {rateLastUpdated && (
                      <p className="text-xs text-muted-foreground">
                        Atualizado: {rateLastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <div className="animate-smooth-appear" style={{ animationDelay: '200ms' }}>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair da conta
                </Button>
              </div>

              {/* Delete Account Button */}
              <div className="animate-smooth-appear" style={{ animationDelay: '250ms' }}>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-full"
                      disabled={isDeleting}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {isDeleting ? 'Excluindo...' : 'Excluir minha conta'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir conta permanentemente?</AlertDialogTitle>
                      <AlertDialogDescription className="space-y-2">
                        <p>Esta ação é <strong>irreversível</strong>. Ao confirmar:</p>
                        <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                          <li>Todos os seus investimentos serão deletados</li>
                          <li>Todo o histórico de transações será removido</li>
                          <li>Suas metas pessoais serão apagadas</li>
                          <li>Seu perfil será excluído permanentemente</li>
                        </ul>
                        <p className="mt-3 text-sm">
                          Você poderá criar uma nova conta no futuro com o mesmo email.
                        </p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Sim, excluir minha conta
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
