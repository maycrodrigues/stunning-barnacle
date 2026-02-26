import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAppStore } from "../../../shared/store/appStore";

// Fix default icon issue with webpack/vite
// These imports might need specific loaders or just work with Vite if assets are handled correctly.
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

interface LocationPickerProps {
  value?: { lat: number; lng: number } | null;
  onChange: (value: { lat: number; lng: number }) => void;
  className?: string;
}

const LocationMarker = ({
  position,
  setPosition,
}: {
  position: { lat: number; lng: number } | null;
  setPosition: (pos: { lat: number; lng: number }) => void;
}) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : <Marker position={position} />;
};

const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);
  return null;
};

// Component to handle initial center updates based on store or value
const MapCenterController = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized && center) {
        map.setView(center, map.getZoom());
        setInitialized(true);
    }
  }, [map, center, initialized]);

  return null;
};

export const LocationPicker = ({ value, onChange, className }: LocationPickerProps) => {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    value || null
  );
  const defaultLocation = useAppStore((state) => state.defaultLocation);

  // Update local state if prop changes
  useEffect(() => {
    if (value) {
      setPosition(value);
    }
  }, [value]);

  const handleSetPosition = (pos: { lat: number; lng: number }) => {
    setPosition(pos);
    onChange(pos);
  };

  const initialCenter: [number, number] = value 
    ? [value.lat, value.lng] 
    : [defaultLocation.lat, defaultLocation.lng];

  // Default zoom from store or standard fallback
  const initialZoom = defaultLocation.zoom || 13;

  return (
    <div className={`h-[400px] w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 ${className}`}>
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        scrollWheelZoom={true}
        className="h-full w-full z-0" // z-0 to avoid overlapping modal
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapResizer />
        <LocationMarker position={position} setPosition={handleSetPosition} />
      </MapContainer>
      <div className="bg-white dark:bg-gray-800 p-2 text-center text-xs text-gray-500 border-t border-gray-200 dark:border-gray-700">
        Clique no mapa para selecionar a localização
      </div>
    </div>
  );
};
