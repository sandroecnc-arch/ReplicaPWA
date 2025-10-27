import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, Plus, User, ChevronLeft, ChevronRight } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { AgendamentoComDetalhes } from "@shared/schema";
import { NovoAgendamentoDialog } from "@/components/novo-agendamento-dialog";
import { EditarAgendamentoDialog } from "@/components/editar-agendamento-dialog";

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  confirmed: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  done: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
};

const statusLabels = {
  pending: "Pendente",
  confirmed: "Confirmado",
  done: "Concluído",
  cancelled: "Cancelado",
};

export default function Agenda() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgendamento, setEditingAgendamento] = useState<AgendamentoComDetalhes | null>(null);

  const { data: agendamentos, isLoading } = useQuery<AgendamentoComDetalhes[]>({
    queryKey: ["/api/agendamentos"],
  });

  const weekStart = startOfWeek(currentDate, { locale: ptBR });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const selectedDayAgendamentos = agendamentos?.filter((ag) =>
    isSameDay(parseISO(ag.dataHora), selectedDate)
  ) || [];

  const previousWeek = () => setCurrentDate(addDays(currentDate, -7));
  const nextWeek = () => setCurrentDate(addDays(currentDate, 7));

  const openWhatsApp = (telefone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanPhone = telefone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b bg-card">
        <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
          <h1 className="text-xl sm:text-2xl font-heading font-semibold text-foreground">Agenda</h1>
          <Button
            size="sm"
            onClick={() => setDialogOpen(true)}
            data-testid="button-novo-agendamento"
            className="sm:h-9"
          >
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Novo Agendamento</span>
          </Button>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={previousWeek}
            data-testid="button-previous-week"
            className="h-8 w-8"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm sm:text-base font-medium text-foreground capitalize">
            {format(weekStart, "MMMM yyyy", { locale: ptBR })}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={nextWeek}
            data-testid="button-next-week"
            className="h-8 w-8"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Week Days */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {weekDays.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            const dayAgendamentos = agendamentos?.filter((ag) =>
              isSameDay(parseISO(ag.dataHora), day)
            ) || [];

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`
                  p-1.5 sm:p-3 rounded-md text-center transition-colors hover-elevate active-elevate-2
                  ${isSelected ? "bg-primary text-primary-foreground" : "bg-card"}
                  ${isToday && !isSelected ? "ring-1 sm:ring-2 ring-primary ring-offset-1 sm:ring-offset-2 ring-offset-background" : ""}
                `}
                data-testid={`button-day-${format(day, "yyyy-MM-dd")}`}
              >
                <div className="text-[10px] sm:text-xs font-medium mb-0.5 sm:mb-1">
                  {format(day, "EEE", { locale: ptBR })}
                </div>
                <div className="text-base sm:text-lg font-semibold mb-0.5 sm:mb-1">
                  {format(day, "dd")}
                </div>
                {dayAgendamentos.length > 0 && (
                  <div className="flex justify-center gap-0.5 sm:gap-1">
                    {dayAgendamentos.slice(0, 3).map((_, i) => (
                      <div
                        key={i}
                        className="w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full bg-current opacity-60"
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Agendamentos do Dia */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        <div className="mb-3 sm:mb-4 flex items-center gap-2 flex-wrap">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          <h2 className="text-base sm:text-lg font-semibold text-foreground">
            {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
          </h2>
          <Badge variant="secondary" className="text-[10px] sm:text-xs">
            {selectedDayAgendamentos.length} agendamento{selectedDayAgendamentos.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : selectedDayAgendamentos.length === 0 ? (
          <Card className="p-8 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Nenhum agendamento
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Não há agendamentos para este dia
            </p>
            <Button onClick={() => setDialogOpen(true)} data-testid="button-criar-agendamento">
              <Plus className="w-4 h-4 mr-2" />
              Criar Agendamento
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {selectedDayAgendamentos
              .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime())
              .map((agendamento) => (
                <Card
                  key={agendamento.id}
                  className="p-4 hover-elevate cursor-pointer transition-all"
                  onClick={() => setEditingAgendamento(agendamento)}
                  data-testid={`card-agendamento-${agendamento.id}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">
                            {agendamento.cliente.nome}
                          </h3>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 flex-shrink-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                            onClick={(e) => openWhatsApp(agendamento.cliente.telefone, e)}
                            data-testid={`button-whatsapp-${agendamento.id}`}
                          >
                            <SiWhatsapp className="w-4 h-4" />
                          </Button>
                        </div>
                        <Badge className={statusColors[agendamento.status]}>
                          {statusLabels[agendamento.status]}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{format(parseISO(agendamento.dataHora), "HH:mm")}</span>
                          <span>•</span>
                          <span>{agendamento.servico.duracao} min</span>
                        </div>
                        <p className="text-sm font-medium text-foreground">
                          {agendamento.servico.nome}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          R$ {agendamento.servico.preco.toFixed(2)}
                        </p>
                      </div>
                      {agendamento.observacoes && (
                        <p className="mt-2 text-sm text-muted-foreground italic">
                          {agendamento.observacoes}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        )}
      </div>

      <NovoAgendamentoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultDate={selectedDate}
      />

      {editingAgendamento && (
        <EditarAgendamentoDialog
          agendamento={editingAgendamento}
          open={!!editingAgendamento}
          onOpenChange={(open) => !open && setEditingAgendamento(null)}
        />
      )}
    </div>
  );
}
