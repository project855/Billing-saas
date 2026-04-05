'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Edit, UserX, FileText, DollarSign, TrendingUp,
  Phone, Mail, Building2, CreditCard, Calendar, Hash,
  CheckCircle, Clock, AlertCircle, XCircle, Minus
} from 'lucide-react';
import { AddCustomerModal } from '@/components/customers/AddCustomerModal';

const formatINR = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

const STATUS_CLASS: Record<string, string> = {
  Paid:      'bg-emerald-50 text-emerald-600 border border-emerald-100',
  Sent:      'bg-blue-50 text-blue-600 border border-blue-100',
  Draft:     'bg-gray-100 text-gray-500 border border-gray-200',
  Overdue:   'bg-red-50 text-brand border border-red-100',
  Cancelled: 'bg-gray-100 text-gray-400 border border-gray-200',
};

export default function CustomerDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const fetchCustomer = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/customers/${id}`);
      const json = await res.json();
      if (!res.ok) { toast.error('Customer not found'); router.push('/customers'); return; }
      setData(json.data);
    } catch { toast.error('Failed to load customer'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCustomer(); }, [id]);

  const handleDeactivate = async () => {
    if (!confirm('Deactivate this customer?')) return;
    try {
      const res  = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error); return; }
      toast.success('Customer deactivated');
      router.push('/customers');
    } catch { toast.error('Failed to deactivate'); }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-400">Loading customer...</p>
      </div>
    </div>
  );

  if (!data) return null;

  const now     = new Date();
  const stats   = data.stats ?? {};
  const invoices = data.invoices ?? [];
  const payments = data.payments ?? [];

  // Avatar initial + gradient
  const initials = data.displayName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
        <div className="flex items-center gap-3">
          <Link href="/customers" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#EF3A2A]/30 to-[#EF3A2A]/10 flex items-center justify-center text-brand font-bold text-sm ring-1 ring-brand/20">
            {initials}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{data.displayName}</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {data.companyName && <span>{data.companyName} · </span>}
              Customer since {format(new Date(data.createdAt), 'MMM yyyy')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditing(true)}
            className="border-gray-200 text-gray-600 gap-2 h-9 text-sm">
            <Edit className="w-4 h-4" /> Edit
          </Button>
          <Link href={`/invoices/new?customerId=${data.id}`}>
            <Button className="bg-brand hover:brightness-90 text-white gap-2 h-9 text-sm border-none shadow-sm">
              <FileText className="w-4 h-4" /> New Invoice
            </Button>
          </Link>
          {data.status !== 'inactive' && (
            <Button variant="outline" onClick={handleDeactivate}
              className="border-red-200 text-red-500 hover:bg-red-50 gap-2 h-9 text-sm">
              <UserX className="w-4 h-4" /> Deactivate
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left: customer info */}
        <div className="space-y-5">

          {/* Contact card */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Contact Info</h3>
            <div className="space-y-3">
              {data.email && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <span className="text-gray-700 break-all">{data.email}</span>
                </div>
              )}
              {data.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <span className="text-gray-700 font-mono">{data.phone}</span>
                </div>
              )}
              {data.gstNumber && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-7 h-7 bg-violet-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Hash className="w-3.5 h-3.5 text-violet-500" />
                  </div>
                  <span className="text-gray-700 font-mono text-xs">{data.gstNumber}</span>
                </div>
              )}
              {data.paymentTerms && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <span className="text-gray-700">{data.paymentTerms}</span>
                </div>
              )}
              {data.billingAddress && (
                <div className="flex items-start gap-3 text-sm">
                  <div className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                  <span className="text-gray-600 text-xs leading-relaxed">{data.billingAddress}</span>
                </div>
              )}
            </div>
            {data.notes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-semibold mb-1">Notes</p>
                <p className="text-sm text-gray-600">{data.notes}</p>
              </div>
            )}
          </div>

          {/* Financial summary */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Financial Summary</h3>
            <div className="space-y-3">
              {[
                { label: 'Total Billed',   value: formatINR(stats.totalBilled  ?? 0), color: 'text-gray-900',   icon: <TrendingUp  className="w-3.5 h-3.5 text-blue-500" /> },
                { label: 'Total Paid',     value: formatINR(stats.totalPaid    ?? 0), color: 'text-emerald-600', icon: <DollarSign  className="w-3.5 h-3.5 text-emerald-500" /> },
                { label: 'Outstanding',    value: formatINR(stats.outstanding  ?? 0), color: stats.outstanding > 0 ? 'text-brand' : 'text-gray-500', icon: <CreditCard className="w-3.5 h-3.5 text-brand" /> },
                { label: 'Total Invoices', value: String(stats.invoiceCount ?? 0),     color: 'text-gray-700',   icon: <FileText   className="w-3.5 h-3.5 text-gray-400" /> },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {row.icon} {row.label}
                  </div>
                  <span className={`text-sm font-bold ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Payment progress */}
            {(stats.totalBilled ?? 0) > 0 && (
              <div className="mt-4">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all"
                    style={{ width: `${Math.min(100, ((stats.totalPaid ?? 0) / (stats.totalBilled ?? 1)) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  {((( stats.totalPaid ?? 0) / (stats.totalBilled ?? 1)) * 100).toFixed(0)}% paid
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: invoices + payments */}
        <div className="lg:col-span-2 space-y-5">

          {/* Invoices */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-800">Invoices</h3>
              <Link href={`/invoices/new?customerId=${data.id}`}
                className="text-xs text-brand hover:underline font-medium">+ New Invoice</Link>
            </div>
            {invoices.length === 0 ? (
              <div className="py-10 text-center">
                <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No invoices yet</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider font-bold text-gray-400 border-b border-gray-50 bg-gray-50/50">
                    <th className="py-3 px-5 text-left">Invoice #</th>
                    <th className="py-3 px-5 text-left">Date</th>
                    <th className="py-3 px-5 text-right">Amount</th>
                    <th className="py-3 px-5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {invoices.map((inv: any) => {
                    const isOverdue = !['Paid','Cancelled','Draft'].includes(inv.status) && new Date(inv.dueDate) < now;
                    const key = isOverdue ? 'Overdue' : inv.status;
                    return (
                      <tr key={inv.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3 px-5">
                          <Link href={`/invoices/${inv.id}`} className="font-mono font-bold text-blue-600 hover:underline">
                            {inv.invoiceNumber}
                          </Link>
                        </td>
                        <td className="py-3 px-5 text-gray-500">{format(new Date(inv.issueDate), 'dd MMM yyyy')}</td>
                        <td className="py-3 px-5 text-right font-bold text-gray-900">{formatINR(inv.amount)}</td>
                        <td className="py-3 px-5 text-center">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold border ${STATUS_CLASS[key] ?? ''}`}>
                            {key}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Recent Payments */}
          {payments.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-800">Recent Payments</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {payments.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{p.method}</p>
                        <p className="text-[11px] text-gray-400">{format(new Date(p.date), 'dd MMM yyyy')} · {p.invoice?.invoiceNumber}</p>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-600">{formatINR(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {editing && (
        <AddCustomerModal
          open={editing}
          onOpenChange={setEditing}
          onSuccess={() => { setEditing(false); fetchCustomer(); }}
          initialData={data}
        />
      )}
    </div>
  );
}
