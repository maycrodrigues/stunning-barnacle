import React, { useMemo } from 'react';
import { LayersControl, MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Demand, Option } from '../../../shared/store/appStore';
import { Contact } from '../../../shared/services/db';
import { MapPin } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface DashboardDemographicMapProps {
  demands: Demand[];
  contacts: Contact[];
  statusOptions: Option[];
}

const getStatusColor = (statusValue: string, statusOptions: Option[]) => {
  const status = statusOptions.find((s: Option) => s.value === statusValue);
  
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

export const DashboardDemographicMap: React.FC<DashboardDemographicMapProps> = ({ demands, contacts, statusOptions }) => {
  // Group demands by neighborhood
  const neighborhoodStats = useMemo(() => {
    const stats: Record<string, number> = {};
    let total = 0;

    demands.forEach(demand => {
      // Try to find contact by requesterName
      // Note: This is a heuristic. Ideally we should have a link or strict match.
      const contact = contacts.find(c => 
        c.name.toLowerCase() === demand.requesterName.toLowerCase() ||
        (demand.requesterContact && (c.email === demand.requesterContact || c.phone === demand.requesterContact))
      );

      const neighborhood = contact?.neighborhood || 'Não Identificado';
      
      stats[neighborhood] = (stats[neighborhood] || 0) + 1;
      total++;
    });

    // Sort by count descending
    return Object.entries(stats)
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5
  }, [demands, contacts]);

  // Filter demands with valid location for the map
  const demandsWithLocation = useMemo(() => {
    return demands.filter(d => d.location && typeof d.location.lat === 'number' && typeof d.location.lng === 'number');
  }, [demands]);

  // Calculate center
  const center: [number, number] = useMemo(() => {
    if (demandsWithLocation.length === 0) {
        return [-19.83996, -40.21045]; // Default Aracruz/ES
    }
    const latSum = demandsWithLocation.reduce((acc, d) => acc + d.location!.lat, 0);
    const lngSum = demandsWithLocation.reduce((acc, d) => acc + d.location!.lng, 0);
    return [latSum / demandsWithLocation.length, lngSum / demandsWithLocation.length];
  }, [demandsWithLocation]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Demografia por Bairros
        </h3>
        <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
          Distribuição de demandas por bairro (baseado no cadastro de contatos)
        </p>
      </div>

      <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
        <div className="relative h-[300px] w-full">
            <MapContainer 
                center={center} 
                zoom={12} 
                scrollWheelZoom={false}
                className="h-full w-full"
                style={{ height: '100%', width: '100%', zIndex: 0 }}
            >
                <LayersControl position="topright">
                    <LayersControl.BaseLayer checked name="Satélite">
                        <TileLayer
                            attribution=""
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Mapa">
                        <TileLayer
                            attribution=""
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                    </LayersControl.BaseLayer>
                </LayersControl>
                
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
                                    <p className="text-xs text-gray-500 mb-1">{demand.requesterName}</p>
                                    <span 
                                        className="text-[10px] px-2 py-0.5 rounded-full text-white font-medium"
                                        style={{ backgroundColor: color }}
                                    >
                                        {statusOptions.find((s: Option) => s.value === demand.status)?.label || demand.status}
                                    </span>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>

            {/* Legend */}
            <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg z-[1000] text-xs">
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

      <div className="space-y-5">
        {neighborhoodStats.map((stat) => (
          <div key={stat.name} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                <MapPin size={16} />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                  {stat.name}
                </p>
                <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                  {stat.count} Demanda{stat.count !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="flex w-full max-w-[140px] items-center gap-3">
              <div className="relative block h-2 w-full max-w-[100px] rounded-sm bg-gray-200 dark:bg-gray-800">
                <div 
                    className="absolute left-0 top-0 flex h-full items-center justify-center rounded-sm bg-brand-500 text-xs font-medium text-white"
                    style={{ width: `${stat.percentage}%` }}
                ></div>
              </div>
              <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                {stat.percentage}%
              </p>
            </div>
          </div>
        ))}
        
        {neighborhoodStats.length === 0 && (
            <div className="text-center text-gray-500 py-4">
                Nenhuma informação de bairro encontrada.
            </div>
        )}
      </div>
    </div>
  );
};
