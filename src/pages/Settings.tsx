import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Eye, EyeOff, Plus, Loader2, Save } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    email: "",
    notifications: {
      workflow_completed: true,
      execution_failures: true,
      pending_approvals: true,
      system_updates: false
    }
  });

  const [sysSettings, setSysSettings] = useState({
    max_concurrent: "10",
    default_timeout: "300",
    retry_attempts: "3"
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  async function fetchData() {
    if (!user?.id) return;
    setLoading(true);
    try {
      // 1. Fetch Profile
      const { data: pData, error: pError } = await (supabase
        .from('profiles')
        .select('id, first_name, last_name, email, notifications')
        .eq('id', user.id)
        .single() as any);

      if (pError) throw pError;
      if (pData) {
        setProfile({
          first_name: pData.first_name || "",
          last_name: pData.last_name || "",
          email: pData.email || user?.email || "",
          notifications: pData.notifications || profile.notifications
        });
      }

      // 2. Fetch System Settings (if available)
      const { data: sData } = await (supabase
        .from('system_settings')
        .select('key, value')
        .eq('key', 'execution_limits')
        .single() as any);

      if (sData) {
        setSysSettings(sData.value);
      }
    } catch (error: any) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          full_name: `${profile.first_name} ${profile.last_name}`.trim()
        } as any)
        .eq('id', user.id);

      if (error) throw error;
      toast({ title: "Success", description: "Profile updated successfully." });
    } catch (error: any) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleNotification = async (key: string, val: boolean) => {
    if (!user?.id) return;
    const updatedNotifications = { ...profile.notifications, [key]: val };
    setProfile(prev => ({ ...prev, notifications: updatedNotifications }));

    try {
      await supabase
        .from('profiles')
        .update({ notifications: updatedNotifications } as any)
        .eq('id', user.id);
    } catch (error) {
      console.error("Failed to save notification preference:", error);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 lg:p-0">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 font-inter">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground font-medium">Manage your personal preferences and platform configuration.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="profile" className="rounded-lg px-6">Profile</TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg px-6">Notifications</TabsTrigger>
          <TabsTrigger value="api-keys" className="rounded-lg px-6">API Keys</TabsTrigger>
          <TabsTrigger value="system" className="rounded-lg px-6">System</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-6 max-w-2xl">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-black">
                {profile.first_name?.[0] || user?.email?.[0].toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">User Identity</h2>
                <p className="text-sm text-muted-foreground">This information is visible to your organization.</p>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">First Name</label>
                <input
                  value={profile.first_name}
                  onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Last Name</label>
                <input
                  value={profile.last_name}
                  onChange={(e) => setProfile(prev => ({ ...prev, last_name: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Login Email</label>
                <input
                  readOnly
                  value={profile.email}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 text-sm text-slate-500 cursor-not-allowed font-medium"
                />
              </div>
            </div>
            <Button onClick={handleSaveProfile} disabled={saving} className="h-11 px-8 rounded-xl shadow-lg shadow-primary/10">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Profile Changes
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-8 max-w-2xl">
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-inter">Personal Alerts</h2>
              <p className="text-sm text-muted-foreground">Control how and when you receive platform updates.</p>
            </div>

            <div className="space-y-6">
              {[
                { id: "workflow_completed", label: "Workflow execution completed", desc: "Get notified when executions finish", value: profile.notifications.workflow_completed },
                { id: "execution_failures", label: "Execution failures", desc: "Critial alert on failed executions", value: profile.notifications.execution_failures },
                { id: "pending_approvals", label: "Pending approvals", desc: "Notify when approvals need your attention", value: profile.notifications.pending_approvals },
                { id: "system_updates", label: "System maintenance", desc: "Platform maintenance and updates", value: profile.notifications.system_updates },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-50 bg-slate-50/30 hover:bg-slate-50 transition-colors">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-slate-800">{item.label}</p>
                    <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                  </div>
                  <Switch
                    checked={item.value}
                    onCheckedChange={(checked) => handleToggleNotification(item.id, checked)}
                  />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="api-keys" className="mt-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-6 max-w-2xl">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Developer Access</h2>
              <p className="text-sm text-muted-foreground">Use these keys to integrate Flow Weaver with your systems.</p>
            </div>

            <div className="rounded-2xl border border-primary/10 bg-primary/5 p-6 flex items-center gap-4">
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">Secret API Key</p>
                <p className="mt-2 font-mono text-sm font-bold text-slate-700">
                  {showKey ? "sk_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4" : "sk_live_••••••••••••••••••••••••"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => setShowKey(!showKey)} className="h-10 w-10 text-slate-400 hover:text-primary hover:bg-primary/10">
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-primary hover:bg-primary/10">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button variant="outline" className="w-full h-11 border-dashed border-slate-300 text-slate-500 hover:text-primary hover:border-primary transition-all rounded-xl">
              <Plus className="h-4 w-4 mr-2" /> Role-based Key Coming Soon
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="system" className="mt-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-8 max-w-2xl">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Platform Governance</h2>
              <p className="text-sm text-muted-foreground">Configure global execution parameters and constraints.</p>
            </div>

            <div className="space-y-6">
              {[
                { label: "Max concurrent executions", value: sysSettings.max_concurrent, desc: "Limits parallel worker threads" },
                { label: "Default timeout (seconds)", value: sysSettings.default_timeout, desc: "Max time before execution kill" },
                { label: "Retry attempts", value: sysSettings.retry_attempts, desc: "Automatic restart strategy" },
              ].map((item) => (
                <div key={item.label} className="grid grid-cols-2 items-center gap-8 py-4 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{item.label}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{item.desc}</p>
                  </div>
                  <input
                    defaultValue={item.value}
                    className="h-11 w-24 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 text-right focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none ml-auto"
                  />
                </div>
              ))}
            </div>
            <Button className="h-11 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold tracking-tight">
              Update System Defaults
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
