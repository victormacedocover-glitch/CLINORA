import React, { useState } from 'react';
import { Stethoscope, Menu, X, ArrowRight, ShieldCheck, User } from 'lucide-react';

interface NavbarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  currentUser?: { name: string; email: string } | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  onNavigate,
  currentUser,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    if (href.startsWith('#')) {
      if (currentRoute !== '/') {
        onNavigate('/');
        setTimeout(() => {
          const element = document.querySelector(href);
          if (element) element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        const element = document.querySelector(href);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      onNavigate(href);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <button
            onClick={() => handleNavClick('/')}
            className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-lg p-1"
            id="nav-logo-btn"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-bold text-xl tracking-tight text-white flex items-center gap-1">
                CLINORA
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-400 border border-teal-500/30">
                  V1
                </span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium -mt-1 hidden sm:inline">
                Gestão Inteligente para Clínicas
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          {currentRoute === '/' && (
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
              <button
                onClick={() => handleNavClick('#beneficios')}
                className="hover:text-teal-400 transition-colors"
                id="nav-link-beneficios"
              >
                Benefícios
              </button>
              <button
                onClick={() => handleNavClick('#funcionalidades')}
                className="hover:text-teal-400 transition-colors"
                id="nav-link-funcionalidades"
              >
                Funcionalidades
              </button>
              <button
                onClick={() => handleNavClick('#como-funciona')}
                className="hover:text-teal-400 transition-colors"
                id="nav-link-como-funciona"
              >
                Como Funciona
              </button>
              <button
                onClick={() => handleNavClick('#para-quem-e')}
                className="hover:text-teal-400 transition-colors"
                id="nav-link-para-quem"
              >
                Para Quem É
              </button>
              <button
                onClick={() => handleNavClick('#plano')}
                className="hover:text-teal-400 transition-colors"
                id="nav-link-plano"
              >
                Plano
              </button>
              <button
                onClick={() => handleNavClick('#faq')}
                className="hover:text-teal-400 transition-colors"
                id="nav-link-faq"
              >
                FAQ
              </button>
            </nav>
          )}

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-slate-300">
                  <User className="w-3.5 h-3.5 text-teal-400" />
                  <span className="font-medium text-white">{currentUser.name}</span>
                </div>
                <button
                  onClick={() => onNavigate('/assinatura')}
                  className="bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                  id="nav-my-subscription-btn"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Minha Assinatura
                </button>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="text-slate-400 hover:text-white text-xs font-medium px-2.5 py-2 transition-colors"
                    id="nav-logout-btn"
                  >
                    Sair
                  </button>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => handleNavClick('/login')}
                  className="text-slate-300 hover:text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors hover:bg-slate-800"
                  id="nav-login-btn"
                >
                  Entrar
                </button>
                <button
                  onClick={() => handleNavClick('/cadastro')}
                  className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-semibold text-sm px-4 py-2 rounded-lg shadow-md shadow-teal-600/20 hover:shadow-teal-600/30 transition-all flex items-center gap-1.5"
                  id="nav-register-btn"
                >
                  Começar agora
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-2">
            {!currentUser && (
              <button
                onClick={() => handleNavClick('/cadastro')}
                className="bg-teal-600 text-white text-xs font-semibold px-3 py-1.5 rounded-md"
                id="nav-mobile-register-btn"
              >
                Cadastrar
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
              aria-label="Abrir Menu"
              id="nav-mobile-menu-trigger"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 pt-3 pb-6 space-y-3">
          {currentRoute === '/' && (
            <div className="flex flex-col space-y-2 py-2 text-sm text-slate-300">
              <button
                onClick={() => handleNavClick('#beneficios')}
                className="text-left py-1.5 hover:text-teal-400"
              >
                Benefícios
              </button>
              <button
                onClick={() => handleNavClick('#funcionalidades')}
                className="text-left py-1.5 hover:text-teal-400"
              >
                Funcionalidades
              </button>
              <button
                onClick={() => handleNavClick('#como-funciona')}
                className="text-left py-1.5 hover:text-teal-400"
              >
                Como Funciona
              </button>
              <button
                onClick={() => handleNavClick('#para-quem-e')}
                className="text-left py-1.5 hover:text-teal-400"
              >
                Para Quem É
              </button>
              <button
                onClick={() => handleNavClick('#plano')}
                className="text-left py-1.5 hover:text-teal-400"
              >
                Plano Clinora Pro
              </button>
              <button
                onClick={() => handleNavClick('#faq')}
                className="text-left py-1.5 hover:text-teal-400"
              >
                FAQ
              </button>
            </div>
          )}

          <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
            {currentUser ? (
              <>
                <button
                  onClick={() => handleNavClick('/assinatura')}
                  className="w-full bg-teal-600 text-white font-medium py-2 rounded-lg text-center text-sm"
                >
                  Minha Assinatura
                </button>
                {onLogout && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full bg-slate-800 text-slate-300 py-2 rounded-lg text-center text-sm"
                  >
                    Sair da Conta
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => handleNavClick('/login')}
                  className="w-full border border-slate-700 text-slate-200 py-2 rounded-lg text-center text-sm font-medium hover:bg-slate-800"
                >
                  Entrar na conta
                </button>
                <button
                  onClick={() => handleNavClick('/cadastro')}
                  className="w-full bg-teal-600 text-white py-2 rounded-lg text-center text-sm font-semibold hover:bg-teal-500"
                >
                  Começar agora (Criar conta)
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
