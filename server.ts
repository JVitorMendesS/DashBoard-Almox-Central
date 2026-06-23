import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";

const app = express();
const PORT = 3000;
const DB_PATH = path.join(process.cwd(), "src", "data", "db.json");

// Define Supabase configuration from process.env
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

let supabase: any = null;
if (supabaseUrl && supabaseKey && supabaseUrl !== "MY_SUPABASE_URL" && supabaseKey !== "MY_SUPABASE_KEY") {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log("Supabase client initialized successfully. Connected to: " + supabaseUrl);
  } catch (err) {
    console.error("Failed to initialize Supabase Client:", err);
  }
} else {
  console.log("Supabase environment variables not set. Using local JSON database (src/data/db.json).");
}

// Middleware to parse JSON bodies up to 10MB (for larger XMLs)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Helper to read database
function readDatabase() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      // Return empty database standard structure if missing
      return { materials: [], transactions: [] };
    }
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Erro ao ler o banco de dados:", error);
    return { materials: [], transactions: [] };
  }
}

// Helper to write database
function writeDatabase(data: any) {
  try {
    const parentDir = path.dirname(DB_PATH);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Erro ao salvar o banco de dados:", error);
    return false;
  }
}

// Ensure database file exists
readDatabase();

// ================= API ENDPOINTS =================

// 1. Get all materials and transactions
app.get("/api/dashboard", async (req, res) => {
  if (supabase) {
    try {
      const { data: materials, error: mError } = await supabase
        .from("materials")
        .select("*")
        .order("name", { ascending: true });
        
      const { data: transactions, error: tError } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });

      if (!mError && !tError && materials) {
        return res.json({
          success: true,
          materials: materials || [],
          transactions: transactions || []
        });
      }
      
      console.warn("Erro ao buscar no Supabase, caindo de volta para db.json:", mError || tError);
    } catch (e) {
      console.error("Exceção ao ligar com Supabase, usando db.json de fallback:", e);
    }
  }

  const data = readDatabase();
  res.json({
    success: true,
    materials: data.materials || [],
    transactions: data.transactions || []
  });
});

// 2. Add or update material manually
app.post("/api/materials", async (req, res) => {
  const { id, code, name, description, category, quantity, minStock, unit, location, unitPrice } = req.body;
  if (!name || !code) {
    return res.status(400).json({ success: false, message: "Nome e Código de barras são obrigatórios." });
  }

  const now = new Date().toISOString();

  if (supabase) {
    try {
      // Find by code to check if it already exists
      const { data: existing, error: findError } = await supabase
        .from("materials")
        .select("*")
        .eq("code", code)
        .maybeSingle();

      if (!findError) {
        if (existing) {
          // Update
          const { data: updated, error: updateError } = await supabase
            .from("materials")
            .update({
              name: name || existing.name,
              description: description !== undefined ? description : existing.description,
              category: category || existing.category,
              quantity: quantity !== undefined ? Number(quantity) : existing.quantity,
              minStock: minStock !== undefined ? Number(minStock) : existing.minStock,
              unit: unit || existing.unit,
              location: location || existing.location,
              unitPrice: unitPrice !== undefined ? Number(unitPrice) : existing.unitPrice,
              lastUpdated: now
            })
            .eq("id", existing.id)
            .select()
            .single();

          if (!updateError && updated) {
            return res.json({ success: true, material: updated });
          }
          console.warn("Erro ao atualizar material no Supabase:", updateError);
        } else {
          // Insert
          const newId = id || `mat-${Date.now()}`;
          const { data: inserted, error: insertError } = await supabase
            .from("materials")
            .insert({
              id: newId,
              code,
              name,
              description: description || "",
              category: category || "Geral",
              quantity: Number(quantity) || 0,
              minStock: Number(minStock) || 0,
              unit: unit || "un",
              location: location || "",
              unitPrice: Number(unitPrice) || 0,
              lastUpdated: now
            })
            .select()
            .single();

          if (!insertError && inserted) {
            return res.json({ success: true, material: inserted });
          }
          console.warn("Erro ao inserir material no Supabase:", insertError);
        }
      }
    } catch (e) {
      console.error("Exceção de materiais no Supabase. Fallback para JSON:", e);
    }
  }

  const db = readDatabase();
  const existingIndex = db.materials.findIndex((m: any) => m.code === code);

  let updatedMaterial;
  if (existingIndex >= 0) {
    db.materials[existingIndex] = {
      ...db.materials[existingIndex],
      name: name || db.materials[existingIndex].name,
      description: description !== undefined ? description : db.materials[existingIndex].description,
      category: category || db.materials[existingIndex].category,
      quantity: quantity !== undefined ? Number(quantity) : db.materials[existingIndex].quantity,
      minStock: minStock !== undefined ? Number(minStock) : db.materials[existingIndex].minStock,
      unit: unit || db.materials[existingIndex].unit,
      location: location || db.materials[existingIndex].location,
      unitPrice: unitPrice !== undefined ? Number(unitPrice) : db.materials[existingIndex].unitPrice,
      lastUpdated: now
    };
    updatedMaterial = db.materials[existingIndex];
  } else {
    const newId = id || `mat-${Date.now()}`;
    updatedMaterial = {
      id: newId,
      code,
      name,
      description: description || "",
      category: category || "Geral",
      quantity: Number(quantity) || 0,
      minStock: Number(minStock) || 0,
      unit: unit || "un",
      location: location || "",
      unitPrice: Number(unitPrice) || 0,
      lastUpdated: now
    };
    db.materials.push(updatedMaterial);
  }

  writeDatabase(db);
  res.json({ success: true, material: updatedMaterial });
});

