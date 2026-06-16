/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Suspense, useState, lazy, useEffect } from "react";
import { useFerppaStore } from "./store";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, Menu } from "lucide-react";

// Lazy Load Componentes para Code Splitting
const Sidebar = lazy(() => import("./components/Sidebar"));
const CommandCenter = lazy(() => import("./components/CommandCenter"));
const ModuloAbastecimento = lazy(() => import("./components/ModuloAbastecimento"));
const ModuloLogistica = lazy(() => import("./components/ModuloLogistica"));
const ModuloFinanceiro = lazy(() => import("./components/ModuloFinanceiro"));
const FleetManager = lazy(() => import("./components/FleetManager"));
const ModuloTelemetria = lazy(() => import("./components/ModuloTelemetria"));
const ModuloCRM = lazy(() => import("./components/ModuloCRM"));
const UserProfile = lazy(() => import("./components/UserProfile"));

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { activeTab, loading, fetchData } = useFerppaStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ferppa-dark flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-ferppa-gold animate-spin" />
        <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">
          Inicializando Ferppa OS...
        </span>
      </div>
    );
  }

  // Component dispatcher according to currently active tab
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <CommandCenter />;
      case "abastecimento":
        return <ModuloAbastecimento />;
      case "logistica":
        return <ModuloLogistica />;
      case "financeiro":
        return <ModuloFinanceiro />;
      case "fleet":
        return <FleetManager />;
      case "telemetria":
        return <ModuloTelemetria />;
      case "crm":
        return <ModuloCRM />;
      case "perfil":
        return <UserProfile />;
      default:
        return (
          <div className="py-20 text-center text-xs text-gray-500 font-mono">
            Módulo em desenvolvimento operacional.
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-ferppa-dark text-ferppa-offwhite flex antialiased selection:bg-ferppa-gold selection:text-ferppa-dark">
      {/* Sidebar Navigation Panel */}
      <Suspense fallback={null}>
        <Sidebar
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />
      </Suspense>

      {/* Main Working Stage Container */}
      <main
        className={`flex-1 min-h-screen pl-0 lg:pl-[260px] flex flex-col w-full max-w-[100vw] overflow-x-hidden ${activeTab === "telemetria" ? "p-0" : "p-4 md:p-6"}`}
      >
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between mb-4 p-4 bg-[#0f1516] rounded-xl border border-[#1e2a2c]">
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-widest text-[14px]">FERPPA <span className="text-ferppa-gold">OS</span></span>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white/5 rounded-lg text-ferppa-gold">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <div
          className={`w-full flex-1 flex flex-col justify-start ${activeTab === "telemetria" ? "h-[calc(100vh-80px)] lg:h-screen" : "max-w-7xl mx-auto"}`}
        >
          {/* Module Transition Canvas */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className={`flex-1 flex flex-col ${activeTab === "telemetria" ? "h-full" : ""}`}
            >
              <Suspense fallback={
                <div className="flex flex-1 items-center justify-center p-10">
                  <Loader2 className="w-8 h-8 text-ferppa-gold animate-spin" />
                </div>
              }>
                {renderContent()}
              </Suspense>
            </motion.div>
          </AnimatePresence>

          {/* Master Footer credits */}
          {activeTab !== "telemetria" && (
            <footer className="mt-10 lg:mt-16 pt-5 border-t border-[#26383a]/40 text-[10px] text-gray-500 flex flex-col sm:flex-row justify-between items-center gap-4 font-mono pb-4 lg:pb-0">
              <div className="text-center sm:text-left">
                <span>
                  © {new Date().getFullYear()} Ferppa Mineração S.A. Todos os
                  direitos reservados.
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-center">
                <span>
                  ESTAÇÃO: <strong className="text-ferppa-gold">JAZIDA RIO CLARO</strong>
                </span>
                <span className="hidden sm:inline">•</span>
                <span>
                  TERM: <strong className="text-ferppa-gold">BALANÇA_02_WS</strong>
                </span>
              </div>
            </footer>
          )}
        </div>
      </main>
    </div>
  );
}
