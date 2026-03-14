import { useState, useEffect, useCallback, useRef } from 'react';
import { reportsAPI } from '../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n ?? 0);
const fmtN = (n) => new Intl.NumberFormat('en-US').format(n ?? 0);
const pct = (n) => `${(n ?? 0).toFixed(1)}%`;

function today() {
    return new Date().toISOString().slice(0, 10);
}
function firstOfMonth() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}
function firstOfYear() {
    return `${new Date().getFullYear()}-01-01`;
}

const PRESETS = [
    { label: 'This Month', from: firstOfMonth, to: today },
    { label: 'This Year', from: firstOfYear, to: today },
    { label: 'All Time', from: () => '', to: () => '' },
];

// ── Tiny inline bar chart ─────────────────────────────────────────────────────
function MiniBarChart({ data, valueKey = 'revenue', labelKey = 'date', height = 120 }) {
    if (!data || data.length === 0)
        return (
            <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
                No data for this period
            </div>
        );

    const max = Math.max(...data.map((d) => d[valueKey]));
    return (
        <div className="flex items-end gap-0.5" style={{ height }}>
            {data.map((d, i) => {
                const h = max > 0 ? Math.max(4, (d[valueKey] / max) * height) : 4;
                return (
                    <div key={i} className="flex-1 flex flex-col items-center group relative">
                        <div
                            className="w-full bg-primary-500 rounded-t-sm transition-all hover:bg-primary-600"
                            style={{ height: h }}
                        />
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 shadow-lg">
                            <p className="font-semibold">{fmt(d[valueKey])}</p>
                            <p className="text-slate-300">{d[labelKey]}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, accent = false, icon }) {
    return (
        <div
            className={`rounded-xl p-5 flex flex-col gap-1 shadow-sm border ${accent
                    ? 'bg-primary-600 text-white border-primary-700'
                    : 'bg-white text-slate-800 border-slate-200'
                }`}
        >
            <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${accent ? 'text-primary-100' : 'text-slate-500'}`}>
                    {label}
                </span>
                {icon && <span className="text-xl">{icon}</span>}
            </div>
            <p className={`text-2xl font-bold tracking-tight ${accent ? 'text-white' : ''}`}>{value}</p>
            {sub && (
                <p className={`text-xs ${accent ? 'text-primary-200' : 'text-slate-400'}`}>{sub}</p>
            )}
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function FinancialReport() {
    const [from, setFrom] = useState(firstOfMonth());
    const [to, setTo] = useState(today());
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const printRef = useRef();

    const load = useCallback(() => {
        setLoading(true);
        setError('');
        const params = {};
        if (from) params.from = from;
        if (to) params.to = to;
        reportsAPI
            .getFinancial(params)
            .then((res) => setReport(res.data))
            .catch((err) => setError(err.response?.data?.error || 'Failed to load report'))
            .finally(() => setLoading(false));
    }, [from, to]);

    useEffect(() => {
        load();
    }, [load]);

    const applyPreset = (preset) => {
        setFrom(preset.from());
        setTo(preset.to());
    };

    const handlePrint = () => {
        window.print();
    };

    const s = report?.summary;
    const inv = report?.inventory;

    // category donut width calculations
    const catTotal = report?.categoryBreakdown?.reduce((a, c) => a + c.revenue, 0) || 1;
    const catColors = [
        '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
        '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#14b8a6',
    ];

    return (
        <div ref={printRef}>
            {/* ── Print style injection ── */}
            <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: fixed; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8 no-print">
                <div>
                    <h1 className="font-display text-2xl font-bold text-slate-900">Financial Report</h1>
                    <p className="text-slate-500 text-sm mt-1">Sales, revenue & profitability overview</p>
                </div>
                <button
                    onClick={handlePrint}
                    className="btn-secondary flex items-center gap-2 self-start"
                >
                    🖨️ Print / Export PDF
                </button>
            </div>

            {/* ── Date Filters ── */}
            <div className="card p-4 mb-6 no-print">
                <div className="flex flex-wrap items-end gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">From</label>
                        <input
                            type="date"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                            className="input text-sm py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">To</label>
                        <input
                            type="date"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            className="input text-sm py-2"
                        />
                    </div>
                    <button onClick={load} className="btn-primary py-2 px-5 text-sm">
                        Apply
                    </button>
                    <div className="flex gap-2 flex-wrap">
                        {PRESETS.map((p) => (
                            <button
                                key={p.label}
                                onClick={() => applyPreset(p)}
                                className="px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
                </div>
            ) : report ? (
                <div id="print-area" className="space-y-6">
                    {/* ── Print header (visible only in print) ── */}
                    <div className="hidden print:block mb-4">
                        <h1 className="text-2xl font-bold">Financial Report</h1>
                        <p className="text-sm text-slate-500">
                            Period:{' '}
                            {report.period.from
                                ? `${report.period.from} → ${report.period.to || 'today'}`
                                : 'All Time'}
                        </p>
                        <hr className="my-3" />
                    </div>

                    {/* ── Period badge ── */}
                    <div className="text-sm text-slate-500 font-medium">
                        📅 Period:{' '}
                        <span className="text-slate-700">
                            {report.period.from
                                ? `${report.period.from}  →  ${report.period.to || 'today'}`
                                : 'All Time'}
                        </span>
                    </div>

                    {/* ── KPI Row 1 — Revenue ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard
                            label="Total Revenue"
                            value={fmt(s?.totalRevenue)}
                            sub={`${fmtN(s?.totalOrders)} orders`}
                            accent
                            icon="💰"
                        />
                        <KpiCard
                            label="Gross Profit"
                            value={fmt(s?.grossProfit)}
                            sub={`Margin: ${pct(s?.grossMargin)}`}
                            icon="📈"
                        />
                        <KpiCard
                            label="Avg Order Value"
                            value={fmt(s?.avgOrderValue)}
                            sub={`${fmtN(s?.unitsSold)} units sold`}
                            icon="🛒"
                        />
                        <KpiCard
                            label="Cost of Goods"
                            value={fmt(s?.cogs)}
                            sub={`Discount: ${fmt(s?.totalDiscount)}`}
                            icon="📦"
                        />
                    </div>

                    {/* ── KPI Row 2 — Inventory ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        <KpiCard
                            label="Inventory Cost Value"
                            value={fmt(inv?.inventoryValue)}
                            sub={`${fmtN(inv?.totalProducts)} products`}
                            icon="🏭"
                        />
                        <KpiCard
                            label="Inventory Retail Value"
                            value={fmt(inv?.retailValue)}
                            sub="At current selling prices"
                            icon="🏷️"
                        />
                        <KpiCard
                            label="Potential Gross Profit"
                            value={fmt((inv?.retailValue ?? 0) - (inv?.inventoryValue ?? 0))}
                            sub="If all inventory is sold"
                            icon="✨"
                        />
                    </div>

                    {/* ── Charts Row ── */}
                    <div className="grid lg:grid-cols-2 gap-6">
                        {/* Revenue Trend */}
                        <div className="card p-5">
                            <h2 className="font-semibold text-slate-800 mb-1">Revenue Trend</h2>
                            <p className="text-xs text-slate-400 mb-4">
                                {report.dailyTrend?.length > 31
                                    ? 'Monthly view'
                                    : 'Daily view'}
                            </p>
                            <MiniBarChart
                                data={
                                    report.dailyTrend?.length > 60
                                        ? report.monthlyTrend?.map((d) => ({ ...d, date: d.label }))
                                        : report.dailyTrend
                                }
                                valueKey="revenue"
                                labelKey="date"
                                height={140}
                            />
                        </div>

                        {/* Category Breakdown */}
                        <div className="card p-5">
                            <h2 className="font-semibold text-slate-800 mb-4">Revenue by Category</h2>
                            {report.categoryBreakdown?.length === 0 ? (
                                <p className="text-slate-400 text-sm text-center py-8">No data</p>
                            ) : (
                                <div className="space-y-3">
                                    {report.categoryBreakdown?.map((cat, i) => {
                                        const share = (cat.revenue / catTotal) * 100;
                                        return (
                                            <div key={cat.category_name}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="font-medium text-slate-700">{cat.category_name}</span>
                                                    <span className="text-slate-500">
                                                        {fmt(cat.revenue)} <span className="text-xs text-slate-400">({pct(share)})</span>
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all"
                                                        style={{
                                                            width: `${share}%`,
                                                            backgroundColor: catColors[i % catColors.length],
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Profit & Loss Summary ── */}
                    <div className="card p-5">
                        <h2 className="font-semibold text-slate-800 mb-4">Profit & Loss Summary</h2>
                        <div className="divide-y divide-slate-100">
                            {[
                                { label: 'Gross Revenue', value: s?.totalRevenue, cls: 'text-slate-900 font-semibold' },
                                { label: '− Discounts Given', value: -(s?.totalDiscount ?? 0), cls: 'text-red-600' },
                                { label: '+ Tax Collected', value: s?.totalTax, cls: 'text-slate-700' },
                                { label: '= Net Revenue', value: (s?.totalRevenue ?? 0) - (s?.totalDiscount ?? 0) + (s?.totalTax ?? 0), cls: 'text-slate-900 font-semibold border-t-2 border-slate-300 pt-1' },
                                { label: '− Cost of Goods Sold (COGS)', value: -(s?.cogs ?? 0), cls: 'text-red-600' },
                                { label: '= Gross Profit', value: s?.grossProfit, cls: 'text-emerald-700 font-bold text-base border-t-2 border-slate-300 pt-1' },
                            ].map((row, i) => (
                                <div key={i} className={`flex justify-between items-center py-2.5 ${row.cls}`}>
                                    <span className="text-sm">{row.label}</span>
                                    <span className={`text-sm tabular-nums ${row.value < 0 ? 'text-red-600' : ''}`}>
                                        {fmt(row.value)}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                            <p className="text-xs text-slate-500">
                                Gross Margin:{' '}
                                <strong className={s?.grossMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                                    {pct(s?.grossMargin)}
                                </strong>
                                {' '}· Total Units Sold:{' '}
                                <strong className="text-slate-700">{fmtN(s?.unitsSold)}</strong>
                                {' '}· Total Orders:{' '}
                                <strong className="text-slate-700">{fmtN(s?.totalOrders)}</strong>
                            </p>
                        </div>
                    </div>

                    {/* ── Top Products ── */}
                    <div className="card overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="font-semibold text-slate-800">Top 10 Products by Revenue</h2>
                            <span className="text-xs text-slate-400">Gross profit per product</span>
                        </div>
                        {report.topProducts?.length === 0 ? (
                            <p className="p-8 text-center text-slate-400 text-sm">No sales in this period</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[600px]">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">#</th>
                                            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Product</th>
                                            <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Units Sold</th>
                                            <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Revenue</th>
                                            <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">COGS</th>
                                            <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Gross Profit</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.topProducts?.map((p, i) => (
                                            <tr
                                                key={p.product_id}
                                                className="border-t border-slate-100 hover:bg-slate-50 transition-colors"
                                            >
                                                <td className="px-6 py-3 text-slate-400 text-sm">{i + 1}</td>
                                                <td className="px-6 py-3 font-medium text-slate-900">{p.product_name}</td>
                                                <td className="px-6 py-3 text-right text-slate-600">{fmtN(p.unitsSold)}</td>
                                                <td className="px-6 py-3 text-right font-medium text-slate-900">{fmt(p.revenue)}</td>
                                                <td className="px-6 py-3 text-right text-red-600">{fmt(p.cogs)}</td>
                                                <td className="px-6 py-3 text-right">
                                                    <span
                                                        className={`font-semibold ${p.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
                                                            }`}
                                                    >
                                                        {fmt(p.grossProfit)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* ── Daily trend table (compact) ── */}
                    {report.dailyTrend?.length > 0 && (
                        <div className="card overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100">
                                <h2 className="font-semibold text-slate-800">Daily Sales Breakdown</h2>
                            </div>
                            <div className="overflow-x-auto max-h-72 overflow-y-auto">
                                <table className="w-full min-w-[400px]">
                                    <thead className="bg-slate-50 sticky top-0">
                                        <tr>
                                            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                                            <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Orders</th>
                                            <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...report.dailyTrend].reverse().map((d) => (
                                            <tr key={d.date} className="border-t border-slate-100 hover:bg-slate-50">
                                                <td className="px-6 py-2.5 text-sm text-slate-700">{d.date}</td>
                                                <td className="px-6 py-2.5 text-right text-sm text-slate-500">{d.orders}</td>
                                                <td className="px-6 py-2.5 text-right text-sm font-medium text-emerald-600">{fmt(d.revenue)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ── Footer ── */}
                    <p className="text-xs text-slate-400 text-right pb-2">
                        Generated: {new Date().toLocaleString()} · Shop Manager Financial Report
                    </p>
                </div>
            ) : null}
        </div>
    );
}