// 3. Register standard incoming (ENTRADA) or outgoing (SAÍDA) transaction
app.post("/api/transactions/register", async (req, res) => {
  const { materialId, materialCode, type, quantity, responsible, notes, origin } = req.body;
  
  if (!type || !quantity || Number(quantity) <= 0 || !responsible) {
    return res.status(400).json({ success: false, message: "Campos obrigatórios ausentes ou quantidade inválida." });
  }

  const now = new Date().toISOString();
  const qty = Number(quantity);

  if (supabase) {
    try {
      let materialQuery = supabase.from("materials").select("*");
      if (materialId) {
        materialQuery = materialQuery.eq("id", materialId);
      } else if (materialCode) {
        materialQuery = materialQuery.eq("code", materialCode);
      } else {
        return res.status(400).json({ success: false, message: "É necessário fornecer ID ou código do material." });
      }

      const { data: material, error: mError } = await materialQuery.maybeSingle();

      if (mError) {
        console.warn("Erro ao buscar material no Supabase:", mError);
      } else if (!material) {
        return res.status(404).json({ success: false, message: "Material não encontrado no almoxarifado." });
      } else {
        let newQty = Number(material.quantity);
        if (type === "SAIDA") {
          if (newQty < qty) {
            return res.status(400).json({ 
              success: false, 
              message: `Estoque insuficiente. Saldo atual: ${newQty} ${material.unit}. Solicitado: ${qty} ${material.unit}.` 
            });
          }
          newQty -= qty;
        } else if (type === "ENTRADA") {
          newQty += qty;
        } else {
          return res.status(400).json({ success: false, message: "Tipo de movimentação inválido." });
        }

        const { error: mUpdateError } = await supabase
          .from("materials")
          .update({ quantity: newQty, lastUpdated: now })
          .eq("id", material.id);

        if (!mUpdateError) {
          const newTx = {
            id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            materialId: material.id,
            materialName: material.name,
            type,
            quantity: qty,
            date: now,
            origin: origin || "MANUAL_ENTRADA",
            responsible,
            notes: notes || ""
          };

          const { data: insertedTx, error: txError } = await supabase
            .from("transactions")
            .insert(newTx)
            .select()
            .single();

          if (!txError) {
            const updatedMaterial = { ...material, quantity: newQty, lastUpdated: now };
            return res.json({ success: true, material: updatedMaterial, transaction: insertedTx || newTx });
          }
          console.warn("Erro ao salvar transação no Supabase:", txError);
        } else {
          console.warn("Erro ao atualizar quantidade no Supabase:", mUpdateError);
        }
      }
    } catch (e) {
      console.error("Exceção ao registrar no Supabase. Usando JSON de fallback:", e);
    }
  }

  const db = readDatabase();
  let material = null;

  if (materialId) {
    material = db.materials.find((m: any) => m.id === materialId);
  } else if (materialCode) {
    material = db.materials.find((m: any) => m.code === materialCode);
  }

  if (!material) {
    return res.status(404).json({ success: false, message: "Material não encontrado no almoxarifado." });
  }

  if (type === "SAIDA") {
    if (material.quantity < qty) {
      return res.status(400).json({ 
        success: false, 
        message: `Estoque insuficiente. Saldo atual: ${material.quantity} ${material.unit}. Solicitado: ${qty} ${material.unit}.` 
      });
    }
    material.quantity -= qty;
  } else if (type === "ENTRADA") {
    material.quantity += qty;
  } else {
    return res.status(400).json({ success: false, message: "Tipo de movimentação inválido." });
  }

  material.lastUpdated = now;

  const newTx = {
    id: `tx-${Date.now()}-${Math.floor(Math.random() * 1005)}`,
    materialId: material.id,
    materialName: material.name,
    type,
    quantity: qty,
    date: now,
    origin: origin || "MANUAL_ENTRADA",
    responsible,
    notes: notes || ""
  };

  db.transactions.unshift(newTx);

  writeDatabase(db);
  res.json({ success: true, material, transaction: newTx });
});

