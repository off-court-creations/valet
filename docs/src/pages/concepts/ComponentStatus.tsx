// ─────────────────────────────────────────────────────────────
// src/pages/concepts/ComponentStatus.tsx  | valet-docs
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
import type { Chart, ChartOptions, LegendItem } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import NavDrawer from '../../components/NavDrawer';
import type { DocMeta } from '../../types';
import {
  COMPONENTS_STATUS,
  sortComponents,
  type ComponentStatus,
} from '../../data/componentsStatus';

const STATUS_BUCKETS = ['golden', 'stable', 'experimental', 'unstable', 'deprecated'] as const;

type StatusKey = (typeof STATUS_BUCKETS)[number];

const STATUS_LABELS: Record<StatusKey, string> = {
  golden: 'Golden',
  stable: 'Stable',
  experimental: 'Experimental',
  unstable: 'Unstable',
  deprecated: 'Deprecated',
};

ChartJS.register(ArcElement, Legend, ChartDataLabels);

function legendLabelsWithCounts(chart: Chart): LegendItem[] {
  const generator = ChartJS.defaults.plugins.legend.labels.generateLabels;
  const baseLabels = (typeof generator === 'function' ? generator(chart) : []) as LegendItem[];

  return baseLabels
    .filter((labelItem) => typeof labelItem.index === 'number')
    .map((labelItem) => {
      const datasetIndex = typeof labelItem.datasetIndex === 'number' ? labelItem.datasetIndex : 0;
      const dataIndex = labelItem.index ?? 0;
      const dataset = chart.data.datasets?.[datasetIndex];
      const rawValue = dataset?.data?.[dataIndex];
      const numericValue =
        typeof rawValue === 'number'
          ? rawValue
          : Number.parseFloat(typeof rawValue === 'string' ? rawValue : '0');

      const safeValue = Number.isFinite(numericValue) ? Math.round(numericValue) : 0;

      return {
        ...labelItem,
        text: `${labelItem.text} (${safeValue})`,
      };
    });
}

function pickReadableTextColor(hex: string): string {
  const normalized = hex.startsWith('#') ? hex.slice(1) : hex;
  if (normalized.length !== 6) return 'rgba(15, 23, 42, 0.88)';

  const r = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const g = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const b = Number.parseInt(normalized.slice(4, 6), 16) / 255;

  const toLinear = (value: number) =>
    value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);

  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

  return luminance > 0.55 ? 'rgba(15, 23, 42, 0.88)' : '#ffffff';
}

function resolveSliceColor(datasetColor: unknown, dataIndex: number): string {
  if (Array.isArray(datasetColor)) {
    const value = datasetColor[dataIndex];
    return typeof value === 'string' ? value : '#334155';
  }
  return typeof datasetColor === 'string' ? datasetColor : '#334155';
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

function resolveStatusColor(colors: Record<string, string>, status: StatusKey): string {
  const directKey = `status.${status}`;
  if (colors[directKey]) return colors[directKey];

  const primary = colors['primary'] ?? '#0E65C0';
  const secondary = colors['secondary'] ?? '#45706C';
  const tertiary = colors['tertiary'] ?? '#C0E6FF';
  const error = colors['error'] ?? '#D32F2F';
  const backgroundAlt = colors['backgroundAlt'] ?? '#363636';

  switch (status) {
    case 'golden':
      return adjustHexColor(primary, 0.35);
    case 'stable':
      return secondary;
    case 'experimental':
      return adjustHexColor(tertiary, -0.15);
    case 'unstable':
      return adjustHexColor(error, 0.05);
    case 'deprecated':
      return adjustHexColor(backgroundAlt, -0.2);
    default:
      return '#334155';
  }
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

  const chartData = useMemo(() => {
    return {
      labels: STATUS_BUCKETS.map((status) => STATUS_LABELS[status]),
      datasets: [
        {
          label: 'Component count',
          data: STATUS_BUCKETS.map((status) => countsByStatus[status]),
          backgroundColor: STATUS_BUCKETS.map((status) => statusColors[status]),
          borderWidth: 0,
        },
      ],
    };
  }, [countsByStatus, statusColors]);

  const chartOptions = useMemo<ChartOptions<'pie'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      events: ['click'],
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 16,
            generateLabels: (chart) => legendLabelsWithCounts(chart),
          },
        },
        tooltip: {
          enabled: false,
        },
        datalabels: {
          display: (context) => {
            const rawValue = context.dataset.data?.[context.dataIndex];
            const value =
              typeof rawValue === 'number'
                ? rawValue
                : Number.parseFloat(typeof rawValue === 'string' ? rawValue : '0');
            return Number.isFinite(value) && value > 0;
          },
          formatter: (value, context) => {
            const numeric = typeof value === 'number' ? value : Number(value);
            const safeValue = Number.isFinite(numeric) ? Math.round(numeric) : 0;
            const status = STATUS_BUCKETS[context.dataIndex] ?? 'stable';
            const label = STATUS_LABELS[status] ?? 'Status';
            return `${label}\n${safeValue}`;
          },
          color: (context) => {
            const datasetColor = context.dataset.backgroundColor;
            const sliceColor = resolveSliceColor(datasetColor, context.dataIndex);
            return pickReadableTextColor(sliceColor);
          },
          font: {
            weight: 700,
            size: 14,
          },
          clamp: true,
          textAlign: 'center',
        },
      },
    }),
    [],
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
        <Typography>
          This page reflects the status declared in each component&apos;s <code>*.meta.json</code>{' '}
          sidecar. It is also embedded into the MCP data so external tools can reason about
          stability.
        </Typography>
        <Panel fullWidth>
          <Stack
            gap={2}
            sx={{ alignItems: 'center' }}
          >
            <Typography variant='h3'>Status Distribution</Typography>
            <div
              style={{ width: '100%', maxWidth: 420, aspectRatio: '1 / 1', position: 'relative' }}
            >
              <Pie
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
          />
        </Panel>
        {null}
      </Stack>
    </Surface>
  );
}
