export interface Material {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  quantity: number;
  minStock: number;
  unit: string;
  location: string;
  unitPrice: number;
  lastUpdated: string;
}

export interface StockTransaction {
  id: string;
  materialId: string;
  materialName: string;
  type: 'ENTRADA' | 'SAIDA';
  quantity: number;
  date: string;
  origin: 'XML_NFE' | 'MANUAL_ENTRADA' | 'MANUAL_SAIDA' | 'BARCODE_SCAN';
  responsible: string;
  notes: string;
}

export interface AppConfig {
  companyName: string;
}

export interface ForecastResponse {
  materialId: string;
  materialName: string;
  historicalAverage: number;
  currentStock: number;
  predictedDemandNextMonth: number;
  confidenceScore: number; // 0 to 100
  recommendation: string; // purchase suggestions, safety stock
  aiReasoning: string; // Explanations
}
