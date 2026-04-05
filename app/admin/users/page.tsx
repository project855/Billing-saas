import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Edit } from 'lucide-react';
import Link from 'next/link';

const users = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
    status: 'Active',
    joinDate: '2024-01-15',
    lastLogin: '2024-03-19',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'Manager',
    status: 'Active',
    joinDate: '2024-02-01',
    lastLogin: '2024-03-20',
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    role: 'User',
    status: 'Active',
    joinDate: '2024-02-15',
    lastLogin: '2024-03-18',
  },
  {
    id: '4',
    name: 'Sarah Williams',
    email: 'sarah@example.com',
    role: 'User',
    status: 'Inactive',
    joinDate: '2024-03-01',
    lastLogin: '2024-03-15',
  },
];

export default function AdminUsersPage() {
  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Team Members</h1>
            <p className="text-gray-400">Manage users and their roles</p>
          </div>
          <Link href="/admin/users/new">
            <Button className="bg-brand hover:brightness-90 text-gray-950">
              <Plus size={18} className="mr-2" />
              Add User
            </Button>
          </Link>
        </div>

        {/* Users Table */}
        <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Joined</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Last Login</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-6 py-4 text-sm text-white font-medium">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        user.role === 'Admin'
                          ? 'bg-purple-500/20 text-purple-400'
                          : user.role === 'Manager'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-gray-700 text-gray-600'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        user.status === 'Active'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-700 text-gray-400'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.joinDate}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.lastLogin}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <Link href={`/admin/users/${user.id}/edit`}>
                          <button className="text-gray-400 hover:text-white transition">
                            <Edit size={18} />
                          </button>
                        </Link>
                        <button className="text-red-400 hover:text-red-300 transition">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-100 rounded-lg p-6">
            <p className="text-gray-400 text-sm">Total Users</p>
            <p className="text-xl font-bold text-gray-900 mt-2">{users.length}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-6">
            <p className="text-gray-400 text-sm">Active Users</p>
            <p className="text-3xl font-bold text-green-500 mt-2">{users.filter((u) => u.status === 'Active').length}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-6">
            <p className="text-gray-400 text-sm">Admins</p>
            <p className="text-3xl font-bold text-purple-500 mt-2">{users.filter((u) => u.role === 'Admin').length}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-6">
            <p className="text-gray-400 text-sm">Managers</p>
            <p className="text-3xl font-bold text-blue-500 mt-2">{users.filter((u) => u.role === 'Manager').length}</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
