import { useState, useEffect, useMemo, useRef } from 'react';
import { salesAPI, productsAPI, customersAPI } from '../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => `$${parseFloat(n || 0).toFixed(2)}`;
const fmtDate = (d) =>
  new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const PAYMENT_METHODS = ['cash', 'card', 'transfer', 'other'];
const METHOD_ICONS = { cash: '💵', card: '💳', transfer: '🏦', other: '🔖' };

function PaymentStatusBadge({ status }) {
  const cfg = {
    paid: { label: 'Paid', cls: 'bg-emerald-100 text-emerald-700' },
    partial: { label: 'Partial', cls: 'bg-amber-100 text-amber-700' },
    unpaid: { label: 'Unpaid', cls: 'bg-red-100 text-red-700' },
  };
  const { label, cls } = cfg[status] || cfg.paid;
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
  );
}

// ── Print receipt helper ──────────────────────────────────────────────────────
function printReceipt(sale) {
  const subtotal = (sale.items || []).reduce((s, i) => s + parseFloat(i.subtotal), 0);
  const balanceDue = Math.max(0, parseFloat(sale.total_amount) - parseFloat(sale.amount_paid || 0));
  const w = window.open('', '_blank', 'width=400,height=650');
  w.document.write(`
    <html><head><title>Receipt ${sale.sale_number}</title>
    <style>
      body{font-family:monospace;font-size:13px;padding:20px;max-width:320px;margin:0 auto}
      h2{text-align:center;margin-bottom:2px}
      p{text-align:center;margin:2px 0;color:#555}
      hr{border:none;border-top:1px dashed #999;margin:10px 0}
      table{width:100%}td{padding:2px 0}.right{text-align:right}
      .bold{font-weight:bold}.total{font-size:15px;font-weight:bold}
      .balance{color:#e53e3e;font-weight:bold;font-size:14px}
      .paid-stamp{text-align:center;font-size:20px;font-weight:bold;color:#38a169;margin:8px 0;letter-spacing:2px}
      .footer{text-align:center;margin-top:12px;color:#888;font-size:11px}
    </style></head><body>
    <h2>SHOP MANAGER</h2><p>Receipt</p>
    <p>${fmtDate(sale.created_at)}</p>
    <p>Sale #: ${sale.sale_number}</p>
    <p>Customer: ${sale.customer_name || 'Walk-in'}</p>
    <hr/>
    <table>
      ${(sale.items || []).map(i => `
        <tr><td>${i.product_name}</td></tr>
        <tr><td>${i.quantity} × ${fmt(i.unit_price)}</td><td class="right">${fmt(i.subtotal)}</td></tr>
      `).join('')}
    </table>
    <hr/>
    <table>
      <tr><td>Subtotal</td><td class="right">${fmt(subtotal)}</td></tr>
      ${parseFloat(sale.discount) > 0 ? `<tr><td>Discount</td><td class="right">-${fmt(sale.discount)}</td></tr>` : ''}
      ${parseFloat(sale.tax) > 0 ? `<tr><td>Tax</td><td class="right">+${fmt(sale.tax)}</td></tr>` : ''}
      <tr class="total"><td>TOTAL</td><td class="right">${fmt(sale.total_amount)}</td></tr>
      <tr><td>Amount Paid</td><td class="right">${fmt(sale.amount_paid)}</td></tr>
      ${balanceDue > 0 ? `<tr class="balance"><td>BALANCE DUE</td><td class="right">${fmt(balanceDue)}</td></tr>` : ''}
    </table>
    ${sale.payment_status === 'paid' ? '<div class="paid-stamp">✓ PAID IN FULL</div>' : ''}
    <hr/>
    ${sale.notes ? `<p>Note: ${sale.notes}</p>` : ''}
    <div class="footer">Thank you for your purchase!</div>
    </body></html>
  `);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); w.close(); }, 300);
}

