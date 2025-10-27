import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProdutoSchema, type InsertProduto, type Produto } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

interface ProdutoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produto?: Produto | null;
}

export function ProdutoDialog({ open, onOpenChange, produto }: ProdutoDialogProps) {
  const { toast } = useToast();
  const isEditing = !!produto;

  const form = useForm<InsertProduto>({
    resolver: zodResolver(insertProdutoSchema),
    defaultValues: {
      nome: "",
      marca: "",
      categoria: "",
      colorHex: "",
      qty: 0,
      minQty: 0,
    },
  });

  useEffect(() => {
    if (produto) {
      form.reset({
        nome: produto.nome,
        marca: produto.marca || "",
        categoria: produto.categoria,
        colorHex: produto.colorHex || "",
        qty: produto.qty,
        minQty: produto.minQty,
      });
    } else {
      form.reset({
        nome: "",
        marca: "",
        categoria: "",
        colorHex: "",
        qty: 0,
        minQty: 0,
      });
    }
  }, [produto, form]);

  const createMutation = useMutation({
    mutationFn: (data: InsertProduto) =>
      apiRequest("POST", "/api/produtos", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/produtos"] });
      toast({
        title: "Produto cadastrado",
        description: "O produto foi cadastrado com sucesso.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Erro ao cadastrar",
        description: "Ocorreu um erro ao cadastrar o produto. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertProduto) =>
      apiRequest("PATCH", `/api/produtos/${produto?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/produtos"] });
      toast({
        title: "Produto atualizado",
        description: "O produto foi atualizado com sucesso.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar",
        description: "Ocorreu um erro ao atualizar o produto. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertProduto) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Produto" : "Novo Produto"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Vermelho Intenso"
                      {...field}
                      data-testid="input-produto-nome"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="marca"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Marca (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Risqué"
                      {...field}
                      data-testid="input-produto-marca"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Esmalte, Base, Top Coat"
                      {...field}
                      data-testid="input-produto-categoria"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="colorHex"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor (opcional)</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="#FF0000"
                        {...field}
                        data-testid="input-produto-color-hex"
                      />
                    </FormControl>
                    <Input
                      type="color"
                      value={field.value || "#000000"}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="w-16 h-10 p-1 cursor-pointer"
                      data-testid="input-produto-color-picker"
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="qty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade em Estoque</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                          field.onChange(isNaN(value) ? 0 : value);
                        }}
                        data-testid="input-produto-qty"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minQty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade Mínima</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                          field.onChange(isNaN(value) ? 0 : value);
                        }}
                        data-testid="input-produto-min-qty"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancelar-produto"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                data-testid="button-salvar-produto"
              >
                {isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
