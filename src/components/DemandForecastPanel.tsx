import React, { useState } from 'react';
import { Material, ForecastResponse } from '../types';
import { Bot, HelpCircle, AlertTriangle, ArrowRight, ShoppingCart, TrendingUp, RefreshCcw, Sparkles, AlertCircle, FileSpreadsheet } from 'lucide-react';

interface DemandForecastPanelProps {
  materials: Material[];
}

export default function DemandForecastPanel({ materials }: DemandForecastPanelProps) {
  const [forecastList, setForecastList] = useState<ForecastResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const generateAIForecast = async () => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const response = await fetch('/api/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const resData = await response.json();
      if (resData.success) {
        setForecastList(resData.forecast);
        setSuccessMessage("Previsões de demanda calculadas com sucesso pelo modelo inteligente Gemini 3.5!");
      } else {
        setErrorMessage(resData.message || "Erro para consultar predição de IA.");
      }
    } catch (err) {
      setErrorMessage("Erro de rede ao comunicar com o servidor do Gemini.");
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 85) return 'text-emerald-500 bg-emerald-50 border-emerald-100';
    if (score >= 60) return 'text-amber-500 bg-amber-50 border-amber-100';
    return 'text-rose-500 bg-rose-50 border-rose-100';
  };

  return (
    <div className="space-y-8">
      
      {/* Intro visual banner - Bold style */}
      <div className="bg-slate-950 p-8 rounded-none text-white border-b-8 border-indigo-600 shadow-sm space-y-5 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-y-1/4 translate-x-1/12">
          {/* Stylized grid decoration */}
          <Sparkles className="h-44 w-44 text-indigo-400 rotate-12" />
        </div>

        <div className="space-y-3 max-w-2xl relative">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600 border border-indigo-500 rounded-none text-[9px] font-black tracking-widest text-white uppercase shadow-sm">
            <Bot className="h-3.5 w-3.5" />
            Módulo Predictivo por IA
          </span>
          <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">Otimizador de Inventário e Previsões</h2>
          <p className="text-xs text-slate-350 leading-relaxed font-sans">
            Nossa Inteligência Artificial analisa o histórico de entradas, saídas manuais e bips do coletor, reconhecendo frequências de retirada, tendências sazonais e tempos de reposição. Obtenha sugestões inteligentes de compra para mitigar custos de capital parado e evitar rupturas operacionais repentinas.
          </p>
        </div>

        <div className="pt-2">
          {forecastList.length === 0 ? (
            <button
              onClick={generateAIForecast}
              disabled={loading}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-none border-2 border-indigo-500 shadow-md transition-colors flex items-center gap-2 cursor-pointer"
              id="ai-generate-forecast-btn"
            >
              <Sparkles className="h-4 w-4 animate-spin-pulse" />
              {loading ? "Processando Algoritmos..." : "Calcular Previsões de Demanda"}
            </button>
          ) : (
            <button
              onClick={generateAIForecast}
              disabled={loading}
              className="px-4 py-2 border-2 border-slate-700 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-none transition-colors flex items-center gap-2 cursor-pointer"
              id="ai-recalculate-forecast-btn"
            >
              <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Recalcular com Novos Logs
            </button>
          )}
        </div>
      </div>

      {/* Loading animation state */}
      {loading && (
        <div className="bg-white p-12 rounded-none border-2 border-slate-900 flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
          <div className="relative">
            <div className="h-16 w-16 border-4 border-slate-100 border-t-slate-900 animate-spin" />
            <Bot className="h-7 w-7 text-slate-900 absolute top-4.5 left-4.5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-lg font-black uppercase tracking-tighter text-slate-900">IA analisando almoxarifado corporativo</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm font-mono uppercase tracking-wider">
              Agrupando histórico de logs, comparando mínimos estipulados e solicitando predições lógicas ao Gemini 3.5...
            </p>
          </div>
        </div>
      )}

      {/* Error feedback */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border-l-8 border-l-rose-550 border-y border-r border-slate-205 border-rose-200 text-rose-900 text-xs rounded-none flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-650" />
          <div>
            <p className="font-black uppercase tracking-wider text-[11px]">Não foi possível calcular previsões:</p>
            <p className="text-[11px] mt-1 font-mono font-bold">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Success notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border-l-8 border-l-emerald-500 text-emerald-900 text-xs rounded-none font-black uppercase tracking-wider shadow-xs">
          {successMessage}
        </div>
      )}

      {/* Results grid */}
      {forecastList.length > 0 && !loading && (
        <div className="space-y-8">
          
          {/* Rupture threat warnings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white p-6 rounded-none border border-slate-200 border-b-8 border-b-rose-500 shadow-sm space-y-2 col-span-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Sugestões de Compra Críticas</span>
              <div className="text-4xl font-black text-rose-650 font-mono">
                {forecastList.filter(f => f.predictedDemandNextMonth > f.currentStock).length} {forecastList.filter(f => f.predictedDemandNextMonth > f.currentStock).length === 1 ? 'Item' : 'Itens'}
              </div>
              <p className="text-[11px] text-slate-450 font-medium font-sans">Produtos com demanda prevista acima do saldo físico vigente.</p>
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-none border border-slate-950 border-b-8 border-b-indigo-400 shadow-xs space-y-2 col-span-2">
              <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest block">Resumo Estratégico de Compras por IA</span>
              <div className="text-xs text-slate-300 leading-relaxed font-sans">
                Para o próximo ciclo mensal, a IA recomenda priorizar o ressuprimento de materiais EPIs e Elétricos com base nos picos históricos. Evite estocar materiais com giro inferior a 15% para economizar caixa circulante e evitar perdas fiscais ou de validade.
              </div>
            </div>

          </div>

          {/* Cards catalog of predictions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {forecastList.map((item, index) => {
              const matchesMaterials = materials.find(m => m.id === item.materialId);
              const isBelowStock = item.predictedDemandNextMonth > item.currentStock;
              
              return (
                <div 
                  key={index}
                  className={`bg-white p-6 rounded-none border transition-all shadow-sm space-y-4 relative ${
                    isBelowStock 
                      ? 'border-2 border-rose-500 border-l-[10px] border-l-rose-550' 
                      : 'border border-slate-200 border-l-[10px] border-l-slate-900'
                  }`}
                >
                  {/* Confidence absolute bubble top */}
                  <div className={`absolute top-4 right-4 text-[9px] px-2.5 py-0.5 rounded-none border font-black uppercase tracking-wider font-mono ${getConfidenceColor(item.confidenceScore)}`}>
                    Confiança: {item.confidenceScore}%
                  </div>

                  <div className="space-y-1.5 max-w-[70%]">
                    <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase font-mono block">
                      ID: {item.materialId}
                    </span>
                    <h3 className="text-md font-black tracking-tight text-slate-900 uppercase line-clamp-1">{item.materialName}</h3>
                  </div>

                  {/* Compare levels */}
                  <div className="grid grid-cols-3 gap-3 border-y-2 border-dashed border-slate-200 py-3 text-center text-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 block font-black uppercase tracking-wider">Físico Atual</span>
                      <span className="font-black text-slate-800 font-mono text-sm">
                        {item.currentStock} {matchesMaterials?.unit || 'un'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 block font-black uppercase tracking-wider">Giro Médio Hist.</span>
                      <span className="font-black text-slate-800 font-mono text-sm">
                        {item.historicalAverage?.toFixed(1) || '0'} /mês
                      </span>
                    </div>
                    <div className="space-y-1 bg-indigo-50 border border-indigo-100 p-1.5 text-indigo-900">
                      <span className="text-[9px] text-indigo-600 block font-black uppercase tracking-widest">Demanda IA</span>
                      <span className="font-black font-mono text-sm leading-tight text-indigo-950 block">
                        {item.predictedDemandNextMonth} {matchesMaterials?.unit || 'un'}
                      </span>
                    </div>
                  </div>

                  {/* Recommendation and text outputs */}
                  <div className="space-y-3 text-xs">
                    <div className="flex gap-2 items-start text-slate-650 leading-relaxed font-sans">
                      <Bot className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5 bg-indigo-50 p-1 border border-indigo-100" />
                      <p className="text-[11px] text-slate-600 leading-normal font-sans">{item.aiReasoning}</p>
                    </div>

                    <div className={`p-3 rounded-none border-2 font-black uppercase tracking-wider text-[10px] flex items-center gap-2 ${
                      isBelowStock 
                        ? 'bg-rose-50 border-rose-300 text-rose-900' 
                        : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    }`}>
                      <ShoppingCart className="h-4 w-4 shrink-0" />
                      <span>{item.recommendation}</span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Export and buy list printout */}
          <div className="bg-slate-900 text-white p-6 rounded-none border border-slate-950 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 text-xs shadow-sm">
            <div className="space-y-1">
              <h4 className="font-black uppercase tracking-wider text-sm">Folha de Compras Predictiva Gerada</h4>
              <p className="text-slate-400 text-[11px]">Você pode imprimir ou exportar estas recomendações automáticas de abastecimento para o departamento corporativo de suprimentos.</p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px] rounded-none flex items-center gap-1.5 shadow-sm border border-indigo-500 cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Imprimir Recomendações
            </button>
          </div>

        </div>
      )}

      {/* Placeholder state */}
      {forecastList.length === 0 && !loading && (
        <div className="bg-white p-12 rounded-none border-2 border-slate-900 text-center space-y-5 max-w-xl mx-auto shadow-sm">
          <div className="h-14 w-14 bg-slate-100 border border-slate-200 text-slate-800 rounded-none flex items-center justify-center mx-auto shadow-xs font-black">
            📈
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900">Nenhum cálculo predictivo ativo</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              O modelo de IA ainda não processou os saldos físicos vigentes e registros de consumo da empresa. Clique no botão abaixo para executar o motor predictivo do Gemini.
            </p>
          </div>
          <button
            onClick={generateAIForecast}
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-none shadow-xs transition-colors cursor-pointer"
          >
            Processar com Gemini 3.5
          </button>
        </div>
      )}

    </div>
  );
}

