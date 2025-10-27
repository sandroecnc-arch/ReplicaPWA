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
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t-2 border-border safe-area-bottom z-50 shadow-lg">
      <div className="grid grid-cols-6 h-16 sm:h-18">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;

          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={`
                flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-all duration-200
                hover-elevate active-elevate-2
                ${isActive ? "text-primary font-semibold" : "text-foreground/60"}
              `}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <Icon 
                className={`w-6 h-6 sm:w-5 sm:h-5 transition-all ${isActive ? "fill-current scale-110" : ""}`} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`text-[10px] sm:text-xs leading-tight ${isActive ? "font-semibold" : "font-medium"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
