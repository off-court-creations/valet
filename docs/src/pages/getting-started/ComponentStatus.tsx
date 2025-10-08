// ─────────────────────────────────────────────────────────────
// src/pages/getting-started/ComponentStatus.tsx  | valet-docs
// Status matrix of all components with sidecars, rendered via <Table/>
// ─────────────────────────────────────────────────────────────
import { useMemo } from 'react';
import {
  Surface,
  Stack,
  Typography,
  Panel,
  Table,
  useTheme,
  type TableColumn,
} from '@archway/valet';
import { Chart as ChartJS, ArcElement, Legend } from 'chart.js';
import type { ChartOptions, Plugin, ScriptableContext } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import NavDrawer from '../../components/NavDrawer';
import type { DocMeta } from '../../types';
import {
  COMPONENTS_STATUS,
  sortComponents,
  type ComponentStatus,
} from '../../data/componentsStatus';

const STATUS_BUCKETS = ['production', 'stable', 'experimental', 'unstable', 'deprecated'] as const;

type StatusKey = (typeof STATUS_BUCKETS)[number];

const STATUS_LABELS: Record<StatusKey, string> = {
  production: 'Production',
  stable: 'Stable',
  experimental: 'Experimental',
  unstable: 'Unstable',
  deprecated: 'Deprecated',
};

// Cool doughnut center label + soft shadow
const DoughnutFxPlugin: Plugin<'doughnut'> = {
  id: 'doughnutFx',
  beforeDatasetDraw(chart, args) {
    if (args.index !== 0) return;
    const { ctx } = chart;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 8;
  },
  afterDatasetDraw(chart, args) {
    if (args.index !== 0) return;
    chart.ctx.restore();
  },
};

const CenterTextPlugin: Plugin<'doughnut'> = {
  id: 'centerText',
  afterDraw(chart, _args, opts) {
    const meta = chart.getDatasetMeta(0);
    const first = (meta?.data?.[0] ?? null) as unknown as { x: number; y: number } | null;
    if (!first) return;
    const ctx = chart.ctx as CanvasRenderingContext2D;
    const {
      value = 0,
      label = '',
      color = '#0f172a',
    } = (opts as unknown as { value?: number; label?: string; color?: string }) ?? {};
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.font = '600 12px ui-sans-serif, system-ui, -apple-system';
    ctx.fillText(label, first.x, first.y - 8);
    ctx.fillStyle = color;
    ctx.font = '800 22px ui-sans-serif, system-ui, -apple-system';
    ctx.fillText(String(value), first.x, first.y + 12);
    ctx.restore();
  },
};

ChartJS.register(ArcElement, Legend, ChartDataLabels, DoughnutFxPlugin, CenterTextPlugin);

// Chart legend is disabled; we draw our own swatch legend.

function pickReadableTextColor(hex: string): string {
  const normalized = hex.startsWith('#') ? hex.slice(1) : hex;
  if (normalized.length !== 6) return 'rgba(15, 23, 42, 0.88)';
  const r = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const g = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const b = Number.parseInt(normalized.slice(4, 6), 16) / 255;
  const toLinear = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return luminance > 0.55 ? 'rgba(15, 23, 42, 0.88)' : '#ffffff';
}

