'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Beer, Users, ShoppingBag, CreditCard, Settings, LogOut, Loader2 } from 'lucide-react';

interface User {
  id: string;
  nome: string;
  email: string;
  cargo: string;
}

export default function TenantDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenantNome, setTenantNome] = useState('');

  useEffect(() => {
    // Verificar autenticação
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const savedSlug = localStorage.getItem('tenant_slug');
    
    if (!token || !userData) {
      router.push(`/t/${slug}/login`);
      return;
    }

    // Verificar se o slug corresponde
    if (savedSlug && savedSlug !== slug) {
      router.push(`/t/${savedSlug}/dashboard`);
      return;
    }

    try {
      setUser(JSON.parse(userData));
    } catch {
      router.push(`/t/${slug}/login`);
      return;
    }

    // Carregar nome do tenant
    async function loadTenant() {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const response = await fetch(`${API_URL}/registro/tenant/${slug}`);
        if (response.ok) {
          const data = await response.json();
          setTenantNome(data.nome);
        }
      } catch (err) {
        console.error('Erro ao carregar tenant:', err);
      } finally {
        setLoading(false);
      }
    }

    loadTenant();
  }, [slug, router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant_slug');
    localStorage.removeItem('tenant_id');
    router.push(`/t/${slug}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  const menuItems = [
    { icon: ShoppingBag, label: 'Pedidos', href: `/t/${slug}/pedidos`, color: 'bg-blue-500' },
    { icon: Users, label: 'Mesas', href: `/t/${slug}/mesas`, color: 'bg-green-500' },
    { icon: CreditCard, label: 'Comandas', href: `/t/${slug}/comandas`, color: 'bg-purple-500' },
    { icon: Settings, label: 'Configurações', href: `/t/${slug}/config`, color: 'bg-gray-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Beer className="h-8 w-8 text-amber-500" />
            <div>
              <h1 className="font-bold text-gray-800">{tenantNome}</h1>
              <p className="text-xs text-gray-500">Olá, {user?.nome}</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition"
          >
            <LogOut className="h-5 w-5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <p className="text-sm text-gray-500">Pedidos Hoje</p>
            <p className="text-2xl font-bold text-gray-800">0</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <p className="text-sm text-gray-500">Mesas Ocupadas</p>
            <p className="text-2xl font-bold text-gray-800">0/10</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <p className="text-sm text-gray-500">Comandas Abertas</p>
            <p className="text-2xl font-bold text-gray-800">0</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <p className="text-sm text-gray-500">Faturamento</p>
            <p className="text-2xl font-bold text-green-600">R$ 0,00</p>
          </div>
        </div>

        {/* Menu Grid */}
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Acesso Rápido</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition flex flex-col items-center gap-3"
            >
              <div className={`${item.color} p-3 rounded-full`}>
                <item.icon className="h-6 w-6 text-white" />
              </div>
              <span className="font-medium text-gray-700">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Info */}
        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm text-amber-800">
            <strong>Dica:</strong> Este é o dashboard do seu estabelecimento. 
            Use o menu acima para gerenciar pedidos, mesas e comandas.
          </p>
        </div>
      </main>
    </div>
  );
}
