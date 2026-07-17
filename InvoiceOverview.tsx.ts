import { useState, useEffect, useMemo, useCallback } from 'react';
import type { CSSProperties } from 'react';
import {
  ArrowLeft,
  Search,
  FileText,
  Pencil,
  Trash2,
  Eye,
  Calendar,
  User,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { IconBadge } from './IconBadge';

const COLORS = {
  navy: '#12303A',
  invoice: '#8E44AD',
  invoiceTint: '#F4ECF7',
  bgApp: '#F7F5F2',
  border: '#E5E1DC',
  success: '#1F9D6B',
  successTint: '#E8F6F0',
  danger: '#E5533D',
  dangerTint: '#FDEDE9',
  muted: '#6B7B8A',
};

const latinFont: CSSProperties = { fontFamily: "'Inter', sans-serif" };
const INLINE = 20 as const;
const ACTION = 28 as const;

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string | null;
  total_amount: number;
  status: 'paid' | 'pending' | 'cancelled';
  created_at: string;
}

interface Props {
  lang: 'KH' | 'EN';
  onBack: () => void;
  onEditInvoice: (invoiceId: string) => void;
  onPreviewInvoice: (invoiceId: string) => void;
  onCreateInvoice: () => void;
}

function fmtMoney(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function InvoiceOverview({
  lang,
  onBack,
  onEditInvoice,
  onPreviewInvoice,
  onCreateInvoice,
}: Props) {
  const tr = (kh: string, en: string) => (lang === 'KH' ? kh : en);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('invoices')
      .select('id, invoice_number, customer_name, total_amount, status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch invoices:', error);
      setInvoices([]);
    } else {
      setInvoices((data as Invoice[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const filteredInvoices = useMemo(() => {
    if (!search.trim()) return invoices;
    const q = search.trim().toLowerCase();
    return invoices.filter(
      (inv) =>
        inv.invoice_number.toLowerCase().includes(q) ||
        (inv.customer_name && inv.customer_name.toLowerCase().includes(q))
    );
  }, [invoices, search]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    const { error } = await supabase.from('invoices').delete().eq('id', deleteTarget.id);
    setDeleteBusy(false);
    if (error) {
      console.error('Delete invoice failed:', error);
      return;
    }
    setDeleteTarget(null);
    fetchInvoices();
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: COLORS.bgApp }}>
      {/* Header */}
      <div
        className="px-4 pt-4 pb-4 flex items-center gap-3"
        style={{ background: `linear-gradient(135deg, ${COLORS.navy} 0%, #1A4453 100%)` }}
      >
        <button
          onClick={onBack}
          className="flex items-center justify-center"
          style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)' }}
        >
          <ArrowLeft size={INLINE} color="#FFFFFF" strokeWidth={2} />
        </button>
        <div className="flex-1">
          <p className="text-white font-bold text-base">{tr('ទិដ្ឋភាពវិក្កយបត្រ', 'Invoice Overview')}</p>
          <p className="text-white/70 text-xs">{tr('រាល់វិក្កយបត្រទាំងអស់', 'All your invoices')}</p>
        </div>
        <button
          onClick={onCreateInvoice}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-sm"
          style={{ backgroundColor: '#FFFFFF', color: COLORS.invoice }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
          {tr('បង្កើតថ្មី', 'New')}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-3.5 pb-24 -mt-2">
        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 rounded-xl border bg-white mb-4"
          style={{ borderColor: COLORS.border }}
        >
          <Search size={16} color={COLORS.muted} strokeWidth={2} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tr('ស្វែងរកវិក្កយបត្រ...', 'Search invoices...')}
            className="flex-1 py-2.5 text-sm outline-none bg-transparent"
            style={{ color: COLORS.navy }}
          />
        </div>

        {/* List */}
        <div className="space-y-2.5">
          {loading && (
            <p className="text-xs text-center py-6" style={{ color: COLORS.muted }}>
              {tr('កំពុងផ្ទុក...', 'Loading...')}
            </p>
          )}
          {!loading && filteredInvoices.length === 0 && (
            <div className="text-center py-10">
              <IconBadge icon={FileText} size={ACTION} tint="invoice" shape="rounded" className="mx-auto" />
              <p className="text-xs mt-3" style={{ color: COLORS.muted }}>
                {tr('មិនទាន់មានវិក្កយបត្រនៅឡើយទេ', 'No invoices yet')}
              </p>
            </div>
          )}
          {filteredInvoices.map((inv) => {
            const dateStr = new Date(inv.created_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={inv.id}
                className="bg-white rounded-2xl border overflow-hidden"
                style={{ borderColor: COLORS.border }}
              >
                <div className="p-3.5">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <IconBadge icon={FileText} size={INLINE} tint="invoice" shape="rounded" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: COLORS.navy }}>
                          {inv.invoice_number}
                        </p>
                        <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: COLORS.muted }}>
                          <User size={12} /> {inv.customer_name || tr('អតិថិជនទូទៅ', 'General Customer')}
                        </p>
                        <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: COLORS.muted, ...latinFont }}>
                          <Calendar size={12} /> {dateStr}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-sm font-extrabold" style={{ color: COLORS.navy, ...latinFont }}>
                        {fmtMoney(inv.total_amount)}
                      </p>
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-1"
                        style={{
                          backgroundColor:
                            inv.status === 'paid'
                              ? COLORS.successTint
                              : inv.status === 'pending'
                              ? '#FEF9E7'
                              : COLORS.dangerTint,
                          color:
                            inv.status === 'paid'
                              ? COLORS.success
                              : inv.status === 'pending'
                              ? '#D4AC0D'
                              : COLORS.danger,
                        }}
                      >
                        {inv.status === 'paid' && <CheckCircle size={10} />}
                        {inv.status === 'pending' && <Clock size={10} />}
                        {inv.status === 'cancelled' && <XCircle size={10} />}
                        {inv.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex border-t" style={{ borderColor: COLORS.border }}>
                  <button
                    onClick={() => onPreviewInvoice(inv.id)}
                    className="flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-bold"
                    style={{ color: COLORS.invoice }}
                  >
                    <Eye size={16} strokeWidth={2} />
                    {tr('មើល', 'View')}
                  </button>
                  <div style={{ width: 1, backgroundColor: COLORS.border }} />
                  <button
                    onClick={() => onEditInvoice(inv.id)}
                    className="flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-bold"
                    style={{ color: COLORS.navy }}
                  >
                    <Pencil size={16} strokeWidth={2} />
                    {tr('កែ', 'Edit')}
                  </button>
                  <div style={{ width: 1, backgroundColor: COLORS.border }} />
                  <button
                    onClick={() => setDeleteTarget(inv)}
                    className="flex items-center justify-center px-4 text-rose-500"
                    style={{ color: COLORS.danger }}
                  >
                    <Trash2 size={16} strokeWidth={2} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 px-4"
          style={{ backgroundColor: 'rgba(18,48,58,0.5)' }}
          onClick={() => setDeleteTarget(null)}
        >
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
            <IconBadge icon={Trash2} size={ACTION} tint="danger" shape="rounded" className="mx-auto" />
            <p className="text-sm font-bold mt-3 mb-1" style={{ color: COLORS.navy }}>
              {tr('លុបវិក្កយបត្រ?', 'Delete Invoice?')}
            </p>
            <p className="text-xs mb-4" style={{ color: COLORS.muted }}>
              {deleteTarget.invoice_number}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 rounded-lg border text-sm font-bold"
                style={{ borderColor: COLORS.border, color: COLORS.navy }}
              >
                {tr('បោះបង់', 'Cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteBusy}
                className="flex-1 py-3 rounded-lg font-bold text-white text-sm disabled:opacity-60"
                style={{ backgroundColor: COLORS.danger }}
              >
                {deleteBusy ? tr('កំពុងលុប...', 'Deleting...') : tr('លុប', 'Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}