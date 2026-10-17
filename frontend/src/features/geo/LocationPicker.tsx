import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useTranslation } from "react-i18next";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MapPin } from "lucide-react";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export interface LocationPickerProps {
  value?: { lat: number; lon: number };
  onChange: (v: { lat: number; lon: number }) => void;
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const { t } = useTranslation();
  const [marker, setMarker] = useState<
    { lat: number; lon: number } | undefined
  >(value);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const set = (lat: number, lon: number) => {
    setMarker({ lat, lon });
    onChange({ lat, lon });
  };

  const useCurrentGps = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation unsupported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => set(p.coords.latitude, p.coords.longitude),
      (e) => setGpsError(e.message),
      { enableHighAccuracy: true },
    );
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Latitude"
          type="number"
          step="0.0000001"
          value={marker?.lat ?? ""}
          onChange={(e) => set(Number(e.target.value), marker?.lon ?? 0)}
        />
        <Input
          label="Longitude"
          type="number"
          step="0.0000001"
          value={marker?.lon ?? ""}
          onChange={(e) => set(marker?.lat ?? 0, Number(e.target.value))}
        />
      </div>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        leftIcon={<MapPin className="h-4 w-4" />}
        onClick={useCurrentGps}
      >
        {t("geo.picker.useGps")}
      </Button>
      {gpsError && (
        <p role="alert" className="text-caption text-danger">
          {gpsError}
        </p>
      )}

      <div
        className="rounded-md overflow-hidden border border-neutral-300"
        style={{ height: 260 }}
      >
        <MapContainer
          center={marker ? [marker.lat, marker.lon] : [9.145, 40.489]}
          zoom={marker ? 12 : 6}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OSM"
          />
          <ClickCatcher onClick={set} />
          {marker && <Marker position={[marker.lat, marker.lon]} />}
        </MapContainer>
      </div>
    </div>
  );
}

function ClickCatcher({
  onClick,
}: {
  onClick: (lat: number, lon: number) => void;
}) {
  useMapEvents({
    click: (e) => onClick(e.latlng.lat, e.latlng.lng),
  });
  return null;
}