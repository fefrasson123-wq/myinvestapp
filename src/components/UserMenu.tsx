import { useNavigate } from 'react-router-dom';
import { User, LogIn, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCheck } from '@/hooks/useAdminCheck';

export function UserMenu() {
  const { user, isLoading } = useAuth();
  const { isAdmin } = useAdminCheck();
  const navigate = useNavigate();

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
          size="icon"
          onClick={() => navigate('/profile')}
          className="rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
          title="Meu Perfil"
        >
          <User className="w-5 h-5 text-primary" />
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
