/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Fuel, Truck, TrendingUp, AlertOctagon, ShieldAlert, Coins } from 'lucide-react';
import { FleetItem, FuelLogItem, TripItem } from '../types';

import { useFerppaStore } from '../store';

export default function CommandCenter() {
  const { fleet, fuelLogs, trips, getWeeklyLimitsExceeded } = useFerppaStore();
  // 1. Calculations:
  // Current calendar week date range
  const today = new Date();
  const dayOfWeek = today.getDay();
  const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - distanceToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  // Filter logs for this week
  const weeklyFuelLogs = fuelLogs.filter(log => {
    const logDate = new Date(log.date + 'T12:00:00');
    return logDate >= monday && logDate <= sunday;
  });

  const weeklyFuelLiters = weeklyFuelLogs.reduce((acc, curr) => acc + curr.liters, 0);
  const weeklyFuelCost = weeklyFuelLogs.reduce((acc, curr) => acc + curr.total_value, 0);

  // Filter trips for this week
  const weeklyTrips = trips.filter(trip => {
    const tripDate = new Date(trip.date + 'T12:00:00');
    return tripDate >= monday && tripDate <= sunday;
  });

  const weeklyVolumem3 = weeklyTrips.reduce((acc, curr) => acc + curr.volume_m3, 0);

  // Average fuel cost per m3 delivered
  // Formula: Weekly Fuel Cost / Weekly m3 Delivered
  const averageFuelCostPerm3 = weeklyVolumem3 > 0 ? weeklyFuelCost / weeklyVolumem3 : 0;

  // Over-limit Alerts
  const exceededFleet = getWeeklyLimitsExceeded();

  // 2. Gráfico Data Mapping
  // Gather last 7 days of activity to display in the chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  }).map(dateStr => {
    // Sum diesel consumed on this day
    const dayLiters = fuelLogs
      .filter(l => l.date === dateStr)
      .reduce((sum, l) => sum + l.liters, 0);

    // Sum volume delivered on this day
    const daym3 = trips
      .filter(t => t.date === dateStr)
      .reduce((sum, t) => sum + t.volume_m3, 0);

    // Format date string for label e.g., "14 Jun"
    const [_, month, day] = dateStr.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const label = `${parseInt(day)} ${months[parseInt(month) - 1]}`;

    return {
      date: label,
      rawDate: dateStr,
      'Diesel Consumido (L)': Number(dayLiters.toFixed(1)),
      'Material Entregue (m³)': Number(daym3.toFixed(1))
    };
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            COMMAND CENTER
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] uppercase opacity-50 tracking-widest">Semana Selecionada</div>
            <div className="font-mono text-sm">{monday.toLocaleDateString('pt-BR')} - {sunday.toLocaleDateString('pt-BR')}</div>
          </div>
          <div className="w-10 h-10 rounded bg-white/5 border border-white/10 flex items-center justify-center items-center font-bold text-ferppa-gold">
            JS
          </div>
        </div>
      </div>

      {/* Alert Component: Exceeded Weekly Fuel Limits */}
      {exceededFleet.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded p-4 flex items-start gap-4 animate-blink relative overflow-hidden backdrop-blur-md mb-6 text-red-400">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 font-bold font-sans">
              <AlertOctagon className="w-4 h-4" /> ALERTA DE COTA
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {exceededFleet.map((alert) => (
                <div key={alert.fleetId} className="text-xs">
                  Caminhão placa <span className="font-mono font-bold text-red-300">{alert.plate}</span> excedeu o limite semanal em {alert.excess.toLocaleString('pt-BR')}L.
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* KPI 1 */}
        <div className="bg-gradient-to-b from-[#182324] to-[#131b1c] shadow-panel border border-[#1e2a2c] rounded-xl p-5 relative overflow-hidden group hover:border-[#2a3a3d] transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Fuel className="w-12 h-12 text-white" />
          </div>
          <div className="text-[10px] uppercase tracking-[0.1em] text-gray-500 font-bold mb-1">Diesel Semana</div>
          <div className="font-mono text-[28px] font-bold text-white tracking-tight">
            {weeklyFuelLiters.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} <span className="text-sm text-gray-500">L</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-gradient-to-b from-[#182324] to-[#131b1c] shadow-panel border border-[#1e2a2c] rounded-xl p-5 relative overflow-hidden group hover:border-[#2a3a3d] transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Coins className="w-12 h-12 text-white" />
          </div>
          <div className="text-[10px] uppercase tracking-[0.1em] text-gray-500 font-bold mb-1">Custo Diesel</div>
          <div className="font-mono text-[28px] font-bold text-white tracking-tight">
            <span className="text-lg text-gray-500 mr-1">R$</span>{weeklyFuelCost.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-gradient-to-b from-[#182324] to-[#131b1c] shadow-panel border border-ferppa-gold/30 rounded-xl p-5 relative overflow-hidden group hover:border-ferppa-gold/50 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp className="w-12 h-12 text-ferppa-gold" />
          </div>
          <div className="text-[10px] uppercase tracking-[0.1em] text-ferppa-gold/70 font-bold mb-1">Total Cubagem</div>
          <div className="font-mono text-[28px] font-bold text-ferppa-gold tracking-tight tabular-nums">
            {weeklyVolumem3.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} <span className="text-sm text-ferppa-gold/50">m³</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-gradient-to-b from-[#182324] to-[#131b1c] shadow-panel border border-[#1e2a2c] rounded-xl p-5 relative overflow-hidden group hover:border-[#2a3a3d] transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Truck className="w-12 h-12 text-white" />
          </div>
          <div className="text-[10px] uppercase tracking-[0.1em] text-gray-500 font-bold mb-1">Custo Médio / m³</div>
          <div className="font-mono text-[28px] font-bold text-white tracking-tight tabular-nums">
            <span className="text-lg text-gray-500 mr-1">R$</span>{averageFuelCostPerm3.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Main Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 flex-1">
        <div className="bg-gradient-to-b from-[#182324] to-[#131b1c] shadow-panel border border-[#1e2a2c] rounded-xl p-6 lg:col-span-2 flex flex-col hover:border-[#2a3a3d] transition-colors">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[11px] uppercase tracking-[0.1em] text-gray-400 font-bold">Logística: Volume vs Consumo Diário</h3>
            <div className="flex gap-4 text-[10px] text-gray-500 uppercase font-bold tracking-widest">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-ferppa-gold rounded-full shadow-[0_0_8px_rgba(183,145,82,0.6)]"></div> Volume m³</div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-[#364e52] rounded-full"></div> Consumo L</div>
            </div>
          </div>

        <div className="h-80 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={last7Days}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#26383a" opacity={0.6} />
              <XAxis
                dataKey="date"
                stroke="#eae9e5"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#26383a' }}
              />
              <YAxis
                stroke="#eae9e5"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#26383a' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#172122',
                  border: '1px solid #b79152',
                  borderRadius: '6px',
                  color: '#eae9e5',
                }}
                labelStyle={{ fontWeight: 'bold', color: '#b79152' }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', color: '#eae9e5' }}
              />
              <Bar
                dataKey="Material Entregue (m³)"
                fill="#b79152"
                radius={[4, 4, 0, 0]}
                maxBarSize={45}
              />
              <Bar
                dataKey="Diesel Consumido (L)"
                fill="#364e52"
                radius={[4, 4, 0, 0]}
                maxBarSize={45}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="flex flex-col gap-6">
        <div className="bg-gradient-to-b from-[#182324] to-[#131b1c] shadow-panel border border-[#1e2a2c] rounded-xl p-6 hover:border-[#2a3a3d] transition-colors">
          <div className="text-[11px] uppercase tracking-[0.1em] text-gray-400 font-bold mb-5">Status da Frota</div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-[11px] uppercase tracking-wider mb-2">
                <span className="text-gray-500 font-bold">Operacional</span>
                <span className="font-mono text-white">18 / 20</span>
              </div>
              <div className="w-full h-1.5 bg-[#0f1516] rounded-full overflow-hidden border border-[#1e2a2c]">
                <div className="h-full bg-ferppa-gold shadow-[0_0_10px_rgba(183,145,82,0.8)]" style={{ width: '90%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] uppercase tracking-wider mb-2 mt-4">
                <span className="text-gray-500 font-bold">Em Manutenção</span>
                <span className="font-mono text-white">02</span>
              </div>
              <div className="w-full h-1.5 bg-[#0f1516] rounded-full overflow-hidden border border-[#1e2a2c]">
                <div className="h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" style={{ width: '10%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      <div className="bg-gradient-to-b from-[#182324] to-[#131b1c] shadow-panel border border-[#1e2a2c] rounded-xl p-6 flex-1 flex flex-col overflow-hidden min-h-[300px] hover:border-[#2a3a3d] transition-colors">
        <h3 className="text-[11px] uppercase tracking-[0.1em] text-gray-400 font-bold mb-5">Últimos Registros de Cubagem</h3>
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="text-left p-4 border-b border-[#1e2a2c] uppercase text-[10px] tracking-widest text-gray-500 font-bold">Ticket</th>
                <th className="text-left p-4 border-b border-[#1e2a2c] uppercase text-[10px] tracking-widest text-gray-500 font-bold">Placa</th>
                <th className="text-left p-4 border-b border-[#1e2a2c] uppercase text-[10px] tracking-widest text-gray-500 font-bold">Material</th>
                <th className="text-left p-4 border-b border-[#1e2a2c] uppercase text-[10px] tracking-widest text-gray-500 font-bold">Volume</th>
                <th className="text-left p-4 border-b border-[#1e2a2c] uppercase text-[10px] tracking-widest text-gray-500 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {trips.slice(0, 5).map((trip, idx) => (
                <tr key={trip.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 border-b border-white/5 font-mono text-gray-300">{trip.trip_number}</td>
                  <td className="p-4 border-b border-white/5 font-mono text-white font-bold">{fleet.find(f => f.id === trip.truck_id)?.plate || '-'}</td>
                  <td className="p-4 border-b border-white/5 font-sans tracking-wide text-gray-400">{trip.product}</td>
                  <td className="p-4 border-b border-white/5 font-mono text-ferppa-gold">{trip.volume_m3.toFixed(2)} m³</td>
                  <td className="p-4 border-b border-white/5">
                    <span className="px-2.5 py-1 rounded bg-ferppa-gold/10 border border-ferppa-gold/20 text-ferppa-gold text-[10px] uppercase tracking-widest font-bold">Validado</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-gradient-to-b from-[#182324] to-[#131b1c] shadow-panel border border-[#1e2a2c] rounded-xl p-6 flex-1 flex flex-col overflow-hidden min-h-[300px] hover:border-[#2a3a3d] transition-colors mt-6">
        <h3 className="text-[11px] uppercase tracking-[0.1em] text-gray-400 font-bold mb-5 flex justify-between items-center">
          <span>Depoimentos de Clientes - Prova Social</span>
          <span className="text-ferppa-gold">VERIFIED</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min">
          {/* Bento Box 1 */}
          <div className="bg-[#0f1516] border border-[#26383a] rounded-xl p-5 hover:border-ferppa-gold/50 transition-colors flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-white text-sm">Construtora Alpha S.A.</h4>
                <p className="text-[10px] uppercase tracking-widest text-gray-500">Eng. Roberto Nogueira</p>
              </div>
              <div className="text-ferppa-gold font-bold text-lg">★★★★★</div>
            </div>
            <p className="text-sm text-gray-400 italic">"A pontualidade da Ferppa na entrega de brita nos permitiu adiantar o cronograma da obra do viaduto em 2 semanas. Parceiro estratégico indispensável."</p>
            <div className="mt-auto pt-4 border-t border-[#26383a] text-[10px] text-gray-500 font-mono">
              Volume operado: 12.000 m³
            </div>
          </div>

          {/* Bento Box 2 */}
          <div className="bg-[#0f1516] border border-[#26383a] rounded-xl p-5 hover:border-ferppa-gold/50 transition-colors flex flex-col gap-4 lg:col-span-2">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-white text-sm">Consórcio Vias Metro</h4>
                <p className="text-[10px] uppercase tracking-widest text-gray-500">Diretoria de Suprimentos</p>
              </div>
              <div className="text-ferppa-gold font-bold text-lg">★★★★★</div>
            </div>
            <p className="text-sm text-gray-400 italic">"A qualidade do material e a transparência do Ferppa OS com os tickets de medição acabaram com os problemas de conciliação financeira no fim do mês. Excelente qualidade de pedra marroada."</p>
            <div className="mt-auto pt-4 border-t border-[#26383a] text-[10px] text-gray-500 font-mono">
              Volume operado: 45.500 m³
            </div>
          </div>

          {/* Bento Box 3 */}
          <div className="bg-[#0f1516] border border-[#26383a] rounded-xl p-5 hover:border-ferppa-gold/50 transition-colors flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-white text-sm">Engenharia Prisma</h4>
                <p className="text-[10px] uppercase tracking-widest text-gray-500">Ana Beatriz - Compras</p>
              </div>
              <div className="text-ferppa-gold font-bold text-lg">★★★★★</div>
            </div>
            <p className="text-sm text-gray-400 italic">"Garantia de fornecimento até nos momentos de pico de demanda. Frota nova e motoristas bem treinados na descarga."</p>
            <div className="mt-auto pt-4 border-t border-[#26383a] text-[10px] text-gray-500 font-mono">
              Volume operado: 8.200 m³
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
