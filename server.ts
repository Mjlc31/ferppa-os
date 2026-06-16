import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Aumento de limite para processar imagens base64 do WhatsApp
  app.use(express.json({ limit: '50mb' }));

  // MÓDULO 1: FRICÇÃO ZERO (Webhook OCR via WhatsApp / Evolution API)
  app.post('/api/webhook/evolution', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY não configurada no servidor.');
      }
      
      const ai = new GoogleGenAI({ apiKey });
      const payload = req.body;
      
      // Simulação da estrutura de payload da Evolution API ou Z-API (base64)
      const base64Image = payload?.data?.message?.base64 || payload?.base64 || payload?.message?.document?.base64;
      
      if (!base64Image) {
        res.status(400).json({ error: 'Nenhuma imagem encontrada no payload' });
        return;
      }

      // Remover prefixo data:image caso exista
      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { 
                text: 'Extraia os dados deste canhoto/cupom de abastecimento de diesel. Retorne APENAS um JSON válido e estrito contendo as chaves: "liters" (number), "total_value" (number), "gas_station" (string), "receipt_number" (string).' 
              },
              { 
                inlineData: { 
                  data: base64Data, 
                  mimeType: 'image/jpeg' 
                } 
              }
            ]
          }
        ]
      });

      let jsonStr = response.text || '{}';
      // Limpeza da formatação Markdown se houver
      jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
      
      let extractedData;
      try {
        extractedData = JSON.parse(jsonStr);
      } catch (e) {
        throw new Error('Falha ao fazer parse do JSON retornado pelo Gemini Vision.');
      }

      // Inserção no Supabase - Tabela fuel_logs
      // Simulando a resolução do fleet_id - buscaria na base pelo numero WhatsApp
      // Para este protótipo, criaremos um registro fictício caso a frota não exista
      const { data: fleetData } = await supabase.from('fleet').select('id').limit(1).single();
      const fleetId = fleetData ? fleetData.id : crypto.randomUUID(); // Note: if fleet doesn't exist, this might fail FK constraint. Ideally fetch a real fallback or fail. For prototype, we assume fleet exists.
      
      const today = new Date().toISOString().split('T')[0];
      const time = new Date().toTimeString().substring(0, 5);
      const unitPrice = extractedData.liters ? (extractedData.total_value / extractedData.liters) : 0;
      const controlNumber = 'WA-' + Date.now().toString().substring(4);

      const { data: insertedData, error: dbError } = await supabase.from('fuel_logs').insert([{
        fleet_id: fleetId,
        control_number: controlNumber,
        date: today,
        time: time,
        gas_station: extractedData.gas_station || 'Posto Desconhecido',
        odometer: 0,
        fuel_type: 'Diesel S10',
        liters: extractedData.liters,
        unit_price: Number(unitPrice.toFixed(2)),
        payment_method: 'A PRAZO / FATURADO',
        receipt_image: `WhatsApp Upload - Referência: ${controlNumber}`
      }]).select().single();

      if (dbError) {
        console.error('Erro ao inserir no Supabase:', dbError);
        throw new Error('Erro ao inserir log no banco de dados.');
      }

      // Retorno do Webhook de Volta para Motorista (Auto-resposta Z-API/Evolution)
      res.json({
        status: 'success',
        message: `Comprovante processado com sucesso! Posto: ${extractedData.gas_station} | ${extractedData.liters} L | R$ ${extractedData.total_value}`,
        extracted_data: extractedData,
        db_record: insertedData
      });
    } catch (error) {
      console.error('OCR Webhook Error:', error);
      res.status(500).json({ error: 'Falha no processamento Módulo 1 (Fricção Zero)', details: error instanceof Error ? error.message : String(error) });
    }
  });

  // MÓDULO 3: Utilidade de Lógica p/ KPI de Manutenção Preditiva (Backend-Side)
  app.get('/api/kpi/predictive-maintenance', async (req, res) => {
    try {
      // Esta seria uma Server Action agregando `trips` e `fuel_logs` agrupados por caminhão
      // Neste stub, validamos a lógica calculando o Custo do Diesel por m³ Entregue (Mock Data)
      
      const mockAggregatedData = [
         { truck_id: 'truck-A', m3_delivered: 450, diesel_cost: 3200 },
         { truck_id: 'truck-B', m3_delivered: 410, diesel_cost: 4100 }, // Flag (Custando mais por m3)
      ];

      const historicalAverageCostPerM3 = 7.50; // Média Histórica: R$ 7,50 / m³

      const kpiAnalysis = mockAggregatedData.map(truck => {
        const costPerM3 = truck.diesel_cost / truck.m3_delivered;
        const isRedFlag = costPerM3 > historicalAverageCostPerM3 * 1.15; // 15% acima da média histórica

        return {
          truck_id: truck.truck_id,
          cost_per_m3: costPerM3,
          red_flag: isRedFlag,
          status: isRedFlag ? 'ALERTA DE DESVIO/CONSUMO' : 'OK'
        }
      });

      res.json({ analysis: kpiAnalysis });
    } catch(err) {
      res.status(500).json({ error: 'Erro no cálculo do KPI', details: String(err) });
    }
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
