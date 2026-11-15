import React, { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Crosshair, Navigation } from 'lucide-react'
import type { Pt } from '../lib/geo'
import { haversineKm } from '../lib/geo'

export type MapSignal = { id: string; name: string; lat: number; lng: number; state: 'RED' | 'GREEN' }

type Props = {
  center?: Pt
  zoom?: number
  route?: Pt[]
  travelled?: number
  ambulance?: Pt
  patient?: Pt
  hospital?: Pt
  signals?: MapSignal[]
  extra?: { lat: number; lng: number; label: string; tone?: string }[]
  height?: number
  showRecenter?: boolean
  className?: string
}

const icon = (html: string, size = 34) =>
  L.divIcon({ html, className: 'smn-pin', iconSize: [size, size], iconAnchor: [size / 2, size / 2] })

const pin = (emoji: string, label: string, bg: string) =>
  icon(`<div style="display:flex;flex-direction:column;align-items:center;gap:2px;transform:translateY(-4px)">
    <span style="display:grid;place-items:center;width:30px;height:30px;border-radius:9999px;background:${bg};box-shadow:0 3px 10px rgba(15,23,42,.35);font-size:15px;line-height:1;border:2px solid #fff">${emoji}</span>
    <span style="font:700 9px/1.2 ui-sans-serif;background:#0f172a;color:#fff;padding:2px 5px;border-radius:5px;white-space:nowrap">${label}</span>
  </div>`, 34)

const signalPin = (s: MapSignal) =>
  icon(`<div style="display:flex;align-items:center;gap:3px">
    <span style="display:flex;flex-direction:column;gap:2px;background:#0f172a;padding:3px;border-radius:5px;border:1px solid #334155">
      <span style="width:6px;height:6px;border-radius:9999px;background:${s.state === 'RED' ? '#ef4444' : '#1e293b'};box-shadow:${s.state === 'RED' ? '0 0 5px #ef4444' : 'none'}"></span>
      <span style="width:6px;height:6px;border-radius:9999px;background:${s.state === 'GREEN' ? '#22c55e' : '#1e293b'};box-shadow:${s.state === 'GREEN' ? '0 0 6px #22c55e' : 'none'}"></span>
    </span>
    <span style="font:700 8.5px/1.2 ui-sans-serif;color:${s.state === 'RED' ? '#fca5a5' : '#86efac'};background:#0f172a;padding:1px 4px;border-radius:4px;white-space:nowrap">${s.id} ${s.state}</span>
  </div>`, 56)

