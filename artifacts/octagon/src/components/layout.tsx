import { Link, useLocation } from "wouter";
import { Activity, Brain, ShieldAlert, GitMerge, Network, PlaySquare } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "SYS_STATUS", icon: Activity },
    { href: "/memory", label: "MEMORY_BANK", icon: Brain },
    { href: "/doctrine", label: "DOCTRINE", icon: ShieldAlert },
    { href: "/workflows", label: "WORKFLOWS", icon: GitMerge },
    { href: "/routing", label: "ROUTING", icon: Network },
    { href: "/scenarios", label: "SCENARIOS", icon: PlaySquare },
  ];

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-mono uppercase text-xs tracking-wider">
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <span className="font-bold text-lg text-primary tracking-widest">OCTAGON //</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2 border ${
                    location === link.href || (link.href !== "/" && location.startsWith(link.href))
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-transparent text-muted-foreground hover:border-border hover:bg-muted"
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-border text-[10px] text-muted-foreground">
          SECURE CONNECTION ESTABLISHED
          <br />
          LOCAL NODE ACTIVE
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
