import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Activity, Brain, ShieldAlert, GitMerge, Network, PlaySquare, ChevronLeft, Menu, X } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const links = [
    { href: "/dashboard", label: "SYS_STATUS", icon: Activity },
    { href: "/memory", label: "MEMORY_BANK", icon: Brain },
    { href: "/doctrine", label: "DOCTRINE", icon: ShieldAlert },
    { href: "/workflows", label: "WORKFLOWS", icon: GitMerge },
    { href: "/routing", label: "ROUTING", icon: Network },
    { href: "/scenarios", label: "SCENARIOS", icon: PlaySquare },
  ];

  const isActive = (href: string) =>
    location === href || (href !== "/dashboard" && location.startsWith(href));

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-mono uppercase text-xs tracking-wider">

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — fixed drawer on mobile, static on desktop */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          md:static md:z-auto md:translate-x-0
          w-64 shrink-0 border-r border-border bg-card flex flex-col
          transition-transform duration-200 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="h-14 md:h-16 flex items-center px-4 md:px-6 border-b border-border gap-2">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <span className="font-bold text-base md:text-lg text-primary tracking-widest flex-1 min-w-0 truncate">
            OCTAGON //
          </span>
          <button
            className="md:hidden text-muted-foreground hover:text-foreground transition-colors p-1"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 border transition-colors ${
                    isActive(link.href)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-transparent text-muted-foreground hover:border-border hover:bg-muted"
                  }`}
                >
                  <link.icon className="w-4 h-4 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-border text-[10px] text-muted-foreground leading-relaxed">
          SECURE CONNECTION ESTABLISHED
          <br />
          LOCAL NODE ACTIVE
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Mobile top bar — hidden on desktop */}
        <div className="h-14 flex items-center px-4 border-b border-border md:hidden shrink-0 bg-card">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-muted-foreground hover:text-primary transition-colors p-1 mr-2"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors p-1 mr-1">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <span className="font-bold text-sm text-primary tracking-widest">OCTAGON //</span>
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
