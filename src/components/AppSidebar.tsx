import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Settings,
  Zap,
  X,
  FileText,
  GitBranch,
  Crown,
  CreditCard,
  LineChart
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { Skeleton } from "./ui/skeleton";
import { Badge } from "./ui/badge";

interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function AppSidebar({ open, onClose }: AppSidebarProps) {
  const location = useLocation();
  const { isPremium, loading } = useUserRole();

  // Define navigations per role
  // Unified navigation for all individuals
  const navItems = [
    { title: "My Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Workflow Builder", url: "/workflows", icon: GitBranch },
    { title: "Run Workflows", url: "/executions/new", icon: Zap },
    { title: "Executions", url: "/executions/my", icon: FileText },
  ];

  if (isPremium) {
    navItems.push({ title: "Premium Insights", url: "/analytics", icon: LineChart });
  } else {
    navItems.push({ title: "Pricing & Billing", url: "/admin/pricing", icon: CreditCard });
  }

  navItems.push({ title: "Settings", url: "/settings", icon: Settings });

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:static lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary tracking-tighter">
              <Zap className="h-4 w-4 text-sidebar-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-sidebar-accent-foreground leading-none">
                Flow Weaver
              </span>
              {loading ? (
                <Skeleton className="h-2 w-16 mt-1 bg-sidebar-border" />
              ) : isPremium && (
                <span className="text-[10px] font-black uppercase text-primary mt-0.5 tracking-[0.2em]">
                  Pro Edition
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-sidebar-muted hover:text-sidebar-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-sidebar-border bg-sidebar-accent/50 flex items-center justify-between">
          {loading ? (
            <Skeleton className="h-4 w-24 bg-sidebar-border" />
          ) : (
            <>
              <span className="text-xs font-bold uppercase tracking-wider text-sidebar-primary">
                {isPremium ? 'Flow Member' : 'Standard User'}
              </span>
              {isPremium && (
                <Badge className="h-4 px-1.5 text-[9px] font-bold bg-gradient-to-r from-amber-400 to-orange-500 border-none text-white shadow-sm ring-1 ring-amber-200/50">
                  PRO
                </Badge>
              )}
            </>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.url ||
              (item.url !== "/dashboard" && location.pathname.startsWith(item.url));
            return (
              <NavLink
                key={item.url}
                to={item.url}
                end={item.url === "/dashboard"}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                  ? ""
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                activeClassName="bg-sidebar-accent text-sidebar-primary"
                onClick={onClose}
              >
                <item.icon className="h-4.5 w-4.5" />
                <span>{item.title}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <div className="rounded-lg bg-sidebar-accent p-3 relative overflow-hidden group">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-3 w-28 bg-sidebar-border" />
                <Skeleton className="h-2 w-20 bg-sidebar-border" />
              </div>
            ) : (
              <>
                {isPremium && (
                  <div className="absolute top-0 right-0 p-1 opacity-20 group-hover:opacity-100 transition-opacity">
                    <Crown className="w-4 h-4 text-amber-500" />
                  </div>
                )}
                <p className="text-xs font-medium text-sidebar-accent-foreground">Flow Weaver {isPremium ? 'Premium' : 'SaaS'}</p>
                <p className="mt-0.5 text-xs text-sidebar-muted">{isPremium ? 'Priority Support Active' : 'Free Tier'}</p>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
