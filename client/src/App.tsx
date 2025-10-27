import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { BottomNavigation } from "@/components/bottom-navigation";

import Agenda from "@/pages/agenda";
import Clientes from "@/pages/clientes";
import Servicos from "@/pages/servicos";
import Produtos from "@/pages/produtos";
import Relatorios from "@/pages/relatorios";
import Configuracoes from "@/pages/configuracoes";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="flex-1 overflow-hidden pb-16">
        <Switch>
          <Route path="/" component={Agenda} />
          <Route path="/clientes" component={Clientes} />
          <Route path="/servicos" component={Servicos} />
          <Route path="/produtos" component={Produtos} />
          <Route path="/relatorios" component={Relatorios} />
          <Route path="/configuracoes" component={Configuracoes} />
          <Route component={NotFound} />
        </Switch>
      </div>
      <BottomNavigation />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
