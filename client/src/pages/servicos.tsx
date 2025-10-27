import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Clock, DollarSign, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import type { Servico } from "@shared/schema";
import { ServicoDialog } from "@/components/servico-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Servicos() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingServico, setEditingServico] = useState<Servico | null>(null);
  const [deletingServico, setDeletingServico] = useState<Servico | null>(null);
  const { toast } = useToast();

  const { data: servicos, isLoading } = useQuery<Servico[]>({
    queryKey: ["/api/servicos"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("DELETE", `/api/servicos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/servicos"] });
      toast({
        title: "Serviço excluído",
        description: "O serviço foi excluído com sucesso.",
      });
      setDeletingServico(null);
    },
    onError: () => {
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir o serviço. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (servico: Servico) => {
    setEditingServico(servico);
    setDialogOpen(true);
  };

  const handleDelete = (servico: Servico) => {
    setDeletingServico(servico);
  };

  const handleNewServico = () => {
    setEditingServico(null);
    setDialogOpen(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b bg-card">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-heading font-semibold text-foreground">Serviços</h1>
          <Button
            size="default"
            onClick={handleNewServico}
            data-testid="button-novo-servico"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Serviço
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </Card>
            ))}
          </div>
        ) : !servicos || servicos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum serviço cadastrado
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Adicione seu primeiro serviço para começar
            </p>
            <Button onClick={handleNewServico}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Serviço
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {servicos.map((servico) => (
              <Card
                key={servico.id}
                className="overflow-hidden"
                data-testid={`card-servico-${servico.id}`}
              >
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg text-foreground mb-2" data-testid={`text-servico-nome-${servico.id}`}>
                    {servico.nome}
                  </h3>

                  {servico.descricao && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2" data-testid={`text-servico-descricao-${servico.id}`}>
                      {servico.descricao}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground" data-testid={`text-duracao-${servico.id}`}>
                        {servico.duracao} min
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground font-semibold" data-testid={`text-preco-${servico.id}`}>
                        {formatPrice(servico.preco)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleEdit(servico)}
                      data-testid={`button-editar-${servico.id}`}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleDelete(servico)}
                      data-testid={`button-excluir-${servico.id}`}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ServicoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        servico={editingServico}
      />

      <AlertDialog open={!!deletingServico} onOpenChange={() => setDeletingServico(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o serviço "{deletingServico?.nome}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancelar-exclusao">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingServico && deleteMutation.mutate(deletingServico.id)}
              data-testid="button-confirmar-exclusao"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
