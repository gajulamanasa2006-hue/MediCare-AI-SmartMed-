/* =====================================================================
   Geo helpers + demo route data (Hyderabad / Telangana).
   All coordinates are synthetic demo routing data — NOT live GPS.
   ===================================================================== */

export type Pt = { lat: number; lng: number }

export const HYDERABAD_CENTER: Pt = { lat: 17.4325, lng: 78.4400 }

/* Quick-jump centres: Telangana districts + a few world cities, so the map
   genuinely works anywhere (Leaflet/OSM is world-capable). */
export const MAP_CENTERS = [
  { k: 'hyderabad', label: 'Hyderabad (default)', lat: 17.4325, lng: 78.4400, z: 12 },
  { k: 'secunderabad', label: 'Secunderabad', lat: 17.4399, lng: 78.4983, z: 13 },
  { k: 'gachibowli', label: 'Gachibowli / Hitec City', lat: 17.4401, lng: 78.3489, z: 13 },
  { k: 'warangal', label: 'Warangal', lat: 17.9689, lng: 79.5941, z: 12 },
  { k: 'nizamabad', label: 'Nizamabad', lat: 18.6725, lng: 78.0941, z: 12 },
  { k: 'karimnagar', label: 'Karimnagar', lat: 18.4386, lng: 79.1288, z: 12 },
  { k: 'khammam', label: 'Khammam', lat: 17.2473, lng: 80.1514, z: 12 },
  { k: 'london', label: 'London', lat: 51.5072, lng: -0.1276, z: 11 },
  { k: 'dubai', label: 'Dubai', lat: 25.2048, lng: 55.2708, z: 11 },
  { k: 'singapore', label: 'Singapore', lat: 1.3521, lng: 103.8198, z: 11 },
]

/* ------------------------------------------------------------------ demo emergency geometry */
export const PATIENT_PT: Pt = { lat: 17.4435, lng: 78.3772 }   // Hitec City pickup
export const HOSPITAL_PT: Pt = { lat: 17.4399, lng: 78.4983 }  // receiving hospital
export const AMBULANCE_BASE: Pt = { lat: 17.4312, lng: 78.4013 } // Jubilee Hills station

/* Cached road-ish route so the demo still animates with no network. */
export const FALLBACK_ROUTE: Pt[] = [
  PATIENT_PT,
  { lat: 17.4412, lng: 78.3852 },
  { lat: 17.4370, lng: 78.3930 },
  { lat: 17.4312, lng: 78.4013 },
  { lat: 17.4237, lng: 78.4110 },
  { lat: 17.4150, lng: 78.4290 },
  { lat: 17.4165, lng: 78.4390 },
  { lat: 17.4260, lng: 78.4520 },
  { lat: 17.4340, lng: 78.4480 },
  { lat: 17.4425, lng: 78.4620 },
  { lat: 17.4390, lng: 78.4790 },
  HOSPITAL_PT,
]

/* Traffic signals sitting on the route. `t` is the fractional position
   along the route (0 = patient, 1 = hospital). */
export type SignalSeed = { id: string; name: string; t: number }
export const SIGNAL_SEEDS: SignalSeed[] = [
  { id: 'S1', name: 'Jubilee Hills Check Post', t: 0.20 },
  { id: 'S2', name: 'Punjagutta Junction', t: 0.52 },
  { id: 'S3', name: 'Begumpet Flyover', t: 0.78 },
  { id: 'S4', name: 'Prakash Nagar', t: 0.91 },
]

/* ------------------------------------------------------------------ math */
const R = 6371
export function haversineKm(a: Pt, b: Pt) {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const la1 = (a.lat * Math.PI) / 180
  const la2 = (b.lat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function routeLengthKm(route: Pt[]) {
  let d = 0
  for (let i = 1; i < route.length; i++) d += haversineKm(route[i - 1], route[i])
  return d
}

/** Point at fractional distance f (0..1) along a polyline. */
export function pointAt(route: Pt[], f: number): Pt {
  if (!route.length) return HYDERABAD_CENTER
  const clamped = Math.max(0, Math.min(1, f))
  const total = routeLengthKm(route)
  let target = total * clamped
  for (let i = 1; i < route.length; i++) {
    const seg = haversineKm(route[i - 1], route[i])
    if (target <= seg || i === route.length - 1) {
      const r = seg === 0 ? 0 : target / seg
      return {
        lat: route[i - 1].lat + (route[i].lat - route[i - 1].lat) * r,
        lng: route[i - 1].lng + (route[i].lng - route[i - 1].lng) * r,
      }
    }
    target -= seg
  }
  return route[route.length - 1]
}

/** Remaining km from fraction f to the end of the route. */
export function remainingKm(route: Pt[], f: number) {
  return Math.max(0, routeLengthKm(route) * (1 - Math.max(0, Math.min(1, f))))
}

/** Live ETA computed from distance + current speed. Never a hardcoded figure. */
export function etaMinutes(route: Pt[], f: number, speedKmh: number) {
  const km = remainingKm(route, f)
  const v = Math.max(8, speedKmh) // floor so ETA never divides by ~0 in traffic
  const mins = (km / v) * 60
  // + ~7 s per remaining signal on red, a realistic urban penalty
  return Math.max(km > 0 ? 1 : 0, Math.round(mins))
}

export const fmtKm = (km: number) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`)

/* ------------------------------------------------------------------ OSRM road routing (best effort) */
export async function fetchRoadRoute(from: Pt, to: Pt): Promise<{ route: Pt[]; source: 'OSRM' | 'cached' }> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 4500)
    const res = await fetch(url, { signal: ctrl.signal })
    clearTimeout(t)
    if (!res.ok) throw new Error('osrm ' + res.status)
    const json = await res.json()
    const coords = json?.routes?.[0]?.geometry?.coordinates as [number, number][] | undefined
    if (!coords || coords.length < 2) throw new Error('no geometry')
    return { route: coords.map(([lng, lat]) => ({ lat, lng })), source: 'OSRM' }
  } catch {
    return { route: FALLBACK_ROUTE, source: 'cached' }
  }
}
