import { useEffect, useState } from "react";
import { Bell, Download, Moon, Sun, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/contexts/auth-context";
import { requestNotificationPermission, getNotificationPermission } from "@/lib/onesignal";
import { useToast } from "@/hooks/use-toast";

export function AppHeader() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const { theme, setTheme } = useTheme();
  const { logout, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Detectar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Capturar evento de instalação
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Verificar permissão de notificação (OneSignal é inicializado via index.html)
    setNotificationPermission(getNotificationPermission());

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
      toast({
        title: "App instalado!",
        description: "O app foi adicionado à sua tela inicial.",
      });
    }

    setDeferredPrompt(null);
  };

  const handleNotificationClick = async () => {
    const permission = await requestNotificationPermission();
    
    if (permission) {
      setNotificationPermission('granted');
      toast({
        title: "Notificações ativadas!",
        description: "Você receberá lembretes dos seus agendamentos.",
      });
    } else {
      toast({
        title: "Permissão negada",
        description: "Você pode ativar as notificações nas configurações do navegador.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">💅</span>
          </div>
          <h1 className="text-lg font-semibold text-foreground">Studio Lite</h1>
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <span className="text-sm text-muted-foreground hidden sm:inline" data-testid="text-user-email">
              {user.email}
            </span>
          )}

          {/* Botão de Tema */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            data-testid="button-toggle-theme"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
            <span className="sr-only">Alternar tema</span>
          </Button>

          {/* Botão de Notificações */}
          {notificationPermission !== 'granted' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNotificationClick}
              data-testid="button-enable-notifications"
              className="relative"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary animate-pulse" />
              <span className="sr-only">Ativar notificações</span>
            </Button>
          )}

          {/* Botão de Instalar App */}
          {!isInstalled && deferredPrompt && (
            <Button
              variant="default"
              size="sm"
              onClick={handleInstallClick}
              data-testid="button-install-app"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Instalar</span>
            </Button>
          )}

          {/* Botão de Logout */}
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            data-testid="button-logout"
          >
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Sair</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
