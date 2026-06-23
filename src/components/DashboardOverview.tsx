import React from 'react';
import { Material, StockTransaction } from '../types';
import { Package, DollarSign, AlertTriangle, ArrowUpRight, ArrowDownRight, RefreshCw, Calendar, Bot } from 'lucide-react';

interface DashboardOverviewProps {
  materials: Material[];
  transactions: StockTransaction[];
  onNavigate: (tab: string) => void;
  onRefresh: () => void;
  loading: boolean;
}

export default function DashboardOverview({
  materials,
  transactions,
  onNavigate,
  onRefresh,
  loading
}: DashboardOverviewProps) {
  
  // Calculations
  const totalItemsCount = materials.length;
  const totalStockQuantity = materials.reduce((acc, curr) => acc + curr.quantity, 0);
  
  const totalValue = materials.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0);
  
  const lowStockItems = materials.filter(m => m.quantity <= m.minStock);
  const criticalItemsCount = lowStockItems.length;

  // Let's group transactions of the last 7 days vs previous 7 days or do basic stats
  const recentTransactions = transactions.slice(0, 5);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Group materials by category for a bento-grid distribution
  const categorySummary = materials.reduce((acc: Record<string, { count: number; value: number }>, m) => {
    if (!acc[m.category]) {
      acc[m.category] = { count: 0, value: 0 };
    }
    acc[m.category].count += 1;
    acc[m.category].value += m.quantity * m.unitPrice;
    return acc;
  }, {});

  const categories = Object.entries(categorySummary).map(([name, data]) => ({
    name,
    ...data
  })).sort((a, b) => b.value - a.value);

  // Maximum value for proportional bars
  const maxCatValue = categories.length > 0 ? Math.max(...categories.map(c => c.value)) : 1;

  return (
    <div className="space-y-8">
      {/* Header section with Bold display style */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 bg-white p-6 rounded-none border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase leading-none text-slate-900">
            Painel Executivo<span className="text-indigo-600 font-medium lowercase">.ai</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">
            Indicadores de Estoque, Saúde de Ativos e Auditoria
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-black uppercase text-xs tracking-wider rounded-none hover:bg-slate-800 hover:border-slate-800 transition-colors disabled:opacity-50 border-2 border-slate-900"
            id="refresh-dashboard-btn"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Sincronizar Banco
          </button>
          
          <div className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-wider rounded-none border border-slate-200 font-mono">
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            <span>Hoje: {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())}</span>
          </div>
        </div>
      </div>

      {/* KPI stats bar - Heavy borders and Bold typography */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total cadastrado */}
        <div className="bg-white p-6 border-b-8 border-indigo-600 rounded-none shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total de Itens</p>
            <p className="text-4xl font-black tracking-tighter text-slate-900">{totalItemsCount}</p>
            <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Total de {totalStockQuantity} un físicos</p>
          </div>
          <div className="h-12 w-12 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-none flex items-center justify-center font-black">
            📦
          </div>
        </div>

        {/* Financeiro */}
        <div className="bg-white p-6 border-b-8 border-slate-900 rounded-none shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor em Patrimônio</p>
            <p className="text-4xl font-black tracking-tighter text-slate-900 font-mono text-[22px] truncate max-w-[200px]" title={formatCurrency(totalValue)}>
              {formatCurrency(totalValue)}
            </p>
            <p className="text-xs text-slate-450 font-bold uppercase tracking-wider text-emerald-600">Capital Ativo</p>
          </div>
          <div className="h-12 w-12 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-none flex items-center justify-center font-black">
            💰
          </div>
        </div>

        {/* Alerta estoque minimo */}
        <div className={`p-6 border-b-8 rounded-none shadow-sm flex items-center justify-between transition-all ${
          criticalItemsCount > 0 
            ? 'bg-white border-rose-500 text-rose-900' 
            : 'bg-white border-slate-200'
        }`}>
          <div className="space-y-1.5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estoque Crítico</p>
            <p className={`text-4xl font-black tracking-tighter ${criticalItemsCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {criticalItemsCount}
            </p>
            {criticalItemsCount > 0 ? (
              <button 
                onClick={() => onNavigate('estoque')}
                className="text-xs text-rose-600 font-black uppercase tracking-wider underline block text-left"
              >
                ⚠️ AÇÃO IMEDIATA &rarr;
              </button>
            ) : (
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Tudo Sob Controle</p>
            )}
          </div>
          <div className={`h-12 w-12 rounded-none flex items-center justify-center font-black text-lg ${
            criticalItemsCount > 0 ? 'bg-rose-100 text-rose-650' : 'bg-slate-100 text-slate-400'
          }`}>
            ⚠️
          </div>
        </div>

        {/* Movimentações do Mês */}
        <div className="bg-slate-900 text-white p-6 border-b-8 border-indigo-400 shadow-sm flex items-center justify-between rounded-none">
          <div className="space-y-1.5">
            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Entradas & Baixas</p>
            <p className="text-4xl font-black tracking-tighter text-white">{transactions.length}</p>
            <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider italic">Movimentos Auditados</p>
          </div>
          <div className="h-12 w-12 bg-slate-800 text-indigo-400 rounded-none flex items-center justify-center font-black">
            🔄
          </div>
        </div>

      </div>

      {/* Main double column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Span 7: Critical Alerts List & Category distributions */}
        <div className="lg:col-span-7 space-y-8">
          
          {criticalItemsCount > 0 && (
            <div className="bg-white p-6 rounded-none border border-slate-200 border-l-8 border-l-rose-500 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-rose-100 pb-3">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900">
                  Ruptura de Estoque Detectada
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Os itens abaixo estão com o saldo físico <strong>igual ou inferior</strong> ao estoque mínimo operacional estipulado em sistema. Recomendamos reabastecer imediatamente.
              </p>
              
              <div className="overflow-hidden border-2 border-slate-900 rounded-none">
                <table className="min-w-full divide-y divide-slate-205 bg-white">
                  <thead>
                    <tr className="bg-slate-900 text-white text-left text-[11px] font-black uppercase tracking-wider">
                      <th className="p-3">Material</th>
                      <th className="p-3">Categoria</th>
                      <th className="p-3 text-center">Mínimo</th>
                      <th className="p-3 text-center">Físico Atual</th>
                      <th className="p-3 text-right">Diferença</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs text-slate-700 font-mono">
                    {lowStockItems.slice(0, 4).map(item => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-sans font-black text-slate-950">{item.name}</td>
                        <td className="p-3 text-slate-500 font-sans uppercase tracking-wider text-[10px]">{item.category}</td>
                        <td className="p-3 text-center text-slate-650">{item.minStock} {item.unit}</td>
                        <td className="p-3 text-center font-black text-rose-600">{item.quantity} {item.unit}</td>
                        <td className="p-3 text-right font-black text-rose-700">
                          -{item.minStock - item.quantity} {item.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {criticalItemsCount > 4 && (
                <div className="text-right">
                  <button 
                    onClick={() => onNavigate('estoque')}
                    className="text-xs text-rose-600 font-black uppercase tracking-wider underline hover:opacity-85"
                  >
                    E mais {criticalItemsCount - 4} itens críticos... Ver lista completa &rarr;
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Value distribution by category */}
          <div className="bg-white p-6 rounded-none border border-slate-200 shadow-sm space-y-5">
            <div className="flex justify-between items-end border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900">Capital por Categoria</h3>
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Visão Financeira</span>
            </div>

            <div className="space-y-5">
              {categories.slice(0, 5).map(cat => (
                <div key={cat.name} className="space-y-2">
                  <div className="flex justify-between text-xs font-black uppercase tracking-wider text-slate-700">
                    <div>
                      <span>{cat.name} </span>
                      <span className="text-[10px] text-slate-400 font-medium font-sans">({cat.count} {cat.count === 1 ? 'item' : 'itens'})</span>
                    </div>
                    <span className="font-mono text-slate-950">{formatCurrency(cat.value)}</span>
                  </div>
                  {/* Heavy square progress bar */}
                  <div className="h-3 bg-slate-100 border border-slate-200 rounded-none overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 border-r-2 border-indigo-805 transition-all duration-500"
                      style={{ width: `${Math.max(5, (cat.value / maxCatValue) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}

              {categories.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-400 font-bold uppercase tracking-wider">
                  Nenhum dado cadastrado para consolidar categorias.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Span 5: Recent Transactions & AI Forecast Banner */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* AI Info Snippet Box */}
          <div className="bg-slate-950 text-white p-6 rounded-none border border-slate-900 border-l-8 border-l-indigo-500 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="bg-indigo-600 text-white text-[10px] px-2.5 py-0.5 font-black uppercase tracking-widest leading-none">
                IA DEMAND FORECAST
              </span>
              <Bot className="h-4.5 w-4.5 text-indigo-400" />
            </div>

            <div className="space-y-4">
              <div className="border-l-2 border-indigo-400 pl-4 py-1">
                <p className="text-[10px] text-indigo-300 font-black uppercase tracking-widest">Foco do Próximo Ciclo</p>
                <p className="text-lg font-black tracking-tight italic text-indigo-100">Abastecimento Preventivo</p>
                <p className="text-[10px] text-slate-400 font-sans mt-1">Previsão automatizada ajuda a evitar custos extras de frete urgente em itens de saúde e segurança.</p>
              </div>

              <div className="border-l-2 border-emerald-400 pl-4 py-1">
                <p className="text-[10px] text-emerald-300 font-black uppercase tracking-widest">Recomendação Geral de Compras</p>
                <p className="text-sm font-black tracking-tight italic text-emerald-200">Mitigar Estoques Parados</p>
                <p className="text-[10px] text-slate-400 font-sans mt-1">Evite manter capital estático superior a 45 dias para categorias com giro de consumo inferior a 10%.</p>
              </div>
            </div>

            <div className="pt-2">
              <button 
                onClick={() => onNavigate('previsoes')}
                className="w-full py-2 bg-indigo-650 hover:bg-white hover:text-slate-950 border border-slate-800 text-white font-black uppercase tracking-widest text-[9px] transition-all"
              >
                Ver Módulo Inteligente IA &rarr;
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-none border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-end border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900">Movimentações</h3>
              <button 
                onClick={() => onNavigate('historico')}
                className="text-xs text-indigo-600 font-black uppercase tracking-wider underline hover:opacity-80"
              >
                Ver Todas &rarr;
              </button>
            </div>

            <div className="space-y-3">
              {recentTransactions.map(tx => (
                <div 
                  key={tx.id} 
                  className="flex items-start gap-3 p-3 rounded-none border border-slate-100 bg-slate-50 hover:bg-slate-100/50 transition-colors text-xs"
                >
                  <div className={`p-1.5 rounded-none mt-0.5 border font-black ${
                    tx.type === 'ENTRADA' 
                      ? 'bg-green-100 border-green-200 text-green-700' 
                      : 'bg-amber-100 border-amber-200 text-amber-700'
                  }`}>
                    {tx.type === 'ENTRADA' ? 'IN' : 'OUT'}
                  </div>
                  
                  <div className="space-y-1 flex-1">
                    <div className="flex justify-between items-start gap-1">
                      <p className="font-sans font-black text-slate-900 line-clamp-1">{tx.materialName}</p>
                      <span className={`font-mono font-black shrink-0 text-sm ${
                        tx.type === 'ENTRADA' ? 'text-green-600' : 'text-amber-600'
                      }`}>
                        {tx.type === 'ENTRADA' ? '+' : '-'}{tx.quantity}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-slate-400 font-mono text-[9px] font-bold uppercase tracking-wider">
                      <span>Ref: {tx.responsible}</span>
                      <span>{new Date(tx.date).toLocaleDateString('pt-BR')}</span>
                    </div>

                    {tx.notes && (
                      <p className="text-[11px] text-slate-550 italic font-sans border-t border-slate-200/50 pt-1 mt-1 line-clamp-1 text-slate-500">
                        "{tx.notes}"
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {recentTransactions.length === 0 && (
                <div className="text-center py-12 text-xs text-slate-450 font-bold uppercase tracking-widest space-y-3">
                  <p>Nenhum movimento auditado no sistema.</p>
                  <button 
                    onClick={() => onNavigate('historico')}
                    className="px-4 py-2 border-2 border-slate-900 text-slate-900 font-black uppercase text-[10px] tracking-wider hover:bg-slate-900 hover:text-white transition-all"
                  >
                    Lançar Transação Manual
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Quick Action Bento Grid links - Square bold aesthetic */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white border-2 border-dashed border-slate-300 hover:border-indigo-650 p-6 rounded-none text-slate-900 space-y-3 flex flex-col justify-between group hover:scale-[1.01] transition-all">
          <div className="space-y-1.5">
            <span className="text-2xl">📄</span>
            <h4 className="text-md font-black uppercase tracking-tighter text-slate-900 group-hover:text-indigo-600">Importação Automática NF</h4>
            <p className="text-xs text-slate-500 font-sans leading-relaxed">
              Carregue arquivos XML padrão de qualquer Nota Fiscal de Compra (NF-e) para realizar o recebimento instantâneo no sistema e alimentar os estoques com zero digitação.
            </p>
          </div>
          <button 
            onClick={() => onNavigate('importar')}
            className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] tracking-widest uppercase rounded-none self-start"
          >
            Importar XML &rarr;
          </button>
        </div>

        <div className="bg-indigo-600 border-2 border-indigo-700 p-6 rounded-none text-white space-y-3 flex flex-col justify-between hover:scale-[1.01] transition-all shadow-sm">
          <div className="space-y-1.5">
            <span className="text-2xl">📷</span>
            <h4 className="text-md font-black uppercase tracking-tighter">Leitura de Código de Barras</h4>
            <p className="text-xs text-indigo-100 font-sans leading-relaxed">
              Registre a baixa rápida ou inserção física de equipamentos utilizando coletores USB ou simulações auditáveis diretamente no nosso scanner de almoxarifado virtual.
            </p>
          </div>
          <button 
            onClick={() => onNavigate('leitor')}
            className="mt-4 px-4 py-2 bg-white text-indigo-750 hover:bg-indigo-50 font-black text-[10px] tracking-widest uppercase rounded-none self-start"
          >
            Abrir Leitor Widget &rarr;
          </button>
        </div>

        <div className="bg-slate-900 border-2 border-slate-950 p-6 rounded-none text-white space-y-3 flex flex-col justify-between hover:scale-[1.01] transition-all shadow-sm">
          <div className="space-y-1.5">
            <span className="text-2xl">⚡</span>
            <h4 className="text-md font-black uppercase tracking-tighter">Frequência e Previsão IA</h4>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Consulte modelos estatísticos inteligentes para reconhecer os picos sazonais de requisição, calibrando tempos de reabastecimento para mitigar fretes duplicados.
            </p>
          </div>
          <button 
            onClick={() => onNavigate('previsoes')}
            className="mt-4 px-4 py-2 bg-indigo-505 bg-indigo-600 hover:bg-indigo-550 text-white font-black text-[10px] tracking-widest uppercase rounded-none self-start border border-indigo-500"
          >
            Ver Módulo de IA &rarr;
          </button>
        </div>

      </div>

    </div>
  );
}

