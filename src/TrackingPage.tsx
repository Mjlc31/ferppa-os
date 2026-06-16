import React, { useEffect, useState } from 'react';
import { Truck, MapPin, Navigation2, Clock } from 'lucide-react';
import { motion } from 'motion/react';

// B2B Public Tracking Experience
export default function TrackingPage() {
  const [loading, setLoading] = useState(true);
  const [eta, setEta] = useState(0); // in minutes
  const [distance, setDistance] = useState(15.4); // in km

  useEffect(() => {
    // Simula validação do banco do Supabase para achar a Geofence e Truck position
    setTimeout(() => {
      setLoading(false);
    }, 1500);

    const interval = setInterval(() => {
      setDistance(prev => Math.max(0, prev - 0.2));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setEta(Math.ceil((distance / 40) * 60)); // Simula tempo ETA com velocid 40km/h
  }, [distance]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111819] flex items-center justify-center font-sans tracking-tight">
        <div className="flex flex-col items-center gap-4">
          <Truck className="w-8 h-8 text-ferppa-gold animate-pulse" />
          <p className="text-white/50 text-[11px] uppercase tracking-widest font-bold">Localizando carga...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111819] text-white font-sans relative overflow-hidden flex flex-col">
      {/* Background Simulating Simple Map / War Room Style without loading a fat GL library for B2B portal */}
      <div className="absolute inset-0 z-0 bg-[#0a0a0a]">
        {/* Animated grid background layer */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] opacity-30"></div>
      </div>

      {/* Header Container */}
      <div className="z-10 p-6 flex items-center justify-between border-b border-white/5 bg-[#172122]/90 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <img src="/Marca-01.png" alt="Ferppa" className="w-8 h-8 object-contain" />
          <span className="font-extrabold tracking-wide text-lg">FERPPA <span className="text-ferppa-gold">LOGÍSTICA</span></span>
        </div>
        <div className="bg-ferppa-gold/10 text-ferppa-gold border border-ferppa-gold/20 px-3 py-1 rounded text-[10px] uppercase font-bold tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-ferppa-gold animate-pulse"></span>
          Em Trânsito
        </div>
      </div>

      {/* Main Content */}
      <main className="z-10 flex-1 flex flex-col items-center justify-center p-6 w-full max-w-lg mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full space-y-4"
        >
          {/* Main Journey Card */}
          <div className="bg-[#172122] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-ferppa-gold"></div>
            
            <h1 className="text-gray-400 text-[11px] uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
              <Navigation2 className="w-4 h-4 text-ferppa-gold" />
              Destino: Obra Edifício X
            </h1>

            <div className="text-5xl font-extrabold tracking-tighter mb-2 tabular-nums group">
              {eta > 0 ? `${eta} min` : 'Chegou'}
            </div>
            <div className="text-sm text-gray-500 font-mono mb-8">
              Faltam {distance.toFixed(1)} km
            </div>

            <div className="bg-[#111819] rounded-xl p-4 border border-white/5">
              <div className="grid grid-cols-2 gap-4 divide-x divide-white/5">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Caminhão</p>
                  <p className="font-mono text-white font-bold text-sm">FTW-9128</p>
                </div>
                <div className="pl-4">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Volume</p>
                  <p className="font-mono text-ferppa-gold font-bold text-sm">22.5 m³ Areia</p>
                </div>
              </div>
            </div>
          </div>

          {/* Simple Timeline Status */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="relative pl-6 space-y-6">
              <div className="absolute left-2 top-2 bottom-2 w-px bg-white/10"></div>
              
              <div className="relative text-sm">
                <div className="absolute -left-[27px] bg-[#111819] w-3 h-3 rounded-full border border-gray-600"></div>
                <p className="text-gray-400">Saiu da Base Draga 01</p>
                <p className="text-[10px] font-mono text-gray-600">14:20</p>
              </div>

              <div className="relative text-sm">
                <div className="absolute -left-[27.5px] items-center justify-center flex bg-[#111819] w-4 h-4 rounded-full border border-ferppa-gold shadow-[0_0_10px_rgba(183,145,82,0.5)]">
                  <div className="w-1.5 h-1.5 bg-ferppa-gold rounded-full animate-pulse"></div>
                </div>
                <p className="font-bold text-white">A Caminho da Obra</p>
                <p className="text-[10px] font-mono text-ferppa-gold flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" /> Rastreado agora (Satélite)
                </p>
              </div>

              <div className="relative text-sm opacity-30">
                <div className="absolute -left-[27px] bg-[#111819] w-3 h-3 rounded-full border border-gray-500"></div>
                <p className="text-gray-400">Previsão de Chegada</p>
                <p className="text-[10px] font-mono text-gray-600">Dentro de {eta} min</p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      <footer className="z-10 p-4 text-center mt-auto border-t border-white/5">
        <p className="text-[9px] uppercase tracking-widest text-gray-600 font-mono flex items-center justify-center gap-2">
          <Truck className="w-3 h-3" /> Logística Monitorada por Ferppa OS
        </p>
      </footer>
    </div>
  );
}
