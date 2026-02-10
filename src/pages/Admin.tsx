import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, TrendingUp, ArrowLeft, Loader2, UserPlus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { categoryLabels } from '@/types/investment';

interface UserData {
  id: string;
  email: string;
  display_name: string;
  username: string | null;
  whatsapp: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  roles: string[];
  investments_count: number;
  investments: Array<{
    id: string;
    name: string;
    category: string;
    current_value: number;
  }>;
}

export default function Admin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isLoading: isCheckingAdmin } = useAdminCheck();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<string>('user');
  const [isAddingRole, setIsAddingRole] = useState(false);

  useEffect(() => {
    if (!isCheckingAdmin && !isAdmin) {
      toast.error('Acesso negado. Apenas administradores.');
      navigate('/app');
    }
  }, [isAdmin, isCheckingAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-list-users');
      
      if (error) throw error;
      
      setUsers(data.users || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRole = async () => {
    if (!newAdminEmail.trim()) {
      toast.error('Digite o email do usuário');
      return;
    }

    setIsAddingRole(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-set-role', {
        body: { email: newAdminEmail, role: newAdminRole }
      });

      if (error) throw error;

      toast.success(data.message);
      setNewAdminEmail('');
      setNewAdminRole('user');
      fetchUsers();
    } catch (error: any) {
      console.error('Erro ao adicionar role:', error);
      toast.error(error.message || 'Erro ao adicionar role');
    } finally {
      setIsAddingRole(false);
    }
  };

  if (isCheckingAdmin || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/app')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="p-2 rounded-lg bg-destructive/20">
                <Shield className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary">Painel Administrativo</h1>
                <p className="text-sm text-muted-foreground">Gerenciamento de usuários e ativos</p>
              </div>
            </div>
            <Badge variant="destructive" className="gap-1">
              <Shield className="w-3 h-3" />
              Admin
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total de Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{users.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Administradores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-destructive">
                {users.filter(u => u.roles.includes('admin')).length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Total de Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-success">
                {users.reduce((acc, u) => acc + u.investments_count, 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Add Role */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Adicionar Role a Usuário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="email">Email do Usuário</Label>
                <Input
                  id="email"
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="w-full sm:w-48">
                <Label>Role</Label>
                <Select value={newAdminRole} onValueChange={setNewAdminRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="moderator">Moderador</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddRole} disabled={isAddingRole}>
                  {isAddingRole ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Adicionar'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Usuários Cadastrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Ativos</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead>Último Login</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((userData) => (
                    <TableRow key={userData.id}>
                      <TableCell className="font-medium">{userData.email}</TableCell>
                      <TableCell>{userData.display_name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {userData.whatsapp ? (
                          <a 
                            href={`https://wa.me/55${userData.whatsapp}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {userData.whatsapp}
                          </a>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {userData.roles.length > 0 ? (
                            userData.roles.map((role) => (
                              <Badge 
                                key={role} 
                                variant={role === 'admin' ? 'destructive' : role === 'moderator' ? 'secondary' : 'outline'}
                              >
                                {role}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline">user</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{userData.investments_count}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(userData.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {userData.last_sign_in_at 
                          ? new Date(userData.last_sign_in_at).toLocaleDateString('pt-BR')
                          : 'Nunca'
                        }
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedUser(userData)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Ver Ativos
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>
                                Ativos de {userData.display_name || userData.email}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              {userData.investments.length > 0 ? (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Nome</TableHead>
                                      <TableHead>Categoria</TableHead>
                                      <TableHead>Valor Atual</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {userData.investments.map((inv) => (
                                      <TableRow key={inv.id}>
                                        <TableCell>{inv.name}</TableCell>
                                        <TableCell>
                                          <Badge variant="outline">
                                            {categoryLabels[inv.category as keyof typeof categoryLabels] || inv.category}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium text-success">
                                          R$ {inv.current_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              ) : (
                                <p className="text-center text-muted-foreground py-8">
                                  Este usuário não possui ativos cadastrados.
                                </p>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}