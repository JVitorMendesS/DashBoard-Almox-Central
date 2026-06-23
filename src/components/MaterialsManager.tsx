import React, { useState } from 'react';
import { Material } from '../types';
import BarcodeGenerator from './BarcodeGenerator';
import { Plus, Search, Pencil, Trash2, Printer, MapPin, Tag, ShieldAlert, CheckCircle2, ChevronRight, X, Layers, AlertTriangle } from 'lucide-react';

interface MaterialsManagerProps {
  materials: Material[];
  onRefresh: () => void;
}

export default function MaterialsManager({ materials, onRefresh }: MaterialsManagerProps) {
  // Navigation & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  
  // CRUD Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  
  // Barcode Label Print Dialog State
  const [printBarcodeMaterial, setPrintBarcodeMaterial] = useState<Material | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('EPI (Proteção)');
  const [quantity, setQuantity] = useState(0);
  const [minStock, setMinStock] = useState(5);
  const [unit, setUnit] = useState('un');
  const [location, setLocation] = useState('');
  const [unitPrice, setUnitPrice] = useState(0);

  // Notifications
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');
  const [loading, setLoading] = useState(false);

  // Available categories
  const categoriesList = ["EPI (Proteção)", "Componentes Elétricos", "Materiais de Escritório", "Ferramentas", "Suprimentos", "Segurança", "Geral"];

  const openAddForm = () => {
    setEditingMaterial(null);
    setName('');
    // Generate a random-looking 13-digit EAN-like code for convenience
    const randomCode = '789' + Math.floor(1000000000 + Math.random() * 9000000000).toString();
    setCode(randomCode);
    setDescription('');
    setCategory('EPI (Proteção)');
    setQuantity(0);
    setMinStock(10);
    setUnit('un');
    setLocation('Corredor A');
    setUnitPrice(0);
    setIsFormOpen(true);
    setErrorText('');
    setSuccessText('');
  };

  const openEditForm = (m: Material) => {
    setEditingMaterial(m);
    setName(m.name);
    setCode(m.code);
    setDescription(m.description);
    setCategory(m.category);
    setQuantity(m.quantity);
    setMinStock(m.minStock);
    setUnit(m.unit);
    setLocation(m.location);
    setUnitPrice(m.unitPrice);
    setIsFormOpen(true);
    setErrorText('');
    setSuccessText('');
  };

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setErrorText("Nome do material e Código de barras (EAN/SKU) são obrigatórios.");
      return;
    }

    setLoading(true);
    setErrorText('');
    setSuccessText('');

    try {
      const payload = {
        code,
        name,
        description,
        category,
        quantity: Number(quantity),
        minStock: Number(minStock),
        unit,
        location,
        unitPrice: Number(unitPrice)
      };

      const response = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      if (resData.success) {
        setSuccessText(`Material "${name}" salvo com sucesso no estoque!`);
        setIsFormOpen(false);
        onRefresh();
      } else {
        setErrorText(resData.message || "Erro para salvar no banco.");
      }
    } catch (err) {
      setErrorText("Erro de comunicação com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMaterial = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza absoluta que deseja excluir o material "${name}" do cadastro? Isso apagará o código de barras correspondente.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/materials/${id}`, {
        method: 'DELETE'
      });
      const resData = await response.json();
      if (resData.success) {
        setSuccessText(`Material "${name}" removido com sucesso.`);
        onRefresh();
      } else {
        setErrorText(resData.message || "Não foi possível remover o material.");
      }
    } catch (err) {
      setErrorText("Erro de rede ao remover o material.");
    }
  };

  // Filter logic
  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.code.includes(searchQuery) ||
                          m.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6 relative">
      
      {/* Search and category filters board - Bold design */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-none border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Text search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por Material, Código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs border-2 border-slate-900 bg-white rounded-none focus:border-indigo-600 focus:outline-hidden font-bold"
            />
          </div>

          {/* Category Dropdown */}
          <div className="relative w-full sm:w-56">
            <Layers className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 text-xs font-black uppercase tracking-wider border-2 border-slate-900 rounded-none focus:border-indigo-600 focus:outline-hidden appearance-none bg-white block"
            >
              <option value="ALL">Todas as Categorias</option>
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={openAddForm}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-none border-2 border-slate-900 cursor-pointer transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Cadastrar Novo Material
        </button>
      </div>

      {/* Notifications feedback */}
      {errorText && (
        <div className="p-4 bg-rose-50 border-l-8 border-l-rose-550 border-slate-205 text-rose-950 text-xs rounded-none font-black uppercase tracking-wider">
          {errorText}
        </div>
      )}

      {successText && (
        <div className="p-4 bg-emerald-50 border-l-8 border-l-emerald-500 text-emerald-950 text-xs rounded-none font-black uppercase tracking-wider">
          {successText}
        </div>
      )}

      {/* Table grid layout of materials - Stark flat borders */}
      <div className="bg-white rounded-none border-2 border-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-auto max-h-[600px] relative">
          <table className="min-w-full divide-y divide-slate-205 border-separate border-spacing-0">
            <thead className="sticky top-0 z-10 bg-slate-900">
              <tr className="bg-slate-900 text-white text-left text-[11px] font-black uppercase tracking-wider">
                <th className="p-3 md:p-4 pl-4 md:pl-6 whitespace-nowrap">Código / EAN</th>
                <th className="p-3 md:p-4 whitespace-nowrap">Material / Especificação</th>
                <th className="p-3 md:p-4">Categoria</th>
                <th className="p-3 md:p-4 whitespace-nowrap">Localização</th>
                <th className="p-3 md:p-4 text-right whitespace-nowrap">Preço Custo</th>
                <th className="p-3 md:p-4 text-center whitespace-nowrap">Físico</th>
                <th className="p-3 md:p-4 text-center whitespace-nowrap">Estoq. Mínimo</th>
                <th className="p-3 md:p-4 text-right pr-4 md:pr-6 whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
              {filteredMaterials.map(item => {
                const isCritical = item.quantity <= item.minStock;
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    
                    {/* Barcode code */}
                    <td className="p-3 md:p-4 pl-4 md:pl-6 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-black text-slate-800">{item.code}</span>
                        <button
                          title="Gerar e Imprimir Código de Barras"
                          onClick={() => setPrintBarcodeMaterial(item)}
                          className="p-1 text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-all cursor-pointer"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Material Spec */}
                    <td className="p-3 md:p-4">
                      <div className="space-y-0.5 max-w-sm">
                        <span className="font-black text-slate-950 block text-xs md:text-sm uppercase tracking-tight">{item.name}</span>
                        {item.description && (
                          <span className="text-[10px] text-slate-400 block font-sans tracking-tight">{item.description}</span>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-3 md:p-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 border border-slate-200 font-black uppercase text-[9px] bg-slate-100 text-slate-700">
                        <Tag className="h-2.5 w-2.5 text-slate-500" />
                        {item.category}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="p-3 md:p-4 whitespace-nowrap text-slate-650 font-mono font-bold uppercase tracking-wider">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {item.location || 'Sem localização'}
                      </span>
                    </td>

                    {/* Unit cost */}
                    <td className="p-3 md:p-4 text-right whitespace-nowrap font-mono font-black text-slate-900">
                      {formatCurrency(item.unitPrice)}
                    </td>

                    {/* Balance */}
                    <td className="p-3 md:p-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 font-mono font-black text-[11px] rounded-none ${
                        isCritical 
                          ? 'bg-rose-50 border-2 border-rose-500 text-rose-800' 
                          : 'bg-emerald-50 border-2 border-emerald-450 text-emerald-900'
                      }`}>
                        {isCritical && <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
                        {item.quantity} {item.unit}
                      </span>
                    </td>

                    {/* Min stock Limit */}
                    <td className="p-3 md:p-4 text-center whitespace-nowrap font-mono text-slate-500 font-bold">
                      {item.minStock} {item.unit}
                    </td>

                    {/* Action Tools */}
                    <td className="p-3 md:p-4 text-right pr-4 md:pr-6 whitespace-nowrap">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => openEditForm(item)}
                          className="p-1.5 border-2 border-slate-900 hover:bg-slate-900 hover:text-white transition-colors text-slate-950 font-black cursor-pointer rounded-none"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMaterial(item.id, item.name)}
                          className="p-1.5 border-2 border-slate-900 hover:bg-rose-600 hover:text-white transition-colors text-slate-950 font-black cursor-pointer rounded-none"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}

              {filteredMaterials.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 font-bold uppercase tracking-wider">
                    Nenhum material encontrado para os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: MANUAL EDIT OR ADD MATERIAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-none border-4 border-slate-900 p-6 space-y-4 shadow-2xl max-w-2xl w-full">
            
            <div className="flex justify-between items-center border-b-2 border-slate-100 pb-3">
              <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900">
                {editingMaterial ? 'Editar Material Cadastrado' : 'Cadastrar Novo Ativo'}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1 border border-transparent hover:border-slate-900 rounded-none text-slate-400 hover:text-slate-955"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold uppercase tracking-wider">
              
              {/* Product barcode */}
              <div className="space-y-1 sm:col-span-1">
                <label className="text-slate-700 block text-[10px] font-black">Código EAN/SKU de Barras *</label>
                <input 
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/[^a-zA-Z0-9.\- ]/g, ''))}
                  className="w-full text-xs p-2 border-2 border-slate-900 rounded-none font-mono text-indigo-750 bg-white"
                  placeholder="Ex: 7891020301011"
                  required
                />
              </div>

              {/* Category */}
              <div className="space-y-1 sm:col-span-1">
                <label className="text-slate-700 block text-[10px] font-black">Categoria Almoxarifado</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full text-xs p-2 border-2 border-slate-900 rounded-none bg-white appearance-none h-[38px]"
                >
                  {categoriesList.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Product name */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-slate-700 block text-[10px] font-black">Nome do Material / Especificação *</label>
                <input 
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full text-xs p-2.5 border-2 border-slate-900 rounded-none bg-white normal-case font-bold"
                  placeholder="Ex: Disjuntor Tripolar DIN 32A"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-slate-700 block text-[10px] font-black">Descrição detalhada</label>
                <textarea 
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full text-xs p-2.5 border-2 border-slate-900 rounded-none bg-white normal-case font-semibold"
                  placeholder="Aplicação, marca ou código auxiliar..."
                />
              </div>

              {/* Location */}
              <div className="space-y-1 col-span-1">
                <label className="text-slate-700 block text-[10px] font-black">Endereço de Armazenagem</label>
                <input 
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full text-xs p-2 border-2 border-slate-900 rounded-none bg-white font-mono"
                  placeholder="Corredor, Prateleira ou Gaveta..."
                />
              </div>

              {/* Unit of measure */}
              <div className="space-y-1 col-span-1">
                <label className="text-slate-700 block text-[10px] font-black">Unidade de Medida</label>
                <input 
                  type="text"
                  value={unit}
                  onChange={e => setUnit(e.target.value.toLowerCase())}
                  className="w-full text-xs p-2 border-2 border-slate-900 rounded-none bg-white lowercase"
                  placeholder="un, kg, rolo, m"
                />
              </div>

              {/* Physical quantity */}
              <div className="space-y-1 col-span-1">
                <label className="text-slate-700 block text-[10px] font-black">Quantidade Física Inicial</label>
                <input 
                  type="number"
                  min="0"
                  value={quantity}
                  disabled={!!editingMaterial}
                  onChange={e => setQuantity(Number(e.target.value))}
                  className="w-full text-xs p-2 border-2 border-slate-900 rounded-none font-mono bg-slate-50 disabled:opacity-50"
                  placeholder="Ex: 10"
                />
                {editingMaterial && (
                  <span className="text-[9px] text-slate-400 block lowercase normal-case mt-0.5">Lançamentos requerem auditoria</span>
                )}
              </div>

              {/* Minimum Stock threshold */}
              <div className="space-y-1 col-span-1">
                <label className="text-rose-700 block text-[10px] font-black">Estoque Mínimo de Alerta *</label>
                <input 
                  type="number"
                  min="0"
                  value={minStock}
                  onChange={e => setMinStock(Number(e.target.value))}
                  className="w-full text-xs p-2 border-2 border-rose-500 bg-rose-50/20 text-rose-950 font-black font-mono rounded-none"
                  placeholder="Ex: 5"
                  required
                />
              </div>

              {/* Unit cost price */}
              <div className="space-y-1 col-span-1">
                <label className="text-slate-700 block text-[10px] font-black">Preço Unitário Custo (R$)</label>
                <input 
                  type="number"
                  step="0.01"
                  min="0"
                  value={unitPrice}
                  onChange={e => setUnitPrice(Number(e.target.value))}
                  className="w-full text-xs p-2 border-2 border-slate-900 rounded-none font-mono font-semibold"
                />
              </div>

              {/* Spacer */}
              <div className="hidden sm:block" />

              {/* Form Actions */}
              <div className="sm:col-span-2 pt-4 flex justify-end gap-2 border-t-2 border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border-2 border-slate-900 text-slate-900 text-xs font-black rounded-none hover:bg-slate-900 hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-indigo-650 text-white text-xs font-black rounded-none transition-colors border-2 border-slate-900 cursor-pointer"
                >
                  {loading ? 'Processando...' : 'Salvar no Almoxarifado'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL: PRINT BARCODE LABEL PRINT LAYOUT */}
      {printBarcodeMaterial && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-none border-4 border-slate-900 p-6 space-y-5 shadow-2xl max-w-sm w-full">
            
            <div className="flex justify-between items-center border-b-2 border-slate-100 pb-3">
              <h3 className="text-md font-black uppercase tracking-tighter text-slate-900">Etiqueta de Estoque</h3>
              <button 
                onClick={() => setPrintBarcodeMaterial(null)}
                className="p-1 hover:bg-slate-100 border border-transparent hover:border-slate-300 text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Simulated Printed label sticker with cut border style */}
            <div className="border-2 border-dashed border-slate-400 p-6 bg-slate-50 text-center rounded-none font-sans relative flex flex-col items-center justify-center space-y-4">
              <span className="absolute top-2 left-2 text-[8px] font-black text-slate-400 tracking-widest uppercase font-mono">
                SISTEMA PATRIMÔNIAL
              </span>
              
              <div className="space-y-1">
                <h4 className="text-md font-black text-slate-950 uppercase tracking-tight line-clamp-1">{printBarcodeMaterial.name}</h4>
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider font-mono">
                  {printBarcodeMaterial.category} | Reg: {printBarcodeMaterial.location || 'N/A'}
                </p>
              </div>

              {/* Genuine Code 39 SVG Barcode! */}
              <div className="py-2 scale-110">
                <BarcodeGenerator value={printBarcodeMaterial.code} height={50} showText={true} />
              </div>
              
              <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest font-mono">
                Almoxarifado inteligente | {new Date().toLocaleDateString('pt-BR')}
              </div>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed text-center font-sans">
              💡 Compatível com impressora térmica direta (Ex: Zebra, Elgin) de rolo contínuo ou fita térmica para colar nas caixas organizadoras.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setPrintBarcodeMaterial(null)}
                className="px-4 py-2 border-2 border-slate-900 text-slate-900 text-xs font-black uppercase rounded-none hover:bg-slate-900 hover:text-white transition-all flex-1"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  document.title = `Etiqueta - ${printBarcodeMaterial.name}`;
                  window.print();
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-indigo-650 text-white text-xs font-black uppercase tracking-widest rounded-none border-2 border-slate-900 flex-1 flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <Printer className="h-4.5 w-4.5" />
                Imprimir
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

