import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "../../../shared/components/ui/modal";
import Input from "../../../shared/components/form/input/InputField";
import TextArea from "../../../shared/components/form/input/TextArea";
import Checkbox from "../../../shared/components/form/input/Checkbox";
import Select from "../../../shared/components/form/Select";
import Label from "../../../shared/components/form/Label";
import Button from "../../../shared/components/ui/button/Button";
import { ContactFormData, contactSchema } from "../types";
import { Contact } from "../../../shared/services/db";
import { maskPhone } from "../../../shared/utils/masks";
import { useAppStore } from "../../../shared/store/appStore";
import { LayersControl, MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface ContactFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ContactFormData) => Promise<void>;
  initialData?: Contact;
  initialValues?: Partial<ContactFormData>;
  isLoading?: boolean;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  initialValues,
  isLoading = false,
}) => {
  const { politicalSpectrumOptions } = useAppStore();
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      neighborhood: "",
      notes: "",
      isVoter: false,
      politicalSpectrum: undefined,
    },
  });

  const normalizePoliticalSpectrum = (
    value: string | undefined
  ): ContactFormData["politicalSpectrum"] => {
    if (value === "Left" || value === "Right" || value === "Center") return value;
    return undefined;
  };

  const showMap = !initialData;
  const addressValue = watch("address");

  const defaultCenter = useMemo<[number, number]>(() => [-19.83996, -40.21045], []);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultCenter);
  const suppressNextForwardGeocodeRef = useRef(false);

  const reverseGeocodeToAddress = useCallback(async (lat: number, lng: number) => {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    url.searchParams.set("addressdetails", "1");

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;

    const data = (await response.json()) as {
      address?: Record<string, unknown>;
      name?: string;
      display_name?: string;
    };

    const addr = data.address ?? {};
    const road =
      (addr.road as string | undefined) ||
      (addr.pedestrian as string | undefined) ||
      (addr.footway as string | undefined);
    const houseNumber = addr.house_number as string | undefined;
    const neighborhood =
      (addr.neighbourhood as string | undefined) ||
      (addr.suburb as string | undefined) ||
      (addr.city_district as string | undefined) ||
      (addr.quarter as string | undefined);

    const addressLine = [road, houseNumber].filter(Boolean).join(", ").trim();
    return {
      address: addressLine || (data.name ?? ""),
      neighborhood: neighborhood ?? "",
    };
  }, []);

  const handleMapPick = useCallback(
    async (lat: number, lng: number) => {
      const nextPos: [number, number] = [lat, lng];
      setMarkerPosition(nextPos);
      setMapCenter(nextPos);

      suppressNextForwardGeocodeRef.current = true;
      const resolved = await reverseGeocodeToAddress(lat, lng);
      if (!resolved) return;

      if (resolved.address) {
        setValue("address", resolved.address, { shouldDirty: true, shouldValidate: true });
      }
      if (resolved.neighborhood) {
        setValue("neighborhood", resolved.neighborhood, { shouldDirty: true, shouldValidate: true });
      }
    },
    [reverseGeocodeToAddress, setValue]
  );

  const MapRecenter: React.FC<{ center: [number, number] }> = ({ center }) => {
    const map = useMap();
    useEffect(() => {
      map.setView(center, map.getZoom(), { animate: true });
    }, [center, map]);
    return null;
  };

  const MapInteractions: React.FC = () => {
    useMapEvents({
      click: (event) => {
        void handleMapPick(event.latlng.lat, event.latlng.lng);
      },
    });
    return null;
  };

  useEffect(() => {
    if (isOpen) {
      if (!initialData) {
        setMarkerPosition(null);
        setMapCenter(defaultCenter);
      }
      if (initialData) {
        reset({
          name: initialData.name,
          email: initialData.email || "",
          phone: initialData.phone || "",
          address: initialData.address || "",
          neighborhood: initialData.neighborhood || "",
          notes: initialData.notes || "",
          isVoter: initialData.isVoter || false,
          politicalSpectrum: normalizePoliticalSpectrum(initialData.politicalSpectrum),
        });
      } else if (initialValues) {
        reset({
          name: initialValues.name || "",
          email: initialValues.email || "",
          phone: initialValues.phone || "",
          address: initialValues.address || "",
          neighborhood: initialValues.neighborhood || "",
          notes: initialValues.notes || "",
          isVoter: initialValues.isVoter || false,
          politicalSpectrum: normalizePoliticalSpectrum(initialValues.politicalSpectrum),
        });
      } else {
        reset({
          name: "",
          email: "",
          phone: "",
          address: "",
          neighborhood: "",
          notes: "",
          isVoter: false,
          politicalSpectrum: undefined,
        });
      }
    }
  }, [defaultCenter, isOpen, initialData, initialValues, reset]);

  useEffect(() => {
    if (!isOpen) return;
    if (!showMap) return;

    const query = addressValue?.trim();
    if (!query || query.length < 6) return;
    if (suppressNextForwardGeocodeRef.current) {
      suppressNextForwardGeocodeRef.current = false;
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const url = new URL("https://nominatim.openstreetmap.org/search");
        url.searchParams.set("format", "jsonv2");
        url.searchParams.set("q", query);
        url.searchParams.set("addressdetails", "1");
        url.searchParams.set("limit", "1");

        const response = await fetch(url.toString(), {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) return;

        const results = (await response.json()) as Array<{
          lat: string;
          lon: string;
        }>;
        const first = results[0];
        if (!first) return;

        const lat = Number(first.lat);
        const lng = Number(first.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const nextPos: [number, number] = [lat, lng];
        setMarkerPosition(nextPos);
        setMapCenter(nextPos);
      } catch (error) {
        if ((error as { name?: string }).name !== "AbortError") {
          console.error("Error geocoding address:", error);
        }
      }
    }, 650);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [addressValue, isOpen, showMap]);

  const onFormSubmit = async (data: ContactFormData) => {
    try {
      await onSubmit(data);
      onClose();
      reset();
    } catch (error) {
      console.error("Error submitting contact form:", error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {initialData ? "Editar Contato" : "Novo Contato"}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Preencha as informações do contato abaixo.
        </p>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="name">Nome Completo *</Label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="name"
                placeholder="Ex: João da Silva"
                error={!!errors.name}
                hint={errors.name?.message}
                className="bg-white dark:bg-gray-800"
              />
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="email"
                  type="email"
                  placeholder="joao@email.com"
                  error={!!errors.email}
                  hint={errors.email?.message}
                  className="bg-white dark:bg-gray-800"
                />
              )}
            />
          </div>

          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Controller
              name="phone"
              control={control}
              render={({ field: { onChange, value, ...field } }) => (
                <Input
                  {...field}
                  value={maskPhone(value || "")}
                  onChange={(e) => onChange(maskPhone(e.target.value))}
                  id="phone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  error={!!errors.phone}
                  hint={errors.phone?.message}
                  className="bg-white dark:bg-gray-800"
                  maxLength={15}
                />
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
             <Label htmlFor="politicalSpectrum">Espectro Político</Label>
             <Controller
              name="politicalSpectrum"
              control={control}
              render={({ field }) => (
                <Select
                  options={politicalSpectrumOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Selecione..."
                  className="w-full"
                />
              )}
            />
          </div>
          
          <div className="flex items-center pt-6">
            <Controller
              name="isVoter"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value || false}
                  onChange={field.onChange}
                  label="É um eleitor?"
                  id="isVoter"
                />
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="address">Endereço</Label>
            <Controller
              name="address"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="address"
                  placeholder="Rua, Número, Complemento"
                  error={!!errors.address}
                  hint={errors.address?.message}
                  className="bg-white dark:bg-gray-800"
                />
              )}
            />
          </div>

          <div>
            <Label htmlFor="neighborhood">Bairro</Label>
            <Controller
              name="neighborhood"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="neighborhood"
                  placeholder="Nome do Bairro"
                  error={!!errors.neighborhood}
                  hint={errors.neighborhood?.message}
                  className="bg-white dark:bg-gray-800"
                />
              )}
            />
          </div>
        </div>

        {showMap && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Localização
            </div>
            <div className="h-[320px] w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
              <MapContainer
                center={mapCenter}
                zoom={13}
                scrollWheelZoom
                className="h-full w-full"
                style={{ height: "100%", width: "100%" }}
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
                <MapRecenter center={mapCenter} />
                <MapInteractions />
                {markerPosition && (
                  <Marker
                    position={markerPosition}
                    draggable
                    eventHandlers={{
                      dragend: (event) => {
                        const marker = event.target as L.Marker;
                        const pos = marker.getLatLng();
                        void handleMapPick(pos.lat, pos.lng);
                      },
                    }}
                  />
                )}
              </MapContainer>
            </div>
          </div>
        )}

        {initialData && (
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <TextArea
                  {...field}
                  rows={3}
                  placeholder="Informações adicionais..."
                  error={!!errors.notes}
                  hint={errors.notes?.message}
                  className="bg-white dark:bg-gray-800"
                />
              )}
            />
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Salvando..." : initialData ? "Atualizar" : "Salvar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
