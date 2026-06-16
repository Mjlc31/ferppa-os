import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

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

    return res.json({ analysis: kpiAnalysis });
  } catch(err) {
    return res.status(500).json({ error: 'Erro no cálculo do KPI', details: String(err) });
  }
}
