import * as React from "react";
import mapboxgl from "mapbox-gl";
import maplibregl from "maplibre-gl";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { parseLatLng, geocode, geocodeOsm, getDirections, searchPlaces, searchPlacesOsm } from "@infrastructure/map/mapbox";
import type { PlaceSuggestion } from "@infrastructure/map/mapbox";
import type { Feature, LineString } from "geojson";
import type { Occurrence } from "@domain/types";

interface Props {
  map: mapboxgl.Map | maplibregl.Map | null;
  tokenPresent: boolean;
  isMapbox: boolean;
  occurrences: Occurrence[];
  collapsed?: boolean;
  variant?: "sheet" | "modal";
  onRequestClose?: () => void;
  onSelectionModeChange?: (m: "none" | "origin" | "destination") => void;
}

export interface RoutePlannerHandle {
  startTwoTap: () => void;
  setOriginFrom: (lat: number, lng: number) => void;
  setDestinationFrom: (lat: number, lng: number) => void;
}

export const RoutePlanner = React.forwardRef<RoutePlannerHandle, Props>(function RoutePlanner(
  { map, tokenPresent, isMapbox, occurrences, collapsed, variant = "sheet", onRequestClose, onSelectionModeChange }: Props,
  ref
) {
  const [origin, setOrigin] = React.useState("");
  const [destination, setDestination] = React.useState("");
  const [status, setStatus] = React.useState<string>("");
  const [error, setError] = React.useState<string>("");
  const [avoidBarriers, setAvoidBarriers] = React.useState(true);
  const [originSuggestions, setOriginSuggestions] = React.useState<PlaceSuggestion[]>([]);
  const [destSuggestions, setDestSuggestions] = React.useState<PlaceSuggestion[]>([]);
  const originControllerRef = React.useRef<AbortController | null>(null);
  const destControllerRef = React.useRef<AbortController | null>(null);
  const [selectionMode, setSelectionMode] = React.useState<
    "none" | "origin" | "destination"
  >("none");
  const [selectedOrigin, setSelectedOrigin] = React.useState<
    [number, number] | null
  >(null);
  const [selectedDestination, setSelectedDestination] = React.useState<
    [number, number] | null
  >(null);
  const originMarkerRef = React.useRef<any>(null);
  const destMarkerRef = React.useRef<any>(null);
  React.useEffect(() => { onSelectionModeChange?.(selectionMode); }, [selectionMode]);

  function placeOriginMarker(lat: number, lng: number) {
    try { if (originMarkerRef.current) originMarkerRef.current.remove(); } catch {}
    const existing = document.getElementById("route-origin-marker");
    if (existing && existing.parentElement) existing.parentElement.removeChild(existing);
    const el = document.createElement("div");
    el.id = "route-origin-marker";
    el.setAttribute("role", "img");
    el.setAttribute("aria-label", "Origem selecionada");
    el.style.width = "28px";
    el.style.height = "28px";
    el.style.background = "transparent";
    el.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5 3h2v18H5V3zm2 2h9l-2 3 2 3H7V5z" fill="#14B8A6"/></svg>';
    originMarkerRef.current = (
      isMapbox ? new mapboxgl.Marker({ element: el }) : new maplibregl.Marker({ element: el } as any)
    )
      .setLngLat([lng, lat])
      .addTo(map as any);
  }

  function placeDestMarker(lat: number, lng: number) {
    try { if (destMarkerRef.current) destMarkerRef.current.remove(); } catch {}
    const existing = document.getElementById("route-dest-marker");
    if (existing && existing.parentElement) existing.parentElement.removeChild(existing);
    const el = document.createElement("div");
    el.id = "route-dest-marker";
    el.setAttribute("role", "img");
    el.setAttribute("aria-label", "Destino selecionado");
    el.style.width = "28px";
    el.style.height = "28px";
    el.style.background = "transparent";
    el.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2c3.866 0 7 3.134 7 7 0 5.25-7 13-7 13S5 14.25 5 9c0-3.866 3.134-7 7-7z" fill="#7C3AED"/><circle cx="12" cy="9" r="3" fill="#ffffff"/></svg>';
    destMarkerRef.current = (
      isMapbox ? new mapboxgl.Marker({ element: el }) : new maplibregl.Marker({ element: el } as any)
    )
      .setLngLat([lng, lat])
      .addTo(map as any);
  }

  function clearSelections() {
    setSelectedOrigin(null);
    setSelectedDestination(null);
    setSelectionMode("none");
    setStatus("");
    setError("");
    try {
      const sourceId = "route-source" as any;
      const layerId = "route-line" as any;
      if (map && (map as any).getLayer && (map as any).getLayer(layerId)) {
        (map as any).removeLayer(layerId);
      }
      if (map && (map as any).getSource && (map as any).getSource(sourceId)) {
        (map as any).removeSource(sourceId);
      }
      try { if (originMarkerRef.current) originMarkerRef.current.remove(); } catch {}
      try { if (destMarkerRef.current) destMarkerRef.current.remove(); } catch {}
      const e1 = document.getElementById("route-origin-marker");
      if (e1 && e1.parentElement) e1.parentElement.removeChild(e1);
      const e2 = document.getElementById("route-dest-marker");
      if (e2 && e2.parentElement) e2.parentElement.removeChild(e2);
    } catch {}
  }

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && selectionMode !== "none") {
        clearSelections();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectionMode]);

  React.useImperativeHandle(ref, () => ({
    startTwoTap: () => {
      // Reset estado e camadas anteriores
      setSelectedOrigin(null);
      setSelectedDestination(null);
      setSelectionMode("origin");
      setError("");
      setStatus("");
      try {
        const sourceId = "route-source" as any;
        const layerId = "route-line" as any;
        if (map && (map as any).getLayer && (map as any).getLayer(layerId)) {
          (map as any).removeLayer(layerId);
        }
        if (map && (map as any).getSource && (map as any).getSource(sourceId)) {
          (map as any).removeSource(sourceId);
        }
        try { if (originMarkerRef.current) originMarkerRef.current.remove(); } catch {}
        try { if (destMarkerRef.current) destMarkerRef.current.remove(); } catch {}
        const e1 = document.getElementById("route-origin-marker");
        if (e1 && e1.parentElement) e1.parentElement.removeChild(e1);
        const e2 = document.getElementById("route-dest-marker");
        if (e2 && e2.parentElement) e2.parentElement.removeChild(e2);
      } catch {}
    },
    cancelSelection: () => {
      clearSelections();
    },
    setOriginFrom: (lat: number, lng: number) => {
      setSelectedOrigin([lat, lng]);
      placeOriginMarker(lat, lng);
      setSelectionMode("destination");
    },
    setDestinationFrom: (lat: number, lng: number) => {
      setSelectedDestination([lat, lng]);
      placeDestMarker(lat, lng);
      setSelectionMode("none");
    },
  }));

  async function resolveCoordinate(
    text: string
  ): Promise<[number, number] | null> {
    if (!text) return null;
    const direct = parseLatLng(text);
    if (direct) return direct;
    const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
    const prox = map ? [map.getCenter().lng, map.getCenter().lat] as [number, number] : undefined;
    if (token) return geocode(text, token, prox);
    const b = (map && (map as any).getBounds) ? (map as any).getBounds() : null;
    const viewbox = b ? { left: b.getSouthWest().lng, bottom: b.getSouthWest().lat, right: b.getNorthEast().lng, top: b.getNorthEast().lat } : undefined;
    return geocodeOsm(text, undefined, viewbox);
  }

  async function querySuggestions(kind: "origin" | "destination", text: string) {
    const v = text.trim();
    if (v.length < 2) {
      if (kind === "origin") setOriginSuggestions([]);
      else setDestSuggestions([]);
      return;
    }
    if (kind === "origin") {
      if (originControllerRef.current) originControllerRef.current.abort();
      originControllerRef.current = new AbortController();
    } else {
      if (destControllerRef.current) destControllerRef.current.abort();
      destControllerRef.current = new AbortController();
    }
    const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
    const prox = map ? [map.getCenter().lng, map.getCenter().lat] as [number, number] : undefined;
    const signal = (kind === "origin" ? originControllerRef.current : destControllerRef.current)!.signal;
    const b = (map && (map as any).getBounds) ? (map as any).getBounds() : null;
    const viewbox = b ? { left: b.getSouthWest().lng, bottom: b.getSouthWest().lat, right: b.getNorthEast().lng, top: b.getNorthEast().lat } : undefined;
    const items = token ? await searchPlaces(v, token, prox, signal) : await searchPlacesOsm(v, signal, viewbox);
    if (kind === "origin") setOriginSuggestions(items);
    else setDestSuggestions(items);
  }

  async function planRoute() {
    setError("");
    setStatus("");
    if (!map) {
      setError("Mapa não disponível.");
      return;
    }
    const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

    const from =
      selectedOrigin ??
      (origin
        ? await resolveCoordinate(origin)
        : map
        ? [map.getCenter().lat, map.getCenter().lng]
        : null);
    const to =
      selectedDestination ??
      (destination ? await resolveCoordinate(destination) : null);
    if (!from || !to) {
      setError("Informe origem e destino (lat,lng) ou selecione no mapa.");
      return;
    }
    const fromCoord = from as [number, number];
    const toCoord = to as [number, number];

    placeOriginMarker(fromCoord[0], fromCoord[1]);
    placeDestMarker(toCoord[0], toCoord[1]);
    setSelectedOrigin(fromCoord);
    setSelectedDestination(toCoord);

    const redBarriers = occurrences.filter((o) => o.level === "vermelho");
    const coordsLngLat = buildDetouredCoordinates(fromCoord, toCoord, redBarriers, avoidBarriers);
    const waypoints = coordsLngLat.slice(1, coordsLngLat.length - 1).map(([lng, lat]) => [lat, lng] as [number, number]);

    function fitBoundsPreferZoomIn(first: [number, number], last: [number, number]) {
      try {
        const currentZoom = (map as any).getZoom?.() ?? 0;
        const bounds = [
          [first[0], first[1]],
          [last[0], last[1]],
        ];
        const camera = (map as any).cameraForBounds?.(bounds, { padding: 60 });
        const targetZoom = camera?.zoom ?? currentZoom;
        if (targetZoom > currentZoom) {
          (map as any).fitBounds(bounds, { padding: 60 });
        } else {
          const cx = (first[0] + last[0]) / 2;
          const cy = (first[1] + last[1]) / 2;
          (map as any).easeTo?.({ center: [cx, cy], zoom: currentZoom });
        }
      } catch {}
    }

    if (token && isMapbox) {
      const r = await getDirections(fromCoord, toCoord, token, waypoints);
      if (!r) {
        setError("Não foi possível obter a rota.");
        return;
      }
      const sourceId = "route-source";
      const layerId = "route-line";
      if ((map as any).getSource(sourceId)) {
        const s = (map as any).getSource(sourceId);
        s.setData({ type: "FeatureCollection", features: [r.feature] });
      } else {
        (map as any).addSource(sourceId, {
          type: "geojson",
          data: { type: "FeatureCollection", features: [r.feature] },
        });
        (map as any).addLayer({
          id: layerId,
          type: "line",
          source: sourceId,
          paint: {
            "line-color": "#0052CC",
            "line-width": 5,
            "line-opacity": 0.9,
          },
        });
      }
      const coords = r.feature.geometry.coordinates as [number, number][];
      fitBoundsPreferZoomIn(coords[0], coords[coords.length - 1]);
      setStatus(`Rota: ~${r.distanceKm} km • ~${r.durationMin} min`);
    } else {
      const r = await getOsrmRoute(coordsLngLat);
      const sourceId = "route-source";
      const layerId = "route-line";
      if (r) {
        if ((map as any).getSource(sourceId)) {
          const s = (map as any).getSource(sourceId);
          s.setData({ type: "FeatureCollection", features: [r.feature] });
        } else {
          (map as any).addSource(sourceId, {
            type: "geojson",
            data: { type: "FeatureCollection", features: [r.feature] },
          });
          (map as any).addLayer({
            id: layerId,
            type: "line",
            source: sourceId,
            paint: {
              "line-color": "#0052CC",
              "line-width": 5,
              "line-opacity": 0.9,
            },
          });
        }
        const coords = r.feature.geometry.coordinates as [number, number][];
        fitBoundsPreferZoomIn(coords[0], coords[coords.length - 1]);
        setStatus(`Rota: ~${r.distanceKm.toFixed(2)} km • ~${r.durationMin} min${avoidBarriers ? " • evitando barreiras" : ""}`);
      } else {
        const feature: Feature<LineString> = {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: coordsLngLat,
          },
          properties: {},
        };
        if ((map as any).getSource(sourceId)) {
          const s = (map as any).getSource(sourceId);
          s.setData({ type: "FeatureCollection", features: [feature] });
        } else {
          (map as any).addSource(sourceId, {
            type: "geojson",
            data: { type: "FeatureCollection", features: [feature] },
          });
          (map as any).addLayer({
            id: layerId,
            type: "line",
            source: sourceId,
            paint: {
              "line-color": "#0052CC",
              "line-width": 5,
              "line-opacity": 0.9,
            },
          });
        }
        fitBoundsPreferZoomIn([fromCoord[1], fromCoord[0]], [toCoord[1], toCoord[0]]);
        const d = haversineKm(fromCoord, toCoord);
        const durationMin = Math.round((d / 4.5) * 60);
        setStatus(`Rota estimada: ~${d.toFixed(2)} km • ~${durationMin} min${avoidBarriers ? " • evitando barreiras" : ""}`);
      }
    }
  }

  function haversineKm(a: [number, number], b: [number, number]) {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(b[0] - a[0]);
    const dLng = toRad(b[1] - a[1]);
    const lat1 = toRad(a[0]);
    const lat2 = toRad(b[0]);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function computeDetours(
    from: [number, number],
    to: [number, number],
    barriers: Occurrence[]
  ): [number, number][] {
    const detours: [number, number][] = [];
    const [lat1, lng1] = from;
    const [lat2, lng2] = to;
    const dx = lng2 - lng1;
    const dy = lat2 - lat1;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len; // normal unit approx
    const ny = dx / len;
    const metersToDegLat = 1 / 111000; // ~
    const metersToDegLng = (lat: number) => 1 / (111000 * Math.cos((lat * Math.PI) / 180));

    function pointToSegmentDistanceMeters(lat: number, lng: number) {
      // crude projection assuming small distances
      const t = ((lng - lng1) * dx + (lat - lat1) * dy) / (len * len);
      const clampedT = Math.max(0, Math.min(1, t));
      const px = lng1 + clampedT * dx;
      const py = lat1 + clampedT * dy;
      const dLat = (lat - py) * 111000;
      const dLng = (lng - px) * 111000 * Math.cos((lat * Math.PI) / 180);
      return Math.sqrt(dLat * dLat + dLng * dLng);
    }

    for (const b of barriers) {
      const d = pointToSegmentDistanceMeters(b.latitude, b.longitude);
      if (d < 40) {
        const offsetM = 80;
        const degLat = ny * offsetM * metersToDegLat;
        const degLng = nx * offsetM * metersToDegLng(b.latitude);
        detours.push([b.latitude + degLat, b.longitude + degLng]);
      }
    }
    return detours.slice(0, 2); // limita número de desvios para demo
  }

  function buildDetouredCoordinates(
    from: [number, number],
    to: [number, number],
    barriers: Occurrence[],
    avoid: boolean
  ): [number, number][] {
    const coords: [number, number][] = [
      [from[1], from[0]],
      [to[1], to[0]],
    ];
    if (!avoid) return coords;
    const baseAvoidYellowM = 50;
    const baseAvoidRedM = 80;
    const baseOffsetYellowM = 120;
    const baseOffsetRedM = 160;
    const entryExitAheadM = 60;
    const metersToDegLat = 1 / 111000;
    const metersToDegLng = (lat: number) => 1 / (111000 * Math.cos((lat * Math.PI) / 180));

    const ax = coords[0][0];
    const ay = coords[0][1];
    const bx = coords[1][0];
    const by = coords[1][1];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy || 1e-9;

    function distanceAndT(px: number, py: number) {
      const t = ((px - ax) * dx + (py - ay) * dy) / len2;
      const clampedT = Math.max(0, Math.min(1, t));
      const sx = ax + clampedT * dx;
      const sy = ay + clampedT * dy;
      const dLat = (py - sy) * 111000;
      const dLng = (px - sx) * 111000 * Math.cos((py * Math.PI) / 180);
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      return { dist, t: clampedT, sx, sy };
    }

    let best:
      | { b: Occurrence; dist: number; t: number; sx: number; sy: number }
      | null = null;
    for (const b of barriers) {
      const r = distanceAndT(b.longitude, b.latitude);
      const avoidM = b.level === "vermelho" ? baseAvoidRedM : baseAvoidYellowM;
      if (r.dist < avoidM) {
        if (!best || r.dist < best.dist) best = { b, dist: r.dist, t: r.t, sx: r.sx, sy: r.sy };
      }
    }
    if (!best) return coords;

    const nx = -dy / Math.sqrt(dx * dx + dy * dy || 1);
    const ny = dx / Math.sqrt(dx * dx + dy * dy || 1);
    const offM = best.b.level === "vermelho" ? baseOffsetRedM : baseOffsetYellowM;
    const side = Math.sign((best.b.longitude - best.sx) * nx + (best.b.latitude - best.sy) * ny) || 1;
    const detLat = side * ny * offM * metersToDegLat;
    const detLng = side * nx * offM * metersToDegLng(best.sy);

    const dLatMeters = (to[0] - from[0]) * 111000;
    const dLngMeters = (to[1] - from[1]) * 111000 * Math.cos(((from[0] + to[0]) / 2 * Math.PI) / 180);
    const segLenM = Math.max(1, Math.sqrt(dLatMeters * dLatMeters + dLngMeters * dLngMeters));
    const frac = Math.max(0.02, Math.min(0.25, entryExitAheadM / segLenM));
    const t1 = Math.max(0, best.t - frac);
    const t2 = Math.min(1, best.t + frac);
    const ex1 = ax + t1 * dx;
    const ey1 = ay + t1 * dy;
    const ex2 = ax + t2 * dx;
    const ey2 = ay + t2 * dy;
    const det1: [number, number] = [ex1 + detLng, ey1 + detLat];
    const det2: [number, number] = [ex2 + detLng, ey2 + detLat];
    return [[ax, ay], det1, det2, [bx, by]];
  }

  async function getOsrmRoute(
    coordsLngLat: [number, number][]
  ): Promise<{ feature: Feature<LineString>; distanceKm: number; durationMin: number } | null> {
    try {
      const path = coordsLngLat.map(([lng, lat]) => `${lng},${lat}`).join(";");
      const url = `https://router.project-osrm.org/route/v1/foot/${path}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      const route = data.routes?.[0];
      if (!route?.geometry) return null;
      const feature: Feature<LineString> = {
        type: "Feature",
        geometry: route.geometry,
        properties: {},
      };
      return {
        feature,
        distanceKm: Math.round(route.distance / 10) / 100,
        durationMin: Math.round(route.duration / 60),
      };
    } catch {
      return null;
    }
  }

  React.useEffect(() => {
    if (!map) return;
    function onClick(e: any) {
      const lat = e.lngLat.lat;
      const lng = e.lngLat.lng;
      if (selectionMode === "origin") {
        setSelectedOrigin([lat, lng]);
        placeOriginMarker(lat, lng);
        setSelectionMode("destination");
      } else if (selectionMode === "destination") {
        setSelectedDestination([lat, lng]);
        placeDestMarker(lat, lng);
        setSelectionMode("none");
    }
  }
    (map as any).on("click", onClick);
    return () => {
      (map as any).off("click", onClick);
    };
  }, [map, selectionMode]);

  React.useEffect(() => {
    if (selectedOrigin && selectedDestination) {
      planRoute();
    }
  }, [selectedOrigin, selectedDestination]);

  const containerClass =
    variant === "modal"
      ? "fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-lg border border-neutral-300 bg-white p-4 shadow-2xl focus:outline-none max-h-[85vh] overflow-y-auto md:p-6"
      : "w-full max-h-[65vh] overflow-y-auto";
  const selectionHint =
    selectionMode === "origin"
      ? "Toque no mapa para selecionar a origem"
      : selectionMode === "destination"
      ? "Toque no mapa para selecionar o destino"
      : "";

  return (
    <>
      {selectionMode !== "none" && (
        <div
          role="alert"
          className="fixed left-1/2 top-[calc(env(safe-area-inset-top)+12px)] z-[60] -translate-x-1/2 rounded-md bg-white px-4 py-2 shadow-xl"
        >
          {selectionHint}
        </div>
      )}
      {collapsed ? null : (
        <div className={containerClass}>
      <h3 className="mb-2 text-sm font-semibold text-neutral-900">
        Planejador de Rotas
      </h3>
      {/* Comentário de Acessibilidade: rótulos associados e foco visível */}
      <div className="space-y-3">
        <div>
          <Label htmlFor="origin">Origem</Label>
          <Input
            id="origin"
            value={origin}
            onChange={(e) => { const v = e.target.value; setOrigin(v); setSelectedOrigin(null); querySuggestions("origin", v); }}
            placeholder="Endereço ou lat,lng"
            aria-describedby="origin-help"
          />
          {originSuggestions.length > 0 && (
            <div className="mt-1 rounded-md border bg-white shadow-sm">
              {originSuggestions.map((s) => (
                <button
                  key={`${s.latitude},${s.longitude},${s.label}`}
                  type="button"
                  className="block w-full px-3 py-2 text-left hover:bg-neutral-100"
                  onClick={() => { setOrigin(s.label); setSelectedOrigin([s.latitude, s.longitude]); setOriginSuggestions([]); }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
          <p id="origin-help" className="text-xs text-neutral-700">
            Use "lat,lng" ou um endereço. Em branco usa o centro do mapa.
          </p>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="avoid">Evitar barreiras</Label>
          <input
            id="avoid"
            type="checkbox"
            className="h-6 w-6"
            checked={avoidBarriers}
            onChange={(e) => setAvoidBarriers(e.target.checked)}
          />
        </div>
        <div>
          <Label htmlFor="destination">Destino</Label>
          <Input
            id="destination"
            value={destination}
            onChange={(e) => { const v = e.target.value; setDestination(v); setSelectedDestination(null); querySuggestions("destination", v); }}
            placeholder="Endereço ou lat,lng"
            aria-describedby="dest-help"
          />
          {destSuggestions.length > 0 && (
            <div className="mt-1 rounded-md border bg-white shadow-sm">
              {destSuggestions.map((s) => (
                <button
                  key={`${s.latitude},${s.longitude},${s.label}`}
                  type="button"
                  className="block w-full px-3 py-2 text-left hover:bg-neutral-100"
                  onClick={() => { setDestination(s.label); setSelectedDestination([s.latitude, s.longitude]); setDestSuggestions([]); }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
          <p id="dest-help" className="text-xs text-neutral-700">
            Informe um destino válido.
          </p>
        </div>
        <div className="mt-2 grid grid-cols-1 gap-2">
          <Button size="lg" className="h-12 w-full justify-center" onClick={() => { setSelectionMode("origin"); onRequestClose?.(); }} disabled={!map}>
            Origem no mapa
          </Button>
          <Button size="lg" className="h-12 w-full justify-center" onClick={() => { setSelectionMode("destination"); onRequestClose?.(); }} disabled={!map}>
            Destino no mapa
          </Button>
          <Button size="lg" className="h-12 w-full justify-center" onClick={() => { planRoute(); }} disabled={!map}>
            Calcular rota
          </Button>
          <Button variant="outline" size="lg" className="h-12 w-full justify-center" onClick={() => { clearSelections(); }} disabled={!map}>
            Limpar origem/destino
          </Button>
        </div>
        {status && (
          // Comentário de Acessibilidade: role="status" para feedback não intrusivo
          <div
            role="status"
            aria-live="polite"
            className="text-sm text-neutral-900"
          >
            {status}
          </div>
        )}
        {error && (
          // Comentário de Acessibilidade: role="alert" para erros
          <div role="alert" className="text-sm text-danger">
            {error}
          </div>
        )}
        </div>
        </div>
      )}
    </>
  );
});
