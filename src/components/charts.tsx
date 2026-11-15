import React from 'react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'

const AX = { fontSize: 11, fill: '#64748b' } as const
const GRID = '#e2e8f0'

const TipBox = ({ active, payload, label, unit }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white/97 px-3 py-2 shadow-lift backdrop-blur">
      {label && <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-2 text-[12.5px] font-semibold text-slate-800">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          {p.name}: <span className="tabular-nums">{p.value}{unit || ''}</span>
        </p>
      ))}
    </div>
  )
}

const defs = {
  bp: (
    <defs>
      <linearGradient id="gSys" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#2563eb" stopOpacity={0.34} /><stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
      </linearGradient>
      <linearGradient id="gDia" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.3} /><stop offset="100%" stopColor="#14b8a6" stopOpacity={0.02} />
      </linearGradient>
    </defs>
  ),
}

export function BpChart({ data, height = 240 }: { data: any[]; height?: number }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
          {defs.bp}
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
          <XAxis dataKey="d" tick={AX} axisLine={false} tickLine={false} />
          <YAxis tick={AX} axisLine={false} tickLine={false} domain={[60, 140]} />
          <Tooltip content={<TipBox unit=" mmHg" />} />
          <Area type="monotone" dataKey="sys" name="Systolic" stroke="#2563eb" strokeWidth={2.4} fill="url(#gSys)" />
          <Area type="monotone" dataKey="dia" name="Diastolic" stroke="#14b8a6" strokeWidth={2.4} fill="url(#gDia)" />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} iconType="circle" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function SugarChart({ data, height = 240 }: { data: any[]; height?: number }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
          <XAxis dataKey="d" tick={AX} axisLine={false} tickLine={false} />
          <YAxis tick={AX} axisLine={false} tickLine={false} domain={[60, 180]} />
          <Tooltip content={<TipBox unit=" mg/dL" />} />
          <Line type="monotone" dataKey="f" name="Fasting" stroke="#0d9488" strokeWidth={2.6} dot={{ r: 3.5, fill: '#0d9488' }} />
          <Line type="monotone" dataKey="p" name="Post-meal" stroke="#f59e0b" strokeWidth={2.6} strokeDasharray="5 3" dot={{ r: 3.5, fill: '#f59e0b' }} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} iconType="circle" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function SimpleLine({ data, k, name, color = '#2563eb', height = 200, unit = '', domain }:
  { data: any[]; k: string; name: string; color?: string; height?: number; unit?: string; domain?: any[] }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={'g' + k + color.replace('#', '')} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.32} /><stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
          <XAxis dataKey="d" tick={AX} axisLine={false} tickLine={false} />
          <YAxis tick={AX} axisLine={false} tickLine={false} domain={domain} />
          <Tooltip content={<TipBox unit={unit} />} />
          <Area type="monotone" dataKey={k} name={name} stroke={color} strokeWidth={2.6} fill={`url(#g${k}${color.replace('#', '')})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function AdherenceBars({ data, height = 200 }: { data: any[]; height?: number }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
          <XAxis dataKey="d" tick={AX} axisLine={false} tickLine={false} />
          <YAxis tick={AX} axisLine={false} tickLine={false} domain={[0, 100]} />
          <Tooltip content={<TipBox unit="%" />} />
          <Bar dataKey="v" name="Adherence" radius={[6, 6, 0, 0]} fill="#0d9488" maxBarSize={44} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function OpsTrend({ data, height = 260 }: { data: any[]; height?: number }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="gOpd" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} /><stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
          <XAxis dataKey="d" tick={AX} axisLine={false} tickLine={false} />
          <YAxis tick={AX} axisLine={false} tickLine={false} />
          <Tooltip content={<TipBox />} />
          <Area type="monotone" dataKey="opd" name="OPD visits" stroke="#3b82f6" strokeWidth={2.6} fill="url(#gOpd)" />
          <Line type="monotone" dataKey="emg" name="Emergency" stroke="#e11d48" strokeWidth={2.4} dot={{ r: 3 }} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} iconType="circle" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function RevenueChart({ data, height = 250 }: { data: any[]; height?: number }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 10, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
          <XAxis dataKey="m" tick={AX} axisLine={false} tickLine={false} />
          <YAxis tick={AX} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
          <Tooltip content={<TipBox />} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} iconType="circle" />
          <Bar dataKey="opd" name="OPD" stackId="a" fill="#3b82f6" maxBarSize={38} />
          <Bar dataKey="ipd" name="IPD" stackId="a" fill="#10b981" maxBarSize={38} />
          <Bar dataKey="lab" name="Laboratory" stackId="a" fill="#06b6d4" radius={[6, 6, 0, 0]} maxBarSize={38} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function Donut({ value, label, sub, color = '#2563eb', height = 190, total }:
  { value: number; label: string; sub?: string; color?: string; height?: number; total?: number }) {
  const data = [{ v: value }, { v: Math.max(0, 100 - value) }]
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="v" innerRadius="68%" outerRadius="94%" startAngle={90} endAngle={-270} stroke="none">
            <Cell fill={color} /><Cell fill="#e2e8f0" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-[24px] font-extrabold leading-none text-slate-900 tabular-nums">{value}%</p>
          <p className="mt-1 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
          {sub && <p className="mt-0.5 text-[11px] text-slate-500">{sub}</p>}
        </div>
      </div>
    </div>
  )
}

export function MiniRadial({ data, height = 220 }: { data: any[]; height?: number }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart data={data} innerRadius="26%" outerRadius="100%" startAngle={90} endAngle={-270}>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="v" cornerRadius={6} background={{ fill: '#eef2f7' }} />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  )
}
