import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI
      .getStats()
      .then((res) => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  const cards = [
    {
      label: 'Total Products',
      value: stats.totalProducts,
      icon: '📦',
      color: 'bg-primary-500',
      link: '/inventory',
    },
    {
      label: 'Total Sales',
      value: stats.totalSales,
      icon: '🛒',
      color: 'bg-emerald-500',
      link: '/sales',
    },
    {
      label: 'Low Stock Items',
      value: stats.lowStockCount,
      icon: '⚠️',
      color: 'bg-amber-500',
      link: '/inventory?lowStock=true',
    },
    {
      label: 'Total Revenue',
      value: `$${parseFloat(stats.totalRevenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: '💰',
      color: 'bg-violet-500',
    },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-slate-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.link || '#'}
            className={`card p-6 flex items-center gap-4 hover:shadow-md transition-shadow ${!card.link ? 'cursor-default' : ''}`}
          >
            <div className={`w-14 h-14 rounded-xl ${card.color} flex items-center justify-center text-2xl`}>
              {card.icon}
            </div>
            <div>
              <p className="text-slate-500 text-sm">{card.label}</p>
              <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="card">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">Recent Transactions</h2>
          </div>
          <div className="divide-y divide-slate-100 max-h-80 overflow-auto">
            {stats.recentTransactions.length === 0 ? (
              <p className="p-6 text-slate-500 text-center">No sales yet</p>
            ) : (
              stats.recentTransactions.map((sale) => (
                <Link
                  key={sale.id}
                  to={`/sales?view=${sale.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50"
                >
                  <div>
                    <p className="font-medium text-slate-900">{sale.sale_number}</p>
                    <p className="text-sm text-slate-500">
                      {sale.customer_name || 'Walk-in'} •{' '}
                      {new Date(sale.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="font-semibold text-emerald-600">
                    ${parseFloat(sale.total_amount).toFixed(2)}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="font-semibold text-slate-900">Low Stock Alerts</h2>
            <Link to="/inventory?lowStock=true" className="text-sm text-primary-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-slate-100 max-h-80 overflow-auto">
            {stats.lowStockProducts.length === 0 ? (
              <p className="p-6 text-slate-500 text-center">All products are well stocked</p>
            ) : (
              stats.lowStockProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="font-medium text-slate-900">{p.name}</p>
                    {p.sku && <p className="text-sm text-slate-500">{p.sku}</p>}
                  </div>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                    {p.stock_quantity} / {p.low_stock_threshold}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
