'use client';

import Link from 'next/link';
import { 
  Beer, 
  Smartphone, 
  BarChart3, 
  Users, 
  Zap, 
  Shield, 
  Globe, 
  CheckCircle,
  ArrowRight,
  Star,
  Clock,
  CreditCard,
  QrCode,
  ChefHat,
  Bell
} from 'lucide-react';

export default function LandingPage() {
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

  const plans = [
    {
      name: 'FREE',
      price: 'R$ 0',
      period: '/mês',
      description: 'Para começar',
      features: [
        '1 ambiente de preparo',
        '5 mesas',
        '2 funcionários',
        'Comandas digitais',
        'Suporte por email',
      ],
      cta: 'Começar Grátis',
      popular: false,
    },
    {
      name: 'BASIC',
      price: 'R$ 99',
      period: '/mês',
      description: 'Para bares pequenos',
      features: [
        '3 ambientes de preparo',
        '20 mesas',
        '10 funcionários',
        'Relatórios básicos',
        'Suporte prioritário',
      ],
      cta: 'Assinar Basic',
      popular: false,
    },
    {
      name: 'PRO',
      price: 'R$ 199',
      period: '/mês',
      description: 'Para bares médios',
      features: [
        'Ambientes ilimitados',
        'Mesas ilimitadas',
        'Funcionários ilimitados',
        'Relatórios avançados',
        'API de integração',
        'Suporte 24/7',
      ],
      cta: 'Assinar Pro',
      popular: true,
    },
    {
      name: 'ENTERPRISE',
      price: 'R$ 499',
      period: '/mês',
      description: 'Para redes e franquias',
      features: [
        'Tudo do PRO',
        'Multi-unidades',
        'White-label',
        'Integrações customizadas',
        'Gerente de conta dedicado',
        'SLA garantido',
      ],
      cta: 'Falar com Vendas',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Beer className="h-8 w-8 text-amber-500" />
              <span className="text-xl font-bold">Pub System</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-300 hover:text-white transition">Recursos</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition">Planos</a>
              <a href="#contact" className="text-gray-300 hover:text-white transition">Contato</a>
            </nav>
            <div className="flex items-center gap-4">
              <Link 
                href="/login" 
                className="text-gray-300 hover:text-white transition"
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
              className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl transition flex items-center gap-2"
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
      <section className="py-12 border-y border-gray-800">
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
                  className="p-6 bg-gray-800/50 border border-gray-700 rounded-2xl hover:border-amber-500/50 transition group"
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
      <section id="pricing" className="py-20 px-4 bg-gray-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Planos para todos os tamanhos
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Comece grátis e escale conforme seu negócio cresce.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div 
                key={plan.name}
                className={`p-6 rounded-2xl border ${
                  plan.popular 
                    ? 'bg-amber-500/10 border-amber-500' 
                    : 'bg-gray-800/50 border-gray-700'
                } relative`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-500 text-black text-xs font-bold rounded-full">
                    MAIS POPULAR
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-300">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-gray-400">{plan.period}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button 
                  className={`w-full py-3 rounded-xl font-semibold transition ${
                    plan.popular
                      ? 'bg-amber-500 hover:bg-amber-600 text-black'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
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
      <footer id="contact" className="py-12 px-4 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Beer className="h-6 w-6 text-amber-500" />
                <span className="font-bold">Pub System</span>
              </div>
              <p className="text-sm text-gray-400">
                Sistema completo de gestão para bares, pubs e restaurantes.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white">Recursos</a></li>
                <li><a href="#pricing" className="hover:text-white">Planos</a></li>
                <li><Link href="/login" className="hover:text-white">Demonstração</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-white">Documentação</a></li>
                <li><a href="#" className="hover:text-white">Contato</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-white">Privacidade</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Pub System. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}