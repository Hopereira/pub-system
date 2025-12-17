// Caminho: frontend/src/components/funcionarios/FuncionarioDetailsDrawer.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Funcionario } from '@/types/funcionario';
import { UpdateFuncionarioDto } from '@/types/funcionario.dto';
import { updateFuncionario, uploadFotoFuncionario } from '@/services/funcionarioService';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Save,
  X,
  Pencil,
  Key,
  Camera
} from 'lucide-react';
import { toast } from 'sonner';

interface FuncionarioDetailsDrawerProps {
  funcionario: Funcionario | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (funcionario: Funcionario) => void;
}

const cargos = ['ADMIN', 'GARCOM', 'CAIXA', 'COZINHEIRO', 'BARTENDER'] as const;

const getCargoLabel = (cargo: string) => {
  const labels: Record<string, string> = {
    'ADMIN': 'Administrador',
    'GARCOM': 'Garçom',
    'CAIXA': 'Caixa',
    'COZINHEIRO': 'Cozinheiro',
    'BARTENDER': 'Bartender',
  };
  return labels[cargo] || cargo;
};

const getCargoColor = (cargo: string) => {
  const cores: Record<string, string> = {
    'ADMIN': 'bg-purple-500',
    'GARCOM': 'bg-green-500',
    'CAIXA': 'bg-yellow-500',
    'COZINHEIRO': 'bg-orange-500',
    'BARTENDER': 'bg-pink-500',
  };
  return cores[cargo] || 'bg-gray-500';
};

const getInitials = (nome: string) => {
  return nome
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

export default function FuncionarioDetailsDrawer({
  funcionario,
  open,
  onOpenChange,
  onUpdate,
}: FuncionarioDetailsDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<UpdateFuncionarioDto>({});
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [isUploadingFoto, setIsUploadingFoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (funcionario && open) {
      setFormData({
        nome: funcionario.nome,
        email: funcionario.email,
        cargo: funcionario.cargo,
        telefone: funcionario.telefone || '',
        endereco: funcionario.endereco || '',
        fotoUrl: funcionario.fotoUrl || '',
      });
      setIsEditing(false);
      setNovaSenha('');
      setConfirmarSenha('');
    }
  }, [funcionario, open]);

  const handleChange = (field: keyof UpdateFuncionarioDto, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!funcionario) return;

    // Validar senha se preenchida
    if (novaSenha) {
      if (novaSenha.length < 6) {
        toast.error('A senha deve ter pelo menos 6 caracteres');
        return;
      }
      if (novaSenha !== confirmarSenha) {
        toast.error('As senhas não coincidem');
        return;
      }
    }

    setIsSaving(true);
    try {
      const dataToUpdate: UpdateFuncionarioDto = { ...formData };
      
      // Adicionar senha se foi preenchida
      if (novaSenha) {
        dataToUpdate.senha = novaSenha;
      }

      const updated = await updateFuncionario(funcionario.id, dataToUpdate);
      toast.success('Funcionário atualizado com sucesso!');
      onUpdate(updated);
      setIsEditing(false);
      setNovaSenha('');
      setConfirmarSenha('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar funcionário');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (funcionario) {
      setFormData({
        nome: funcionario.nome,
        email: funcionario.email,
        cargo: funcionario.cargo,
        telefone: funcionario.telefone || '',
        endereco: funcionario.endereco || '',
        fotoUrl: funcionario.fotoUrl || '',
      });
    }
    setNovaSenha('');
    setConfirmarSenha('');
    setIsEditing(false);
  };

  const handleFotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !funcionario) return;

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
      const funcionarioAtualizado = await uploadFotoFuncionario(funcionario.id, file);
      setFormData(prev => ({ ...prev, fotoUrl: funcionarioAtualizado.fotoUrl || '' }));
      onUpdate(funcionarioAtualizado);
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

  if (!funcionario) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Ficha do Funcionário</span>
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            )}
          </SheetTitle>
          <SheetDescription>
            Visualize e edite as informações completas do funcionário
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Avatar e Info Principal */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={formData.fotoUrl || funcionario.fotoUrl} alt={funcionario.nome} />
                <AvatarFallback className="text-xl bg-primary/10">
                  {getInitials(funcionario.nome)}
                </AvatarFallback>
              </Avatar>
              {/* Botão de upload de foto */}
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
            <div className="flex-1">
              {isEditing ? (
                <Input
                  value={formData.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                  className="text-xl font-semibold"
                />
              ) : (
                <h2 className="text-xl font-semibold">{funcionario.nome}</h2>
              )}
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getCargoColor(funcionario.cargo)}>
                  {getCargoLabel(funcionario.cargo)}
                </Badge>
                <Badge variant={funcionario.status === 'ATIVO' ? 'default' : 'secondary'}>
                  {funcionario.status}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Informações de Contato */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Informações de Contato
            </h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                {isEditing ? (
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="email@exemplo.com"
                  />
                ) : (
                  <span className="text-sm">{funcionario.email}</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                {isEditing ? (
                  <Input
                    value={formData.telefone}
                    onChange={(e) => handleChange('telefone', e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                ) : (
                  <span className="text-sm">
                    {funcionario.telefone || <span className="text-muted-foreground italic">Não informado</span>}
                  </span>
                )}
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                {isEditing ? (
                  <Input
                    value={formData.endereco}
                    onChange={(e) => handleChange('endereco', e.target.value)}
                    placeholder="Rua, número, bairro, cidade"
                  />
                ) : (
                  <span className="text-sm">
                    {funcionario.endereco || <span className="text-muted-foreground italic">Não informado</span>}
                  </span>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Cargo */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Cargo no Sistema
            </h3>

            <div className="flex items-center gap-3">
              <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              {isEditing ? (
                <Select 
                  value={formData.cargo} 
                  onValueChange={(value) => handleChange('cargo', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    {cargos.map(cargo => (
                      <SelectItem key={cargo} value={cargo}>
                        {getCargoLabel(cargo)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className="text-sm">{getCargoLabel(funcionario.cargo)}</span>
              )}
            </div>
          </div>

          {/* Dica de upload de foto */}
          <Separator />
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Foto do Perfil
            </h3>
            <p className="text-xs text-muted-foreground">
              Clique no ícone da câmera na foto para fazer upload de uma nova imagem
            </p>
          </div>

          {/* Alterar Senha (apenas em modo edição) */}
          {isEditing && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Alterar Senha
                </h3>
                <p className="text-xs text-muted-foreground">
                  Deixe em branco para manter a senha atual
                </p>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="novaSenha">Nova Senha</Label>
                    <Input
                      id="novaSenha"
                      type="password"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
                    <Input
                      id="confirmarSenha"
                      type="password"
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      placeholder="Repita a nova senha"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
