import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Building2,
  CreditCard,
  Bell,
  Lock,
  Users,
  FileText,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Settings - Augfox',
  description: 'Configure your Augfox workspace settings',
}

export default function SettingsPage() {
  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-400 mt-2">
          Manage your workspace and preferences
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-white border border-gray-100">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card className="bg-white border-gray-100">
            <CardHeader>
              <CardTitle className="text-white">Workspace Settings</CardTitle>
              <CardDescription className="text-gray-400">
                Update your workspace name and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Workspace Name</label>
                  <input
                    type="text"
                    placeholder="Your Workspace"
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 text-white"
                    disabled
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Default Currency</label>
                  <select className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 text-white">
                    <option>USD (US Dollar)</option>
                    <option>EUR (Euro)</option>
                    <option>GBP (British Pound)</option>
                    <option>CAD (Canadian Dollar)</option>
                  </select>
                </div>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700">Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Settings */}
        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Configure your company details for invoices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Company Name</label>
                  <input
                    type="text"
                    placeholder="Your Company"
                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <input
                    type="email"
                    placeholder="contact@company.com"
                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Tax ID</label>
                  <input
                    type="text"
                    placeholder="12-3456789"
                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Settings */}
        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing & Subscription</CardTitle>
              <CardDescription>
                Manage your subscription and payment methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-600">
                  <strong>Current Plan:</strong> Free Trial
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Valid until March 31, 2024
                </p>
              </div>
              <Button>Upgrade Plan</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Settings */}
        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage workspace members and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-slate-600 text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                <p>Team management coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Control how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-slate-600 text-center py-8">
                <Bell className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                <p>Notification settings coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Manage your account security and privacy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-sm mb-2">Change Password</h3>
                <Button variant="outline" className="w-full">
                  <Lock className="w-4 h-4 mr-2" />
                  Update Password
                </Button>
              </div>
              <div>
                <h3 className="font-medium text-sm mb-2">Two-Factor Authentication</h3>
                <Button variant="outline" className="w-full">
                  Enable 2FA
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
