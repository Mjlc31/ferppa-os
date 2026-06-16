import React, { useState, useEffect, useRef } from "react";
import { Geofence, GeofenceType, FleetItem, FleetType } from "../types";
import { toast } from 'sonner';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Crosshair,
  Plus,
  Edit,
  Truck,
  Navigation,
  Route,
  MapPin,
} from "lucide-react";
import { useFerppaStore } from '../store';

// Center point (approximate center of our initial seed Geofences for São Paulo region)
const CENTER_LAT = -23.5505;
const CENTER_LNG = -46.6333;

function FlyToAnimator({
  lat,
  lng,
}: {
  lat: number | null;
  lng: number | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (lat !== null && lng !== null) {
      map.flyTo([lat, lng], 16, { duration: 1.5 });
    }
  }, [lat, lng, map]);
  return null;
}

// Custom map icon for trucks
const createTruckIcon = (plate: string) =>
  L.divIcon({
    className: "bg-transparent",
    html: `
    <div class="relative flex flex-col items-center justify-center">
      <div class="w-4 h-4 bg-ferppa-gold rounded-full border-2 border-[#172122] shadow-[0_0_15px_rgba(183,145,82,0.8)] z-10"></div>
      <div class="absolute -bottom-5 w-max bg-[#172122]/90 border border-ferppa-gold/30 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-white whitespace-nowrap shadow-md">
        ${plate}
      </div>
      <div class="absolute w-8 h-8 rounded-full bg-ferppa-gold/20 animate-ping z-0"></div>
    </div>
  `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

// Custom icon for POI
const createPOIIcon = (type: GeofenceType) => {
  let colorClass = "text-gray-400";
  if (type === "EXTRACTION") colorClass = "text-amber-500";
  if (type === "DELIVERY") colorClass = "text-emerald-500";
  if (type === "GAS_STATION") colorClass = "text-blue-500";
  if (type === "BASE") colorClass = "text-purple-500";

  return L.divIcon({
    className: "bg-transparent",
    html: `
      <div class="flex items-center justify-center w-8 h-8 -ml-4 -mt-4 bg-[#172122] rounded-full border border-white/10 shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 ${colorClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      </div>
    `,
    iconSize: [0, 0],
  });
};

export default function ModuloTelemetria() {
  const { geofences, addGeofence, deleteGeofence, fleet } = useFerppaStore();
  // Geofence management state
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<GeofenceType>("EXTRACTION");
  const [formLat, setFormLat] = useState("");
  const [formLng, setFormLng] = useState("");
  const [formRadius, setFormRadius] = useState("150");
  const [flyToCoords, setFlyToCoords] = useState<{
    lat: number;
    lng: number;
  } | null>({ lat: CENTER_LAT, lng: CENTER_LNG });

  // Simulated truck positions
  const trucksOrigin = fleet.filter((f) => f.type === FleetType.CAMINHAO);
  const [truckPositions, setTruckPositions] = useState<
    { id: string; plate: string; lat: number; lng: number }[]
  >(() => {
    // Initial random spread around origin
    return trucksOrigin.map((truck, idx) => ({
      id: truck.id,
      plate: truck.plate,
      lat: CENTER_LAT + (Math.random() - 0.5) * 0.05 + idx * 0.01,
      lng: CENTER_LNG + (Math.random() - 0.5) * 0.05 + idx * 0.01,
    }));
  });

  // Simulate movement
  useEffect(() => {
    const interval = setInterval(() => {
      setTruckPositions((prev) =>
        prev.map((t) => {
          // move slighly vector
          const latMove = (Math.random() - 0.5) * 0.0005;
          const lngMove = (Math.random() - 0.5) * 0.0005;
          return {
            ...t,
            lat: t.lat + latMove,
            lng: t.lng + lngMove,
          };
        }),
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAddGeofence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formLat || !formLng || !formRadius) return;

    addGeofence({
      name: formName,
      type: formType,
      latitude: parseFloat(formLat),
      longitude: parseFloat(formLng),
      radius_meters: parseInt(formRadius, 10),
    });
    
    toast.success('Ponto de controle criado!', {
      description: `Geofence "${formName}" registrada no mapa.`,
    });

    setFormName("");
    setFormLat("");
    setFormLng("");
    setFormRadius("150");
  };

  const getGeofenceColor = (type: GeofenceType) => {
    switch (type) {
      case "EXTRACTION":
        return "#f59e0b"; // amber
      case "DELIVERY":
        return "#10b981"; // emerald
      case "GAS_STATION":
        return "#3b82f6"; // blue
      case "BASE":
        return "#a855f7"; // purple
      default:
        return "#6b7280"; // gray
    }
  };

  const handleFlyTo = (lat: number, lng: number) => {
    // Briefly clear it to force-trigger effect
    setFlyToCoords(null);
    setTimeout(() => {
      setFlyToCoords({ lat, lng });
    }, 50);
  };

  return (
    <div className="flex w-full h-full text-white bg-ferppa-dark relative overflow-hidden">
      {/* 70% Left: The War Room Map Container */}
      <div className="flex-1 h-full z-0 relative shadow-[inset_-10px_0_30px_rgba(0,0,0,0.5)]">
        <MapContainer
          center={[CENTER_LAT, CENTER_LNG]}
          zoom={13}
          style={{ height: "100%", width: "100%", background: "#0a0a0a" }}
          zoomControl={false}
        >
          {/* CartoDB Dark Matter / Dark Theme Tiles */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          <FlyToAnimator
            lat={flyToCoords?.lat || null}
            lng={flyToCoords?.lng || null}
          />

          {/* Render Geofences */}
          {geofences.map((geo) => (
            <React.Fragment key={geo.id}>
              <Circle
                center={[geo.latitude, geo.longitude]}
                radius={geo.radius_meters}
                pathOptions={{
                  color: getGeofenceColor(geo.type),
                  fillColor: getGeofenceColor(geo.type),
                  fillOpacity: 0.15,
                  weight: 2,
                  dashArray: "4 4",
                }}
              />
              <Marker
                position={[geo.latitude, geo.longitude]}
                icon={createPOIIcon(geo.type)}
              >
                <Popup className="custom-popup border-0">
                  <div className="bg-[#172122] text-white p-3 rounded shadow-xl border border-white/10 min-w-40 font-sans">
                    <div className="text-[10px] uppercase font-bold text-ferppa-gold mb-1 tracking-widest">
                      {geo.type}
                    </div>
                    <div className="font-bold text-sm mb-2">{geo.name}</div>
                    <div className="text-[10px] text-gray-400 font-mono">
                      Raio: {geo.radius_meters}m
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          ))}

          {/* Render Trucks (Live telemetry simulation) */}
          {truckPositions.map((truck) => (
            <Marker
              key={truck.id}
              position={[truck.lat, truck.lng]}
              icon={createTruckIcon(truck.plate)}
            >
              <Popup>
                <div className="bg-[#172122] text-white p-2 rounded border border-white/10 min-w-32">
                  <div className="text-[11px] uppercase opacity-50 mb-1">
                    Caminhão
                  </div>
                  <div className="font-mono font-bold text-ferppa-gold">
                    {truck.plate}
                  </div>
                  <div className="text-[10px] mt-2 font-mono flex items-center gap-2">
                    <span className="animate-pulse w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                    Sinal Prorrac OK
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Radar Overlay Effect elements */}
        <div className="absolute top-6 left-6 z-[400] pointer-events-none">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <h1 className="text-xl font-bold tracking-widest text-shadow uppercase">
              SATCOM <span className="text-ferppa-gold">GEOFENCING</span>
            </h1>
          </div>
          <p className="text-[10px] font-mono text-white/50 tracking-widest uppercase">
            Sistema de Rastreamento Prorrac / LatLng Live
          </p>
        </div>
      </div>

      {/* 30% Right: Geofence Manager Sidebar */}
      <div className="w-[420px] shrink-0 h-full bg-[#172122]/95 backdrop-blur-2xl border-l border-white/5 flex flex-col z-[410] overflow-hidden drop-shadow-2xl">
        {/* Module Header */}
        <div className="px-6 py-6 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold tracking-tight">
              Geofence Manager
            </h2>
            <Navigation className="w-5 h-5 text-ferppa-gold" />
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed uppercase tracking-widest">
            Cadastre os polígonos e referências (POIs) para disparos eletrônicos
            automáticos.
          </p>
        </div>

        {/* POI Form */}
        <div className="p-6 border-b border-white/5 bg-black/20">
          <h3 className="text-[11px] uppercase tracking-widest text-ferppa-gold mb-4 font-bold flex items-center gap-2">
            <Plus className="w-3.5 h-3.5" /> NOVO MARCO (POI)
          </h3>
          <form className="space-y-4" onSubmit={handleAddGeofence}>
            <div>
              <label className="block text-[10px] font-mono text-gray-400 mb-1.5 uppercase">
                Nome do Local
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full bg-[#1e2a2c] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-ferppa-gold transition-colors"
                placeholder="Ex: Porto de Areia Boreal 02"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-gray-400 mb-1.5 uppercase">
                  Tipo de Operação
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as GeofenceType)}
                  className="w-full bg-[#1e2a2c] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-ferppa-gold transition-colors"
                >
                  <option value="EXTRACTION">Área Extração</option>
                  <option value="DELIVERY">Ponto Entrega</option>
                  <option value="GAS_STATION">Posto Abastecimento</option>
                  <option value="BASE">Base/Pátio</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-gray-400 mb-1.5 uppercase">
                  Raio (Metros)
                </label>
                <input
                  type="number"
                  required
                  min="50"
                  step="10"
                  value={formRadius}
                  onChange={(e) => setFormRadius(e.target.value)}
                  className="w-full bg-[#1e2a2c] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-ferppa-gold transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-gray-400 mb-1.5 uppercase">
                  Latitude (Y)
                </label>
                <input
                  type="number"
                  required
                  step="any"
                  value={formLat}
                  onChange={(e) => setFormLat(e.target.value)}
                  className="w-full bg-[#1e2a2c] border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-ferppa-gold transition-colors"
                  placeholder="-23.5505"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-gray-400 mb-1.5 uppercase">
                  Longitude (X)
                </label>
                <input
                  type="number"
                  required
                  step="any"
                  value={formLng}
                  onChange={(e) => setFormLng(e.target.value)}
                  className="w-full bg-[#1e2a2c] border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-ferppa-gold transition-colors"
                  placeholder="-46.6333"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-ferppa-gold hover:bg-ferppa-gold-hover text-ferppa-dark font-bold text-xs uppercase tracking-widest rounded transition-colors mt-2"
            >
              Catalogar Nova Cerca
            </button>
          </form>
        </div>

        {/* Catalog List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          <h3 className="text-[10px] uppercase font-mono text-white/40 tracking-widest px-2 mb-3">
            Zonas Monitoradas ({geofences.length})
          </h3>

          {geofences.length === 0 ? (
            <div className="text-center py-10 px-4 text-xs font-mono text-white/30 uppercase tracking-widest border border-white/5 rounded-lg border-dashed">
              Nenhuma cerca eletrônica catalogada
            </div>
          ) : (
            geofences.map((geo) => (
              <div
                key={geo.id}
                className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors group relative cursor-pointer"
                onClick={() => handleFlyTo(geo.latitude, geo.longitude)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-xs font-bold text-white mb-0.5">
                      {geo.name}
                    </div>
                    <div className="text-[9px] uppercase tracking-widest border border-white/10 bg-black/30 px-1.5 py-0.5 rounded text-ferppa-gold inline-block">
                      {geo.type}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toast.info('Funcionalidade de edição em desenvolvimento.');
                    }}
                    className="p-1.5 text-white/30 hover:text-ferppa-gold transition-colors rounded hover:bg-white/10"
                    title="Editar Geofence"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex justify-between items-end mt-3 border-t border-white/5 pt-2">
                  <div className="text-[10px] font-mono text-white/50 bg-[#172122] px-1.5 py-0.5 rounded flex items-center gap-1.5">
                    <Crosshair className="w-3 h-3 text-ferppa-gold opacity-50" />
                    {geo.latitude.toFixed(4)}, {geo.longitude.toFixed(4)}
                  </div>
                  <div className="text-[10px] font-mono text-white/40">
                    R {geo.radius_meters}m
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
