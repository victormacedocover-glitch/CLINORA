import React, { useState } from 'react';
import {
  Users,
  Calendar,
  FileText,
  DollarSign,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  Building2,
  Clock,
  HeartPulse,
  Lock,
} from 'lucide-react';
import { CLINORA_PRO_PLAN } from '../types';

interface LandingPageProps {
  onNavigate: (route: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const beneficios = [
    {
      icon: Clock,
      title: 'Economia de Tempo',
      description:
        'Reduza em até 80% o tempo gasto com tarefas burocráticas e rotineiras da recepção e consultório.',
    },
    {
      icon: TrendingUp,
      title: 'Aumento de Faturamento',
      description:
        'Acompanhe orçamentos pendentes e feche mais procedimentos com o funil visual de oportunidades.',
    },
    {
      icon: CheckCircle2,
      title: 'Zero Faltas e Confusão',
      description:
        'Agenda visual com status claro das consultas para manter seus horários sempre otimizados.',
    },
    {
      icon: Shield,
      title: 'Organização e Segurança',
      description:
        'Histórico organizado de pacientes e registros financeiros protegidos em nuvem com isolamento de dados.',
    },
  ];

  const funcionalidades = [
    {
      icon: Users,
      title: 'Pacientes',
      description: 'Cadastro detalhado, contato rápido e histórico organizado por clínica.',
    },
    {
      icon: Calendar,
      title: 'Agenda',
      description: 'Visualização diária, semanal e em lista com controle de status das consultas.',
    },
    {
      icon: FileText,
      title: 'Orçamentos',
      description: 'Criação ágil de orçamentos com vinculação de procedimentos e acompanhamento do status.',
    },
    {
      icon: DollarSign,
      title: 'Financeiro Básico',
      description: 'Controle de receitas, despesas e saldo mensal sem complicações contábeis.',
    },
    {
      icon: CheckCircle2,
      title: 'Tarefas',
      description: 'Gerenciamento simples de pendências e rotinas da sua equipe.',
    },
    {
      icon: HeartPulse,
      title: 'Oportunidades',
      description: 'Acompanhe novos leads desde o primeiro contato até a conversão em cliente.',
    },
    {
      icon: BarChart3,
      title: 'Relatórios',
      description: 'Visão clara dos principais indicadores de desempenho e faturamento da clínica.',
    },
  ];

  const comoFuncionaSteps = [
    {
      step: '01',
      title: 'Cadastre sua Clínica',
      desc: 'Informe o nome da sua clínica, e-mail e crie sua senha com rapidez em menos de 1 minuto.',
    },
    {
      step: '02',
      title: 'Ative a Assinatura',
      desc: 'Realize o pagamento seguro via Mercado Pago no plano mensal Clinora Pro sem fidelidade.',
    },
    {
      step: '03',
      title: 'Acesse e Organize',
      desc: 'Comece a usar imediatamente a agenda, pacientes, orçamentos e financeiro da sua clínica.',
    },
  ];

  const paraQuemIs = [
    {
      title: 'Clínicas Odontológicas',
      desc: 'Perfeito para dentistas e consultórios odonto que precisam organizar consultas e orçamentos.',
    },
    {
      title: 'Clínicas de Estética',
      desc: 'Ideal para clínicas estéticas que buscam acompanhar sessões, procedimentos e oportunidades.',
    },
    {
      title: 'Pequenos Consultórios',
      desc: 'Feito sob medida para profissionais liberais que querem gestão descomplicada sem pagar caro.',
    },
  ];

  const faqs = [
    {
      q: 'O que é o Clinora?',
      a: 'O Clinora é um sistema de gestão web completo para clínicas e consultórios odontológicos e de estética. Ele centraliza pacientes, agenda, orçamentos, financeiro, tarefas e oportunidades em um único lugar.',
    },
    {
      q: 'Quanto custa a assinatura?',
      a: `O Clinora possui um Plano Único, o Clinora Pro, pelo valor fixo de R$ ${CLINORA_PRO_PLAN.price.toFixed(
        2
      ).replace('.', ',')} por mês. Não há taxas de adesão nem custos escondidos.`,
    },
    {
      q: 'Existe contrato de fidelidade?',
      a: 'Não! Você pode cancelar sua assinatura mensal a qualquer momento sem qualquer multa ou carência.',
    },
    {
      q: 'Como funciona o pagamento?',
      a: 'O pagamento é processado com total segurança através da API oficial do Mercado Pago (cartão de crédito ou boleto/pix recorrente segundo a modalidade escolhida).',
    },
    {
      q: 'Meus dados e os dados dos pacientes ficam seguros?',
      a: 'Sim. Cada clínica possui isolamento total de dados no banco de dados via Row Level Security (RLS). Nenhuma outra clínica tem acesso às suas informações.',
    },
    {
      q: 'Preciso instalar algum programa no computador?',
      a: 'Não. O Clinora é 100% online na nuvem. Você pode acessar de qualquer computador, tablet ou celular conectado à internet.',
    },
  ];

  return (
    <div className="bg-slate-900 text-slate-100 min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32 border-b border-slate-800">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-teal-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-10 right-10 w-[300px] h-[300px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Sua clínica no próximo nível
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
              A gestão da sua clínica, <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-300">simples e organizada.</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 font-normal leading-relaxed">
              Centralize <strong className="text-white font-medium">pacientes, agenda, orçamentos, financeiro, tarefas e relatórios</strong> em uma única plataforma intuitiva projetada para clínicas odontológicas e de estética.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => onNavigate('/cadastro')}
                className="w-full sm:w-auto bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-bold text-base px-8 py-4 rounded-xl shadow-xl shadow-teal-500/20 hover:shadow-teal-500/30 transition-all flex items-center justify-center gap-2 group"
                id="hero-cta-main"
              >
                Começar agora
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => onNavigate('/login')}
                className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-base px-8 py-4 rounded-xl border border-slate-700 transition-colors"
                id="hero-cta-login"
              >
                Já tenho uma conta (Entrar)
              </button>
            </div>

            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-teal-400" /> Sem taxa de instalação
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-teal-400" /> Cancele quando quiser
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-teal-400" /> Pagamento 100% seguro
              </span>
            </div>
          </div>

          {/* Interactive Interface Preview Mockup */}
          <div className="mt-14 relative rounded-2xl border border-slate-800 bg-slate-950/80 p-3 sm:p-5 shadow-2xl shadow-teal-950/40">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 px-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="text-xs text-slate-500 ml-2 font-mono">clinora.app/dashboard</span>
              </div>
              <div className="text-xs text-teal-400 font-medium flex items-center gap-1 bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/20">
                <Zap className="w-3.5 h-3.5" /> Clinora Pro Ativo
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Stat card 1 */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-slate-400 font-medium">Pacientes Cadastrados</span>
                  <Users className="w-4 h-4 text-teal-400" />
                </div>
                <p className="text-2xl font-bold text-white">1.482</p>
                <p className="text-[11px] text-teal-400 mt-1">+28 este mês</p>
              </div>

              {/* Stat card 2 */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-slate-400 font-medium">Consultas de Hoje</span>
                  <Calendar className="w-4 h-4 text-teal-400" />
                </div>
                <p className="text-2xl font-bold text-white">12</p>
                <p className="text-[11px] text-slate-400 mt-1">9 confirmadas | 3 a realizar</p>
              </div>

              {/* Stat card 3 */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-slate-400 font-medium">Orçamentos Aprovados</span>
                  <FileText className="w-4 h-4 text-teal-400" />
                </div>
                <p className="text-2xl font-bold text-white">R$ 38.450</p>
                <p className="text-[11px] text-teal-400 mt-1">84% de conversão</p>
              </div>

              {/* Stat card 4 */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-slate-400 font-medium">Receita Líquida</span>
                  <DollarSign className="w-4 h-4 text-teal-400" />
                </div>
                <p className="text-2xl font-bold text-white">R$ 52.190</p>
                <p className="text-[11px] text-teal-400 mt-1">Entradas em dia</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BENEFÍCIOS SECTION */}
      <section id="beneficios" className="py-20 border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-teal-400 tracking-wider uppercase mb-2">
              Por que escolher o Clinora?
            </h2>
            <p className="text-3xl font-bold text-white sm:text-4xl">
              Projetado para eliminar o caos da sua rotina
            </p>
            <p className="text-slate-400 mt-3 text-sm">
              Tudo o que sua equipe precisa para focar no atendimento ao paciente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {beneficios.map((b, i) => {
              const Icon = b.icon;
              return (
                <div
                  key={i}
                  className="bg-slate-950 border border-slate-800 p-6 rounded-2xl hover:border-teal-500/50 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{b.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{b.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. FUNCIONALIDADES SECTION */}
      <section id="funcionalidades" className="py-20 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-teal-400 tracking-wider uppercase mb-2">
              Recursos do Clinora Pro
            </h2>
            <p className="text-3xl font-bold text-white sm:text-4xl">
              Todas as ferramentas essenciais em um só lugar
            </p>
            <p className="text-slate-400 mt-3 text-sm">
              Sem funções desnecessárias. Apenas o que realmente gera valor para sua clínica.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {funcionalidades.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="bg-slate-950 border border-slate-800/80 p-6 rounded-xl hover:border-teal-500/40 transition-all space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-white text-base">{f.title}</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. COMO FUNCIONA SECTION */}
      <section id="como-funciona" className="py-20 border-b border-slate-800 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-teal-400 tracking-wider uppercase mb-2">
              Simplicidade em 3 passos
            </h2>
            <p className="text-3xl font-bold text-white sm:text-4xl">Como funciona o Clinora</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {comoFuncionaSteps.map((s, i) => (
              <div
                key={i}
                className="bg-slate-950 border border-slate-800 p-8 rounded-2xl relative space-y-4"
              >
                <span className="text-4xl font-extrabold text-teal-400/30 font-mono block">
                  {s.step}
                </span>
                <h3 className="text-xl font-bold text-white">{s.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. PARA QUEM É SECTION */}
      <section id="para-quem-e" className="py-20 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-teal-400 tracking-wider uppercase mb-2">
              Público-alvo
            </h2>
            <p className="text-3xl font-bold text-white sm:text-4xl">Para quem é o Clinora?</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {paraQuemIs.map((item, i) => (
              <div
                key={i}
                className="bg-slate-950 border border-slate-800 p-6 rounded-2xl text-center space-y-3"
              >
                <div className="w-12 h-12 rounded-full bg-teal-500/10 mx-auto flex items-center justify-center text-teal-400">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. PLANO SECTION (Clinora Pro — R$149,90/mês) */}
      <section id="plano" className="py-20 border-b border-slate-800 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-teal-400 tracking-wider uppercase mb-2">
              Investimento Transparente
            </h2>
            <p className="text-3xl font-bold text-white sm:text-4xl">Plano Único e Sem Pegadinhas</p>
            <p className="text-slate-400 mt-2 text-sm">
              Tudo o que sua clínica precisa por um valor fixo mensal.
            </p>
          </div>

          <div className="max-w-lg mx-auto bg-slate-900 border-2 border-teal-500 rounded-3xl p-8 shadow-2xl shadow-teal-500/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-teal-500 text-slate-950 text-[10px] font-extrabold uppercase px-4 py-1.5 rounded-bl-xl tracking-wider">
              MAIS POPULAR
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white">{CLINORA_PRO_PLAN.name}</h3>
              <p className="text-xs text-slate-400 mt-1">{CLINORA_PRO_PLAN.description}</p>
            </div>

            <div className="mb-8 pb-6 border-b border-slate-800 flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold text-white">
                R$ {CLINORA_PRO_PLAN.price.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-slate-400 text-sm font-medium">/ {CLINORA_PRO_PLAN.period}</span>
            </div>

            <ul className="space-y-3 mb-8">
              {CLINORA_PRO_PLAN.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-xs text-slate-200">
                  <div className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => onNavigate('/cadastro')}
              className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-teal-500/25 transition-all text-center flex items-center justify-center gap-2"
              id="plan-cta-btn"
            >
              Assinar Clinora Pro
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-[11px] text-slate-400 text-center mt-3">
              Cobrança mensal recorrente via Mercado Pago. Cancele quando quiser.
            </p>
          </div>
        </div>
      </section>

      {/* 7. FAQ SECTION */}
      <section id="faq" className="py-20 border-b border-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold text-teal-400 tracking-wider uppercase mb-2">
              Tire suas dúvidas
            </h2>
            <p className="text-3xl font-bold text-white">Perguntas Frequentes</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full px-6 py-4 text-left font-semibold text-white text-sm flex justify-between items-center hover:text-teal-400 transition-colors"
                  id={`faq-btn-${i}`}
                >
                  <span>{faq.q}</span>
                  {openFaq === i ? (
                    <ChevronUp className="w-4 h-4 text-teal-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. CTA FINAL SECTION */}
      <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-950 text-center relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 mx-auto flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Pronto para organizar sua clínica de forma simples?
          </h2>
          <p className="text-slate-300 max-w-xl mx-auto text-sm">
            Cadastre sua clínica agora mesmo e descubra o jeito mais inteligente de gerenciar seus pacientes e o seu financeiro.
          </p>
          <div>
            <button
              onClick={() => onNavigate('/cadastro')}
              className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-bold text-base px-8 py-4 rounded-xl shadow-xl shadow-teal-500/25 transition-all inline-flex items-center gap-2"
              id="cta-final-register-btn"
            >
              Começar agora no Clinora Pro
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
