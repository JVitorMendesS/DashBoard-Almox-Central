import React, { useState, useRef, useEffect } from 'react';
import { Material } from '../types';
import { Scan, Keyboard, ShieldAlert, CheckCircle2, AlertTriangle, User, FileText, ShoppingCart } from 'lucide-react';

interface BarcodeScannerWidgetProps {
  materials: Material[];
  onTransactionComplete: () => void;
}

export default function BarcodeScannerWidget({ materials, onTransactionComplete }: BarcodeScannerWidgetProps) {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [responsible, setResponsible] = useState('Carlos Silva');
  const [exitQuantity, setExitQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [autoSubmit, setAutoSubmit] = useState(true);
  const [lastScannedMaterial, setLastScannedMaterial] = useState<Material | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  
  const scanInputRef = useRef<HTMLInputElement>(null);

  // Play synthetic warehouse scan "BIP" sound
  const playScanBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = "sine";
      oscillator.frequency.value = 1450; // high pitched electronic checkout-like beep
      
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.12);
    } catch (err) {
      console.warn("Navegador bloqueou reprodução de áudio. Aguardando interação do usuário.", err);
    }
  };

  // Focus the input when component mounts or auto-focus is desired
  useEffect(() => {
    if (scanInputRef.current) {
      scanInputRef.current.focus();
    }
  }, []);

  const handleBarcodeSubmit = async (codeToProcess: string) => {
    const code = codeToProcess.trim();
    if (!code) return;

    setFeedback(null);
    setBarcodeInput(''); // clear for next scans

    // Check if material is in list
    const foundMaterial = materials.find(m => m.code === code);
    if (!foundMaterial) {
      playScanBeep();
      setTimeout(() => playScanBeep(), 100); // double beep for error
      setFeedback({
        type: 'error',
        text: `Código [${code}] de barras não identificado no Almoxarifado corporativo. Cadastre o material no inventário primeiro.`
      });
      setLastScannedMaterial(null);
      return;
    }

    if (foundMaterial.quantity < exitQuantity) {
      playScanBeep();
      setTimeout(() => playScanBeep(), 100);
      setFeedback({
        type: 'error',
        text: `Ruptura de estoque para "${foundMaterial.name}". Saldo físico atual é de apenas ${foundMaterial.quantity} ${foundMaterial.unit}, mas a saída solicitada foi de ${exitQuantity} ${foundMaterial.unit}.`
      });
      setLastScannedMaterial(foundMaterial);
      return;
    }

    // Call API to register SAIDA
    try {
      const response = await fetch('/api/transactions/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialCode: code,
          type: 'SAIDA',
          quantity: exitQuantity,
          responsible,
          notes: notes || 'Saída registrada via scanner de código de barras.',
          origin: 'BARCODE_SCAN'
        })
      });

      const resData = await response.json();
      if (resData.success) {
        // play authentic bip sound
        playScanBeep();
        
        setFeedback({
          type: 'success',
          text: `BIP! Saída registrada: -${exitQuantity} ${foundMaterial.unit} de "${foundMaterial.name}". Estoque atualizado para ${foundMaterial.quantity - exitQuantity} ${foundMaterial.unit}.`
        });
        setLastScannedMaterial({
          ...foundMaterial,
          quantity: foundMaterial.quantity - exitQuantity
        });
        onTransactionComplete();
      } else {
        setFeedback({
          type: 'error',
          text: resData.message || "Erro desconhecido ao computar a saída."
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: "Erro de rede ao registrar transação eletrônica."
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBarcodeSubmit(barcodeInput);
    }
  };

  // Simulated scan triggers
  const triggerSimulatedScan = (barcode: string) => {
    handleBarcodeSubmit(barcode);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Configuration & Main Terminal Scan box (Span 2) */}
      <div className="lg:col-span-2 space-y-6">
        
        <div className="bg-white p-6 rounded-none border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-105">
            <Scan className="h-6 w-6 text-indigo-600" />
            <div>
              <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900">Leitor Virtual & Físico</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest text-[9px]">Baixa de estoque em tempo real</p>
            </div>
          </div>

          {/* Hidden/Active input trigger */}
          <div className="bg-slate-950 rounded-none p-5 text-white space-y-4 border-2 border-slate-905 shadow-xs">
            <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-800 pb-3 font-mono font-black uppercase tracking-wider">
              <span className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${isFocused ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
                {isFocused ? 'Terminal Ativo (Aguardando Bip)' : 'Terminal Desfocado (Clique no Campo)'}
              </span>
              <span>Porto: USB_HID_GUN</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-300 block font-black uppercase tracking-wider">
                Entrada Óptica / Digitação de Código:
              </label>
              
              <div className="relative">
                <input
                  type="text"
                  ref={scanInputRef}
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Escaneie com leitor ou digite manualmente..."
                  className="w-full bg-slate-900 border-2 border-slate-700 text-white font-mono rounded-none pl-4 pr-16 py-3 focus:outline-hidden focus:border-indigo-500 text-xs placeholder-slate-600 block"
                />
                
                <button
                  type="button"
                  onClick={() => handleBarcodeSubmit(barcodeInput)}
                  className="absolute right-2 top-2.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-750 text-[10px] rounded-none text-white font-black uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Reg
                </button>
              </div>

              <p className="text-[10px] text-slate-450 leading-relaxed font-sans">
                💡 <strong>Integração com Hardware:</strong> Pistolas USB / Bluetooth emulam um teclado físico, preenchendo este campo e enviando um evento de confirmação automática ao final de cada código de barras.
              </p>
            </div>
          </div>

          {/* Settings panel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div className="space-y-1">
              <label className="font-black text-slate-800 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <User className="h-3 w-3 text-slate-400" />
                Operador Responsável
              </label>
              <input
                type="text"
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                placeholder="Ex: Carlos Silva"
                className="w-full p-2.5 border-2 border-slate-900 bg-white rounded-none focus:border-indigo-600 focus:outline-hidden text-xs font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-black text-slate-800 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <ShoppingCart className="h-3 w-3 text-slate-400" />
                Quantidade por Saída
              </label>
              <input
                type="number"
                min="1"
                value={exitQuantity}
                onChange={(e) => setExitQuantity(Number(e.target.value))}
                className="w-full p-2.5 border-2 border-slate-900 bg-white rounded-none focus:border-indigo-500 focus:outline-hidden text-xs font-mono font-black text-indigo-700"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="font-black text-slate-800 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <FileText className="h-3 w-3 text-slate-400" />
                Justificativa / Destinatário
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Baixa para manutenção elétrica / Obra Central"
                className="w-full p-2.5 border-2 border-slate-900 bg-white rounded-none focus:border-indigo-500 focus:outline-hidden text-xs font-bold"
              />
            </div>
          </div>

        </div>

        {/* FEEDBACK NOTIFICATION AREA */}
        {feedback && (
          <div className={`p-4 rounded-none border-y border-r flex items-start gap-3 text-xs shadow-sm ${
            feedback.type === 'success' 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-950 border-l-[8px] border-l-emerald-500' 
              : 'bg-rose-50 border-rose-100 text-rose-950 border-l-[8px] border-l-rose-500'
          }`}>
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-650 mt-0.5" />
            ) : (
              <AlertTriangle className="h-5 w-5 shrink-0 text-rose-650 mt-0.5" />
            )}
            <div>
              <p className="font-black uppercase tracking-wider text-[11px] mb-1">{feedback.type === 'success' ? 'BIP! SUCESSO' : 'BIP! FALHA OPERACIONAL'}</p>
              <p className="font-medium text-slate-800 leading-relaxed">{feedback.text}</p>
              
              {/* Show warning about low stock after exit */}
              {lastScannedMaterial && lastScannedMaterial.quantity <= lastScannedMaterial.minStock && (
                <div className="mt-3 text-xs font-black text-rose-900 bg-rose-100/60 p-3 rounded-none border border-rose-300 max-w-fit leading-normal uppercase tracking-wide">
                  ⚠️ <strong>Estoque Mínimo Violado:</strong> "{lastScannedMaterial.name}" agora contém apenas {lastScannedMaterial.quantity} {lastScannedMaterial.unit} em estoque. É essencial providenciar o ressuprimento.
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Simulator Gun Controls (Span 1) */}
      <div className="bg-white p-6 rounded-none border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
          <Keyboard className="h-4.5 w-4.5 text-slate-500" />
          Simulador de Pistola
        </h3>
        
        <p className="text-xs text-slate-500 leading-relaxed font-sans">
          Sem pistola de leitura no momento? Clique no botão <strong className="text-indigo-600">Simular Bip</strong> para enviar o código codificado diretamente ao terminal e testar os alertas audíveis.
        </p>

        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {materials.map(m => (
            <div 
              key={m.id} 
              className="p-3.5 bg-slate-50 hover:bg-indigo-50/20 border border-slate-200 transition-colors rounded-none text-xs space-y-2.5 relative"
            >
              <div className="space-y-0.5">
                <span className="font-black text-slate-950 uppercase line-clamp-1 block pr-12 text-[11px] font-sans">{m.name}</span>
                <span className="text-[10px] font-mono text-slate-400 block tracking-wider uppercase">Cód: {m.code}</span>
              </div>

              <div className="flex justify-between items-center border-t border-slate-200/50 pt-2 text-[11px] text-slate-500">
                <span className="font-mono">Saldo: <strong className="text-slate-900 font-black">{m.quantity} {m.unit}</strong></span>
                <button
                  type="button"
                  onClick={() => triggerSimulatedScan(m.code)}
                  className="px-2.5 py-1 bg-slate-900 text-white hover:bg-indigo-650 font-black font-mono text-[9px] uppercase tracking-wider rounded-none transition-colors border border-slate-900 cursor-pointer"
                >
                  📢 Simular Bip
                </button>
              </div>
            </div>
          ))}

          {materials.length === 0 && (
            <div className="text-center py-6 text-xs text-slate-400 font-bold uppercase tracking-wider">
              Nenhum material cadastrado para simular.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
