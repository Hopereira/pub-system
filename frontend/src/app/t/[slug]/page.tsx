'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Beer, Loader2 } from 'lucide-react';

interface TenantInfo {
  id: string;
  nome: string;
  slug: string;
  status: string;
  plano: string;
}

export default function TenantLoginPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTenant() {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const response = await fetch(`${API_URL}/registro/tenant/${slug}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Estabelecimento não encontrado');
          } else {
            setError('Erro ao carregar estabelecimento');
          }
          return;
        }
        
        const data = await response.json();
        setTenant(data);
        
        // Salvar slug no localStorage para usar nas requisições
        localStorage.setItem('tenant_slug', slug);
        localStorage.setItem('tenant_id', data.id);
        
      } catch (err) {
        console.error('Erro ao carregar tenant:', err);
        setError('Erro de conexão');
      } finally {
        setLoading(false);
      }
    }
    
    if (slug) {
      loadTenant();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-amber-600 mx-auto" />
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
        <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-xl">
          <Beer className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Ops!</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return null;
  }

  // Redirecionar para o login do tenant
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <Beer className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">{tenant.nome}</h1>
          <p className="text-gray-500 text-sm mt-1">Plano: {tenant.plano}</p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={() => {
              // Salvar contexto e ir para login
              localStorage.setItem('tenant_slug', slug);
              localStorage.setItem('tenant_id', tenant.id);
              router.push('/login');
            }}
            className="w-full py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition font-medium"
          >
            Entrar no Sistema
          </button>
          
          <button
            onClick={() => router.push(`/t/${slug}/cardapio`)}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
          >
            Ver Cardápio
          </button>
        </div>
        
        <p className="text-center text-xs text-gray-400 mt-8">
          Powered by Pub System
        </p>
      </div>
    </div>
  );
}
