import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2, User, LogOut, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function SessionBar() {
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="bg-muted/50 border-b px-4 py-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Verificando sessão...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="bg-primary/5 border-b px-4 py-2 flex items-center justify-between gap-4 text-sm">
      <div className="flex items-center gap-2 min-w-0">
        {user.role === 'admin' ? (
          <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0" />
        ) : (
          <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
        <span className="truncate font-medium">{user.nome}</span>
        {user.role === 'admin' && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex-shrink-0">
            Admin
          </span>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        className="flex-shrink-0 h-7 px-2 text-muted-foreground hover:text-destructive"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline ml-1">Sair</span>
      </Button>
    </div>
  );
}
