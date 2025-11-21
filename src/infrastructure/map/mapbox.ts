import type { Feature, LineString } from "geojson";

// Comentário de Acessibilidade: serviços de mapa em arquivo separado, mantendo UI limpa

export function parseLatLng(query: string): [number, number] | null {
  const trimmed = query.trim();
  const m = trimmed.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
  return null;
}

export async function geocode(
  query: string,
  token: string,
  proximity?: [number, number]
): Promise<[number, number] | null> {
  const params = new URLSearchParams({
    limit: "1",
    language: "pt-BR",
    country: "BR",
    access_token: token,
  });
  if (proximity && Number.isFinite(proximity[0]) && Number.isFinite(proximity[1])) {
    params.set("proximity", `${proximity[0]},${proximity[1]}`);
  }
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const feature = data.features?.[0];
  if (!feature) return null;
  const [lng, lat] = feature.center;
  return [lat, lng];
}

export async function geocodeOsm(query: string, signal?: AbortSignal, viewbox?: { left: number; top: number; right: number; bottom: number }): Promise<[number, number] | null> {
  try {
    const params = new URLSearchParams({
      format: "json",
      limit: "1",
      "accept-language": "pt-BR",
      countrycodes: "br",
    });
    if (viewbox) {
      params.set("viewbox", `${viewbox.left},${viewbox.top},${viewbox.right},${viewbox.bottom}`);
      params.set("bounded", "1");
    }
    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' }, signal });
    if (!res.ok) return null;
    const data = await res.json();
    const first = Array.isArray(data) ? data[0] : null;
    if (!first?.lat || !first?.lon) return null;
    const lat = Number(first.lat);
    const lng = Number(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return [lat, lng];
  } catch {
    return null;
  }
}

export async function getDirections(
  from: [number, number],
  to: [number, number],
  token: string,
  waypoints?: [number, number][]
): Promise<{
  feature: Feature<LineString>;
  distanceKm: number;
  durationMin: number;
} | null> {
  const [fromLat, fromLng] = from;
  const [toLat, toLng] = to;
  const middle = (waypoints || [])
    .map(([lat, lng]) => `${lng},${lat}`)
    .join(";");
  const coords = middle
    ? `${fromLng},${fromLat};${middle};${toLng},${toLat}`
    : `${fromLng},${fromLat};${toLng},${toLat}`;
  const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${coords}?geometries=geojson&overview=full&alternatives=false&access_token=${token}`;
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
    distanceKm: Math.round(route.distance / 10) / 100, // m -> km, 2 casas
    durationMin: Math.round(route.duration / 60), // s -> min
  };
}

export interface PlaceSuggestion {
  label: string;
  latitude: number;
  longitude: number;
}

function stateToUf(state?: string, shortCode?: string): string | undefined {
  const map: Record<string, string> = {
    'Acre': 'AC','Alagoas': 'AL','Amapá': 'AP','Amazonas': 'AM','Bahia': 'BA','Ceará': 'CE','Distrito Federal': 'DF','Espírito Santo': 'ES','Goiás': 'GO','Maranhão': 'MA','Mato Grosso': 'MT','Mato Grosso do Sul': 'MS','Minas Gerais': 'MG','Pará': 'PA','Paraíba': 'PB','Paraná': 'PR','Pernambuco': 'PE','Piauí': 'PI','Rio de Janeiro': 'RJ','Rio Grande do Norte': 'RN','Rio Grande do Sul': 'RS','Rondônia': 'RO','Roraima': 'RR','Santa Catarina': 'SC','São Paulo': 'SP','Sergipe': 'SE','Tocantins': 'TO'
  };
  if (shortCode && shortCode.startsWith('BR-')) return shortCode.slice(3);
  return state ? map[state] : undefined;
}

export async function searchPlaces(query: string, token: string, proximity?: [number, number], signal?: AbortSignal): Promise<PlaceSuggestion[]> {
  const params = new URLSearchParams({
    limit: "5",
    language: "pt-BR",
    country: "BR",
    types: "address,place,poi",
    access_token: token,
  });
  if (proximity && Number.isFinite(proximity[0]) && Number.isFinite(proximity[1])) {
    params.set("proximity", `${proximity[0]},${proximity[1]}`);
  }
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params.toString()}`;
  const res = await fetch(url, { signal });
  if (!res.ok) return [];
  const data = await res.json();
  const items: PlaceSuggestion[] = (data.features || []).map((f: any) => {
    const lat = f.center[1] as number;
    const lng = f.center[0] as number;
    const num = (f.address ?? f.properties?.address ?? '') as string;
    const street = (f.text ?? '') as string;
    const ctx: any[] = f.context || [];
    const get = (idPrefix: string) => ctx.find((c) => typeof c.id === 'string' && c.id.startsWith(idPrefix));
    const neigh = (get('neighborhood')?.text || get('district')?.text || '') as string;
    const city = (get('place')?.text || get('locality')?.text || '') as string;
    const region = get('region');
    const uf = stateToUf(region?.text as string | undefined, region?.short_code as string | undefined);
    const cep = (get('postcode')?.text || '') as string;
    const streetPart = [street, num].filter(Boolean).join(', ').trim();
    const locationPart = (neigh || '').trim();
    const cityUfPart = [city, uf].filter(Boolean).join('/').trim();
    const cepPart = (cep || '').trim();
    const parts = [streetPart, locationPart, cityUfPart, cepPart]
      .map((p) => p.replace(/\s+/g, ' '))
      .filter((p) => p.length > 0 && /[\p{L}\p{N}]/u.test(p));
    const label = parts.join(' - ');
    return { label, latitude: lat, longitude: lng };
  });
  return items;
}

export async function searchPlacesOsm(query: string, signal?: AbortSignal, viewbox?: { left: number; top: number; right: number; bottom: number }): Promise<PlaceSuggestion[]> {
  const params = new URLSearchParams({
    format: "json",
    limit: "5",
    "accept-language": "pt-BR",
    countrycodes: "br",
    addressdetails: "1",
  });
  if (viewbox) {
    params.set("viewbox", `${viewbox.left},${viewbox.top},${viewbox.right},${viewbox.bottom}`);
    params.set("bounded", "1");
  }
  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' }, signal });
  if (!res.ok) return [];
  const data = await res.json();
  const items: PlaceSuggestion[] = (Array.isArray(data) ? data : [])
    .filter((i: any) => i?.address?.road && (i?.address?.city || i?.address?.town || i?.address?.municipality))
    .map((i: any) => {
      const lat = Number(i.lat);
      const lng = Number(i.lon);
      const a = i.address || {};
      const street = a.road as string | undefined;
      const num = a.house_number as string | undefined;
      const neigh = (a.neighbourhood || a.suburb) as string | undefined;
      const city = (a.city || a.town || a.village || a.municipality) as string | undefined;
      const uf = stateToUf(a.state as string | undefined);
      const cep = a.postcode as string | undefined;
      const streetPart = [street, num].filter(Boolean).join(', ').trim();
      const locationPart = (neigh || '').trim();
      const cityUfPart = [city, uf].filter(Boolean).join('/').trim();
      const cepPart = (cep || '').trim();
      const parts = [streetPart, locationPart, cityUfPart, cepPart]
        .map((p) => p.replace(/\s+/g, ' '))
        .filter((p) => p.length > 0 && /[\p{L}\p{N}]/u.test(p));
      const label = parts.join(' - ');
      return { label, latitude: lat, longitude: lng };
    })
    .filter((i: any) => Number.isFinite(i.latitude) && Number.isFinite(i.longitude));
  return items;
}
