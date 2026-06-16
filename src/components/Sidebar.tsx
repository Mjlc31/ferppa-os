/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LayoutDashboard, Fuel, Truck, Database, Settings, RefreshCw, User, ShieldCheck, X, DollarSign, Users } from 'lucide-react';
import { useFerppaStore } from '../store';

interface SidebarProps {
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { activeTab, setActiveTab, resetToDefaults, getWeeklyLimitsExceeded, userProfile, signOut } = useFerppaStore();
  const exceededCount = getWeeklyLimitsExceeded().length;
  const menuItems = [
    { id: 'dashboard', label: 'COMMAND CENTER', icon: LayoutDashboard, badge: exceededCount > 0 ? exceededCount : undefined },
    { id: 'abastecimento', label: 'ABASTECIMENTO', icon: Fuel },
    { id: 'logistica', label: 'LOGÍSTICA & CUBAGEM', icon: Truck },
    ...(userProfile?.role === 'ADMIN' ? [{ id: 'financeiro', label: 'FINANCEIRO DRE', icon: DollarSign }] : []),
    { id: 'telemetria', label: 'RASTREIO & TELEMETRIA', icon: Database },
    { id: 'fleet', label: 'FROTA & EQUIPAMENTOS', icon: Settings },
    { id: 'crm', label: 'CRM / LEADS', icon: Users },
  ];

  const handleReset = () => {
    if (confirm('Deseja redefinir todos os dados para o estado inicial padrão? Todas as novos lançamentos locais serão substituídos.')) {
      resetToDefaults();
      window.location.reload();
    }
  };

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    if (setIsOpen) setIsOpen(false); // Close sidebar on mobile after clicking
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" 
          onClick={() => setIsOpen?.(false)} 
        />
      )}

      {/* Sidebar Navigation */}
      <aside 
        className={`w-[260px] bg-[#0f1516] border-r border-[#1e2a2c] flex flex-col h-[100dvh] fixed top-0 left-0 z-50 shrink-0 py-6 shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-6 pb-10 flex flex-col gap-3 relative">
          {/* Mobile close button */}
          <button 
            className="absolute top-0 right-4 p-2 text-gray-500 hover:text-white lg:hidden"
            onClick={() => setIsOpen?.(false)}
          >
            <X className="w-5 h-5" />
          </button>
          
          {/* CSS-based Brand Logo replacing the missing missing Marca-01.png */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 bg-gradient-to-br from-[#1a2325] to-[#0f1516] rounded-xl border border-[#2a3a3d] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(183,145,82,0.15)] overflow-hidden">
              <div className="absolute inset-x-0 bottom-0 top-3 bg-gradient-to-t from-ferppa-gold/20 to-transparent" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }}></div>
              <span className="text-ferppa-gold font-black tracking-tighter text-lg font-display drop-shadow relative z-10">F</span>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-widest text-[16px] leading-none">FERPPA <span className="text-ferppa-gold">OS</span></span>
              <span className="text-[8px] uppercase tracking-[0.2em] text-gray-500 font-bold mt-1">Mineração & Log.</span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 minimal-scrollbar">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-[12px] transition-all duration-200 group cursor-pointer ${
                  isActive
                    ? 'text-ferppa-dark bg-ferppa-gold font-bold shadow-[0_0_15px_rgba(183,145,82,0.3)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <IconComponent className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isActive ? 'text-ferppa-dark' : 'text-gray-500 group-hover:text-ferppa-gold group-hover:scale-110'}`} />
                  <span className="tracking-[0.08em] uppercase whitespace-nowrap">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${isActive ? 'bg-ferppa-dark/20 text-ferppa-dark shadow-inner' : 'bg-red-500/20 text-red-400 animate-pulse border border-red-500/30'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Session User info & Actions */}
        <div className="px-4 py-4 border-t border-white/5 mt-auto flex flex-col gap-3">
          <button
            onClick={() => handleTabClick('perfil')}
            className={`flex items-center gap-3 w-full p-2 rounded transition-colors group ${
              activeTab === 'perfil' ? 'bg-white/10 text-ferppa-gold' : 'hover:bg-white/5 text-ferppa-offwhite'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-ferppa-dark border border-ferppa-gold/50 flex items-center justify-center text-ferppa-gold text-xs font-bold shrink-0 shadow-[0_0_10px_rgba(183,145,82,0.1)]">
              {userProfile?.email ? userProfile.email.substring(0, 2).toUpperCase() : 'US'}
            </div>
            <div className="text-left flex-1 flex flex-col overflow-hidden">
              <span className={`text-[11px] font-bold uppercase tracking-widest truncate ${activeTab === 'perfil' ? 'text-ferppa-gold' : 'text-white'}`}>
                {userProfile?.email ? userProfile.email.split('@')[0] : 'Usuário'}
              </span>
              <span className="text-[9px] uppercase tracking-widest text-gray-400 truncate">
                {userProfile?.role || 'Acesso Restrito'}
              </span>
            </div>
            <Settings className="w-3.5 h-3.5 text-gray-500 group-hover:text-ferppa-gold transition-colors" />
          </button>

          <div className="flex justify-between items-center px-2 text-[10px] uppercase tracking-widest text-ferppa-offwhite/50">
            <button 
              onClick={() => signOut()}
              className="text-red-400 hover:text-red-300 transition-colors tracking-widest"
            >
              LOGOUT
            </button>
            <button
              onClick={handleReset}
              className="hover:text-ferppa-gold transition-colors duration-150"
              title="Limpar localStorage (Resetar)"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