// 4. Import / Bulk register from NF-e XML
app.post("/api/import-xml", async (req, res) => {
  const { items, responsible, nfeNumber, nfeIssuer } = req.body;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: "Nenhum material enviado para importar." });
  }

  const now = new Date().toISOString();
  const importedTxs: any[] = [];

  if (supabase) {
    try {
      for (const item of items) {
        const { code, name, quantity, unit, unitPrice, location, minStock, category } = item;
        const qty = Number(quantity) || 0;
        const price = Number(unitPrice) || 0;

        const { data: material, error: mError } = await supabase
          .from("materials")
          .select("*")
          .eq("code", code)
          .maybeSingle();

        let targetMaterial;
        let finalQty = qty;

        if (!mError && material) {
          finalQty = Number(material.quantity) + qty;
          const { data: updatedMaterial, error: updateError } = await supabase
            .from("materials")
            .update({
              quantity: finalQty,
              unitPrice: price,
              lastUpdated: now,
              location: location || material.location
            })
            .eq("id", material.id)
            .select()
            .single();

          targetMaterial = updatedMaterial || { ...material, quantity: finalQty, unitPrice: price, lastUpdated: now };
        } else {
          const newId = `mat-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const { data: insertedMaterial, error: insertError } = await supabase
            .from("materials")
            .insert({
              id: newId,
              code: code || `BAR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              name: name,
              description: `Importado da NF-e nº ${nfeNumber || ""} - Emitente: ${nfeIssuer || ""}`,
              category: category || "Suprimentos",
              quantity: qty,
              minStock: Number(minStock) || 5,
              unit: unit || "un",
              location: location || "Área de Recebimento",
              unitPrice: price,
              lastUpdated: now
            })
            .select()
            .single();

          targetMaterial = insertedMaterial || { id: newId, name };
        }

        const newTx = {
          id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          materialId: targetMaterial.id,
          materialName: targetMaterial.name,
          type: "ENTRADA",
          quantity: qty,
          date: now,
          origin: "XML_NFE",
          responsible: responsible || "Importação Automática",
          notes: `NF-e nº ${nfeNumber || "-"} | Emitente: ${nfeIssuer || "-"}`
        };

        const { error: txError } = await supabase
          .from("transactions")
          .insert(newTx);

        if (!txError) {
          importedTxs.push(newTx);
        }
      }

      if (importedTxs.length > 0) {
        return res.json({ success: true, count: items.length, transactions: importedTxs });
      }
    } catch (e) {
      console.error("Exceção ao importar XML no Supabase, usando JSON:", e);
    }
  }

  const db = readDatabase();

  for (const item of items) {
    const { code, name, quantity, unit, unitPrice, location, minStock, category } = item;
    
    let material = db.materials.find((m: any) => m.code === code);
    const qty = Number(quantity) || 0;
    const price = Number(unitPrice) || 0;

    if (material) {
      material.quantity += qty;
      material.unitPrice = price;
      material.lastUpdated = now;
      if (location) material.location = location;
    } else {
      material = {
        id: `mat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        code: code || `BAR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: name,
        description: `Importado da NF-e nº ${nfeNumber || ""} - Emitente: ${nfeIssuer || ""}`,
        category: category || "Suprimentos",
        quantity: qty,
        minStock: Number(minStock) || 5,
        unit: unit || "un",
        location: location || "Área de Recebimento",
        unitPrice: price,
        lastUpdated: now
      };
      db.materials.push(material);
    }

    const newTx = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      materialId: material.id,
      materialName: material.name,
      type: "ENTRADA",
      quantity: qty,
      date: now,
      origin: "XML_NFE",
      responsible: responsible || "Importação Automática",
      notes: `NF-e nº ${nfeNumber || "-"} | Emitente: ${nfeIssuer || "-"}`
    };

    importedTxs.push(newTx);
    db.transactions.unshift(newTx);
  }

  writeDatabase(db);
  res.json({ success: true, count: items.length, transactions: importedTxs });
});

// 5. Delete material
app.delete("/api/materials/:id", async (req, res) => {
  const { id } = req.params;

  if (supabase) {
    try {
      const { error } = await supabase
        .from("materials")
        .delete()
        .eq("id", id);

      if (!error) {
        return res.json({ success: true });
      }
      console.warn("Erro ao deletar no Supabase:", error);
    } catch (e) {
      console.error("Exceção ao deletar no Supabase, caindo para JSON:", e);
    }
  }

  const db = readDatabase();
  const initialLength = db.materials.length;
  db.materials = db.materials.filter((m: any) => m.id !== id);
  
  if (db.materials.length === initialLength) {
    return res.status(404).json({ success: false, message: "Material não encontrado." });
  }

  writeDatabase(db);
  res.json({ success: true });
});