// ── Receipt Modal (post-sale) ─────────────────────────────────────────────────
function ReceiptModal({ sale, onClose }) {
  if (!sale) return null;
  const subtotal = (sale.items || []).reduce((s, i) => s + parseFloat(i.subtotal), 0);
  const balanceDue = Math.max(0, parseFloat(sale.total_amount) - parseFloat(sale.amount_paid || 0));

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className={`text-white rounded-t-2xl px-6 py-5 text-center ${balanceDue > 0 ? 'bg-amber-500' : 'bg-emerald-600'}`}>
          <div className="text-3xl mb-1">{balanceDue > 0 ? '⏳' : '✅'}</div>
          <h2 className="text-lg font-bold">{balanceDue > 0 ? 'Partial Payment Recorded' : 'Sale Complete!'}</h2>
          <p className="text-white/75 text-sm">{sale.sale_number}</p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex justify-between text-sm text-slate-500">
            <span>{fmtDate(sale.created_at)}</span>
            <span className="font-medium text-slate-700">{sale.customer_name || 'Walk-in'}</span>
          </div>

          {/* Items */}
          <div className="border border-slate-100 rounded-xl divide-y divide-slate-100">
            {(sale.items || []).map((item, i) => (
              <div key={i} className="flex justify-between items-center px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.product_name}</p>
                  <p className="text-xs text-slate-400">{item.quantity} × {fmt(item.unit_price)}</p>
                </div>
                <span className="text-sm font-semibold">{fmt(item.subtotal)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
            {parseFloat(sale.discount) > 0 && <div className="flex justify-between text-red-500"><span>Discount</span><span>−{fmt(sale.discount)}</span></div>}
            {parseFloat(sale.tax) > 0 && <div className="flex justify-between text-slate-500"><span>Tax</span><span>+{fmt(sale.tax)}</span></div>}
            <div className="flex justify-between font-bold text-slate-900 border-t pt-2 text-base"><span>Total</span><span>{fmt(sale.total_amount)}</span></div>
            <div className="flex justify-between text-emerald-600 font-semibold"><span>Amount Paid</span><span>{fmt(sale.amount_paid)}</span></div>
            {balanceDue > 0 && (
              <div className="flex justify-between font-bold text-amber-600 text-base bg-amber-50 rounded-lg px-3 py-2">
                <span>Balance Due</span><span>{fmt(balanceDue)}</span>
              </div>
            )}
          </div>

          {sale.notes && <p className="text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2">📝 {sale.notes}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={() => printReceipt(sale)} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors">
            🖨️ Print Receipt
          </button>
          <button onClick={onClose} className={`flex-1 py-3 rounded-xl text-white text-sm font-medium transition-colors ${balanceDue > 0 ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Payment Modal ─────────────────────────────────────────────────────────
function AddPaymentModal({ sale, onClose, onSuccess }) {
  const balanceDue = Math.max(0, parseFloat(sale.total_amount) - parseFloat(sale.amount_paid || 0));
  const [amount, setAmount] = useState(balanceDue.toFixed(2));
  const [method, setMethod] = useState('cash');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setError('Enter a valid amount'); return; }
    if (amt > balanceDue) { setError(`Cannot exceed balance due (${fmt(balanceDue)})`); return; }
    setSaving(true);
    setError('');
    try {
      const res = await salesAPI.addPayment(sale.id, { amount: amt, method, note });
      onSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900">Record Payment</h3>
            <p className="text-xs text-slate-400">{sale.sale_number}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Balance due info */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex justify-between items-center">
            <span className="text-sm text-amber-700 font-medium">Balance Due</span>
            <span className="text-lg font-bold text-amber-700">{fmt(balanceDue)}</span>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Amount to Pay *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
              <input
                type="number"
                min="0.01"
                max={balanceDue}
                step="0.01"
                className="input pl-7"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                required
              />
            </div>
            {/* Quick amount buttons */}
            <div className="flex gap-2 mt-2 flex-wrap">
              {[balanceDue * 0.25, balanceDue * 0.5, balanceDue].map((v, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setAmount(v.toFixed(2))}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                >
                  {i === 2 ? 'Full' : `${i === 0 ? '25%' : '50%'}`} — {fmt(v)}
                </button>
              ))}
            </div>
          </div>

          {/* Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Payment Method</label>
            <div className="grid grid-cols-4 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-xs capitalize transition-all ${method === m
                      ? 'border-primary-400 bg-primary-50 text-primary-700 font-semibold'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                >
                  <span className="text-base">{METHOD_ICONS[m]}</span>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Note (optional)</label>
            <input
              className="input text-sm"
              placeholder="e.g. Bank transfer ref #123"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold transition-colors">
              {saving ? 'Saving…' : 'Record Payment'}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Sale Detail Drawer ────────────────────────────────────────────────────────
function SaleDrawer({ sale: initialSale, onClose, onSaleUpdated }) {
  const [sale, setSale] = useState(initialSale);
  const [addingPayment, setAddingPayment] = useState(false);

  const balanceDue = Math.max(0, parseFloat(sale.total_amount) - parseFloat(sale.amount_paid || 0));
  const subtotal = (sale.items || []).reduce((s, i) => s + parseFloat(i.subtotal), 0);

  const handlePaymentSuccess = (updated) => {
    setSale(updated);
    setAddingPayment(false);
    onSaleUpdated?.(updated);
  };

  return (
    <>
      {addingPayment && (
        <AddPaymentModal
          sale={sale}
          onClose={() => setAddingPayment(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      <div className="fixed inset-0 bg-black/50 flex justify-end z-50" onClick={onClose}>
        <div
          className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900">{sale.sale_number}</h3>
                <PaymentStatusBadge status={sale.payment_status} />
              </div>
              <p className="text-xs text-slate-400">{fmtDate(sale.created_at)}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 text-lg">✕</button>
          </div>

          {/* Customer */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                {sale.customer_name ? sale.customer_name[0].toUpperCase() : '?'}
              </div>
              <div>
                <p className="font-medium text-slate-800">{sale.customer_name || 'Walk-in Customer'}</p>
                {sale.customer_email && <p className="text-xs text-slate-400">{sale.customer_email}</p>}
                {sale.customer_phone && <p className="text-xs text-slate-400">{sale.customer_phone}</p>}
              </div>
            </div>
          </div>

          <div className="flex-1 px-6 py-4 space-y-5">
            {/* Items */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Items</p>
              <div className="space-y-1">
                {(sale.items || []).map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2.5 border-b border-slate-100">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{item.product_name}</p>
                      <p className="text-xs text-slate-400">{item.quantity} × {fmt(item.unit_price)}</p>
                    </div>
                    <span className="text-sm font-semibold">{fmt(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-1.5 text-sm bg-slate-50 rounded-xl p-4">
              <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
              {parseFloat(sale.discount) > 0 && <div className="flex justify-between text-red-500"><span>Discount</span><span>−{fmt(sale.discount)}</span></div>}
              {parseFloat(sale.tax) > 0 && <div className="flex justify-between text-slate-500"><span>Tax</span><span>+{fmt(sale.tax)}</span></div>}
              <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-2 text-base"><span>Total</span><span>{fmt(sale.total_amount)}</span></div>
              <div className="flex justify-between text-emerald-600 font-semibold"><span>Paid</span><span>{fmt(sale.amount_paid)}</span></div>
              {balanceDue > 0 && (
                <div className="flex justify-between font-bold text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-1">
                  <span>Balance Due</span><span>{fmt(balanceDue)}</span>
                </div>
              )}
            </div>

            {/* Payment history */}
            {(sale.payments || []).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Payment History</p>
                <div className="space-y-2">
                  {sale.payments.map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{METHOD_ICONS[p.method] || '💰'}</span>
                        <div>
                          <p className="text-sm font-medium text-slate-700 capitalize">{p.method}</p>
                          <p className="text-xs text-slate-400">
                            {p.created_at ? fmtDate(p.created_at) : '—'}
                            {p.note && ` · ${p.note}`}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-emerald-600">+{fmt(p.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sale.notes && (
              <p className="text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2">📝 {sale.notes}</p>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t border-slate-100 space-y-2">
            {balanceDue > 0 && (
              <button
                onClick={() => setAddingPayment(true)}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                💳 Record Payment · {fmt(balanceDue)} Due
              </button>
            )}
            <button
              onClick={() => printReceipt(sale)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors"
            >
              🖨️ Print Receipt
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main Sales Page ───────────────────────────────────────────────────────────
export default function Sales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // POS
  const [posOpen, setPosOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState('');
  const [tax, setTax] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountTendered, setAmountTendered] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [receiptSale, setReceiptSale] = useState(null);

  // History
  const [historySearch, setHistorySearch] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [drawerSale, setDrawerSale] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  const searchRef = useRef();

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadSales = () =>
    salesAPI.getAll().then((r) => setSales(r.data)).catch(console.error);

  useEffect(() => {
    setLoading(true);
    Promise.all([salesAPI.getAll(), productsAPI.getAll(), customersAPI.getAll()])
      .then(([s, p, c]) => { setSales(s.data); setProducts(p.data); setCustomers(c.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ── POS ───────────────────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase();
    return products.filter(
      (p) => p.stock_quantity > 0 &&
        (p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q))
    );
  }, [products, productSearch]);

  const addToCart = (product) => {
    setCart((c) => {
      const ex = c.find((x) => x.product_id === product.id);
      if (ex) {
        if (ex.quantity >= product.stock_quantity) return c;
        return c.map((x) =>
          x.product_id === product.id ? { ...x, quantity: x.quantity + 1 } : x
        );
      }
      return [...c, {
        product_id: product.id,
        product_name: product.name,
        unit_price: parseFloat(product.price),
        quantity: 1,
        max_stock: product.stock_quantity,
      }];
    });
  };

  const updateQty = (productId, qty) => {
    const n = Math.max(0, parseInt(qty) || 0);
    setCart((c) => {
      const item = c.find((x) => x.product_id === productId);
      if (!item) return c;
      if (n === 0) return c.filter((x) => x.product_id !== productId);
      return c.map((x) =>
        x.product_id === productId ? { ...x, quantity: Math.min(n, item.max_stock) } : x
      );
    });
  };

  const removeFromCart = (id) => setCart((c) => c.filter((x) => x.product_id !== id));

  const subtotalAmt = cart.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const discountAmt = parseFloat(discount) || 0;
  const taxAmt = parseFloat(tax) || 0;
  const totalAmount = Math.max(0, subtotalAmt - discountAmt + taxAmt);
  const tendered = parseFloat(amountTendered) || 0;
  const changeDue = Math.max(0, tendered - totalAmount);
  const balanceDue = tendered > 0 ? Math.max(0, totalAmount - tendered) : 0;
  const isPartial = tendered > 0 && tendered < totalAmount;
  const isOverpaying = tendered > totalAmount;

  const resetPOS = () => {
    setCart([]); setCustomerId(''); setNotes('');
    setDiscount(''); setTax(''); setProductSearch('');
    setPaymentMethod('cash'); setAmountTendered('');
  };
  const openPOS = () => { resetPOS(); setPosOpen(true); setTimeout(() => searchRef.current?.focus(), 100); };
  const closePOS = () => { setPosOpen(false); resetPOS(); };

  // Auto-fill amount tendered when total changes (only if not partial mode already)
  useEffect(() => {
    if (totalAmount > 0 && !amountTendered) setAmountTendered(totalAmount.toFixed(2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalAmount]);

  const submitSale = async () => {
    if (cart.length === 0) return;
    const amountPaid = tendered > 0 ? Math.min(tendered, totalAmount) : totalAmount;
    setSubmitting(true);
    const items = cart.map((i) => ({
      product_id: i.product_id, quantity: i.quantity,
      unit_price: i.unit_price, subtotal: i.quantity * i.unit_price,
    }));
    try {
      const res = await salesAPI.create({
        items, total_amount: totalAmount, customer_id: customerId || null,
        discount: discountAmt, tax: taxAmt, notes: notes || null,
        amount_paid: amountPaid, payment_method: paymentMethod,
      });
      closePOS();
      loadSales();
      setReceiptSale(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create sale');
    } finally {
      setSubmitting(false);
    }
  };

  // ── History ───────────────────────────────────────────────────────────────
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const q = historySearch.toLowerCase();
      const matchQ = !q || s.sale_number?.toLowerCase().includes(q) || (s.customer_name || '').toLowerCase().includes(q);
      const d = new Date(s.created_at);
      const matchFrom = !historyFrom || d >= new Date(historyFrom);
      const matchTo = !historyTo || d <= new Date(historyTo + 'T23:59:59');
      const matchPmt = !paymentFilter || s.payment_status === paymentFilter;
      return matchQ && matchFrom && matchTo && matchPmt;
    });
  }, [sales, historySearch, historyFrom, historyTo, paymentFilter]);

  const historyRevenue = filteredSales.reduce((s, x) => s + parseFloat(x.total_amount || 0), 0);
  const historyPaid = filteredSales.reduce((s, x) => s + parseFloat(x.amount_paid || 0), 0);
  const historyBalance = filteredSales.reduce((s, x) => s + parseFloat(x.balance_due || 0), 0);
  const partialCount = filteredSales.filter((x) => x.payment_status !== 'paid').length;

  const openDrawer = (sale) => {
    setDrawerLoading(true);
    salesAPI.getById(sale.id)
      .then((r) => setDrawerSale(r.data))
      .catch(console.error)
      .finally(() => setDrawerLoading(false));
  };

  const handleSaleUpdated = (updated) => {
    setSales((prev) => prev.map((s) => s.id === updated.id ? { ...s, ...updated } : s));
    setDrawerSale(updated);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {receiptSale && <ReceiptModal sale={receiptSale} onClose={() => setReceiptSale(null)} />}

      {drawerLoading && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent" />
        </div>
      )}
      {drawerSale && (
        <SaleDrawer
          sale={drawerSale}
          onClose={() => setDrawerSale(null)}
          onSaleUpdated={handleSaleUpdated}
        />
      )}

      {/* ── POS Modal ── */}
      {posOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-stretch p-4">
          <div className="flex flex-col lg:flex-row w-full max-w-5xl mx-auto bg-white rounded-2xl overflow-hidden shadow-2xl">

            {/* LEFT — Products */}
            <div className="flex-1 flex flex-col bg-slate-50 min-h-0">
              <div className="px-5 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
                <h2 className="font-bold text-slate-900 text-lg">🛒 New Sale</h2>
                <button onClick={closePOS} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 text-lg">✕</button>
              </div>
              <div className="px-4 py-3 border-b border-slate-200 bg-white">
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="🔍 Search products…"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="input text-sm"
                />
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {filteredProducts.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm py-12">No products found</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredProducts.map((p) => {
                      const inCart = cart.find((c) => c.product_id === p.id);
                      return (
                        <button
                          key={p.id}
                          onClick={() => addToCart(p)}
                          className={`text-left p-3 rounded-xl border transition-all ${inCart ? 'bg-primary-50 border-primary-300 shadow-sm' : 'bg-white border-slate-200 hover:border-primary-300 hover:shadow-sm'}`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <p className="font-medium text-slate-800 text-sm leading-tight">{p.name}</p>
                            {inCart && <span className="shrink-0 text-xs bg-primary-500 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold">{inCart.quantity}</span>}
                          </div>
                          <div className="flex justify-between items-end mt-1.5">
                            <span className="text-primary-600 font-semibold text-sm">{fmt(p.price)}</span>
                            <span className={`text-xs ${p.stock_quantity <= (p.low_stock_threshold || 10) ? 'text-amber-500' : 'text-slate-400'}`}>Stock: {p.stock_quantity}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT — Cart + Payment */}
            <div className="w-full lg:w-96 flex flex-col border-l border-slate-200 bg-white">
              {/* Customer + Notes */}
              <div className="px-5 py-3 border-b border-slate-100 space-y-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Customer</label>
                  <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="input text-sm py-2">
                    <option value="">Walk-in Customer</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Notes</label>
                  <input className="input text-sm py-2" placeholder="Optional…" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>

              {/* Cart items */}
              <div className="flex-1 overflow-y-auto px-5 py-3">
                {cart.length === 0 ? (
                  <div className="text-center py-10 text-slate-300">
                    <p className="text-4xl mb-2">🛍️</p><p className="text-sm">Add products to begin</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {cart.map((item) => (
                      <div key={item.product_id} className="flex items-center gap-2 py-2 border-b border-slate-100">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{item.product_name}</p>
                          <p className="text-xs text-slate-400">{fmt(item.unit_price)} each</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => updateQty(item.product_id, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm">−</button>
                          <span className="w-7 text-center text-sm font-bold text-slate-800">{item.quantity}</span>
                          <button onClick={() => updateQty(item.product_id, item.quantity + 1)} disabled={item.quantity >= item.max_stock} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-600 font-bold text-sm">+</button>
                        </div>
                        <span className="text-sm font-semibold w-16 text-right">{fmt(item.quantity * item.unit_price)}</span>
                        <button onClick={() => removeFromCart(item.product_id)} className="text-red-400 hover:text-red-600 text-xs ml-1">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Discount & Tax */}
              <div className="px-5 py-3 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Discount ($)</label>
                    <input type="number" min="0" step="0.01" className="input text-sm py-2" placeholder="0.00" value={discount} onChange={(e) => setDiscount(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Tax ($)</label>
                    <input type="number" min="0" step="0.01" className="input text-sm py-2" placeholder="0.00" value={tax} onChange={(e) => setTax(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Payment section */}
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
                {/* Payment method */}
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Payment Method</label>
                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`flex flex-col items-center gap-0.5 py-1.5 rounded-xl border text-xs capitalize transition-all ${paymentMethod === m ? 'border-primary-400 bg-primary-50 text-primary-700 font-semibold' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}
                    >
                      <span>{METHOD_ICONS[m]}</span>{m}
                    </button>
                  ))}
                </div>

                {/* Amount tendered */}
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Amount Tendered</label>
                <div className="relative mb-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={`input pl-7 text-sm py-2 ${isPartial ? 'border-amber-400 bg-amber-50' : ''}`}
                    placeholder={totalAmount.toFixed(2)}
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                  />
                </div>

                {/* Change / Balance feedback */}
                {tendered > 0 && (
                  <div className={`rounded-lg px-3 py-2 text-sm flex justify-between font-semibold mb-2 ${isPartial ? 'bg-amber-100 text-amber-700' :
                      isOverpaying ? 'bg-blue-100 text-blue-700' :
                        'bg-emerald-100 text-emerald-700'
                    }`}>
                    <span>{isPartial ? '⏳ Balance Due' : isOverpaying ? '💵 Change' : '✅ Exact'}</span>
                    <span>{isPartial ? fmt(balanceDue) : isOverpaying ? fmt(changeDue) : 'No change'}</span>
                  </div>
                )}

                {isPartial && (
                  <p className="text-xs text-amber-600 mb-2">Partial payment — remainder will be tracked as balance due.</p>
                )}

                {/* Totals */}
                <div className="space-y-1 text-sm mb-3">
                  <div className="flex justify-between text-slate-500"><span>Total ({cart.length} item{cart.length !== 1 ? 's' : ''})</span><span>{fmt(totalAmount)}</span></div>
                  {discountAmt > 0 && <div className="flex justify-between text-red-500"><span>Discount</span><span>−{fmt(discountAmt)}</span></div>}
                  {taxAmt > 0 && <div className="flex justify-between text-slate-500"><span>Tax</span><span>+{fmt(taxAmt)}</span></div>}
                  <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1.5">
                    <span>Grand Total</span><span className="text-emerald-600">{fmt(totalAmount)}</span>
                  </div>
                </div>

                <button
                  onClick={submitSale}
                  disabled={cart.length === 0 || submitting}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base transition-colors"
                >
                  {submitting ? 'Processing…' : isPartial ? '⏳ Save with Partial Payment' : '✅ Complete Sale'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Sales</h1>
          <p className="text-slate-500 text-sm mt-1">{sales.length} total transactions</p>
        </div>
        <button onClick={openPOS} className="btn-primary flex items-center gap-2">
          <span>+</span> New Sale
        </button>
      </div>

      {/* ── History Filters ── */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input type="text" placeholder="Search sale # or customer…" value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} className="input max-w-xs text-sm py-2" />
        <input type="date" value={historyFrom} onChange={(e) => setHistoryFrom(e.target.value)} className="input w-auto text-sm py-2" />
        <input type="date" value={historyTo} onChange={(e) => setHistoryTo(e.target.value)} className="input w-auto text-sm py-2" />
        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="input w-auto text-sm py-2">
          <option value="">All payments</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="unpaid">Unpaid</option>
        </select>
        {(historySearch || historyFrom || historyTo || paymentFilter) && (
          <button onClick={() => { setHistorySearch(''); setHistoryFrom(''); setHistoryTo(''); setPaymentFilter(''); }} className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">Clear ✕</button>
        )}
      </div>

      {/* ── Summary Strip ── */}
      {filteredSales.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="card p-4">
            <p className="text-xs text-slate-500 mb-1">Transactions</p>
            <p className="text-xl font-bold text-slate-900">{filteredSales.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-slate-500 mb-1">Total Revenue</p>
            <p className="text-xl font-bold text-slate-900">{fmt(historyRevenue)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-slate-500 mb-1">Amount Collected</p>
            <p className="text-xl font-bold text-emerald-600">{fmt(historyPaid)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-slate-500 mb-1">Outstanding Balance</p>
            <p className={`text-xl font-bold ${historyBalance > 0 ? 'text-amber-600' : 'text-slate-400'}`}>{fmt(historyBalance)}</p>
            {partialCount > 0 && <p className="text-xs text-amber-500 mt-0.5">{partialCount} unpaid/partial</p>}
          </div>
        </div>
      )}

      {/* ── Sales Table ── */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Sales History</h2>
          {filteredSales.length !== sales.length && (
            <span className="text-xs text-slate-400">{filteredSales.length} of {sales.length} shown</span>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent mx-auto" /></div>
        ) : filteredSales.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-3xl mb-2">🕵️</p>
            <p className="text-sm">{sales.length === 0 ? 'No sales yet. Create your first one!' : 'No sales match your filters.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[640px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Sale #</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Paid</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Balance</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="border-t border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => openDrawer(sale)}
                  >
                    <td className="px-6 py-3.5">
                      <span className="font-mono text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">{sale.sale_number}</span>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-700">
                      {sale.customer_name || <span className="text-slate-400 italic">Walk-in</span>}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-500">
                      {new Date(sale.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-3.5 text-right font-semibold text-slate-800">{fmt(sale.total_amount)}</td>
                    <td className="px-6 py-3.5 text-right text-emerald-600 font-semibold">{fmt(sale.amount_paid)}</td>
                    <td className="px-6 py-3.5 text-right">
                      {parseFloat(sale.balance_due) > 0
                        ? <span className="text-amber-600 font-semibold">{fmt(sale.balance_due)}</span>
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <PaymentStatusBadge status={sale.payment_status} />
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span className="text-primary-500 text-sm">View →</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
