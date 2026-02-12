import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogIn, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';

export function UserMenu() {
  const { user, isLoading } = useAuth();
  const { isAdmin } = useAdminCheck();
  const { isFree, plan } = useSubscription();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState<string>('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setFirstName('');
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, username')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          const fullName = profile.display_name || profile.username || '';
          // Pega apenas o primeiro nome
          const first = fullName.split(' ')[0];
          setFirstName(first);
        }
      } catch (error) {
        console.error('Erro ao buscar perfil:', error);
      }
    };

    fetchProfile();
  }, [user]);

  if (isLoading) {
    return (
      <div className="w-9 h-9 rounded-full bg-primary/10 animate-pulse" />
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {isAdmin && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin')}
            className="gap-2 bg-destructive/10 hover:bg-destructive/20 transition-colors"
            title="Painel Admin"
          >
            <Shield className="w-4 h-4 text-destructive" />
            <span className="hidden sm:inline text-destructive font-medium">Admin</span>
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={() => navigate('/profile')}
          className="gap-2 bg-primary/10 hover:bg-primary/20 transition-colors rounded-full px-3"
          title="Meu Perfil"
        >
          <User className="w-5 h-5 text-primary" />
          {firstName && (
            <span className="hidden sm:inline text-primary font-medium">{firstName}</span>
          )}
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      onClick={() => navigate('/auth')}
      className="gap-2 bg-primary/10 hover:bg-primary/20 transition-colors"
      title="Login / Cadastro"
    >
      <LogIn className="w-5 h-5 text-primary" />
      <span className="hidden sm:inline text-primary font-medium">Entrar</span>
    </Button>
  );
}
