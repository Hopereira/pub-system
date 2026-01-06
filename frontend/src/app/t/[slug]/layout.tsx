'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home, Users, UtensilsCrossed, BookOpen, ClipboardList, BarChart2,
  Settings, Building2, DoorOpen, ChefHat, Landmark,
  Calendar, MapPin, Package, Search, Receipt, Calculator, User,
  Crown, Menu, X, LogOut, Beer
} from 'lucide-react';
import clsx from 'clsx';

interface NavLink {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
}

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const slug = params.slug as string;
  
  const [user, setUser] = useState<any>(null);
  const [tenantNome, setTenantNome] = useState('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthPage, setIsAuthPage] = useState(false);

  useEffect(() => {
    // Verificar se é página de login ou página inicial
    const isLoginOrHome = pathname === `/t/${slug}` || pathname === `/t/${slug}/login`;
    setIsAuthPage(isLoginOrHome);
    
    if (isLoginOrHome) {
      setLoading(false);
      return;
    }

    // Verificar autenticação para páginas protegidas
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push(`/t/${slug}/login`);
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
  }, [slug, router, pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant_slug');
    localStorage.removeItem('tenant_id');
    router.push(`/t/${slug}`);
  };

  // Se for página de login/home, renderiza sem sidebar
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Links de navegação
  const getNavLinks = (): NavLink[] => {
    const baseUrl = `/t/${slug}`;
    return [
      { href: `${baseUrl}/dashboard`, label: 'Dashboard', icon: Home, roles: ['ADMIN', 'GERENTE'] },
      { href: `${baseUrl}/caixa`, label: 'Área do Caixa', icon: Landmark, roles: ['CAIXA', 'ADMIN', 'GERENTE'] },
      { href: `${baseUrl}/caixa/terminal`, label: 'Terminal de Caixa', icon: Search, roles: ['CAIXA', 'ADMIN', 'GERENTE'] },
      { href: `${baseUrl}/caixa/comandas`, label: 'Comandas Abertas', icon: Receipt, roles: ['CAIXA', 'ADMIN', 'GERENTE'] },
      { href: `${baseUrl}/caixa/gestao`, label: 'Gestão de Caixas', icon: Calculator, roles: ['ADMIN', 'GERENTE'] },
      { href: `${baseUrl}/pedidos`, label: 'Gestão de Pedidos', icon: Package, roles: ['ADMIN', 'GERENTE'] },
      { href: `${baseUrl}/mesas`, label: 'Mapa de Mesas', icon: UtensilsCrossed, roles: ['ADMIN', 'GERENTE'] },
      { href: `${baseUrl}/admin/mesas`, label: 'Gerir Mesas', icon: Settings, roles: ['ADMIN'] },
      { href: `${baseUrl}/admin/cardapio`, label: 'Gerir Cardápio', icon: BookOpen, roles: ['ADMIN'] },
      { href: `${baseUrl}/admin/funcionarios`, label: 'Funcionários', icon: Users, roles: ['ADMIN'] },
      { href: `${baseUrl}/admin/ambientes`, label: 'Ambientes', icon: DoorOpen, roles: ['ADMIN'] },
      { href: `${baseUrl}/admin/pontos-entrega`, label: 'Pontos de Entrega', icon: MapPin, roles: ['ADMIN'] },
      { href: `${baseUrl}/admin/eventos`, label: 'Agenda de Eventos', icon: Calendar, roles: ['ADMIN'] },
      { href: `${baseUrl}/admin/empresa`, label: 'Empresa', icon: Building2, roles: ['ADMIN'] },
      { href: `${baseUrl}/relatorios`, label: 'Relatórios', icon: BarChart2, roles: ['ADMIN'] },
      { href: `${baseUrl}/plano`, label: 'Meu Plano', icon: Crown, roles: ['ADMIN'] },
      { href: `${baseUrl}/dashboard/perfil`, label: 'Meu Perfil', icon: User, roles: ['ADMIN', 'GERENTE', 'GARCOM', 'CAIXA', 'COZINHA', 'COZINHEIRO'] },
    ];
  };

  const navLinks = getNavLinks();
  const accessibleLinks = navLinks.filter(link => user?.cargo && link.roles.includes(user.cargo));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-r">
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Beer className="h-8 w-8 text-amber-500" />
            <div>
              <h1 className="font-bold text-gray-800 truncate">{tenantNome || 'Pub System'}</h1>
              <p className="text-xs text-gray-500">{user?.cargo}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="flex flex-col gap-1">
            {accessibleLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-900',
                  { 'bg-amber-50 text-amber-700 font-medium': pathname === link.href }
                )}
              >
                <link.icon className="h-5 w-5" />
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-gray-600 hover:bg-red-50 hover:text-red-600 transition"
          >
            <LogOut className="h-5 w-5" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Beer className="h-6 w-6 text-amber-500" />
            <span className="font-bold text-gray-800">{tenantNome || 'Pub System'}</span>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-gray-100">
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white">
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                <Beer className="h-8 w-8 text-amber-500" />
                <div>
                  <h1 className="font-bold text-gray-800">{tenantNome}</h1>
                  <p className="text-xs text-gray-500">{user?.cargo}</p>
                </div>
              </div>
            </div>
            <nav className="p-4 overflow-y-auto max-h-[calc(100vh-140px)]">
              <div className="flex flex-col gap-1">
                {accessibleLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setSidebarOpen(false)}
                    className={clsx(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-600 transition-all hover:bg-gray-100',
                      { 'bg-amber-50 text-amber-700 font-medium': pathname === link.href }
                    )}
                  >
                    <link.icon className="h-5 w-5" />
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-gray-600 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="h-5 w-5" />
                <span>Sair</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:p-6 p-4 pt-20 md:pt-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
