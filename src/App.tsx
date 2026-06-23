import React, { useState, useEffect } from 'react';
import { Material, StockTransaction } from './types';
import DashboardOverview from './components/DashboardOverview';
import MaterialsManager from './components/MaterialsManager';
import TransactionsHistory from './components/TransactionsHistory';
import NfeXmlImporter from './components/NfeXmlImporter';
import BarcodeScannerWidget from './components/BarcodeScannerWidget';
import DemandForecastPanel from './components/DemandForecastPanel';
import { supabase } from './supabaseClient';
import { 
  LayoutDashboard, 
  PackageSearch, 
  History, 
  FileInput, 
  Scan, 
  TrendingUp, 
  Loader2, 
  Layers, 
  Settings, 
  Bot,
  Warehouse
} from 'lucide-react';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState('painel');

  // Database State
  const [materials, setMaterials] = useState<Material[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  // Fetch all database records
  const fetchInventoryData = async () => {
    setLoading(true);
    setErrorText('');
    try {
      const response = await fetch('/api/dashboard');
      const resData = await response.json();
      if (resData.success) {
        setMaterials(resData.materials || []);
        setTransactions(resData.transactions || []);
      } else {
        setErrorText("Não foi possível sincronizar o inventário.");
      }
    } catch (err) {
      console.error(err);
      setErrorText("Erro de comunicação com o servidor de banco de dados local.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none pointer-events-auto">
      
      {/* GLOBAL AUDIT LEDGER TOP BAR */}
      <header className="bg-slate-950 text-white px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-4 border-slate-900 z-10 shrink-0 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-600 rounded-none flex items-center justify-center font-black text-2xl italic tracking-tighter shadow-md select-none">
            E
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase leading-none">
              DashBoard Central
            </h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-1">
              Sistema desenvolvido por João Vítor Mendes, MAT 138906, AUX. ADM I - Cobra Brasil
            </p>
          </div>
        </div>

        {/* Global Stock alerts indicator */}
        <div className="flex flex-wrap items-center gap-3">
          {materials.filter(m => m.quantity <= m.minStock).length > 0 && (
            <div className="flex items-center gap-2 bg-rose-500/10 border-2 border-rose-500/30 px-3 py-1 rounded-none text-rose-300 text-xs font-black uppercase tracking-wider">
              <span className="h-2 w-2 rounded-none bg-rose-500 animate-ping" />
              <span>{materials.filter(m => m.quantity <= m.minStock).length} alertas de ruptura</span>
            </div>
          )}

          <div className="bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-none text-xs font-black uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full"></span> IA Sincronizada
          </div>

          {/* Quick info */}
          <div className="text-right text-[11px] font-bold text-slate-400 font-mono">
            <span className="block text-white uppercase tracking-wider">Almoxarifado Central</span>
            <span>Est. Físico: {materials.reduce((acc, c)=>acc+c.quantity, 0)} {materials.length === 1 ? 'item' : 'itens'}</span>
          </div>
        </div>
      </header>

      {/* INNER SHELL WITH SIDEBAR NAVIGATION */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 bg-slate-900 border-r-4 border-slate-950 flex flex-col shrink-0 text-white">
          
          {/* Main options lists */}
          <nav className="p-4 space-y-1.5 flex-1">
            <span className="px-3 text-[10px] font-black text-slate-400 tracking-widest uppercase block mb-3 mt-1">
              Navegação Principal
            </span>

            <button
              id="tab-painel"
              onClick={() => setActiveTab('painel')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-wider rounded-none transition-all ${
                activeTab === 'painel' 
                  ? 'bg-indigo-605 bg-indigo-650 text-white border-l-4 border-indigo-400 font-black' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Visão Geral
            </button>

            <button
              id="tab-estoque"
              onClick={() => setActiveTab('estoque')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-wider rounded-none transition-all ${
                activeTab === 'estoque' 
                  ? 'bg-indigo-650 text-white border-l-4 border-indigo-400 font-black' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <PackageSearch className="h-4 w-4" />
              Estoque Físico
            </button>

            <button
              id="tab-historico"
              onClick={() => setActiveTab('historico')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-wider rounded-none transition-all ${
                activeTab === 'historico' 
                  ? 'bg-indigo-650 text-white border-l-4 border-indigo-400 font-black' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <History className="h-4 w-4" />
              Histórico Movs
            </button>

            <span className="px-3 text-[10px] font-black text-slate-400 tracking-widest uppercase block mt-6 mb-3">
              Recebimentos e Baixas
            </span>

            <button
              id="tab-importar"
              onClick={() => setActiveTab('importar')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-wider rounded-none transition-all ${
                activeTab === 'importar' 
                  ? 'bg-indigo-650 text-white border-l-4 border-indigo-400 font-black' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileInput className="h-4 w-4" />
              Importar XML (NF)
            </button>

            <button
              id="tab-leitor"
              onClick={() => setActiveTab('leitor')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-wider rounded-none transition-all ${
                activeTab === 'leitor' 
                  ? 'bg-indigo-650 text-white border-l-4 border-indigo-400 font-black' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Scan className="h-4 w-4" />
              Leitor de Código
            </button>

            <span className="px-3 text-[10px] font-black text-slate-400 tracking-widest uppercase block mt-6 mb-3">
              Módulo Inteligente
            </span>

            <button
              id="tab-previsoes"
              onClick={() => setActiveTab('previsoes')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-wider rounded-none transition-all ${
                activeTab === 'previsoes' 
                  ? 'bg-indigo-650 text-white border-l-4 border-indigo-400 font-black' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Bot className="h-4 w-4 text-indigo-400" />
              Previsão Demandas
            </button>

          </nav>

          {/* Sidebar Footer info */}
          <div className="p-4 border-t border-slate-800 space-y-2.5">
            <div className="bg-slate-950 p-3 rounded-none border border-slate-800 space-y-1">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Servidor de Produção</span>
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-black uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>DB ONLINE v2.4</span>
              </div>
            </div>
          </div>

        </aside>

        {/* Core Content frame scrolling vertically */}
        <main className="flex-1 min-w-0 overflow-auto p-4 sm:p-6 lg:p-8 space-y-6">
          
          {errorText && (
            <div className="p-4 bg-rose-100 border-2 border-rose-400 text-rose-900 text-sm rounded-none font-bold">
              <strong>Ocorreu um erro:</strong> {errorText}
            </div>
          )}

          {loading ? (
            /* Micro spinner loader */
            <div className="h-[60vh] w-full flex flex-col items-center justify-center text-center space-y-2">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
              <p className="text-xs text-gray-400 font-medium font-mono">Sincronizando banco de dados almoxarifado...</p>
            </div>
          ) : (
            /* Render components according to chosen routing state */
            <>
              {activeTab === 'painel' && (
                <DashboardOverview 
                  materials={materials} 
                  transactions={transactions} 
                  onNavigate={setActiveTab}
                  onRefresh={fetchInventoryData}
                  loading={loading}
                />
              )}

              {activeTab === 'estoque' && (
                <MaterialsManager 
                  materials={materials} 
                  onRefresh={fetchInventoryData} 
                />
              )}

              {activeTab === 'historico' && (
                <TransactionsHistory 
                  materials={materials} 
                  transactions={transactions} 
                  onRefresh={fetchInventoryData} 
                />
              )}

              {activeTab === 'importar' && (
                <NfeXmlImporter 
                  onImportComplete={fetchInventoryData} 
                />
              )}

              {activeTab === 'leitor' && (
                <BarcodeScannerWidget 
                  materials={materials} 
                  onTransactionComplete={fetchInventoryData} 
                />
              )}

              {activeTab === 'previsoes' && (
                <DemandForecastPanel 
                  materials={materials} 
                />
              )}
            </>
          )}

        </main>

      </div>

    </div>
  );
}