// 6. Gemini AI-driven Demand Forecast endpoint
app.post("/api/forecast", async (req, res) => {
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey || geminiKey === "MY_GEMINI_API_KEY") {
      return res.status(400).json({
        success: false,
        message: "Chave da API do Gemini não configurada. Por favor, adicione-a nas configurações de segredos."
      });
    }

    let materialsSnapshot: any[] = [];
    let transactionsSnapshot: any[] = [];
    let fetchedFromSupabase = false;

    if (supabase) {
      try {
        const { data: materials, error: mError } = await supabase
          .from("materials")
          .select("*");
          
        const { data: transactions, error: tError } = await supabase
          .from("transactions")
          .select("*")
          .order("date", { ascending: false })
          .limit(30);

        if (!mError && !tError && materials) {
          materialsSnapshot = materials.map((m: any) => ({
            id: m.id,
            name: m.name,
            currentQuantity: m.quantity,
            minStock: m.minStock,
            unit: m.unit,
            category: m.category
          }));

          transactionsSnapshot = (transactions || []).map((t: any) => ({
            materialId: t.materialId,
            materialName: t.materialName,
            type: t.type,
            quantity: t.quantity,
            date: t.date
          }));

          fetchedFromSupabase = true;
        }
      } catch (e) {
        console.error("Exceção ao buscar no Supabase para previsão:", e);
      }
    }

    if (!fetchedFromSupabase) {
      const db = readDatabase();
      if (!db.materials || db.materials.length === 0) {
        return res.status(400).json({ success: false, message: "Nenhum material cadastrado para prever." });
      }

      materialsSnapshot = db.materials.map((m: any) => ({
        id: m.id,
        name: m.name,
        currentQuantity: m.quantity,
        minStock: m.minStock,
        unit: m.unit,
        category: m.category
      }));

      transactionsSnapshot = (db.transactions || [])
        .slice(0, 30)
        .map((t: any) => ({
          materialId: t.materialId,
          materialName: t.materialName,
          type: t.type,
          quantity: t.quantity,
          date: t.date
        }));
    }

    if (materialsSnapshot.length === 0) {
      return res.status(400).json({ success: false, message: "Nenhum material cadastrado para prever." });
    }

    const ai = new GoogleGenAI({
      apiKey: geminiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });

    const prompt = `
Você é um especialista em Inteligência Artificial para Gestão de Suprimentos (Almoxarifado).
Seu objetivo é analisar os dados de estoque atuais e o histórico recente de transações de entrada e saída para gerar uma previsão de demanda assertiva para os materiais no próximo mês.

Seja focado em dados reais: note tendências de saídas constantes, picos ou riscos de desabastecimento (estoque abaixo do mínimo).
Trabalhe de forma estritamente realista. Se um produto teve 10 saídas por mês no histórico, preveja algo coerente com base na tendência.

Aqui estão os materiais em estoque agora:
${JSON.stringify(materialsSnapshot, null, 2)}

Aqui estão as movimentações recentes (ENTRADA e SAIDA):
${JSON.stringify(transactionsSnapshot, null, 2)}

Gere um documento JSON que seja exatamente um array de objetos correspondente a cada material.
Use estritamente o formato JSON de exemplo a seguir, mantendo as chaves idênticas. Retorne APENAS o JSON válido para análise imediata, NENHUM texto de introdução ou conclusão.
As explicações ou feedbacks devem ser amigáveis e escritos em português do Brasil.

Formato de resposta esperado (Array de objetos):
[
  {
    "materialId": "ID_DO_MATERIAL",
    "materialName": "Nome do Material",
    "historicalAverage": 4.5, // média estimada de saídas mensais baseada no histórico
    "currentStock": 12,
    "predictedDemandNextMonth": 6, // demanda prevista de saídas para o próximo mês
    "confidenceScore": 85, // número de 0 a 100 estimando a confiabilidade do cálculo histórico
    "recommendation": "Comprar mais X unidades para manter estoque de segurança.", // recomendação em português
    "aiReasoning": "Análise da IA explicando o padrão de saída com base nos dados..." // justificativa amigável em português
  }
]
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [prompt],
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Resposta de previsão do Gemini vazia.");
    }

    const forecastData = JSON.parse(text);
    res.json({ success: true, forecast: forecastData });

  } catch (error: any) {
    console.error("Erro no serviço de previsão Gemini:", error);
    res.status(500).json({
      success: false,
      message: "Dificuldade ao gerar previsões baseadas em IA. Detalhes: " + (error.message || error)
    });
  }
});

// ================= VITE INTEGRATION =================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
