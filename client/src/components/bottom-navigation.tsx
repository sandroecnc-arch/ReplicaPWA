import { Calendar, Users, Scissors, Package, BarChart3, Settings } from "lucide-react";
import { useLocation } from "wouter";

const navItems = [
  { path: "/", icon: Calendar, label: "Agenda" },
  { path: "/clientes", icon: Users, label: "Clientes" },
  { path: "/servicos", icon: Scissors, label: "Serviços" },
  { path: "/produtos", icon: Package, label: "Produtos" },
  { path: "/relatorios", icon: BarChart3, label: "Relatórios" },
  { path: "/configuracoes", icon: Settings, label: "Configurações" },
];

export function BottomNavigation() {
  const [location, setLocation] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-card-border safe-area-bottom z-50">
      <div className="grid grid-cols-6 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;

          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={`
                flex flex-col items-center justify-center gap-1 transition-colors
                hover-elevate active-elevate-2
                ${isActive ? "text-primary" : "text-muted-foreground"}
              `}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "fill-current" : ""}`} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
