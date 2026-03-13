import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Eye, EyeOff, Plus } from "lucide-react";

export default function SettingsPage() {
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account and platform settings</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="bg-muted">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <div className="rounded-lg border border-border bg-card p-6 card-shadow space-y-4 max-w-2xl">
            <h2 className="text-base font-semibold text-card-foreground">User Profile</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">First Name</label>
                <input defaultValue="John" className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Last Name</label>
                <input defaultValue="Doe" className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <input defaultValue="john@company.com" className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" />
              </div>
            </div>
            <Button>Save Profile</Button>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <div className="rounded-lg border border-border bg-card p-6 card-shadow space-y-5 max-w-2xl">
            <h2 className="text-base font-semibold text-card-foreground">Notification Preferences</h2>
            {[
              { label: "Workflow execution completed", desc: "Get notified when executions finish", default: true },
              { label: "Execution failures", desc: "Alert on failed executions", default: true },
              { label: "Pending approvals", desc: "Notify when approvals need attention", default: true },
              { label: "System updates", desc: "Platform maintenance and updates", default: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch defaultChecked={item.default} />
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="api-keys" className="mt-6">
          <div className="rounded-lg border border-border bg-card p-6 card-shadow space-y-4 max-w-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-card-foreground">API Keys</h2>
              <Button variant="outline" size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" /> Generate Key</Button>
            </div>
            <div className="rounded-lg border border-border bg-background p-4 flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Production Key</p>
                <p className="mt-1 font-mono text-sm text-muted-foreground">
                  {showKey ? "sk_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4" : "sk_live_••••••••••••••••••••••"}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowKey(!showKey)} className="h-8 w-8 p-0 text-muted-foreground">
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="system" className="mt-6">
          <div className="rounded-lg border border-border bg-card p-6 card-shadow space-y-5 max-w-2xl">
            <h2 className="text-base font-semibold text-card-foreground">System Settings</h2>
            {[
              { label: "Max concurrent executions", value: "10" },
              { label: "Default timeout (seconds)", value: "300" },
              { label: "Retry attempts", value: "3" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-4">
                <label className="text-sm font-medium text-foreground">{item.label}</label>
                <input defaultValue={item.value} className="h-9 w-24 rounded-lg border border-input bg-background px-3 text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring/20" />
              </div>
            ))}
            <Button>Save Settings</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