export function GeoMap({
  center = { lat: 17.4325, lng: 78.44 }, zoom = 12, route = [], travelled = 0,
  ambulance, patient, hospital, signals = [], extra = [], height = 340, showRecenter = true, className = '',
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const routeRef = useRef<L.Polyline | null>(null)
  const doneRef = useRef<L.Polyline | null>(null)
  const ambRef = useRef<L.Marker | null>(null)
  const patRef = useRef<L.Marker | null>(null)
  const hosRef = useRef<L.Marker | null>(null)
  const sigRefs = useRef<Record<string, L.Marker>>({})
  const extraRefs = useRef<L.Marker[]>([])
  const [ready, setReady] = useState(false)

  /* init once */
  useEffect(() => {
    if (!hostRef.current || mapRef.current) return
    const map = L.map(hostRef.current, {
      center: [center.lat, center.lng], zoom, zoomControl: true, attributionControl: true, scrollWheelZoom: true,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)
    mapRef.current = map
    setReady(true)
    return () => { map.remove(); mapRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* route + travelled split + markers */
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return

    const latlngs = route.map((p) => [p.lat, p.lng] as [number, number])
    if (routeRef.current) { routeRef.current.remove(); routeRef.current = null }
    if (doneRef.current) { doneRef.current.remove(); doneRef.current = null }

    if (latlngs.length > 1) {
      routeRef.current = L.polyline(latlngs, { color: '#0d9488', weight: 4, opacity: 0.55, dashArray: '9 8' }).addTo(map)
      const n = Math.max(2, Math.round(latlngs.length * Math.max(0, Math.min(1, travelled))))
      if (travelled > 0) doneRef.current = L.polyline(latlngs.slice(0, n), { color: '#2563eb', weight: 5, opacity: 0.95 }).addTo(map)
      const b = L.latLngBounds(latlngs)
      if (b.isValid()) map.fitBounds(b, { padding: [40, 40] })
    }

    if (patient) {
      if (!patRef.current) patRef.current = L.marker([patient.lat, patient.lng], { icon: pin('📍', 'Patient', '#e11d48'), zIndexOffset: 300 }).addTo(map)
      else patRef.current.setLatLng([patient.lat, patient.lng])
    }
    if (hospital) {
      if (!hosRef.current) hosRef.current = L.marker([hospital.lat, hospital.lng], { icon: pin('🏥', 'Hospital', '#059669'), zIndexOffset: 200 }).addTo(map)
      else hosRef.current.setLatLng([hospital.lat, hospital.lng])
    }
    if (ambulance) {
      if (!ambRef.current) ambRef.current = L.marker([ambulance.lat, ambulance.lng], { icon: pin('🚑', 'Ambulance', '#2563eb'), zIndexOffset: 900 }).addTo(map)
      else ambRef.current.setLatLng([ambulance.lat, ambulance.lng])
    }

    /* signals */
    const seen = new Set<string>()
    signals.forEach((s) => {
      seen.add(s.id)
      const m = sigRefs.current[s.id]
      if (!m) sigRefs.current[s.id] = L.marker([s.lat, s.lng], { icon: signalPin(s), zIndexOffset: 500 }).addTo(map)
      else m.setLatLng([s.lat, s.lng]).setIcon(signalPin(s))
    })
    Object.keys(sigRefs.current).forEach((id) => {
      if (!seen.has(id)) { sigRefs.current[id].remove(); delete sigRefs.current[id] }
    })

    /* extra pins */
    extraRefs.current.forEach((m) => m.remove())
    extraRefs.current = extra.map((e) =>
      L.marker([e.lat, e.lng], { icon: pin('🚑', e.label, e.tone || '#0ea5e9'), zIndexOffset: 100 }).addTo(map))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, JSON.stringify(route), travelled, ambulance?.lat, ambulance?.lng, patient?.lat, hospital?.lat, JSON.stringify(signals.map((s) => [s.id, s.state]))])

  const recenter = () => {
    const map = mapRef.current
    if (!map) return
    if (route.length > 1) {
      const b = L.latLngBounds(route.map((p) => [p.lat, p.lng] as [number, number]))
      if (b.isValid()) map.fitBounds(b, { padding: [40, 40] })
    } else map.setView([center.lat, center.lng], zoom)
  }

  /* follow the ambulance at street zoom while tracking */
  const follow = () => {
    const map = mapRef.current
    if (map && ambulance) map.setView([ambulance.lat, ambulance.lng], 15, { animate: true })
  }

  const km = useMemo(() => {
    if (!ambulance || !hospital) return null
    return haversineKm(ambulance, hospital)
  }, [ambulance?.lat, ambulance?.lng, hospital?.lat, hospital?.lng])

  return (
    <div className={`relative overflow-hidden rounded-xl border border-slate-200 bg-navy-950 ${className}`}>
      <div ref={hostRef} style={{ height }} className="w-full" />
      {showRecenter && (
        <div className="absolute right-3 top-3 z-[500] flex flex-col gap-2">
          <button onClick={recenter} title="Recenter map" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-md transition hover:bg-slate-50">
            <Crosshair size={15} />
          </button>
          {ambulance && (
            <button onClick={follow} title="Follow ambulance" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-brand-700 shadow-md transition hover:bg-slate-50">
              <Navigation size={15} />
            </button>
          )}
        </div>
      )}
      {km !== null && km > 0 && (
        <div className="absolute bottom-3 left-3 z-[500] rounded-lg bg-navy-950/85 px-2.5 py-1.5 text-[10.5px] font-bold text-teal-300 backdrop-blur">
          {km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`} to hospital · straight line
        </div>
      )}
    </div>
  )
}
