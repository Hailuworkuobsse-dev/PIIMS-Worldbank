import { useCallback, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  LayersControl,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { useTranslation } from "react-i18next";
import "leaflet/dist/leaflet.css";
import { useGeoBeneficiaries, useGeoInterventions } from "./geo.queries";
import { MapControls } from "./MapControls";
import { Card, CardHeader } from "@/components/ui/Card";
import type { GeoFilters, MapBounds } from "./geo.types";

/* Fix Leaflet default marker icons under Vite */
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* Ethiopia bbox */
const DEFAULT_CENTER: [number, number] = [9.145, 40.489];
const DEFAULT_ZOOM = 6;

export default function MapPage() {
  const { t } = useTranslation();
  const [layer, setLayer] = useState<GeoFilters["layer"]>("beneficiaries");
  const [bounds, setBounds] = useState<MapBounds | undefined>(undefined);

  const filters: GeoFilters = useMemo(
    () => ({ layer, bounds }),
    [layer, bounds],
  );

  const { data: beneficiaries } = useGeoBeneficiaries(filters);
  const { data: interventions } = useGeoInterventions(filters);

  const onBoundsChange = useCallback((b: MapBounds) => setBounds(b), []);

  return (
    <main id="main" tabIndex={-1} className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-h1 text-primary-900">{t("geo.title")}</h1>
          <p className="text-body-sm text-neutral-600 mt-1">
            {t("geo.subtitle")}
          </p>
        </div>
      </header>

      <MapControls layer={layer} onLayerChange={setLayer} />

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <div
          className="rounded-md border border-neutral-300 overflow-hidden"
          style={{ height: 620 }}
        >
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />

            <BoundsWatcher onBoundsChange={onBoundsChange} />

            <LayersControl position="topright">
              <LayersControl.Overlay
                checked
                name={t("geo.layers.beneficiaries")}
              >
                <MarkersLayer
                  markers={(beneficiaries ?? []).map((b) => ({
                    id: b.beneficiaryId,
                    lat: b.lat,
                    lon: b.lon,
                    title: b.fullName,
                    subtitle: `${b.uniqueId} · ${b.woreda ?? ""}`,
                  }))}
                />
              </LayersControl.Overlay>
              <LayersControl.Overlay name={t("geo.layers.interventions")}>
                <MarkersLayer
                  markers={(interventions ?? []).map((m) => ({
                    id: m.deliveryId,
                    lat: m.lat,
                    lon: m.lon,
                    title: m.productName,
                    subtitle: `${m.serialNo ?? ""} · ${m.projectCode ?? ""}`,
                  }))}
                  color="blue"
                />
              </LayersControl.Overlay>
            </LayersControl>
          </MapContainer>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader title={t("geo.stats.title")} />
            <ul className="text-body-sm space-y-1.5">
              <Row
                label={t("geo.stats.beneficiaries")}
                value={String(beneficiaries?.length ?? 0)}
              />
              <Row
                label={t("geo.stats.interventions")}
                value={String(interventions?.length ?? 0)}
              />
              {bounds && (
                <Row
                  label={t("geo.stats.view")}
                  value={`${bounds.south.toFixed(2)}°S · ${bounds.north.toFixed(2)}°N`}
                />
              )}
            </ul>
          </Card>

          <Card>
            <CardHeader title={t("geo.legend.title")} />
            <ul className="text-caption space-y-1.5">
              <li>
                <span
                  aria-hidden
                  className="inline-block h-2.5 w-2.5 rounded-full bg-primary-700 mr-2"
                />
                {t("geo.legend.registered")}
              </li>
              <li>
                <span
                  aria-hidden
                  className="inline-block h-2.5 w-2.5 rounded-full bg-green-500 mr-2"
                />
                {t("geo.legend.verified")}
              </li>
              <li>
                <span
                  aria-hidden
                  className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500 mr-2"
                />
                {t("geo.legend.intervention")}
              </li>
            </ul>
          </Card>
        </aside>
      </div>
    </main>
  );
}

/* ---- Sub-components ---- */

function BoundsWatcher({
  onBoundsChange,
}: {
  onBoundsChange: (b: MapBounds) => void;
}) {
  useMapEvents({
    moveend: (e) => {
      const b = e.target.getBounds();
      onBoundsChange({
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      });
    },
  });
  return null;
}

function MarkersLayer({
  markers,
  color = "default",
}: {
  markers: {
    id: string;
    lat: number;
    lon: number;
    title: string;
    subtitle: string;
  }[];
  color?: "default" | "blue";
}) {
  return (
    <>
      {markers.map((m) => {
        if (color === "blue") {
          return (
            <CircleMarker
              key={m.id}
              center={[m.lat, m.lon]}
              radius={5}
              pathOptions={{
                color: "#1E4976",
                fillColor: "#2563EB",
                fillOpacity: 0.8,
              }}
            >
              <Popup>
                <div className="text-caption">
                  <div className="font-bold">{m.title}</div>
                  <div className="text-neutral-600">{m.subtitle}</div>
                </div>
              </Popup>
            </CircleMarker>
          );
        }
        return (
          <Marker key={m.id} position={[m.lat, m.lon]}>
            <Popup>
              <div className="text-caption">
                <div className="font-bold">{m.title}</div>
                <div className="text-neutral-600">{m.subtitle}</div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex justify-between gap-3">
      <span className="text-neutral-600">{label}</span>
      <span className="font-semibold">{value}</span>
    </li>
  );
}