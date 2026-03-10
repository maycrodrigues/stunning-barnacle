import React from 'react';
import { LayersControl, MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Leaflet with Vite/Webpack
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

interface Location {
  lat: number;
  lng: number;
}

interface DemandMapProps {
  location?: Location | null;
}

export const DemandMap: React.FC<DemandMapProps> = ({ location }) => {
  if (!location) {
    return (
      <div className="flex h-64 w-full flex-col items-center justify-center rounded-lg bg-gray-100 text-center dark:bg-gray-800">
        <div className="mb-2 rounded-full bg-gray-200 p-3 dark:bg-gray-700">
          <svg 
            className="h-6 w-6 text-gray-400 dark:text-gray-500" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Nenhuma localização registrada
        </p>
      </div>
    );
  }

  return (
    <div className="h-64 w-full overflow-hidden rounded-lg z-0">
      <MapContainer 
        center={[location.lat, location.lng]} 
        zoom={15} 
        scrollWheelZoom={true} 
        dragging={false} // Disable dragging as per requirement "só interações de Zoom"
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
        <Marker position={[location.lat, location.lng]}>
          <Popup>
            Localização da Demanda
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};