function adjustHexColor(hex: string, amount: number): string {
  const normalized = hex.startsWith('#') ? hex.slice(1) : hex;
  if (normalized.length !== 6) return hex;

  const clamp = (v: number) => Math.min(255, Math.max(0, Math.round(v)));
  const adjust = (channel: number) =>
    amount >= 0
      ? channel + (255 - channel) * Math.min(amount, 1)
      : channel * (1 + Math.max(amount, -1));

  const r = clamp(adjust(Number.parseInt(normalized.slice(0, 2), 16)));
  const g = clamp(adjust(Number.parseInt(normalized.slice(2, 4), 16)));
  const b = clamp(adjust(Number.parseInt(normalized.slice(4, 6), 16)));

  const toHex = (value: number) => value.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgba(hex: string, alpha = 1): string {
  const normalized = hex.startsWith('#') ? hex.slice(1) : hex;
  if (normalized.length !== 6) return hex;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function resolveStatusColor(_colors: Record<string, string>, status: StatusKey): string {
  // Fixed palette for status buckets
  const map: Record<StatusKey, string> = {
    production: '#2563EB', // blue — clearly distinct from yellow
    stable: '#22C55E', // green
    experimental: '#EAB308', // yellow
    unstable: '#EF4444', // red
    deprecated: '#000000', // black
  };
  return map[status];
}

export const meta: DocMeta = {
  id: 'component-status',
  title: 'Component Status',
  description: 'Current stability status for every valet component with a meta sidecar.',
  pageType: 'reference',
  tldr: 'Single table of all components and their current stability status.',
};

export default function ComponentStatusPage() {
  const data = [...COMPONENTS_STATUS].sort(sortComponents);
  const { theme } = useTheme();

  const statusColors = useMemo<Record<StatusKey, string>>(() => {
    const palette = theme?.colors ?? {};
    return STATUS_BUCKETS.reduce<Record<StatusKey, string>>(
      (acc, status) => {
        acc[status] = resolveStatusColor(palette, status);
        return acc;
      },
      {} as Record<StatusKey, string>,
    );
  }, [theme]);

  const countsByStatus = useMemo<Record<StatusKey, number>>(() => {
    const base = STATUS_BUCKETS.reduce<Record<StatusKey, number>>(
      (acc, status) => {
        acc[status] = 0;
        return acc;
      },
      {} as Record<StatusKey, number>,
    );

    return data.reduce<Record<StatusKey, number>>((acc, component) => {
      acc[component.status] = (acc[component.status] ?? 0) + 1;
      return acc;
    }, base);
  }, [data]);

  const total = useMemo(
    () => STATUS_BUCKETS.reduce((acc, s) => acc + (countsByStatus[s] ?? 0), 0),
    [countsByStatus],
  );

  const chartData = useMemo(() => {
    // Gradient background per slice using scriptable backgroundColor
    const backgroundColor = (ctx: ScriptableContext<'doughnut'>) => {
      const idx: number = ctx.dataIndex ?? 0;
      const key = (STATUS_BUCKETS[idx] ?? 'stable') as StatusKey;
      const base = statusColors[key] ?? '#64748b';
      const chart = ctx.chart;
      const area = chart?.chartArea;
      const c: CanvasRenderingContext2D | undefined = chart?.ctx;
      if (!area || !c) return base;
      const x = (area.left + area.right) / 2;
      const y = (area.top + area.bottom) / 2;
      const r = Math.min(area.right - area.left, area.bottom - area.top) / 2;
      const grad = c.createRadialGradient(x, y, Math.max(6, r * 0.05), x, y, r);
      grad.addColorStop(0, adjustHexColor(base, 0.35));
      grad.addColorStop(0.7, base);
      grad.addColorStop(1, adjustHexColor(base, -0.12));
      return grad;
    };

    return {
      labels: STATUS_BUCKETS.map((status) => STATUS_LABELS[status]),
      datasets: [
        {
          label: 'Component count',
          data: STATUS_BUCKETS.map((status) => countsByStatus[status]),
          backgroundColor,
          borderColor: STATUS_BUCKETS.map((status) => adjustHexColor(statusColors[status], 0.2)),
          borderWidth: 2,
          offset: 2,
          hoverOffset: 0,
          circumference: 360,
          rotation: -90,
        },
      ],
    };
  }, [countsByStatus, statusColors]);

  const chartOptions = useMemo<ChartOptions<'doughnut'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      // No hover/selection interactions
      events: [],
      layout: { padding: 12 },
      cutout: '62%',
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 1200,
        easing: 'easeOutElastic',
      },
      elements: {
        arc: {
          borderJoinStyle: 'round',
          borderRadius: 10,
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: false,
        },
        centerText: {
          value: total,
          label: 'Components',
          color: theme.colors['text'],
        } as unknown as object,
        datalabels: {
          display: (context) => {
            const rawValue = context.dataset.data?.[context.dataIndex];
            const value =
              typeof rawValue === 'number'
                ? rawValue
                : Number.parseFloat(typeof rawValue === 'string' ? rawValue : '0');
            return Number.isFinite(value) && value > 0;
          },
          formatter: (value) => {
            const numeric = typeof value === 'number' ? value : Number(value);
            const safeValue = Number.isFinite(numeric) ? Math.round(numeric) : 0;
            return `${safeValue}`;
          },
          color: (context) => {
            const key = (STATUS_BUCKETS[context.dataIndex ?? 0] ?? 'stable') as StatusKey;
            const base = statusColors[key] ?? '#0f172a';
            return pickReadableTextColor(base);
          },
          font: (context) => {
            const meta = context.chart.getDatasetMeta(context.datasetIndex ?? 0);
            const arc = meta?.data?.[context.dataIndex ?? 0] as unknown as {
              outerRadius?: number;
              innerRadius?: number;
            };
            const outer = (arc?.outerRadius as number) ?? 0;
            const inner = (arc?.innerRadius as number) ?? 0;
            const thickness = Math.max(outer - inner, 1);
            // Increase label size while staying within ring thickness
            const size = Math.max(13, Math.min(20, Math.floor(thickness * 0.6)));
            return { weight: 'bold', size };
          },
          anchor: 'center',
          align: 'center',
          offset: 0,
          clamp: true,
        },
      },
    }),
    [statusColors, total, theme],
  );

  const columns: TableColumn<ComponentStatus>[] = [
    { header: 'Component', accessor: 'name', sortable: true },
    { header: 'Category', accessor: 'category', sortable: true },
    { header: 'Status', accessor: 'status', sortable: true },
    { header: 'Slug', accessor: 'slug', sortable: true },
  ];

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography
          variant='h2'
          bold
        >
          Component Status
        </Typography>
        <Panel
          fullWidth
          preset='glassHolder'
        >
          <Stack
            gap={2}
            sx={{ alignItems: 'center' }}
          >
            {/* Custom legend with color swatches */}
            <Stack
              direction='row'
              gap={1}
              sx={{ flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}
            >
              {STATUS_BUCKETS.map((key) => (
                <Stack
                  key={key}
                  direction='row'
                  gap={0.5}
                  sx={{ alignItems: 'center' }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 3,
                      background: statusColors[key],
                      boxShadow: `0 0 0 1px ${hexToRgba(statusColors[key], 0.35)}`,
                      display: 'inline-block',
                    }}
                  />
                  <Typography variant='subtitle'>{STATUS_LABELS[key]}</Typography>
                </Stack>
              ))}
            </Stack>
            <div
              style={{ width: '100%', maxWidth: 520, aspectRatio: '1 / 1', position: 'relative' }}
            >
              <Doughnut
                data={chartData}
                options={chartOptions}
                aria-label='Component status distribution as pie chart'
                role='img'
              />
            </div>
          </Stack>
        </Panel>
        <Panel fullWidth>
          <Table
            data={data}
            columns={columns}
            striped
            hoverable
            dividers
            initialSort={{ index: 1 }}
            constrainHeight
            minConstrainedRows={10}
            maxExpandedRows={30}
          />
        </Panel>
        {null}
      </Stack>
    </Surface>
  );
}
