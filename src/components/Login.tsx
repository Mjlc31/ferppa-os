import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Mail, Loader2, LogIn } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ferppa-dark flex flex-col items-center justify-center p-4 relative overflow-hidden text-ferppa-offwhite selection:bg-ferppa-gold selection:text-ferppa-dark">
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-color-dodge">
        <div className="absolute inset-0 bg-[radial-gradient(#b79152_1.5px,transparent_1.5px)] [background-size:32px_32px]"></div>
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-ferppa-gold/5 rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8 flex flex-col items-center">
          <img 
            src="/logo.png" 
            alt="Ferppa Logo" 
            className="w-auto h-20 mb-6 drop-shadow-[0_0_15px_rgba(183,145,82,0.3)]"
            onError={(e) => {
              // Fallback para o ícone antigo caso a logo.png não seja encontrada
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          {/* Fallback caso a logo não exista */}
          <div className="hidden">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-[#182324] border border-[#2a3a3d] shadow-[0_0_20px_rgba(183,145,82,0.15)] mb-6">
              <Lock className="w-8 h-8 text-ferppa-gold" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-widest text-white mb-2">
              FERPPA <span className="text-ferppa-gold">OS</span>
            </h1>
          </div>
          <p className="text-xs font-mono uppercase tracking-widest text-gray-500">
            Acesso Restrito ao Sistema Operacional
          </p>
        </div>

        <div className="bg-[#182324]/80 backdrop-blur-xl border border-[#2a3a3d] rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-ferppa-dark via-ferppa-gold to-ferppa-dark opacity-50"></div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded text-sm text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold ml-1">E-mail Corporativo</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-gray-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#131b1c] border border-[#2a3a3d] rounded-lg py-3 pl-11 pr-4 text-white text-sm focus:outline-none focus:border-ferppa-gold/50 transition-colors"
                  placeholder="seu.nome@ferppa.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold ml-1">Senha de Acesso</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-gray-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#131b1c] border border-[#2a3a3d] rounded-lg py-3 pl-11 pr-4 text-white text-sm focus:outline-none focus:border-ferppa-gold/50 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ferppa-gold text-ferppa-dark font-black text-xs tracking-widest uppercase py-4 rounded-lg hover:brightness-110 hover:shadow-[0_0_20px_rgba(183,145,82,0.3)] transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <LogIn className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
      
      <footer className="absolute bottom-8 left-0 w-full text-center text-[10px] text-gray-600 font-mono tracking-widest">
        © {new Date().getFullYear()} FERPPA MINERAÇÃO S.A.
      </footer>
    </div>
  );
}
