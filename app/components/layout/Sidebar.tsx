import { Link, useLocation } from "react-router";
import {
  IconActivity,
  IconLayoutDashboard,
  IconSpy,
  IconFileText,
  IconSettings,
  IconInfoCircle,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { ExtensionsSidebarSection } from "@agent-native/core/client/extensions";
import { FeedbackButton, appPath } from "@agent-native/core/client";

const navItems = [
  { icon: IconLayoutDashboard, label: "Dashboard", href: "/" },
  { icon: IconFileText, label: "Briefings", href: "/briefings" },
  { icon: IconSettings, label: "Settings", href: "/settings" },
  { icon: IconInfoCircle, label: "About", href: "/about" },
  { icon: IconActivity, label: "Observability", href: "/observability" },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="flex h-full w-56 min-w-0 shrink-0 flex-col overflow-hidden border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-12 shrink-0 items-center gap-2.5 px-4 border-b border-border">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <IconSpy className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold tracking-tight">Lighthouse</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? location.pathname === "/" || location.pathname.startsWith("/competitors")
              : location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-2 py-2">
        <ExtensionsSidebarSection />
      </div>

      <div className="border-t border-border px-3 py-2">
        <FeedbackButton />
      </div>
    </aside>
  );
}
