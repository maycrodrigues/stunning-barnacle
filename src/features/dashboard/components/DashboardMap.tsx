import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Demand, Option } from '../../../shared/store/appStore';
import { renderToStaticMarkup } from 'react-dom/server';
import { MapPin } from 'lucide-react';

// Fix for default marker icon in Leaflet with Vite/Webpack
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface DashboardMapProps {
  demands: Demand[];
  statusOptions: Option[];
  className?: string;
}

// Helper to get color for status
const getStatusColor = (statusValue: string, statusOptions: Option[]) => {
  const status = statusOptions.find(s => s.value === statusValue);
  
  // Map badge colors to hex values or tailwind classes
  const colorMap: Record<string, string> = {
    'primary': '#3C50E0',
    'success': '#10B981',
    'error': '#DC2626',
    'warning': '#F59E0B',
    'info': '#3B82F6',
    'light': '#64748B',
    'dark': '#1E293B',
  };

  if (status?.badge?.color && colorMap[status.badge.color]) {
      return colorMap[status.badge.color];
  }

  // Fallback based on value
  switch (statusValue) {
    case 'concluido': return '#10B981'; // Green
    case 'em-processo-fora-do-prazo': return '#DC2626'; // Red
    case 'em-processo': return '#3B82F6'; // Blue
    case 'em-analise': return '#64748B'; // Gray
    default: return '#3C50E0'; // Brand Blue
  }
};

const createCustomIcon = (color: string) => {
  const iconMarkup = renderToStaticMarkup(
    <div style={{ color: color, filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))' }}>
      <MapPin size={32} fill={color} className="text-white" strokeWidth={1.5} />
    </div>
  );
  
  return L.divIcon({
    html: iconMarkup,
    className: 'custom-marker-icon', // Remove default styling
    iconSize: [32, 32],
    iconAnchor: [16, 32], // Bottom center
    popupAnchor: [0, -32],
  });
};

export const DashboardMap: React.FC<DashboardMapProps> = ({ demands, statusOptions, className = "" }) => {
  // Filter demands with valid location
  const demandsWithLocation = useMemo(() => {
    return demands.filter(d => d.location && typeof d.location.lat === 'number' && typeof d.location.lng === 'number');
  }, [demands]);

  // Calculate center or use default
  const center: [number, number] = useMemo(() => {
    if (demandsWithLocation.length === 0) {
        return [-19.83996, -40.21045]; // Default Aracruz/ES
    }
    
    // Simple average for center
    const latSum = demandsWithLocation.reduce((acc, d) => acc + d.location!.lat, 0);
    const lngSum = demandsWithLocation.reduce((acc, d) => acc + d.location!.lng, 0);
    
    return [latSum / demandsWithLocation.length, lngSum / demandsWithLocation.length];
  }, [demandsWithLocation]);

  if (demandsWithLocation.length === 0) {
      return (
        <div className={`rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6 ${className}`}>
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
                Mapa de Demandas
            </h3>
            <div className="flex h-64 w-full flex-col items-center justify-center rounded-lg bg-gray-100 text-center dark:bg-gray-800">
                <MapPin className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-500">Nenhuma demanda com localização encontrada neste filtro.</p>
            </div>
        </div>
      );
  }

  return (
    <div className={`rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6 ${className}`}>
      <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
        Mapa de Demandas
      </h3>
      <div className="h-[400px] w-full overflow-hidden rounded-xl z-0 relative">
        <MapContainer 
            center={center} 
            zoom={13} 
            scrollWheelZoom={true} 
            className="h-full w-full"
            style={{ height: '100%', width: '100%', zIndex: 0 }}
        >
            <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {demandsWithLocation.map((demand) => {
                const color = getStatusColor(demand.status || '', statusOptions);
                const icon = createCustomIcon(color);
                
                return (
                    <Marker 
                        key={demand.id} 
                        position={[demand.location!.lat, demand.location!.lng]}
                        icon={icon}
                    >
                        <Popup>
                            <div className="p-1">
                                <h4 className="font-semibold text-sm mb-1">{demand.title}</h4>
                                <p className="text-xs text-gray-500 mb-1 line-clamp-2">{demand.description}</p>
                                <span 
                                    className="text-[10px] px-2 py-0.5 rounded-full text-white font-medium"
                                    style={{ backgroundColor: color }}
                                >
                                    {statusOptions.find(s => s.value === demand.status)?.label || demand.status}
                                </span>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
        
        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg z-[1000] text-xs">
            <h5 className="font-semibold mb-2 text-gray-700 dark:text-gray-200">Legenda</h5>
            <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>Em Processo</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-600"></div>
                    <span>Fora do Prazo</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Concluído</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                    <span>Em Análise</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
