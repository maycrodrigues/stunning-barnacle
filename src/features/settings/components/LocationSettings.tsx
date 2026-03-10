import React, { useState, useEffect } from "react";
import { useAppStore } from "../../../shared/store/appStore";
import Swal from "sweetalert2";
import { LayersControl, MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix icons (same as LocationPicker)
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

const MapEvents = ({
  onMoveEnd,
}: {
  onMoveEnd: (center: { lat: number; lng: number }, zoom: number) => void;
}) => {
  const map = useMap();

  useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      onMoveEnd({ lat: center.lat, lng: center.lng }, zoom);
    },
    zoomend: () => {
        const center = map.getCenter();
        const zoom = map.getZoom();
        onMoveEnd({ lat: center.lat, lng: center.lng }, zoom);
    }
  });

  return null;
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

export const LocationSettings: React.FC = () => {
  const defaultLocation = useAppStore((state) => state.defaultLocation);
  const updateDefaultLocation = useAppStore((state) => state.updateDefaultLocation);

  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");
  const [zoom, setZoom] = useState<string>("13");

  useEffect(() => {
    if (defaultLocation) {
      setLat(defaultLocation.lat.toString());
      setLng(defaultLocation.lng.toString());
      setZoom(defaultLocation.zoom.toString());
    }
  }, [defaultLocation]);

  const handleMapMove = (center: { lat: number; lng: number }, newZoom: number) => {
    setLat(center.lat.toFixed(6));
    setLng(center.lng.toFixed(6));
    setZoom(newZoom.toString());
  };

  const handleSave = () => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const zoomNum = parseInt(zoom, 10);

    if (isNaN(latNum) || isNaN(lngNum) || isNaN(zoomNum)) {
      Swal.fire({
        title: "Erro",
        text: "Por favor, insira valores válidos para latitude, longitude e zoom.",
        icon: "error",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    updateDefaultLocation({ lat: latNum, lng: lngNum, zoom: zoomNum });

    Swal.fire({
      title: "Sucesso!",
      text: "Localização padrão atualizada.",
      icon: "success",
      timer: 2000,
      showConfirmButton: false,
    });
  };

  return (
    <div className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
          Localização Padrão
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Defina a latitude, longitude e zoom inicial para o mapa de criação de demandas.
          Você pode mover o mapa abaixo para capturar a localização desejada.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3">
        <div>
          <label
            htmlFor="latitude"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Latitude
          </label>
          <div className="mt-1">
            <input
              type="number"
              step="any"
              name="latitude"
              id="latitude"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="longitude"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Longitude
          </label>
          <div className="mt-1">
            <input
              type="number"
              step="any"
              name="longitude"
              id="longitude"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>

        <div>
            <label
            htmlFor="zoom"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
            Zoom
            </label>
            <div className="mt-1">
            <input
                type="number"
                name="zoom"
                id="zoom"
                value={zoom}
                onChange={(e) => setZoom(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            </div>
        </div>
      </div>

      {/* Preview Map */}
      <div className="h-[400px] w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 relative">
        {defaultLocation && (
            <MapContainer
            center={[defaultLocation.lat, defaultLocation.lng]}
            zoom={defaultLocation.zoom}
            scrollWheelZoom={true}
            className="h-full w-full z-0"
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
            <MapResizer />
            <MapEvents onMoveEnd={handleMapMove} />
            <Marker position={[parseFloat(lat) || defaultLocation.lat, parseFloat(lng) || defaultLocation.lng]} />
            </MapContainer>
        )}
         <div className="absolute top-2 right-2 z-[1000] bg-white/90 dark:bg-gray-800/90 p-2 rounded shadow text-xs">
            Mova o mapa para ajustar
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        >
          Salvar Configuração
        </button>
      </div>
    </div>
  );
};
