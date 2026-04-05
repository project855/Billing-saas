import { AppLayout } from '@/components/app-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Save, Trash2, Copy } from 'lucide-react';

export default function WorkspaceSettingsPage() {
  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Workspace Settings</h1>
          <p className="text-gray-400">Manage workspace information and integrations</p>
        </div>

        <Tabs defaultValue="general" className="bg-white border border-gray-100 rounded-lg p-6">
          <TabsList className="bg-gray-50">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="api">API Keys</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="danger">Danger Zone</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Workspace Name</label>
                <input
                  type="text"
                  defaultValue="Augfox Workspace"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Workspace ID</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    disabled
                    defaultValue="ws_6f8a9d2c1b4e5k3x"
                    className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-600"
                  />
                  <Button variant="outline" className="border-gray-200 text-gray-600">
                    <Copy size={18} />
                  </Button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Workspace URL</label>
                <input
                  type="text"
                  defaultValue="https://augfox.app/workspace/demo"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                />
              </div>
            </div>
            <Button className="bg-brand hover:brightness-90 text-gray-950">
              <Save size={18} className="mr-2" />
              Save Changes
            </Button>
          </TabsContent>

          {/* Integrations */}
          <TabsContent value="integrations" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="text-white font-semibold">Stripe</h3>
                  <p className="text-sm text-gray-400 mt-1">Accept online payments</p>
                </div>
                <Button variant="outline" className="border-green-500 text-green-500">
                  Connect
                </Button>
              </div>
              <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="text-white font-semibold">Slack</h3>
                  <p className="text-sm text-gray-400 mt-1">Get notifications in Slack</p>
                </div>
                <Button variant="outline" className="border-green-500 text-green-500">
                  Connect
                </Button>
              </div>
              <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="text-white font-semibold">Zapier</h3>
                  <p className="text-sm text-gray-400 mt-1">Automate workflows</p>
                </div>
                <Button variant="outline" className="border-green-500 text-green-500">
                  Connect
                </Button>
              </div>
              <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="text-white font-semibold">Google Drive</h3>
                  <p className="text-sm text-gray-400 mt-1">Store receipts and documents</p>
                </div>
                <Button variant="outline" className="border-green-500 text-green-500">
                  Connect
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* API Keys */}
          <TabsContent value="api" className="space-y-6 mt-6">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-400">Keep your API keys secret. Do not share them in public repositories or code.</p>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-white">API Key (Live)</label>
                  <button className="text-sm text-gray-400 hover:text-white">Regenerate</button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    disabled
                    defaultValue="live_api_key_hidden"
                    className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600"
                  />
                  <Button variant="outline" className="border-gray-200 text-gray-600">
                    <Copy size={18} />
                  </Button>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-white">API Key (Test)</label>
                  <button className="text-sm text-gray-400 hover:text-white">Regenerate</button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    disabled
                    defaultValue="test_api_key_hidden"
                    className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600"
                  />
                  <Button variant="outline" className="border-gray-200 text-gray-600">
                    <Copy size={18} />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Billing */}
          <TabsContent value="billing" className="space-y-6 mt-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="mb-6">
                <p className="text-gray-400 text-sm">Current Plan</p>
                <h3 className="text-xl font-bold text-gray-900 mt-2">Professional</h3>
                <p className="text-gray-400 text-sm mt-2">$99/month</p>
              </div>
              <div className="mb-6 pb-6 border-b border-gray-200">
                <p className="text-gray-400 text-sm">Features Included</p>
                <ul className="mt-3 space-y-2 text-sm text-gray-600">
                  <li>✓ Up to 10 team members</li>
                  <li>✓ Unlimited invoices & expenses</li>
                  <li>✓ Advanced reports</li>
                  <li>✓ API access</li>
                  <li>✓ Priority support</li>
                </ul>
              </div>
              <div className="flex gap-2">
                <Button className="bg-brand hover:brightness-90 text-gray-950">Upgrade Plan</Button>
                <Button variant="outline" className="border-gray-200 text-gray-600">Manage Billing</Button>
              </div>
            </div>
          </TabsContent>

          {/* Danger Zone */}
          <TabsContent value="danger" className="space-y-6 mt-6">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-white font-medium">Delete All Data</h4>
                  <p className="text-sm text-gray-400 mt-1">Permanently delete all workspace data. This action cannot be undone.</p>
                  <Button variant="destructive" className="mt-4 bg-red-500/20 text-red-400 hover:bg-red-500/30">
                    <Trash2 size={18} className="mr-2" />
                    Delete All Data
                  </Button>
                </div>
                <div className="border-t border-red-500/30 pt-4">
                  <h4 className="text-white font-medium">Delete Workspace</h4>
                  <p className="text-sm text-gray-400 mt-1">Permanently delete this workspace and all associated data.</p>
                  <Button variant="destructive" className="mt-4 bg-red-500/20 text-red-400 hover:bg-red-500/30">
                    <Trash2 size={18} className="mr-2" />
                    Delete Workspace
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
