import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Trash2, ArrowRight } from 'lucide-react';

interface ExtractedItem {
  code: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  minStock: number;
  category: string;
  location: string;
  selected: boolean;
}

interface NfeInfo {
  nfeNumber: string;
  nfeIssuer: string;
  nfeIssuerCnpj: string;
  emissionDate: string;
}

interface NfeXmlImporterProps {
  onImportComplete: () => void;
}

export default function NfeXmlImporter({ onImportComplete }: NfeXmlImporterProps) {
  const [dragActive, setDragActive] = useState(false);
  const [xmlContent, setXmlContent] = useState<string>('');
  const [nfeInfo, setNfeInfo] = useState<NfeInfo | null>(null);
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
  const [responsible, setResponsible] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample XML generator to let them try without complex file lookup
  const loadSampleXML = () => {
    const sample = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe35220300000000000000550010000001231000001234" versao="4.00">
      <ide>
        <nNF>4258</nNF>
        <dhEmi>2226-06-22T10:30:00-03:00</dhEmi>
      </ide>
      <emit>
        <CNPJ>22.333.444/0001-99</CNPJ>
        <xNome>METALURGICA SUL BRASIL LTDA</xNome>
      </emit>
      <det nItem="1">
        <prod>
          <cProd>7891020301011</cProd>
          <xProd>Bota de Segurança de Couro Bracol</xProd>
          <uCom>un</uCom>
          <qCom>45.0000</qCom>
          <vUnCom>115.0000</vUnCom>
        </prod>
      </det>
      <det nItem="2">
        <prod>
          <cProd>7891020301028</cProd>
          <xProd>Óculos de Proteção Incolor DeltaPlus</xProd>
          <uCom>un</uCom>
          <qCom>100.0000</qCom>
          <vUnCom>17.5000</vUnCom>
        </prod>
      </det>
      <det nItem="3">
        <prod>
          <cProd>7891020301080</cProd>
          <xProd>Luva de Vaqueta Cano Curto Zanel</xProd>
          <uCom>par</uCom>
          <qCom>80.0000</qCom>
          <vUnCom>29.9000</vUnCom>
        </prod>
      </det>
      <det nItem="4">
        <prod>
          <cProd>7899990100456</cProd>
          <xProd>Fita Isolante de PVC Preta 3M 20m</xProd>
          <uCom>rl</uCom>
          <qCom>150.0000</qCom>
          <vUnCom>8.2000</vUnCom>
        </prod>
      </det>
    </infNFe>
  </NFe>
</nfeProc>`;
    setXmlContent(sample);
    processXML(sample);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      readFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      readFile(file);
    }
  };

  const readFile = (file: File) => {
    if (file.type !== "text/xml" && !file.name.endsWith(".xml")) {
      setErrorMessage("Por favor, selecione um arquivo válido em formato XML.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setXmlContent(text);
      processXML(text);
    };
    reader.onerror = () => {
      setErrorMessage("Fracasso ao ler o arquivo XML.");
    };
    reader.readAsText(file);
  };

  const processXML = (xmlText: string) => {
    try {
      setErrorMessage('');
      setSuccessMessage('');
      
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");

      // Verify parse error
      const parserError = xmlDoc.getElementsByTagName("parsererror");
      if (parserError.length > 0) {
        throw new Error("O XML enviado não possui formatação bem estruturada.");
      }

      // 1. Parse NF-e Metadata
      const nNF = xmlDoc.getElementsByTagName("nNF")[0]?.textContent || "S/N";
      const xNome = xmlDoc.getElementsByTagName("xNome")[0]?.textContent || "Emitente Desconhecido";
      const cnpj = xmlDoc.getElementsByTagName("CNPJ")[0]?.textContent || "Isento/Desconhecido";
      const dhEmi = xmlDoc.getElementsByTagName("dhEmi")[0]?.textContent || 
                   xmlDoc.getElementsByTagName("dEmi")[0]?.textContent || 
                   new Date().toISOString();

      setNfeInfo({
        nfeNumber: nNF,
        nfeIssuer: xNome,
        nfeIssuerCnpj: cnpj,
        emissionDate: dhEmi
      });

      // 2. Parse Invoice Items <det>
      const rawDets = xmlDoc.getElementsByTagName("det");
      const items: ExtractedItem[] = [];

      for (let i = 0; i < rawDets.length; i++) {
        const detNode = rawDets[i];
        
        const cProd = detNode.getElementsByTagName("cProd")[0]?.textContent || `NF-${nNF}-${i+1}`;
        const xProd = detNode.getElementsByTagName("xProd")[0]?.textContent || "Nome do Produto Indisponível";
        
        const qComRaw = detNode.getElementsByTagName("qCom")[0]?.textContent || "0";
        const qCom = Math.round(parseFloat(qComRaw));
        
        const uCom = detNode.getElementsByTagName("uCom")[0]?.textContent || "un";
        
        const vUnComRaw = detNode.getElementsByTagName("vUnCom")[0]?.textContent || "0";
        const vUnCom = parseFloat(vUnComRaw);

        // Auto guessing category based on product title
        let autoCategory = "Suprimentos";
        const lowercaseName = xProd.toLowerCase();
        if (lowercaseName.includes("bota") || lowercaseName.includes("óculos") || lowercaseName.includes("luva") || lowercaseName.includes("máscara") || lowercaseName.includes("epi") || lowercaseName.includes("capacete") || lowercaseName.includes("protetor")) {
          autoCategory = "EPI (Proteção)";
        } else if (lowercaseName.includes("cabo") || lowercaseName.includes("disjuntor") || lowercaseName.includes("fio") || lowercaseName.includes("elétrico") || lowercaseName.includes("tomada")) {
          autoCategory = "Componentes Elétricos";
        } else if (lowercaseName.includes("papel") || lowercaseName.includes("caneta") || lowercaseName.includes("pasta") || lowercaseName.includes("escritório") || lowercaseName.includes("sulfite")) {
          autoCategory = "Materiais de Escritório";
        } else if (lowercaseName.includes("martelo") || lowercaseName.includes("chave") || lowercaseName.includes("alicate") || lowercaseName.includes("parafuso") || lowercaseName.includes("ferramenta")) {
          autoCategory = "Ferramentas";
        }

        items.push({
          code: cProd,
          name: xProd,
          quantity: qCom,
          unit: uCom.toLowerCase(),
          unitPrice: vUnCom,
          minStock: Math.max(5, Math.ceil(qCom * 0.15)), // smart default threshold as 15% of inbound
          category: autoCategory,
          location: "Estante Principal",
          selected: true
        });
      }

      if (items.length === 0) {
        throw new Error("Não foi possível encontrar itens '<det>' válidos nesta Nota Fiscal XML.");
      }

      setExtractedItems(items);

    } catch (err: any) {
      setErrorMessage(`Ocorreu um erro ao interpretar o XML: ${err.message || err}`);
      setNfeInfo(null);
      setExtractedItems([]);
    }
  };

  const handleToggleItem = (index: number) => {
    const updated = [...extractedItems];
    updated[index].selected = !updated[index].selected;
    setExtractedItems(updated);
  };

  const handleItemFieldChange = (index: number, field: keyof ExtractedItem, value: any) => {
    const updated = [...extractedItems];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setExtractedItems(updated);
  };

  const handleDeleteItem = (index: number) => {
    const updated = extractedItems.filter((_, i) => i !== index);
    setExtractedItems(updated);
    if (updated.length === 0) {
      setNfeInfo(null);
    }
  };

  const handleSubmitImport = async () => {
    if (!responsible.trim()) {
      setErrorMessage("Por favor, preencha o nome do responsável pela importação.");
      return;
    }

    const selectedItems = extractedItems.filter(item => item.selected);
    if (selectedItems.length === 0) {
      setErrorMessage("Selecione pelo menos 1 item para efetuar o lote de entrada.");
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch("/api/import-xml", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: selectedItems,
          responsible,
          nfeNumber: nfeInfo?.nfeNumber,
          nfeIssuer: nfeInfo?.nfeIssuer
        })
      });

      const resData = await response.json();
      if (resData.success) {
        setSuccessMessage(`Excelente! Lote de ${resData.count} materiais importados com sucesso! Todos os estoques foram atualizados e as movimentações foram registradas para auditoria.`);
        // Reset states
        setExtractedItems([]);
        setNfeInfo(null);
        setXmlContent('');
        onImportComplete();
      } else {
        setErrorMessage(resData.message || "Erro desconhecido ao processar o lote.");
      }
    } catch (err) {
      setErrorMessage("Erro de rede ao submeter os materiais.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6">
      
      {/* Intro info card */}
      <div className="bg-white p-6 rounded-none border border-slate-200 shadow-sm">
        <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900">Leitor Automático de NF-e (XML)</h2>
        <p className="text-xs text-slate-500 mt-1 font-sans">
          Elimine a digitação manual de materiais recebidos. Faça o upload do documento XML da Nota Fiscal Eletrônica (<strong className="text-indigo-600 font-bold">.xml</strong>) para extrair instantaneamente o lote de materiais, CNPJ do fornecedor, preços e códigos de barras.
        </p>
      </div>

      {/* Upload Dropzone */}
      {!nfeInfo ? (
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center border-2 border-dashed p-10 text-center transition-all cursor-pointer bg-white rounded-none ${
            dragActive 
              ? 'border-indigo-600 bg-indigo-50/20' 
              : 'border-slate-400 hover:border-slate-900 hover:bg-slate-50'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xml"
            className="hidden"
          />

          <div className="h-16 w-16 bg-slate-100 border border-slate-300 text-slate-900 rounded-none flex items-center justify-center mb-5 shadow-xs">
            <Upload className="h-7 w-7" />
          </div>

          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Arraste seu documento XML aqui ou clique para buscar</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-2 font-sans">
            Formatos aceitos: Nota Fiscal de Compra (.xml) estruturada conforme padrão nacional da Receita Federal.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
            <span className="text-xs text-slate-400 font-sans">Ambiente de Testes:</span>
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                loadSampleXML();
              }}
              className="text-[10px] text-slate-950 font-black uppercase tracking-wider bg-white border-2 border-slate-950 hover:bg-slate-950 hover:text-white px-4 py-2 rounded-none transition-colors duration-150 cursor-pointer"
            >
              Simular Nota Fiscal Eletrônica de Exemplo &rarr;
            </button>
          </div>
        </div>
      ) : (
        /* Preview extracted XML details */
        <div className="space-y-6">
          
          <div className="bg-white p-6 rounded-none border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-start border-b border-slate-150 pb-3">
              <div>
                <span className="bg-indigo-600 border border-indigo-500 text-white text-[9px] font-black px-2.5 py-1 rounded-none uppercase tracking-widest block max-w-fit">
                  Nota Fiscal Eletrônica Detectada
                </span>
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 mt-2">Nota Fiscal nº: {nfeInfo.nfeNumber}</h3>
              </div>
              <button 
                onClick={() => {
                  setNfeInfo(null);
                  setExtractedItems([]);
                }}
                className="text-xs text-rose-600 hover:text-rose-800 font-black uppercase tracking-wider flex items-center gap-1 border border-transparent p-1 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Descartar XML
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs uppercase tracking-wider font-bold">
              <div className="space-y-0.5">
                <span className="text-[9px] text-slate-400 block font-black">Fornecedor / Emitente</span>
                <span className="font-extrabold text-slate-900 border-b border-slate-100 pb-1 block">{nfeInfo.nfeIssuer}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] text-slate-400 block font-black">CNPJ Emitente</span>
                <span className="font-mono text-slate-900 border-b border-slate-100 pb-1 block">{nfeInfo.nfeIssuerCnpj}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] text-slate-400 block font-black">Emissão da NF</span>
                <span className="font-mono text-slate-950 border-b border-slate-100 pb-1 block">
                  {new Date(nfeInfo.emissionDate).toLocaleDateString('pt-BR')} às {new Date(nfeInfo.emissionDate).toLocaleTimeString('pt-BR')}
                </span>
              </div>
            </div>
            
            {/* Responsible of inventory worker input */}
            <div className="pt-3 max-w-md">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-800 mb-1">
                Operador que efetuará o Lote de Entrada *
              </label>
              <input 
                type="text"
                placeholder="Ex: Mariana Santos"
                value={responsible}
                onChange={e => setResponsible(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-slate-900 font-bold bg-white rounded-none focus:border-indigo-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Grid list of extracted materials */}
          <div className="bg-white p-6 rounded-none border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-none border border-slate-250">
              <div className="text-xs text-slate-650 font-black uppercase tracking-wider text-[10px]">
                Lote Contém <strong className="text-slate-950">{extractedItems.length} materiais</strong>. Selecione quais salvar abaixo.
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hidden sm:inline">
                Inspeção de Cadastramento Automático
              </span>
            </div>

            <div className="overflow-x-auto border-2 border-slate-900 rounded-none shadow-sm">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr className="bg-slate-900 text-white text-left text-[10px] font-black uppercase tracking-wider">
                    <th className="p-3 w-10 text-center">Importar</th>
                    <th className="p-3 w-32">Cód. Barras (NF)</th>
                    <th className="p-3">Material Extraído</th>
                    <th className="p-3 text-center">Qtde. NF</th>
                    <th className="p-3 text-right">Preço Unit.</th>
                    <th className="p-3 w-40">Categoria Alvo</th>
                    <th className="p-3 w-40">Localização Alvo</th>
                    <th className="p-3 text-center w-24">Est. Mínimo</th>
                    <th className="p-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
                  {extractedItems.map((item, index) => (
                    <tr 
                      key={index} 
                      className={`hover:bg-slate-50 transition-colors ${!item.selected ? 'opacity-50 bg-slate-100' : ''}`}
                    >
                      {/* Select state */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <input 
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => handleToggleItem(index)}
                          className="h-4 w-4 bg-white border-2 border-slate-900 text-slate-900 rounded-none focus:ring-slate-900"
                        />
                      </td>

                      {/* Barcode code */}
                      <td className="p-3 whitespace-nowrap font-mono text-slate-900 font-extrabold uppercase">
                        {item.code}
                      </td>

                      {/* Material name */}
                      <td className="p-3 font-bold text-slate-950">
                        <input 
                          type="text"
                          value={item.name}
                          onChange={e => handleItemFieldChange(index, "name", e.target.value)}
                          className="w-full bg-transparent hover:bg-slate-50 border-b-2 border-dashed border-transparent hover:border-slate-300 focus:border-slate-900 focus:outline-hidden p-1 font-bold text-slate-950 uppercase text-xs"
                        />
                      </td>

                      {/* Quantity in invoice */}
                      <td className="p-3 text-center font-mono whitespace-nowrap">
                        <div className="flex justify-center items-center gap-1.5">
                          <input 
                            type="number"
                            value={item.quantity}
                            onChange={e => handleItemFieldChange(index, "quantity", Number(e.target.value))}
                            className="w-12 text-center bg-white border border-slate-300 rounded-none p-1 font-mono font-black"
                          />
                          <span className="text-slate-400 lowercase font-sans font-bold">{item.unit}</span>
                        </div>
                      </td>

                      {/* Unit Price */}
                      <td className="p-3 text-right whitespace-nowrap font-semibold">
                        <div className="flex items-center justify-end gap-1 font-mono">
                          <span className="text-[10px] text-slate-400">R$</span>
                          <input 
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={e => handleItemFieldChange(index, "unitPrice", Number(e.target.value))}
                            className="w-16 text-right bg-white border border-slate-300 rounded-none p-1 font-mono font-black"
                          />
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3">
                        <select
                          value={item.category}
                          onChange={e => handleItemFieldChange(index, "category", e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-none p-1 text-xs font-bold uppercase tracking-wider"
                        >
                          <option value="EPI (Proteção)">EPI (Proteção)</option>
                          <option value="Componentes Elétricos">Componentes Elétricos</option>
                          <option value="Materiais de Escritório">Materiais de Escritório</option>
                          <option value="Ferramentas">Ferramentas</option>
                          <option value="Suprimentos">Suprimentos</option>
                          <option value="Segurança">Segurança</option>
                          <option value="Geral">Geral</option>
                        </select>
                      </td>

                      {/* Location */}
                      <td className="p-3">
                        <input 
                          type="text"
                          value={item.location}
                          onChange={e => handleItemFieldChange(index, "location", e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-none p-1 text-xs uppercase font-bold"
                          placeholder="Localização..."
                        />
                      </td>

                      {/* Minimum Stock setting */}
                      <td className="p-3 text-center">
                        <input 
                          type="number"
                          value={item.minStock}
                          onChange={e => handleItemFieldChange(index, "minStock", Number(e.target.value))}
                          className="w-12 text-center bg-rose-50 border-2 border-rose-450 rounded-none p-1 font-mono text-rose-900 font-extrabold"
                        />
                      </td>

                      {/* Delete row */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <button 
                          onClick={() => handleDeleteItem(index)}
                          className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total value preview */}
            <div className="flex flex-col sm:flex-row justify-between items-center pt-4 gap-4 border-t border-slate-150">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Selecionados: <strong className="text-slate-950 font-black">{extractedItems.filter(i=>i.selected).length} de {extractedItems.length} materiais</strong> para salvamento no Almoxarifado.
              </span>

              <div className="flex items-center gap-5">
                <div className="text-right">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Total do Lote</span>
                  <span className="text-xl font-black text-emerald-900 font-mono">
                    {formatCurrency(extractedItems.reduce((acc, curr) => acc + (curr.selected ? curr.quantity * curr.unitPrice : 0), 0))}
                  </span>
                </div>

                <button 
                  onClick={handleSubmitImport}
                  disabled={loading}
                  className="flex items-center gap-2 bg-slate-900 hover:bg-indigo-650 text-white font-black text-xs uppercase tracking-widest py-3 px-5 rounded-none border-2 border-slate-900 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Processando..." : "Registrar Lote de Entradas"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Message feedback overlays */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border-l-8 border-l-rose-550 border border-slate-200 text-rose-955 text-xs rounded-none flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <p className="font-black uppercase tracking-wider text-[11px] mb-1">Xô, erro de recebimento!</p>
            <p className="font-semibold">{errorMessage}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-5 bg-emerald-50 border-l-8 border-l-emerald-500 border border-slate-205 text-emerald-950 text-xs rounded-none flex items-start gap-4">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-650 mt-1" />
          <div>
            <p className="font-black uppercase tracking-widest text-emerald-900 text-[11px] mb-1.5">LOTE DE ENTRADAS REGISTRADO</p>
            <p className="font-medium text-slate-800 leading-relaxed font-sans">{successMessage}</p>
          </div>
        </div>
      )}

    </div>
  );
}
