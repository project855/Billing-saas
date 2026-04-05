import { AppLayout } from '@/components/app-layout';
import { ChevronRight } from 'lucide-react';

const auditLogs = [
  {
    id: '1',
    action: 'Invoice Created',
    user: 'John Doe',
    timestamp: '2024-03-20 14:30:00',
    description: 'Created invoice INV-001 for $5,000',
    category: 'invoice',
  },
  {
    id: '2',
    action: 'Payment Recorded',
    user: 'Jane Smith',
    timestamp: '2024-03-20 13:15:00',
    description: 'Recorded payment of $2,500 for INV-001',
    category: 'payment',
  },
  {
    id: '3',
    action: 'Customer Added',
    user: 'Mike Johnson',
    timestamp: '2024-03-20 11:45:00',
    description: 'Added new customer: Acme Corp',
    category: 'customer',
  },
  {
    id: '4',
    action: 'Expense Recorded',
    user: 'Sarah Williams',
    timestamp: '2024-03-20 10:20:00',
    description: 'Recorded office supply expense of $250',
    category: 'expense',
  },
  {
    id: '5',
    action: 'User Role Updated',
    user: 'John Doe',
    timestamp: '2024-03-19 16:30:00',
    description: 'Changed Jane Smith role from User to Manager',
    category: 'user',
  },
  {
    id: '6',
    action: 'Settings Changed',
    user: 'John Doe',
    timestamp: '2024-03-19 15:00:00',
    description: 'Updated workspace currency to USD',
    category: 'settings',
  },
  {
    id: '7',
    action: 'Invoice Sent',
    user: 'Jane Smith',
    timestamp: '2024-03-19 14:20:00',
    description: 'Sent invoice INV-001 to Acme Corp',
    category: 'invoice',
  },
  {
    id: '8',
    action: 'Data Exported',
    user: 'Mike Johnson',
    timestamp: '2024-03-19 13:10:00',
    description: 'Exported all invoices as PDF',
    category: 'export',
  },
];

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'invoice':
      return 'bg-blue-500/20 text-blue-400';
    case 'payment':
      return 'bg-green-500/20 text-green-400';
    case 'expense':
      return 'bg-purple-500/20 text-purple-400';
    case 'customer':
      return 'bg-cyan-500/20 text-cyan-400';
    case 'user':
      return 'bg-yellow-500/20 text-yellow-400';
    case 'settings':
      return 'bg-pink-500/20 text-pink-400';
    case 'export':
      return 'bg-orange-500/20 text-orange-400';
    default:
      return 'bg-gray-500/20 text-gray-400';
  }
};

export default function AuditLogsPage() {
  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Audit Logs</h1>
          <p className="text-gray-400">Track all activities and changes in your workspace</p>
        </div>

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <input
            type="text"
            placeholder="Search logs..."
            className="flex-1 min-w-48 px-4 py-2 bg-white border border-gray-100 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
          />
          <select className="px-4 py-2 bg-white border border-gray-100 rounded-lg text-white focus:outline-none focus:border-green-500">
            <option>All Actions</option>
            <option>Invoices</option>
            <option>Payments</option>
            <option>Expenses</option>
            <option>Customers</option>
          </select>
        </div>

        {/* Timeline */}
        <div className="space-y-0">
          {auditLogs.map((log, index) => (
            <div
              key={log.id}
              className={`bg-white border-l-4 border-gray-100 p-6 hover:bg-gray-50/50 transition ${
                index !== auditLogs.length - 1 ? 'border-b border-b-gray-800' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(log.category)}`}>
                      {log.action}
                    </span>
                    <span className="text-xs text-gray-500">{log.timestamp}</span>
                  </div>
                  <p className="text-white font-medium">{log.description}</p>
                  <p className="text-sm text-gray-400 mt-2">By {log.user}</p>
                </div>
                <ChevronRight size={20} className="text-gray-600 mt-1" />
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between py-4">
          <p className="text-sm text-gray-400">Showing 1-8 of {auditLogs.length} logs</p>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-white transition disabled:opacity-50">
              Previous
            </button>
            <button className="px-4 py-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-white transition">
              Next
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
