'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  ArrowLeft, Send, DollarSign, Edit, Trash2, FileText, CheckCircle,
  Clock, AlertCircle, XCircle, Building2, User, Calendar, Hash, CreditCard
} from 'lucide-react';
import RecordPaymentModal from '@/components/invoices/RecordPaymentModal';

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  Draft:     { label: 'Draft',     className: 'bg-gray-100 text-gray-600 border border-gray-200',          icon: <FileText className="w-3.5 h-3.5" /> },
  Sent:      { label: 'Sent',      className: 'bg-blue-50 text-blue-600 border border-blue-100',            icon: <Send className="w-3.5 h-3.5" /> },
  Paid:      { label: 'Paid',      className: 'bg-emerald-50 text-emerald-600 border border-emerald-100',  icon: <CheckCircle className="w-3.5 h-3.5" /> },
  Overdue:   { label: 'Overdue',   className: 'bg-red-50 text-brand border border-red-100',            icon: <AlertCircle className="w-3.5 h-3.5" /> },
  Cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-400 border border-gray-200',          icon: <XCircle className="w-3.5 h-3.5" /> },
};

const formatINR = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(v);

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${id}`);
      const json = await res.json();
      if (res.ok) setInvoice(json.data);
      else { toast.error('Invoice not found'); router.push('/invoices'); }
    } catch { toast.error('Failed to load invoice'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInvoice(); }, [id]);

  const handleSend = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/invoices/${id}/send`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error); return; }
      toast.success('Invoice marked as sent!');
      fetchInvoice();
    } finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    const msg = invoice.status === 'Draft' ? 'Delete this draft?' : 'Cancel this invoice?';
    if (!confirm(msg)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error); return; }
      toast.success(json.message);
      router.push('/invoices');
    } finally { setActionLoading(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-400">Loading invoice...</p>
      </div>
    </div>
  );

  if (!invoice) return null;

  const isOverdue = ['Sent', 'Draft'].includes(invoice.status) && new Date(invoice.dueDate) < new Date();
  const statusKey = isOverdue ? 'Overdue' : invoice.status;
  const cfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.Draft;

  let parsedCustomFields: { id?: string; key: string; value: string }[] = [];
  try {
    if (invoice.customFields) parsedCustomFields = JSON.parse(invoice.customFields);
  } catch (e) {}

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
        <div className="flex items-center gap-3">
          <Link href="/invoices" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900 font-mono">{invoice.invoiceNumber}</h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${cfg.className}`}>
                {cfg.icon} {cfg.label}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-0.5">
              Created {format(new Date(invoice.createdAt), 'dd MMM yyyy')}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          {['Draft', 'Sent'].includes(invoice.status) && (
            <Link href={`/invoices/${id}/edit`}>
              <Button variant="outline" className="border-gray-200 text-gray-600 gap-2 h-9 text-sm">
                <Edit className="w-4 h-4" /> Edit
              </Button>
            </Link>
          )}
          {invoice.status === 'Draft' && (
            <Button
              variant="outline"
              onClick={handleSend}
              disabled={actionLoading}
              className="border-blue-200 text-blue-600 hover:bg-blue-50 gap-2 h-9 text-sm"
            >
              <Send className="w-4 h-4" /> Mark as Sent
            </Button>
          )}
          {invoice.balance > 0.01 && !['Paid', 'Cancelled'].includes(invoice.status) && (
            <Button
              onClick={() => setPaymentModal(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2 h-9 text-sm border-none shadow-sm"
            >
              <DollarSign className="w-4 h-4" /> Record Payment
            </Button>
          )}
          {invoice.status !== 'Paid' && (
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={actionLoading}
              className="border-red-200 text-red-500 hover:bg-red-50 gap-2 h-9 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              {invoice.status === 'Draft' ? 'Delete' : 'Cancel'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main invoice card */}
        <div className="lg:col-span-2">
          <div className="bg-[#f8f9fc] rounded-xl shadow-lg border border-gray-200 overflow-hidden relative min-h-[800px] flex flex-col font-sans">
            
            {/* Top Banner SVG */}
            <div className="absolute top-0 left-0 right-0 h-[200px] sm:h-[220px] z-0">
              <svg className="w-full h-full object-fill" viewBox="0 0 1440 220" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0H1440V120C1100 240 340 40 0 140V0Z" fill="#0C4A8Ee6" />
                <path d="M0 0H1440V90C1100 210 340 10 0 110V0Z" fill="#0B4686" />
              </svg>
            </div>

            {/* Header Texts */}
            <div className="relative z-10 px-8 sm:px-12 pt-12 sm:pt-14 pb-8 sm:pb-12 flex flex-col sm:flex-row sm:justify-between items-start gap-4">
              <div className="flex items-center gap-6">
                {invoice.company?.logo && (
                  <div className="bg-white p-2 rounded-md shadow-sm">
                    <img src={invoice.company.logo} alt="Company Logo" className="h-14 object-contain" />
                  </div>
                )}
                <h1 className="text-4xl xl:text-5xl font-extrabold text-white tracking-wider">INVOICE</h1>
              </div>
              <div className="text-white sm:mt-3 text-left sm:text-right">
                <p className="text-lg xl:text-xl font-bold tracking-wide">NO: {invoice.invoiceNumber}</p>
              </div>
            </div>

            <div className="relative z-10 px-8 sm:px-12 flex-1 space-y-10">
              
              {/* Bill To & From */}
              <div className="flex flex-col sm:flex-row justify-between gap-8 mt-4">
                <div className="text-left max-w-[280px]">
                  <h2 className="text-xl font-bold text-gray-800 mb-3">Bill To:</h2>
                  <p className="font-semibold text-gray-700 text-lg mb-1">{invoice.customer?.displayName}</p>
                  {invoice.customer?.phone && <p className="text-gray-500 text-sm mb-0.5">{invoice.customer.phone}</p>}
                  {invoice.customer?.email && <p className="text-gray-500 text-sm mb-0.5">{invoice.customer.email}</p>}
                  <p className="text-gray-500 text-sm leading-relaxed mt-1">
                    {invoice.customer?.address || '123 Anywhere St., Any City'}
                  </p>
                  {invoice.customer?.gstNumber && (
                    <p className="text-gray-400 mt-2 font-mono text-xs font-semibold tracking-wide">GST: {invoice.customer.gstNumber}</p>
                  )}
                </div>
                <div className="text-left sm:text-right max-w-[280px]">
                  <h2 className="text-xl font-bold text-gray-800 mb-3">From:</h2>
                  <p className="font-semibold text-gray-700 text-lg mb-1">
                    {invoice.salesperson?.name || 'Your Company'}
                  </p>
                  <p className="text-gray-500 text-sm mb-0.5">{invoice.salesperson?.email || 'contact@yourcompany.com'}</p>
                  <p className="text-gray-500 text-sm mb-0.5">+123-456-7890</p>
                  <p className="text-gray-500 text-sm leading-relaxed mt-1">
                    123 Anywhere St., Any City
                  </p>
                </div>
              </div>

              {/* Date and Custom Fields */}
              <div>
                <p className="text-gray-600 font-medium">
                  Date: <span className="text-gray-800 ml-1 mr-4">{format(new Date(invoice.issueDate), 'dd MMMM yyyy')}</span>
                  Issue Date: <span className="text-gray-800 ml-1">{format(new Date(invoice.dueDate), 'dd MMMM yyyy')}</span>
                </p>
                
                {parsedCustomFields.length > 0 && (
                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6">
                    {parsedCustomFields.map((f, i) => (
                      <div key={f.id || i}>
                        <p className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-0.5">{f.key}</p>
                        <p className="text-gray-800 font-medium">{f.value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Invoice Items Table */}
              <div>
                <div className="overflow-x-auto rounded-md shadow-sm border border-gray-300">
                  <table className="w-full text-left border-collapse bg-white whitespace-nowrap min-w-[500px]">
                    <thead className="bg-[#0B4686] text-white">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold text-left border-r border-[#195a9c]">Description</th>
                        <th className="py-2.5 px-4 font-semibold text-center border-r border-[#195a9c] w-20">Qty</th>
                        <th className="py-2.5 px-4 font-semibold text-right border-r border-[#195a9c] w-32">Price</th>
                        <th className="py-2.5 px-4 font-semibold text-right w-32">Total</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-600 border-b border-gray-300">
                      {invoice.items?.map((item: any, i: number) => (
                        <tr key={item.id || i} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50/50">
                          <td className="py-3 px-4 border-r border-gray-200 font-medium text-gray-700 whitespace-normal">{item.description}</td>
                          <td className="py-3 px-4 border-r border-gray-200 text-center">{item.quantity}</td>
                          <td className="py-3 px-4 border-r border-gray-200 text-right">{formatINR(item.unitPrice)}</td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-800">{formatINR(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Subtotal block right-aligned */}
                <div className="flex justify-end mt-4">
                  <div className="w-full sm:w-72 bg-[#0B4686] text-white flex justify-between items-center px-4 py-2.5 rounded shadow-sm">
                    <span className="font-medium">Sub Total</span>
                    <span className="font-bold tracking-wide">{formatINR(invoice.amount - (invoice.tax || 0) + (invoice.discount || 0))}</span>
                  </div>
                </div>
                <div className="flex justify-end mt-1">
                  <div className="w-full sm:w-72 space-y-1 mb-2">
                    {invoice.tax > 0 && (
                      <div className="flex justify-between items-center px-4 py-1 text-gray-600 border-b border-gray-200 border-dashed pb-2">
                        <span className="font-medium text-sm">Tax</span>
                        <span>{formatINR(invoice.tax)}</span>
                      </div>
                    )}
                    {invoice.discount > 0 && (
                      <div className="flex justify-between items-center px-4 py-1 text-emerald-600 border-b border-gray-200 border-dashed pb-2">
                        <span className="font-medium text-sm">Discount</span>
                        <span>-{formatINR(invoice.discount)}</span>
                      </div>
                    )}
                    {(invoice.tax > 0 || invoice.discount > 0) && (
                      <div className="flex justify-between items-center px-4 py-2 text-[#0B4686] font-bold">
                        <span>Total</span>
                        <span className="text-lg">{formatINR(invoice.amount)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Notes and Sign */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-12 pt-6 gap-8">
                <div className="space-y-6 flex-1 w-full shrink-0 max-w-sm">
                  {/* Notes block */}
                  <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                    <span className="font-bold text-gray-800">Note:</span>
                    <div className="flex-1 w-full">
                      {invoice.notes ? (
                        <div className="border-b border-gray-300 pb-1 text-gray-600 text-sm whitespace-pre-wrap">{invoice.notes}</div>
                      ) : (
                        <>
                          <div className="border-b border-gray-300 h-5 w-full"></div>
                          <div className="border-b border-gray-300 h-6 w-[90%]"></div>
                        </>
                      )}
                    </div>
                  </div>


                </div>

                <div className="text-left md:text-right pb-4 md:pb-0">
                  <h2 className="text-3xl sm:text-4xl font-bold text-[#0B4686] tracking-wide font-serif italic opacity-90">Thank You!</h2>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {/* Payment Summary */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Payment Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Invoice Total</span>
                <span className="font-semibold text-gray-900">{formatINR(invoice.amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Paid</span>
                <span className="font-semibold text-emerald-600">{formatINR(invoice.amountPaid ?? 0)}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, ((invoice.amountPaid ?? 0) / invoice.amount) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-100">
                <span className="text-gray-700">Balance Due</span>
                <span className={invoice.balance > 0.01 ? 'text-brand' : 'text-emerald-600'}>
                  {formatINR(invoice.balance ?? invoice.amount)}
                </span>
              </div>
            </div>

            {invoice.balance > 0.01 && !['Paid', 'Cancelled'].includes(invoice.status) && (
              <Button
                onClick={() => setPaymentModal(true)}
                className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold gap-2 border-none shadow-sm h-9 text-sm"
              >
                <DollarSign className="w-4 h-4" /> Record Payment
              </Button>
            )}
          </div>

          {/* Payment History */}
          {invoice.payments?.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Payment History</h3>
              <div className="space-y-3">
                {invoice.payments.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-emerald-50 rounded-full flex items-center justify-center">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-xs">{p.method}</p>
                        <p className="text-[11px] text-gray-400">{format(new Date(p.date), 'dd MMM yyyy')}</p>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-600">{formatINR(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Timeline</h3>
            <div className="space-y-3 text-xs text-gray-500">
              <div className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 flex-shrink-0" />
                <p>Invoice <span className="font-semibold text-gray-700">{invoice.invoiceNumber}</span> created · {format(new Date(invoice.createdAt), 'dd MMM yyyy')}</p>
              </div>
              {invoice.sentAt && (
                <div className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <p>Marked as <span className="font-semibold text-blue-600">Sent</span> · {format(new Date(invoice.sentAt), 'dd MMM yyyy')}</p>
                </div>
              )}
              {invoice.paidAt && (
                <div className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  <p>Invoice <span className="font-semibold text-emerald-600">fully paid</span> · {format(new Date(invoice.paidAt), 'dd MMM yyyy')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {paymentModal && (
        <RecordPaymentModal
          invoice={invoice}
          onClose={() => setPaymentModal(false)}
          onSuccess={() => { setPaymentModal(false); fetchInvoice(); }}
        />
      )}
    </div>
  );
}
