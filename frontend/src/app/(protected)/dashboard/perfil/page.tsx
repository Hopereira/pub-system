'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTurno } from '@/context/TurnoContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Briefcase, 
  Clock, 
  LogOut, 
  Key,
  CheckCircle,
  XCircle,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';

export default function PerfilPage() {
  const { user, logout } = useAuth();
  const { turnoAtivo, temCheckIn } = useTurno();
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [alterandoSenha, setAlterandoSenha] = useState(false);

  const handleAlterarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (novaSenha !== confirmarSenha) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (novaSenha.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    setAlterandoSenha(true);
    try {
      await api.patch('/funcionarios/alterar-senha', { senhaAtual, novaSenha });
      toast.success('Senha alterada com sucesso!');
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao alterar senha');
    } finally {
      setAlterandoSenha(false);
    }
  };

  const getCargoLabel = (cargo: string) => {
    const cargos: Record<string, string> = {
      'ADMIN': 'Administrador',
      'GERENTE': 'Gerente',
      'GARCOM': 'Garçom',
      'CAIXA': 'Caixa',
      'COZINHEIRO': 'Cozinheiro',
      'BARTENDER': 'Bartender',
      'PREPARO': 'Preparo',
    };
    return cargos[cargo] || cargo;
  };

  const getCargoColor = (cargo: string) => {
    const cores: Record<string, string> = {
      'ADMIN': 'bg-purple-500',
      'GERENTE': 'bg-blue-500',
      'GARCOM': 'bg-green-500',
      'CAIXA': 'bg-yellow-500',
      'COZINHEIRO': 'bg-orange-500',
      'BARTENDER': 'bg-pink-500',
      'PREPARO': 'bg-orange-500',
    };
    return cores[cargo] || 'bg-gray-500';
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Meu Perfil</h1>

      {/* Informações do Usuário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{user?.nome}</h2>
              <Badge className={getCargoColor(user?.cargo || '')}>
                {getCargoLabel(user?.cargo || '')}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="grid gap-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Email:</span>
              <span>{user?.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Cargo:</span>
              <span>{getCargoLabel(user?.cargo || '')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status do Turno */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Status do Turno
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {temCheckIn ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium text-green-600">Turno Ativo</p>
                  {turnoAtivo?.checkIn && (
                    <p className="text-sm text-muted-foreground">
                      Início: {new Date(turnoAtivo.checkIn).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-500">Sem turno ativo</p>
                  <p className="text-sm text-muted-foreground">
                    Faça check-in para iniciar seu turno
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alterar Senha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Alterar Senha
          </CardTitle>
          <CardDescription>
            Altere sua senha de acesso ao sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAlterarSenha} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="senhaAtual">Senha Atual</Label>
              <Input
                id="senhaAtual"
                type="password"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                placeholder="Digite sua senha atual"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="novaSenha">Nova Senha</Label>
              <Input
                id="novaSenha"
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Digite a nova senha"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
              <Input
                id="confirmarSenha"
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Confirme a nova senha"
                required
              />
            </div>
            <Button type="submit" disabled={alterandoSenha} className="w-full">
              {alterandoSenha ? 'Alterando...' : 'Alterar Senha'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Botão Sair */}
      <Card>
        <CardContent className="pt-6">
          <Button 
            variant="destructive" 
            onClick={logout} 
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair do Sistema
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
