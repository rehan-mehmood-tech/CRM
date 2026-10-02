"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactCurrency, formatCurrency, formatNumber, titleCase } from "@/lib/format";
import type { MonthPoint, SourcePoint, StagePoint } from "@/lib/metrics";

/**
 * Chart palette: the dark steps of the reference categorical ramp, validated
 * against this app surface (#0b0f22) with scripts/validate_palette.js.
 * Slot 1 blue carries magnitude, slot 2 orange the second series, slot 8 red the
 * negative series. Never cycle or add hues here without re-running the validator.
 */
export const VIZ = {
  surface: "#0b0f22",
  series1: "#3987e5",
  series2: "#d95926",
  negative: "#e66767",
  grid: "rgba(255,255,255,0.06)",
  axis: "#94a0c4",
} as const;

const AXIS_PROPS = {
  stroke: VIZ.grid,
  tick: { fill: VIZ.axis, fontSize: 11 },
  tickLine: false,
} as const;

function TooltipBox({
  label,
  rows,
}: {
  label: string;
  rows: { name: string; value: string; color: string }[];
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#0d1228] px-3 py-2 shadow-xl">
      <p className="text-xs font-medium text-white">{label}</p>
      <ul className="mt-1.5 space-y-1">
        {rows.map((row) => (
          <li key={row.name} className="flex items-center gap-2 text-xs text-slate-300">
            <span className="size-2 rounded-sm" style={{ backgroundColor: row.color }} />
            <span className="flex-1">{row.name}</span>
            <span className="font-medium text-white">{row.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Closed-won against closed-lost revenue, by calendar month. */
export function RevenueChart({ data, currency }: { data: MonthPoint[]; currency: string }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={2}>
        <CartesianGrid stroke={VIZ.grid} vertical={false} />
        <XAxis dataKey="month" {...AXIS_PROPS} />
        <YAxis
          {...AXIS_PROPS}
          width={56}
          tickFormatter={(value: number) => formatCompactCurrency(value, currency)}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <TooltipBox
                label={String(label)}
                rows={payload.map((item) => ({
                  name: String(item.name),
                  value: formatCurrency(Number(item.value), currency),
                  color: String(item.color),
                }))}
              />
            ) : null
          }
        />
        <Legend
          verticalAlign="top"
          align="right"
          height={28}
          iconType="square"
          iconSize={8}
          formatter={(value) => <span className="text-xs text-slate-400">{String(value)}</span>}
        />
        <Bar dataKey="won" name="Closed won" fill={VIZ.series1} radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar dataKey="lost" name="Closed lost" fill={VIZ.negative} radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * Open pipeline value per stage. One series, so magnitude carries the single
 * blue; each bar also wears its stage colour as the legend dot in the surrounding
 * list, and values are labelled directly instead of leaning on a legend.
 */
export function StageChart({ data, currency }: { data: StagePoint[]; currency: string }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 46)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 56, bottom: 4, left: 4 }}>
        <CartesianGrid stroke={VIZ.grid} horizontal={false} />
        <XAxis
          type="number"
          {...AXIS_PROPS}
          tickFormatter={(value: number) => formatCompactCurrency(value, currency)}
        />
        <YAxis type="category" dataKey="stage" {...AXIS_PROPS} width={110} />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const point = payload[0].payload as StagePoint;
            return (
              <TooltipBox
                label={point.stage}
                rows={[
                  { name: "Open value", value: formatCurrency(point.value, currency), color: point.color },
                  { name: "Deals", value: formatNumber(point.count), color: point.color },
                ]}
              />
            );
          }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
          {data.map((point) => (
            <Cell key={point.stage} fill={point.color || VIZ.series1} stroke={VIZ.surface} strokeWidth={2} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            formatter={(value: unknown) => formatCompactCurrency(Number(value), currency)}
            style={{ fill: "#cbd5f5", fontSize: 11 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Leads captured against leads converted, grouped by source. */
export function SourceChart({ data }: { data: SourcePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={2}>
        <CartesianGrid stroke={VIZ.grid} vertical={false} />
        <XAxis dataKey="source" {...AXIS_PROPS} tickFormatter={(value: string) => titleCase(value)} />
        <YAxis {...AXIS_PROPS} width={36} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <TooltipBox
                label={titleCase(String(label))}
                rows={payload.map((item) => ({
                  name: String(item.name),
                  value: formatNumber(Number(item.value)),
                  color: String(item.color),
                }))}
              />
            ) : null
          }
        />
        <Legend
          verticalAlign="top"
          align="right"
          height={28}
          iconType="square"
          iconSize={8}
          formatter={(value) => <span className="text-xs text-slate-400">{String(value)}</span>}
        />
        <Bar dataKey="leads" name="Leads" fill={VIZ.series1} radius={[4, 4, 0, 0]} maxBarSize={24} />
        <Bar dataKey="converted" name="Converted" fill={VIZ.series2} radius={[4, 4, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}
