import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Users, Calendar, DollarSign, CheckCircle, XCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { AgendamentoComDetalhes, Cliente, Servico } from "@shared/schema";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  Pie,
  PieChart,
  Legend,
} from "recharts";

export default function Relatorios() {
  const { data: agendamentos, isLoading: loadingAgendamentos } = useQuery<AgendamentoComDetalhes[]>({
    queryKey: ["/api/agendamentos"],
  });

  const { data: clientes, isLoading: loadingClientes } = useQuery<Cliente[]>({
    queryKey: ["/api/clientes"],
  });

  const { data: servicos, isLoading: loadingServicos } = useQuery<Servico[]>({
    queryKey: ["/api/servicos"],
  });

  const isLoading = loadingAgendamentos || loadingClientes || loadingServicos;

  // Calcular estatísticas
  const totalClientes = clientes?.length || 0;
  const totalAgendamentos = agendamentos?.length || 0;
  const agendamentosConcluidos = agendamentos?.filter(a => a.status === "done").length || 0;
  const faturamentoTotal = agendamentos
    ?.filter(a => a.status === "done")
    .reduce((sum, a) => sum + a.servico.preco, 0) || 0;

  // Estatísticas por status
  const statusData = [
    {
      name: "Concluído",
      value: agendamentos?.filter(a => a.status === "done").length || 0,
      color: "hsl(var(--chart-5))",
    },
    {
      name: "Confirmado",
      value: agendamentos?.filter(a => a.status === "confirmed").length || 0,
      color: "hsl(var(--chart-4))",
    },
    {
      name: "Pendente",
      value: agendamentos?.filter(a => a.status === "pending").length || 0,
      color: "hsl(var(--chart-3))",
    },
    {
      name: "Cancelado",
      value: agendamentos?.filter(a => a.status === "cancelled").length || 0,
      color: "hsl(var(--chart-2))",
    },
  ];

  // Serviços mais populares
  const servicosPopulares = servicos
    ?.map((servico) => ({
      name: servico.nome,
      total: agendamentos?.filter(a => a.servicoId === servico.id && a.status === "done").length || 0,
      receita: agendamentos
        ?.filter(a => a.servicoId === servico.id && a.status === "done")
        .reduce((sum, a) => sum + servico.preco, 0) || 0,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5) || [];

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="p-3 sm:p-4">
        <h1 className="text-xl sm:text-2xl font-heading font-semibold text-foreground mb-4 sm:mb-6">
          Relatórios
        </h1>

        {/* Cards de Estatísticas */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4 rounded" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-20 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-1 sm:gap-2 space-y-0 pb-1.5 sm:pb-2 p-3 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground leading-tight">
                    Faturamento Total
                  </CardTitle>
                  <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                  <div className="text-lg sm:text-2xl font-bold text-foreground">
                    R$ {faturamentoTotal.toFixed(2)}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                    {agendamentosConcluidos} serviços
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-1 sm:gap-2 space-y-0 pb-1.5 sm:pb-2 p-3 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground leading-tight">
                    Clientes
                  </CardTitle>
                  <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                  <div className="text-lg sm:text-2xl font-bold text-foreground">
                    {totalClientes}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                    Cadastrados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-1 sm:gap-2 space-y-0 pb-1.5 sm:pb-2 p-3 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground leading-tight">
                    Agendamentos
                  </CardTitle>
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                  <div className="text-lg sm:text-2xl font-bold text-foreground">
                    {totalAgendamentos}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                    Total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-1 sm:gap-2 space-y-0 pb-1.5 sm:pb-2 p-3 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground leading-tight">
                    Conclusão
                  </CardTitle>
                  <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                  <div className="text-lg sm:text-2xl font-bold text-foreground">
                    {totalAgendamentos > 0
                      ? Math.round((agendamentosConcluidos / totalAgendamentos) * 100)
                      : 0}%
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                    {agendamentosConcluidos} de {totalAgendamentos}
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Gráficos */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 mb-4 sm:mb-6">
          {/* Serviços Mais Populares */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Serviços Mais Populares
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-80 flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : servicosPopulares.length === 0 ? (
                <div className="h-80 flex items-center justify-center text-center">
                  <div>
                    <TrendingUp className="w-12 h-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      Nenhum serviço concluído ainda
                    </p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={servicosPopulares}>
                    <XAxis
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                      }}
                    />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Status dos Agendamentos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Status dos Agendamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-80 flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : totalAgendamentos === 0 ? (
                <div className="h-80 flex items-center justify-center text-center">
                  <div>
                    <Calendar className="w-12 h-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      Nenhum agendamento cadastrado
                    </p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ""
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Receita por Serviço */}
        {!isLoading && servicosPopulares.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Receita por Serviço
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={servicosPopulares} layout="vertical">
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    width={120}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                    formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                  />
                  <Bar dataKey="receita" fill="hsl(var(--chart-1))" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
