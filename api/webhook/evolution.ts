import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

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
      return res.status(400).json({ error: 'Nenhuma imagem encontrada no payload' });
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
    const { data: fleetData } = await supabase.from('fleet').select('id').limit(1).single();
    const fleetId = fleetData ? fleetData.id : crypto.randomUUID(); // Fallback
    
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

    return res.json({
      status: 'success',
      message: `Comprovante processado com sucesso! Posto: ${extractedData.gas_station} | ${extractedData.liters} L | R$ ${extractedData.total_value}`,
      extracted_data: extractedData,
      db_record: insertedData
    });
  } catch (error) {
    console.error('OCR Webhook Error:', error);
    return res.status(500).json({ error: 'Falha no processamento Módulo 1 (Fricção Zero)', details: error instanceof Error ? error.message : String(error) });
  }
}
