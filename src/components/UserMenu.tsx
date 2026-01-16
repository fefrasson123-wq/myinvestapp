import { useNavigate } from 'react-router-dom';
import { User, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export function UserMenu() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="w-9 h-9 rounded-full bg-primary/10 animate-pulse" />
    );
  }

  if (user) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate('/profile')}
        className="rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
        title="Meu Perfil"
      >
        <User className="w-5 h-5 text-primary" />
      </Button>
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
