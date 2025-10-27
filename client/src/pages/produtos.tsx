import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Plus, AlertTriangle, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import type { Produto } from "@shared/schema";
import { ProdutoDialog } from "@/components/produto-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Produtos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [deletingProduto, setDeletingProduto] = useState<Produto | null>(null);
  const { toast } = useToast();

  const { data: produtos, isLoading } = useQuery<Produto[]>({
    queryKey: ["/api/produtos"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("DELETE", `/api/produtos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/produtos"] });
      toast({
        title: "Produto excluído",
        description: "O produto foi excluído com sucesso.",
      });
      setDeletingProduto(null);
    },
    onError: () => {
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir o produto. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const categorias = Array.from(new Set(produtos?.map((p) => p.categoria) || []));

  const filteredProdutos = produtos?.filter((produto) => {
    const matchesSearch =
      produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (produto.marca?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesCategoria = !selectedCategoria || produto.categoria === selectedCategoria;
    return matchesSearch && matchesCategoria;
  }) || [];

  const handleEdit = (produto: Produto) => {
    setEditingProduto(produto);
    setDialogOpen(true);
  };

  const handleDelete = (produto: Produto) => {
    setDeletingProduto(produto);
  };

  const handleNewProduto = () => {
    setEditingProduto(null);
    setDialogOpen(true);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b bg-card">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-heading font-semibold text-foreground">Produtos</h1>
          <Button
            size="default"
            onClick={handleNewProduto}
            data-testid="button-novo-produto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nome ou marca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-produto"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant={selectedCategoria === null ? "default" : "outline"}
            onClick={() => setSelectedCategoria(null)}
            data-testid="filter-todas-categorias"
          >
            Todas
          </Button>
          {categorias.map((categoria) => (
            <Button
              key={categoria}
              size="sm"
              variant={selectedCategoria === categoria ? "default" : "outline"}
              onClick={() => setSelectedCategoria(categoria)}
              data-testid={`filter-categoria-${categoria.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {categoria}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredProdutos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm || selectedCategoria
                ? "Tente ajustar os filtros de busca"
                : "Adicione seu primeiro produto para começar"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProdutos.map((produto) => {
              const needsRestock = produto.qty <= produto.minQty;
              
              return (
                <Card
                  key={produto.id}
                  className="overflow-hidden"
                  data-testid={`card-produto-${produto.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        {produto.colorHex && (
                          <div
                            className="w-12 h-12 rounded-md border border-border flex-shrink-0"
                            style={{ backgroundColor: produto.colorHex }}
                            data-testid={`color-preview-${produto.id}`}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate" data-testid={`text-produto-nome-${produto.id}`}>
                            {produto.nome}
                          </h3>
                          {produto.marca && (
                            <p className="text-sm text-muted-foreground truncate" data-testid={`text-produto-marca-${produto.id}`}>
                              {produto.marca}
                            </p>
                          )}
                          <Badge variant="outline" className="mt-1" data-testid={`badge-categoria-${produto.id}`}>
                            {produto.categoria}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {needsRestock && (
                      <div className="flex items-center gap-2 p-2 rounded-md bg-destructive/10 border border-destructive/20 mb-3">
                        <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                        <p className="text-xs font-medium text-destructive" data-testid={`alert-estoque-baixo-${produto.id}`}>
                          Reposição necessária
                        </p>
                      </div>
                    )}

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Estoque atual:</span>
                        <span className={`text-sm font-semibold ${needsRestock ? 'text-destructive' : 'text-foreground'}`} data-testid={`text-qty-${produto.id}`}>
                          {produto.qty}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Estoque mínimo:</span>
                        <span className="text-sm font-semibold text-foreground" data-testid={`text-min-qty-${produto.id}`}>
                          {produto.minQty}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleEdit(produto)}
                        data-testid={`button-editar-${produto.id}`}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleDelete(produto)}
                        data-testid={`button-excluir-${produto.id}`}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <ProdutoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        produto={editingProduto}
      />

      <AlertDialog open={!!deletingProduto} onOpenChange={() => setDeletingProduto(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o produto "{deletingProduto?.nome}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancelar-exclusao">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingProduto && deleteMutation.mutate(deletingProduto.id)}
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
