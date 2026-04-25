'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Beer, 
  BarChart3, 
  Users, 
  Zap, 
  Globe, 
  CheckCircle,
  ArrowRight,
  QrCode,
  ChefHat,
  Bell,
  Sun,
  Moon,
  Loader2,
} from 'lucide-react';

interface PlanFromAPI {
  code: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  limits: {
    maxMesas: number;
    maxFuncionarios: number;
    maxProdutos: number;
    maxAmbientes: number;
    maxEventos: number;
    storageGB: number;
  };
  isPopular: boolean;
}

const FEATURE_LABELS: Record<string, string> = {
  pedidos: 'Sistema de Pedidos',
  comandas: 'Comandas Digitais',
  mesas: 'Gestão de Mesas',
  produtos: 'Cardápio Digital',
  funcionarios: 'Gestão de Funcionários',
  clientes: 'Cadastro de Clientes',
  avaliacoes: 'Sistema de Avaliações',
  eventos: 'Agenda de Eventos',
  pontos_entrega: 'Pontos de Entrega',
  turnos: 'Controle de Turnos',
  analytics: 'Relatórios Avançados',
  relatorios_avancados: 'Dashboards',
  medalhas: 'Gamificação',
  caixa_avancado: 'Caixa Avançado',
  api_externa: 'API de Integração',
  webhooks: 'Webhooks',
  white_label: 'White-label',
  multi_unidade: 'Multi-unidades',
  suporte_prioritario: 'Suporte 24/7',
};

