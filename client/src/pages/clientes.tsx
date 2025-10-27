import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, User, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Cliente } from "@shared/schema";
import { NovoClienteDialog } from "@/components/novo-cliente-dialog";
import { ClienteDetailSheet } from "@/components/cliente-detail-sheet";

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

  const { data: clientes, isLoading } = useQuery<Cliente[]>({
    queryKey: ["/api/clientes"],
  });

  const filteredClientes = clientes?.filter((cliente) =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefone.includes(searchTerm)
  ) || [];

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b bg-card">
        <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
          <h1 className="text-xl sm:text-2xl font-heading font-semibold text-foreground">Clientes</h1>
          <Button
            size="sm"
            onClick={() => setDialogOpen(true)}
            data-testid="button-novo-cliente"
            className="sm:h-9"
          >
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Novo Cliente</span>
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-cliente"
          />
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredClientes.length === 0 ? (
          <Card className="p-8 text-center">
            <User className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {searchTerm ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm
                ? "Tente buscar com outros termos"
                : "Comece adicionando seu primeiro cliente"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setDialogOpen(true)} data-testid="button-criar-cliente">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Cliente
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredClientes.map((cliente) => (
              <Card
                key={cliente.id}
                className="p-3 sm:p-4 hover-elevate cursor-pointer transition-all"
                onClick={() => setSelectedCliente(cliente)}
                data-testid={`card-cliente-${cliente.id}`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">
                      {cliente.nome}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {cliente.telefone}
                    </p>
                    {cliente.email && (
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                        {cliente.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Pontos de Fidelidade */}
                <div className="flex items-center gap-2 pt-2 sm:pt-3 border-t border-card-border">
                  <div className="flex items-center gap-1 text-primary">
                    <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                    <span className="text-xs sm:text-sm font-semibold">{cliente.pontos}</span>
                  </div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">pontos</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCliente(cliente);
                    }}
                    data-testid={`button-ver-ficha-${cliente.id}`}
                  >
                    Ver Ficha
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <NovoClienteDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      {selectedCliente && (
        <ClienteDetailSheet
          cliente={selectedCliente}
          open={!!selectedCliente}
          onOpenChange={(open) => !open && setSelectedCliente(null)}
        />
      )}
    </div>
  );
}
