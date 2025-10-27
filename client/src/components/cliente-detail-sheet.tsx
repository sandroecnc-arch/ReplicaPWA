import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User, Star, Calendar, Phone, Instagram, Edit, Trash2, X } from "lucide-react";
import { insertClienteSchema, type InsertCliente, type Cliente, type AgendamentoComDetalhes } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface ClienteDetailSheetProps {
  cliente: Cliente;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

export function ClienteDetailSheet({ cliente, open, onOpenChange }: ClienteDetailSheetProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: agendamentos, isLoading } = useQuery<AgendamentoComDetalhes[]>({
    queryKey: ["/api/clientes", cliente.id, "agendamentos"],
    enabled: open,
  });

  const form = useForm<InsertCliente>({
    resolver: zodResolver(insertClienteSchema),
    defaultValues: {
      nome: cliente.nome,
      telefone: cliente.telefone,
      email: cliente.email || "",
      instagram: cliente.instagram || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertCliente) =>
      apiRequest("PATCH", `/api/clientes/${cliente.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
      toast({
        title: "Cliente atualizado",
        description: "Os dados do cliente foram atualizados com sucesso.",
      });
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar",
        description: "Ocorreu um erro ao atualizar o cliente.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/clientes/${cliente.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
      toast({
        title: "Cliente excluído",
        description: "O cliente foi excluído com sucesso.",
      });
      setShowDeleteDialog(false);
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir o cliente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertCliente) => {
    updateMutation.mutate(data);
  };

  const clienteAgendamentos = agendamentos || [];
  const totalPontos = cliente.pontos;
  const agendamentosConcluidos = clienteAgendamentos.filter(a => a.status === "done").length;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-[540px] overflow-y-auto">
          <SheetHeader>
            <div className="flex items-start justify-between">
              <SheetTitle>Ficha do Cliente</SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                data-testid="button-close-sheet"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Cabeçalho do Cliente */}
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="w-10 h-10 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-foreground mb-1">
                  {cliente.nome}
                </h2>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{cliente.telefone}</span>
                  </div>
                  {cliente.instagram && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Instagram className="w-4 h-4" />
                      <span>{cliente.instagram}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Programa de Fidelidade */}
            <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary fill-primary" />
                  Programa de Fidelidade
                </h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary">{totalPontos}</span>
                  <span className="text-sm text-muted-foreground">pontos acumulados</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {agendamentosConcluidos} serviço{agendamentosConcluidos !== 1 ? "s" : ""} concluído{agendamentosConcluidos !== 1 ? "s" : ""}
                </p>
              </div>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="historico" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="historico" data-testid="tab-historico">
                  Histórico
                </TabsTrigger>
                <TabsTrigger value="informacoes" data-testid="tab-informacoes">
                  Informações
                </TabsTrigger>
              </TabsList>

              <TabsContent value="historico" className="space-y-4 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-foreground">
                    Histórico de Agendamentos
                  </h3>
                  <Badge variant="secondary">
                    {clienteAgendamentos.length} total
                  </Badge>
                </div>

                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Card key={i} className="p-3">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </Card>
                    ))}
                  </div>
                ) : clienteAgendamentos.length === 0 ? (
                  <Card className="p-8 text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      Nenhum agendamento registrado
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {clienteAgendamentos
                      .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime())
                      .map((agendamento) => (
                        <Card key={agendamento.id} className="p-3">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium text-foreground">
                                {format(parseISO(agendamento.dataHora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                            <Badge className={statusColors[agendamento.status]} data-testid={`badge-status-${agendamento.id}`}>
                              {statusLabels[agendamento.status]}
                            </Badge>
                          </div>
                          <p className="text-sm text-foreground font-medium mb-1">
                            {agendamento.servico.nome}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            R$ {agendamento.servico.preco.toFixed(2)} • {agendamento.servico.duracao} min
                          </p>
                          {agendamento.status === "done" && (
                            <div className="mt-2 pt-2 border-t border-card-border">
                              <div className="flex items-center gap-1 text-xs text-primary">
                                <Star className="w-3 h-3 fill-current" />
                                <span>+10 pontos</span>
                              </div>
                            </div>
                          )}
                        </Card>
                      ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="informacoes" className="space-y-4 mt-4">
                {!isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground">Nome</label>
                      <p className="mt-1 text-sm text-muted-foreground">{cliente.nome}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Telefone</label>
                      <p className="mt-1 text-sm text-muted-foreground">{cliente.telefone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Instagram</label>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {cliente.instagram || "Não informado"}
                      </p>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(true)}
                        className="flex-1"
                        data-testid="button-editar-cliente"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => setShowDeleteDialog(true)}
                        className="flex-1"
                        data-testid="button-excluir-cliente"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="nome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-nome-edit" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="telefone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-telefone-edit" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="instagram"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instagram (opcional)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                  placeholder="@usuario"
                                  {...field}
                                  className="pl-10"
                                  data-testid="input-instagram-edit"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            form.reset();
                          }}
                          className="flex-1"
                          data-testid="button-cancelar-edicao"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          disabled={updateMutation.isPending}
                          className="flex-1"
                          data-testid="button-salvar-edicao"
                        >
                          {updateMutation.isPending ? "Salvando..." : "Salvar"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente? Todos os agendamentos relacionados
              também serão excluídos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancelar-delete-cliente">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirmar-delete-cliente"
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