export default function LandingPage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [apiPlans, setApiPlans] = useState<PlanFromAPI[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    // Carregar tema salvo
    const savedTheme = localStorage.getItem('landing-theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    // Salvar tema
    localStorage.setItem('landing-theme', theme);
  }, [theme]);

  useEffect(() => {
    // Carregar planos da API
    const loadPlans = async () => {
      try {
        // Usa BFF proxy (same-origin) para evitar CORS
        const response = await fetch('/api/proxy/plans/public');
        if (response.ok) {
          const data = await response.json();
          setApiPlans(data);
        }
      } catch (error) {
        console.error('Erro ao carregar planos:', error);
      } finally {
        setLoadingPlans(false);
      }
    };
    loadPlans();
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const formatLimit = (value: number) => {
    return value === -1 ? 'Ilimitado' : value.toString();
  };

  const getPlanFeaturesList = (plan: PlanFromAPI): string[] => {
    const list: string[] = [];
    
    // Adicionar limites
    if (plan.limits.maxAmbientes > 0) {
      list.push(`${formatLimit(plan.limits.maxAmbientes)} ambiente${plan.limits.maxAmbientes !== 1 ? 's' : ''} de preparo`);
    }
    list.push(`${formatLimit(plan.limits.maxMesas)} mesas`);
    list.push(`${formatLimit(plan.limits.maxFuncionarios)} funcionários`);
    
    // Adicionar algumas features principais
    if (plan.features.includes('relatorios_avancados') || plan.features.includes('analytics')) {
      list.push('Relatórios avançados');
    } else if (plan.features.includes('comandas')) {
      list.push('Relatórios básicos');
    }
    
    if (plan.features.includes('suporte_prioritario')) {
      list.push('Suporte 24/7');
    } else if (plan.features.includes('eventos')) {
      list.push('Suporte prioritário');
    } else {
      list.push('Suporte por email');
    }

    if (plan.features.includes('api_externa')) {
      list.push('API de integração');
    }

    if (plan.features.includes('white_label')) {
      list.push('White-label');
    }

    if (plan.features.includes('multi_unidade')) {
      list.push('Multi-unidades');
    }

    return list;
  };

  const getCTA = (planCode: string): string => {
    switch (planCode) {
      case 'FREE': return 'Começar Grátis';
      case 'BASIC': return 'Assinar Basic';
      case 'STANDARD': return 'Assinar Standard';
      case 'PRO': return 'Assinar Pro';
      case 'ENTERPRISE': return 'Assinar Enterprise';
      default: return 'Assinar';
    }
  };

  const features = [
    {
      icon: QrCode,
      title: 'Comandas Digitais',
      description: 'Clientes acompanham pedidos em tempo real via QR Code, sem precisar de app.',
    },
    {
      icon: ChefHat,
      title: 'Gestão de Cozinha',
      description: 'Painéis Kanban para cada ambiente de preparo com notificações sonoras.',
    },
    {
      icon: Bell,
      title: 'Tempo Real',
      description: 'WebSocket integrado para atualizações instantâneas em todo o sistema.',
    },
    {
      icon: Users,
      title: 'Multi-Funcionários',
      description: 'Controle de acesso por cargo: Admin, Gerente, Caixa, Garçom, Cozinheiro.',
    },
    {
      icon: BarChart3,
      title: 'Relatórios',
      description: 'Dashboard com métricas de vendas, produtos mais vendidos e performance.',
    },
    {
      icon: Globe,
      title: 'Subdomínio Próprio',
      description: 'Cada estabelecimento tem seu próprio endereço: seunome.pubsystem.com.br',
    },
  ];

  // Planos fallback caso API não responda
  const fallbackPlans = [
    { code: 'FREE', name: 'Free', description: 'Para começar', priceMonthly: 0, features: ['pedidos', 'comandas'], limits: { maxMesas: 5, maxFuncionarios: 2, maxAmbientes: 1, maxProdutos: 30, maxEventos: 0, storageGB: 1 }, isPopular: false },
    { code: 'BASIC', name: 'Basic', description: 'Para bares pequenos', priceMonthly: 99, features: ['pedidos', 'comandas', 'eventos'], limits: { maxMesas: 20, maxFuncionarios: 10, maxAmbientes: 3, maxProdutos: 100, maxEventos: 5, storageGB: 5 }, isPopular: false },
    { code: 'PRO', name: 'Pro', description: 'Para bares médios', priceMonthly: 199, features: ['pedidos', 'comandas', 'eventos', 'analytics', 'api_externa'], limits: { maxMesas: -1, maxFuncionarios: -1, maxAmbientes: -1, maxProdutos: -1, maxEventos: 20, storageGB: 20 }, isPopular: true },
    { code: 'ENTERPRISE', name: 'Enterprise', description: 'Para redes e franquias', priceMonthly: 499, features: ['pedidos', 'comandas', 'eventos', 'analytics', 'api_externa', 'white_label', 'multi_unidade', 'suporte_prioritario'], limits: { maxMesas: -1, maxFuncionarios: -1, maxAmbientes: -1, maxProdutos: -1, maxEventos: -1, storageGB: 100 }, isPopular: false },
  ] as PlanFromAPI[];

  const displayPlans = apiPlans.length > 0 ? apiPlans : fallbackPlans;

  // Classes baseadas no tema
  const themeClasses = theme === 'dark' ? {
    bg: 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900',
    text: 'text-white',
    textMuted: 'text-gray-400',
    textSubtle: 'text-gray-500',
    header: 'bg-gray-900/80 border-gray-800',
    card: 'bg-gray-800/50 border-gray-700',
    cardHighlight: 'bg-amber-500/10 border-amber-500',
    button: 'bg-gray-700 hover:bg-gray-600 text-white',
    border: 'border-gray-800',
  } : {
    bg: 'bg-gradient-to-b from-gray-50 via-white to-gray-100',
    text: 'text-gray-900',
    textMuted: 'text-gray-600',
    textSubtle: 'text-gray-500',
    header: 'bg-white/80 border-gray-200',
    card: 'bg-white border-gray-200 shadow-sm',
    cardHighlight: 'bg-amber-50 border-amber-500 shadow-lg',
    button: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
    border: 'border-gray-200',
  };

  return (
    <div className={`min-h-screen ${themeClasses.bg} ${themeClasses.text}`}>
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b ${themeClasses.header}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Beer className="h-8 w-8 text-amber-500" />
              <span className="text-xl font-bold">Pub System</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className={`${themeClasses.textMuted} hover:${themeClasses.text} transition`}>Recursos</a>
              <a href="#pricing" className={`${themeClasses.textMuted} hover:${themeClasses.text} transition`}>Planos</a>
              <a href="#contact" className={`${themeClasses.textMuted} hover:${themeClasses.text} transition`}>Contato</a>
            </nav>
            <div className="flex items-center gap-4">
              {/* Toggle Tema */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg ${themeClasses.button} transition`}
                title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <Link 
                href="/login" 
                className={`${themeClasses.textMuted} hover:opacity-80 transition`}
              >
                Entrar
              </Link>
              <Link 
                href="/login"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg transition"
              >
                Área Admin
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-sm mb-8">
            <Zap className="h-4 w-4" />
            Sistema completo para bares e pubs
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Gerencie seu bar com
            <span className="text-amber-500"> inteligência</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Comandas digitais, gestão de pedidos em tempo real, painéis de preparo 
            e muito mais. Tudo em uma plataforma moderna e fácil de usar.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/primeiro-acesso"
              className="inline-flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl transition"
            >
              Começar Gratuitamente
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link 
              href="/login"
              className="px-8 py-4 border border-gray-600 hover:border-gray-500 rounded-xl transition flex items-center gap-2"
            >
              Ver Demonstração
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            ✓ Sem cartão de crédito &nbsp; ✓ Setup em 5 minutos &nbsp; ✓ Suporte incluído
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className={`py-12 border-y ${themeClasses.border}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl md:text-4xl font-bold text-amber-500">500+</p>
              <p className="text-gray-400 mt-1">Bares ativos</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-amber-500">50k+</p>
              <p className="text-gray-400 mt-1">Pedidos/dia</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-amber-500">99.9%</p>
              <p className="text-gray-400 mt-1">Uptime</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-amber-500">4.9</p>
              <p className="text-gray-400 mt-1">Avaliação</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que seu bar precisa
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Uma plataforma completa para gerenciar comandas, pedidos, estoque e equipe.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <div 
                  key={feature.title}
                  className={`p-6 ${themeClasses.card} border rounded-2xl hover:border-amber-500/50 transition group`}
                >
                  <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition">
                    <IconComponent className="h-6 w-6 text-amber-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className={`py-20 px-4 ${theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-100/50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Planos para todos os tamanhos
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Comece grátis e escale conforme seu negócio cresce.
            </p>
          </div>
          {loadingPlans ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
          ) : (
            <div className={`grid gap-6 ${displayPlans.length <= 4 ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'}`}>
              {displayPlans.map((plan) => (
                <div 
                  key={plan.code}
                  className={`p-6 rounded-2xl border ${
                    plan.isPopular 
                      ? themeClasses.cardHighlight
                      : themeClasses.card
                  } relative`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-500 text-black text-xs font-bold rounded-full">
                      MAIS POPULAR
                    </div>
                  )}
                  <div className="text-center mb-6">
                    <h3 className={`text-lg font-semibold ${themeClasses.textMuted}`}>{plan.name}</h3>
                    <div className="mt-2">
                      <span className="text-4xl font-bold">R$ {Number(plan.priceMonthly).toFixed(0)}</span>
                      <span className={themeClasses.textMuted}>/mês</span>
                    </div>
                    <p className={`text-sm ${themeClasses.textSubtle} mt-1`}>{plan.description}</p>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {getPlanFeaturesList(plan).map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className={themeClasses.textMuted}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/primeiro-acesso?plano=${plan.code.toLowerCase()}`}
                    className={`w-full py-3 rounded-xl font-semibold transition flex items-center justify-center ${
                      plan.isPopular
                        ? 'bg-amber-500 hover:bg-amber-600 text-black'
                        : themeClasses.button
                    }`}
                  >
                    {getCTA(plan.code)}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Pronto para modernizar seu bar?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Junte-se a centenas de estabelecimentos que já usam o Pub System.
          </p>
          <Link 
            href="/primeiro-acesso"
            className="inline-flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl transition"
          >
            Criar Conta Grátis
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className={`py-12 px-4 border-t ${themeClasses.border}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Beer className="h-6 w-6 text-amber-500" />
                <span className="font-bold">Pub System</span>
              </div>
              <p className={`text-sm ${themeClasses.textMuted}`}>
                Sistema completo de gestão para bares, pubs e restaurantes.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className={`space-y-2 text-sm ${themeClasses.textMuted}`}>
                <li><a href="#features" className="hover:text-white">Recursos</a></li>
                <li><a href="#pricing" className="hover:text-white">Planos</a></li>
                <li><Link href="/login" className="hover:text-white">Demonstração</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className={`space-y-2 text-sm ${themeClasses.textMuted}`}>
                <li><a href="#" className="hover:text-white">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-white">Documentação</a></li>
                <li><a href="#" className="hover:text-white">Contato</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className={`space-y-2 text-sm ${themeClasses.textMuted}`}>
                <li><a href="#" className="hover:text-white">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-white">Privacidade</a></li>
              </ul>
            </div>
          </div>
          <div className={`mt-12 pt-8 border-t ${themeClasses.border} text-center text-sm ${themeClasses.textSubtle}`}>
            &copy; {new Date().getFullYear()} Pub System. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}