'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTurno } from '@/context/TurnoContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Mail, 
  Briefcase, 
  Clock, 
  LogOut, 
  Key,
  CheckCircle,
  XCircle,
  Phone,
  MapPin,
  Camera,
  Pencil,
  Save,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';
import { uploadFotoPropria } from '@/services/funcionarioService';

export default function PerfilPage() {
  const { user, logout } = useAuth();
  const { turnoAtivo, temCheckIn } = useTurno();
  
  // Estados para alteração de senha
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [alterandoSenha, setAlterandoSenha] = useState(false);

  // Estados para edição de perfil
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [isUploadingFoto, setIsUploadingFoto] = useState(false);
  const [isLoadingPerfil, setIsLoadingPerfil] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar dados atualizados do perfil do backend
  const carregarPerfil = async () => {
    try {
      setIsLoadingPerfil(true);
      const response = await api.get('/funcionarios/meu-perfil');
      const perfil = response.data;
      setTelefone(perfil.telefone || '');
      setEndereco(perfil.endereco || '');
      setFotoUrl(perfil.fotoUrl || '');
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      // Fallback para dados do JWT se falhar
      if (user) {
        setTelefone(user.telefone || '');
        setEndereco(user.endereco || '');
        setFotoUrl(user.fotoUrl || '');
      }
    } finally {
      setIsLoadingPerfil(false);
    }
  };

  useEffect(() => {
    if (user) {
      carregarPerfil();
    }
  }, [user]);

  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const handleSavePerfil = async () => {
    setIsSaving(true);
    try {
      await api.patch('/funcionarios/meu-perfil', {
        telefone,
        endereco,
      });
      toast.success('Perfil atualizado com sucesso!');
      setIsEditing(false);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Erro ao atualizar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    carregarPerfil();
    setIsEditing(false);
  };

  const handleFotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não permitido. Use: JPG, PNG, WEBP ou GIF');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo: 5MB');
      return;
    }

    setIsUploadingFoto(true);
    try {
      const funcionarioAtualizado = await uploadFotoPropria(file);
      setFotoUrl(funcionarioAtualizado.fotoUrl || '');
      toast.success('Foto atualizada com sucesso!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao fazer upload da foto');
    } finally {
      setIsUploadingFoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Pessoais
            </div>
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSavePerfil} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={fotoUrl} alt={user?.nome} />
                <AvatarFallback className="text-xl bg-primary/10">
                  {user?.nome ? getInitials(user.nome) : <User className="h-8 w-8" />}
                </AvatarFallback>
              </Avatar>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFotoChange}
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                className="hidden"
              />
              <button
                type="button"
                onClick={handleFotoClick}
                disabled={isUploadingFoto}
                className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1.5 cursor-pointer hover:bg-primary/80 transition-colors disabled:opacity-50"
                title="Alterar foto"
              >
                {isUploadingFoto ? (
                  <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="h-3 w-3 text-white" />
                )}
              </button>
            </div>
            <div>
              <h2 className="text-xl font-semibold">{user?.nome}</h2>
              <Badge className={getCargoColor(user?.cargo || '')}>
                {getCargoLabel(user?.cargo || '')}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground min-w-[70px]">Email:</span>
              <span>{user?.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground min-w-[70px]">Cargo:</span>
              <span>{getCargoLabel(user?.cargo || '')}</span>
            </div>
            
            {/* Telefone */}
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground min-w-[70px]">Telefone:</span>
              {isEditing ? (
                <Input
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="flex-1"
                />
              ) : (
                <span>{telefone || <span className="text-muted-foreground italic">Não informado</span>}</span>
              )}
            </div>

            {/* Endereço */}
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
              <span className="text-muted-foreground min-w-[70px]">Endereço:</span>
              {isEditing ? (
                <Input
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Rua, número, bairro, cidade"
                  className="flex-1"
                />
              ) : (
                <span>{endereco || <span className="text-muted-foreground italic">Não informado</span>}</span>
              )}
            </div>

            {/* Dica de upload de foto */}
            <div className="flex items-center gap-3 text-sm">
              <Camera className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">
                Clique no ícone da câmera na foto para alterar sua imagem
              </span>
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
