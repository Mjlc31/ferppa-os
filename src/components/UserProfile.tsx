import React, { useState } from 'react';
import { User, Mail, Shield, Key, Bell, Building2, Smartphone, Save, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export default function UserProfile() {
  const [activeSection, setActiveSection] = useState('general');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Configurações salvas', {
        description: 'Suas preferências foram atualizadas com sucesso.',
      });
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
            PERFIL E CONFIGURAÇÕES
          </h1>
          <span className="text-[10px] uppercase opacity-50 tracking-widest text-ferppa-gold">
            Gerenciamento de Conta e Preferências Pessoais
          </span>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 px-6 py-2 bg-ferppa-gold hover:bg-ferppa-gold-hover text-ferppa-dark font-bold text-[11px] uppercase tracking-widest transition-colors rounded disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Nav */}
        <div className="w-full lg:w-64 shrink-0">
          <ul className="space-y-2">
            {[
              { id: 'general', label: 'Dados Gerais', icon: User },
              { id: 'security', label: 'Segurança & Senha', icon: Shield },
              { id: 'notifications', label: 'Notificações', icon: Bell },
              { id: 'company', label: 'Dados da Empresa', icon: Building2 },
            ].map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-l-2 ${
                    activeSection === item.id
                      ? 'border-ferppa-gold bg-ferppa-gold/10 text-ferppa-gold'
                      : 'border-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Form Content Area */}
        <div className="flex-1 bg-gradient-to-b from-[#182324] to-[#131b1c] shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-[#1e2a2c] rounded-xl p-8">
          {activeSection === 'general' && (
            <div className="space-y-8">
              <h2 className="text-[11px] uppercase tracking-[0.1em] text-ferppa-gold/50 border-b border-[#1e2a2c] pb-3 mb-6 font-bold flex items-center gap-2">
                <User className="w-3.5 h-3.5" /> INFORMAÇÕES PESSOAIS
              </h2>
              
              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 rounded-full border border-ferppa-gold/30 bg-[#172122] flex items-center justify-center text-ferppa-gold text-2xl font-bold shadow-lg">
                  JD
                </div>
                <div>
                  <button className="text-[11px] uppercase tracking-widest font-bold text-white border border-white/20 bg-white/5 hover:bg-white/10 px-4 py-2 rounded transition-colors mb-2">
                    Alterar Avatar
                  </button>
                  <p className="text-[10px] text-gray-500 font-mono">JPG, GIF ou PNG. Máximo de 2MB.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">Nome Completo</label>
                  <input
                    type="text"
                    defaultValue="João Diretor"
                    className="w-full bg-[#172122] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-ferppa-gold transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">Cargo / Função</label>
                  <input
                    type="text"
                    defaultValue="Gerente de Operações"
                    className="w-full bg-[#172122] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-ferppa-gold transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-gray-400 uppercase line-clamp-1">E-mail (Login Principal)</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      defaultValue="joao@ferppa.com.br"
                      disabled
                      className="w-full bg-[#172122]/50 border border-white/10 rounded pl-9 pr-3 py-2 text-sm text-gray-400 focus:outline-none cursor-not-allowed"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">Telefone Celular</label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      defaultValue="(11) 99999-9999"
                      className="w-full bg-[#172122] border border-white/10 rounded pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-ferppa-gold transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="space-y-8">
              <h2 className="text-[11px] uppercase tracking-[0.1em] text-ferppa-gold/50 border-b border-[#1e2a2c] pb-3 mb-6 font-bold flex items-center gap-2">
                <Key className="w-3.5 h-3.5" /> ALTERAÇÃO DE SENHA
              </h2>
              
              <div className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">Senha Atual</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-[#172122] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-ferppa-gold transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">Nova Senha</label>
                  <input
                    type="password"
                    className="w-full bg-[#172122] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-ferppa-gold transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">Confirmar Nova Senha</label>
                  <input
                    type="password"
                    className="w-full bg-[#172122] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-ferppa-gold transition-colors"
                  />
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10">
                <h3 className="text-red-400 text-[11px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" /> Autenticação em Dois Fatores (2FA)
                </h3>
                <p className="text-sm text-gray-400 mb-4 max-w-xl">
                  Habilite a autenticação baseada em um aplicativo (como Google Authenticator) ou SMS para garantir a segurança da plataforma Ferppa OS.
                </p>
                <button className="text-[11px] uppercase tracking-widest font-bold text-ferppa-dark bg-ferppa-gold hover:bg-ferppa-gold-hover px-4 py-2.5 rounded transition-colors">
                  Configurar 2FA
                </button>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="space-y-8">
              <h2 className="text-[11px] uppercase tracking-[0.1em] text-ferppa-gold/50 border-b border-[#1e2a2c] pb-3 mb-6 font-bold flex items-center gap-2">
                <Bell className="w-3.5 h-3.5" /> PREFERÊNCIAS DE NOTIFICAÇÃO
              </h2>
              
              <div className="space-y-4">
                {[
                  { title: 'Alertas de Abastecimento', desc: 'Receber aviso quando o custo de diesel por volume exceder 15%.', checked: true },
                  { title: 'Resumos Diários de Frota', desc: 'Resumo da produtividade da frota enviado para o e-mail no final do dia.', checked: false },
                  { title: 'Intrusões de Geofence', desc: 'Alertas críticos se um trator/caminhão desviar da rota traçada.', checked: true },
                  { title: 'Atualizações Sistêmicas', desc: 'Avisos da equipe Ferppa sobre novidades no software.', checked: true },
                ].map((pref, i) => (
                  <div key={i} className="flex items-start gap-3 bg-[#111819] p-4 rounded-lg border border-[#1e2a2c] shadow-sm hover:border-[#2a3a3d] transition-colors">
                    <div className="flex items-center h-5">
                      <input
                        id={`pref-${i}`}
                        type="checkbox"
                        defaultChecked={pref.checked}
                        className="w-4 h-4 accent-ferppa-gold bg-transparent border-[#2a3a3d] rounded focus:ring-0 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label htmlFor={`pref-${i}`} className="text-sm font-bold text-white cursor-pointer tracking-wide">
                        {pref.title}
                      </label>
                      <p className="text-[10px] text-gray-500 font-mono mt-1 opacity-80">{pref.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'company' && (
            <div className="space-y-8">
              <h2 className="text-[11px] uppercase tracking-[0.1em] text-ferppa-gold/50 border-b border-[#1e2a2c] pb-3 mb-6 font-bold flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5" /> DADOS INSTITUCIONAIS
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">Razão Social</label>
                  <input
                    type="text"
                    defaultValue="Ferppa Mineração S.A."
                    className="w-full bg-[#172122] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-ferppa-gold transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">CNPJ</label>
                  <input
                    type="text"
                    defaultValue="00.000.000/0001-00"
                    disabled
                    className="w-full bg-[#172122]/50 border border-white/10 rounded px-3 py-2 text-sm text-gray-400 focus:outline-none cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">Inscrição Estadual</label>
                  <input
                    type="text"
                    defaultValue="ISENTO"
                    className="w-full bg-[#172122] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-ferppa-gold transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Logout Action at the very bottom of any section */}
          <div className="mt-12 pt-6 border-t border-red-500/20">
            <button className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors text-[11px] font-bold uppercase tracking-widest">
              <LogOut className="w-4 h-4" />
              ENCERRAR SESSÃO NA CONTA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
