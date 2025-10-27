import { Moon, Sun, Bell, Sparkles, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/theme-provider";

export default function Configuracoes() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="p-3 sm:p-4">
        <h1 className="text-xl sm:text-2xl font-heading font-semibold text-foreground mb-4 sm:mb-6">
          Configurações
        </h1>

        <div className="max-w-2xl space-y-4 sm:space-y-6">
          {/* Tema */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                {theme === "dark" ? (
                  <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                ) : (
                  <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                )}
                Aparência
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Personalize o tema visual do aplicativo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="dark-mode" className="text-sm sm:text-base font-medium">
                    Modo Escuro
                  </Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Ative para reduzir o brilho da tela
                  </p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={theme === "dark"}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                  data-testid="switch-dark-mode"
                />
              </div>
            </CardContent>
          </Card>

          {/* Notificações */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Notificações
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Configure lembretes e notificações push
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-medium text-foreground">
                  Lembretes de Agendamento
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  As notificações push são configuradas automaticamente através do OneSignal.
                  Os clientes receberão lembretes 24h, 3h e 1h antes dos agendamentos.
                </p>
              </div>

              <div className="space-y-0.5 pt-2 border-t border-card-border">
                <p className="text-xs sm:text-sm font-medium text-foreground">
                  Clientes Inativos
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  O sistema envia automaticamente notificações para reengajar clientes
                  que não têm agendamentos concluídos nos últimos 30 dias.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Sistema de Fidelidade */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Sistema de Fidelidade
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Recompense seus clientes fiéis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-medium text-foreground">
                  Pontos Automáticos
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Quando um agendamento é marcado como "Concluído", o cliente recebe
                  automaticamente 10 pontos de fidelidade.
                </p>
              </div>

              <div className="p-3 sm:p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs sm:text-sm text-foreground">
                  <strong>Como funciona:</strong> A cada serviço concluído, seus clientes
                  acumulam pontos que podem ser trocados por descontos ou serviços especiais.
                  Acompanhe os pontos de cada cliente na ficha individual.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Sobre e Suporte */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Sobre o Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
              <div className="space-y-2">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  <strong className="text-foreground">Manicure Studio Lite</strong>
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Sistema completo de gerenciamento para estúdios de manicure com
                  agendamentos, clientes, programa de fidelidade e notificações push.
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-3">
                  Versão 1.0.0 - Progressive Web App
                </p>
              </div>

              <div className="pt-3 border-t border-card-border">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-primary" />
                  <p className="text-xs sm:text-sm font-medium text-foreground">
                    Suporte
                  </p>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                  Precisa de ajuda? Entre em contato conosco:
                </p>
                <a 
                  href="mailto:manicurestudiolite@gmail.com"
                  className="text-xs sm:text-sm text-primary hover:underline font-medium"
                  data-testid="link-email-suporte"
                >
                  manicurestudiolite@gmail.com
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
