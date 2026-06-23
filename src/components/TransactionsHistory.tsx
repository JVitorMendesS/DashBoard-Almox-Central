import React, { useState } from 'react';
import { Material, StockTransaction } from '../types';
import { ArrowUpRight, ArrowDownRight, User, PlusCircle, MinusCircle, Search, Calendar, FileText, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

interface TransactionsHistoryProps {
  materials: Material[];
  transactions: StockTransaction[];
  onRefresh: () => void;
}

export default function TransactionsHistory({
  materials,
  transactions,
  onRefresh
}: TransactionsHistoryProps) {
  
  // Registrar panel fields
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [materialSearch, setMaterialSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [type, setType] = useState<'ENTRADA' | 'SAIDA'>('ENTRADA');
  const [quantity, setQuantity] = useState(1);
  const [responsible, setResponsible] = useState('Mariana Santos');
  const [notes, setNotes] = useState('');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'ENTRADA' | 'SAIDA'>('ALL');

  // Request notifications
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');

  // Handle transaction register submission
  const handleRegisterTx = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');
    setSuccessText('');

    if (!selectedMaterialId) {
      setErrorText("Por favor, selecione um material válido do almoxarifado.");
      return;
    }
    if (quantity <= 0) {
      setErrorText("A quantidade física deve ser maior que zero.");
      return;
    }
    if (!responsible.trim()) {
      setErrorText("Preencha o nome do responsável.");
      return;
    }

    const matchedMaterial = materials.find(m => m.id === selectedMaterialId);
    if (!matchedMaterial) {
      setErrorText("Material selecionado inválido.");
      return;
    }

    // Checking stock bounds if doing outbound
    if (type === 'SAIDA' && matchedMaterial.quantity < quantity) {
      setErrorText(`Ruptura de estoque evitada! Saldo físico atual: ${matchedMaterial.quantity} ${matchedMaterial.unit}. Quantidade de saída requisitada: ${quantity} ${matchedMaterial.unit}.`);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/transactions/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialId: selectedMaterialId,
          type,
          quantity,
          responsible,
          notes,
          origin: type === 'ENTRADA' ? 'MANUAL_ENTRADA' : 'MANUAL_SAIDA'
        })
      });

      const resData = await response.json();
      if (resData.success) {
        setSuccessText(`Movimentação de ${type === 'ENTRADA' ? 'ENTRADA (+)' : 'SAÍDA (-)'} aplicada com sucesso!`);
        // Reset states
        setSelectedMaterialId('');
        setMaterialSearch('');
        setQuantity(1);
        setNotes('');
        onRefresh();
      } else {
        setErrorText(resData.message || "Erro retornado pelo servidor.");
      }
    } catch (err) {
      setErrorText("Erro de conexão ao registrar transação.");
    } finally {
      setLoading(false);
    }
  };

  // Filter history logs
  const filteredTxs = transactions.filter(t => {
    const matchesSearch = t.materialName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.responsible.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (t.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'ALL' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  // Filter materials for selector search
  const filteredSelectorMaterials = materials.filter(m => {
    const search = materialSearch.toLowerCase().trim();
    if (!search) return true;
    return m.name.toLowerCase().includes(search) || m.code.toLowerCase().includes(search);
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Col 1: Registrar panel (Grid span 1) */}
      <div className="bg-white p-6 rounded-none border border-slate-205 shadow-sm space-y-4 self-start">
        <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900">Movimentação Manual</h2>
        <p className="text-xs text-slate-450 font-sans leading-relaxed">Gere lançamentos de ajuste, sobras ou testes diretamente no estoque sem usar os coletores ópticos.</p>

        <form onSubmit={handleRegisterTx} className="space-y-4 text-xs font-bold uppercase tracking-wider">
          
          {/* Movement type toggle */}
          <div className="space-y-1">
            <label className="text-slate-700 block text-[10px] font-black">Tipo de Operação</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('ENTRADA')}
                className={`py-2.5 px-3 rounded-none font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
                  type === 'ENTRADA' 
                    ? 'bg-emerald-50 border-emerald-650 text-emerald-955' 
                    : 'bg-white border-slate-900 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <PlusCircle className="h-4 w-4" />
                Entrada (+)
              </button>
              
              <button
                type="button"
                onClick={() => setType('SAIDA')}
                className={`py-2.5 px-3 rounded-none font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
                  type === 'SAIDA' 
                    ? 'bg-rose-50 border-rose-650 text-rose-955' 
                    : 'bg-white border-slate-900 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <MinusCircle className="h-4 w-4" />
                Saída (-)
              </button>
            </div>
          </div>

          {/* Selector of materials (Search bar with instant popup) */}
          <div className="space-y-1 relative">
            <label className="text-slate-700 block text-[10px] font-black">Pesquisar Material (Nome ou Código) *</label>
            
            {!selectedMaterialId ? (
              <div className="relative">
                <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou código de barras..."
                  value={materialSearch}
                  onChange={e => {
                    setMaterialSearch(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  // Blur with small timeout so click events register before hide
                  onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                  className="w-full text-xs pl-8 pr-3 py-2.5 border-2 border-slate-900 rounded-none bg-white font-bold"
                  required
                />
                
                {isDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border-2 border-slate-900 z-30 divide-y divide-slate-205 shadow-md">
                    {filteredSelectorMaterials.length > 0 ? (
                      filteredSelectorMaterials.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onMouseDown={() => {
                            setSelectedMaterialId(m.id);
                            setMaterialSearch(m.name);
                            setIsDropdownOpen(false);
                          }}
                          className="w-full text-left p-2.5 hover:bg-slate-50 transition-colors block cursor-pointer"
                        >
                          <div className="text-slate-950 font-black uppercase text-[11px] leading-tight">{m.name}</div>
                          <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono font-bold mt-1">
                            <span>CÓD CARD: {m.code}</span>
                            <span className="bg-slate-100 px-1 py-0.2 text-slate-705 uppercase font-sans">SALDO: {m.quantity} {m.unit}</span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center text-xs text-slate-400 font-bold uppercase tracking-wider">
                        Produto não localizado.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              (() => {
                const matched = materials.find(m => m.id === selectedMaterialId);
                if (matched) {
                  return (
                    <div className="bg-slate-100 border-2 border-slate-900 p-3.5 flex items-start justify-between gap-3 rounded-none">
                      <div className="space-y-1">
                        <span className="text-[8px] bg-slate-900 text-white font-black px-1.5 py-0.5 uppercase tracking-widest block max-w-fit">
                          Selecionado
                        </span>
                        <div className="font-black text-slate-950 uppercase text-[11px] leading-snug">{matched.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono font-bold">
                          CÓD: {matched.code} | Saldo: {matched.quantity} {matched.unit}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMaterialId('');
                          setMaterialSearch('');
                          setIsDropdownOpen(true);
                        }}
                        className="text-[9px] text-rose-650 hover:text-white hover:bg-rose-600 border-2 border-slate-900 font-black uppercase tracking-wider px-2 py-1 transition-colors rounded-none cursor-pointer"
                      >
                        Mudar
                      </button>
                    </div>
                  );
                }
                return null;
              })()
            )}
          </div>

          {/* Quantity */}
          <div className="space-y-1">
            <label className="text-slate-700 block text-[10px] font-black">Quantidade do Lote *</label>
            <input 
              type="number"
              min="1"
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              className="w-full text-xs p-2.5 border-2 border-slate-900 rounded-none font-mono text-indigo-700 font-black block bg-white"
              required
            />
          </div>

          {/* Responsible worker */}
          <div className="space-y-1">
            <label className="text-slate-700 block text-[10px] font-black font-semibold">Colaborador Executor *</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input 
                type="text"
                value={responsible}
                onChange={e => setResponsible(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2.5 border-2 border-slate-900 font-bold bg-white rounded-none focus:outline-hidden focus:border-indigo-650"
                placeholder="Ex: Mariana Santos"
                required
              />
            </div>
          </div>

          {/* Explanation notes */}
          <div className="space-y-1">
            <label className="text-slate-700 block text-[10px] font-black">Justificativa ou Observações</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full text-xs p-2.5 p-2.5 border-2 border-slate-900 rounded-none bg-white normal-case font-semibold"
              placeholder="Ex: Ajuste decorrente de balanço físico anual / Sobra de obra..."
            />
          </div>

          {/* Response text overlays */}
          {errorText && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-none flex items-start gap-1">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorText}</span>
            </div>
          )}

          {successText && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-none flex items-start gap-1">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successText}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-slate-900 hover:bg-indigo-650 text-white font-black text-xs uppercase tracking-widest rounded-none border-2 border-slate-900 cursor-pointer transition-colors"
          >
            {loading ? 'Salvando...' : 'Confirmar e Atualizar Estoque'}
          </button>

        </form>
      </div>

      {/* Col 2: Ledger list logs view (Grid span 2) */}
      <div className="lg:col-span-2 space-y-4">
        
        {/* Filter toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-none border border-slate-205 shadow-sm">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar histórico..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border-2 border-slate-900 bg-white rounded-none font-bold"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-slate-405 uppercase tracking-widest">Filtro:</span>
            <button
              type="button"
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-none border-2 transition-colors cursor-pointer ${
                filterType === 'ALL' 
                  ? 'bg-slate-900 border-slate-900 text-white' 
                  : 'bg-white border-slate-950 text-slate-500 hover:bg-slate-50'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setFilterType('ENTRADA')}
              className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-none border-2 transition-colors cursor-pointer ${
                filterType === 'ENTRADA' 
                  ? 'bg-emerald-650 border-emerald-650 text-white font-bold' 
                  : 'bg-white border-slate-950 text-slate-500 hover:bg-slate-50'
              }`}
            >
              Entradas
            </button>
            <button
              type="button"
              onClick={() => setFilterType('SAIDA')}
              className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-none border-2 transition-colors cursor-pointer ${
                filterType === 'SAIDA' 
                  ? 'bg-amber-650 border-amber-650 text-white font-bold' 
                  : 'bg-white border-slate-950 text-slate-500 hover:bg-slate-50'
              }`}
            >
              Saídas
            </button>
          </div>
        </div>

        {/* Ledger list */}
        <div className="bg-white rounded-none border-2 border-slate-900 shadow-sm overflow-hidden">
          <div className="overflow-auto max-h-[550px] relative">
            <table className="min-w-full divide-y divide-slate-200 border-separate border-spacing-0">
              <thead className="sticky top-0 z-10 bg-slate-900">
                <tr className="bg-slate-900 text-white text-left text-xs font-black uppercase tracking-wider">
                  <th className="p-4 pl-6">Data / Hora</th>
                  <th className="p-4">Material</th>
                  <th className="p-4 text-center">Tipo</th>
                  <th className="p-4 text-center">Qtde.</th>
                  <th className="p-4">Origem</th>
                  <th className="p-4">Responsável</th>
                  <th className="p-4 pr-6">Justificativa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs text-slate-700 font-bold">
                {filteredTxs.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    
                    {/* Timestamp */}
                    <td className="p-4 pl-6 whitespace-nowrap text-slate-550 font-mono">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{new Date(tx.date).toLocaleDateString('pt-BR')}</span>
                        <span className="text-slate-300">|</span>
                        <span>{new Date(tx.date).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}</span>
                      </div>
                    </td>

                    {/* Material name */}
                    <td className="p-4">
                      <span className="font-extrabold text-slate-950 uppercase text-[11px]">{tx.materialName}</span>
                    </td>

                    {/* Direction type marker */}
                    <td className="p-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-none text-[9px] font-black uppercase tracking-widest ${
                        tx.type === 'ENTRADA' 
                          ? 'bg-emerald-55/30 border border-emerald-300 text-emerald-900 font-extrabold shadow-none' 
                          : 'bg-rose-55/30 border border-rose-300 text-rose-900 font-extrabold shadow-none'
                      }`}>
                        {tx.type === 'ENTRADA' ? (
                          <>
                            <ArrowUpRight className="h-3 w-3 text-emerald-600 shrink-0" />
                            Entrada
                          </>
                        ) : (
                          <>
                            <ArrowDownRight className="h-3 w-3 text-rose-650 shrink-0" />
                            Saída
                          </>
                        )}
                      </span>
                    </td>

                    {/* Quantity impact */}
                    <td className="p-4 text-center whitespace-nowrap font-mono font-black text-slate-900 text-[13px]">
                      {tx.type === 'ENTRADA' ? '+' : '-'}{tx.quantity}
                    </td>

                    {/* Origin channels */}
                    <td className="p-4 whitespace-nowrap text-slate-550 font-black uppercase font-mono text-[9px] tracking-wider">
                      {tx.origin === 'XML_NFE' ? (
                        <span className="text-indigo-900 bg-indigo-50 px-2 py-0.5 border border-indigo-200">💻 NFe XML</span>
                      ) : tx.origin === 'BARCODE_SCAN' ? (
                        <span className="text-purple-900 bg-purple-50 px-2 py-0.5 border border-purple-200">🎯 Bip Leitor</span>
                      ) : (
                        <span className="text-slate-900 bg-slate-50 px-2 py-0.5 border border-slate-300">✍️ manual</span>
                      )}
                    </td>

                    {/* Responsible of inventory */}
                    <td className="p-4 whitespace-nowrap font-extrabold text-slate-900 uppercase">
                      {tx.responsible}
                    </td>

                    {/* Notes detailed */}
                    <td className="p-4 pr-6 max-w-xs truncate text-[11px] text-slate-500 font-semibold normal-case italic" title={tx.notes}>
                      {tx.notes ? `"${tx.notes}"` : '-'}
                    </td>

                  </tr>
                ))}

                {filteredTxs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 font-black uppercase tracking-wider">
                      Nenhuma movimentação registrada para essa pesquisa.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
