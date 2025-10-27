import { z } from "zod";

// Clientes (Clients) Schema
export const clienteSchema = z.object({
  id: z.number(),
  nome: z.string(),
  telefone: z.string(),
  email: z.string().email().optional(),
  instagram: z.string().optional(),
  pontos: z.number().default(0),
});

export const insertClienteSchema = clienteSchema.omit({ id: true, pontos: true }).extend({
  nome: z.string().trim().min(1, "Nome é obrigatório"),
  telefone: z.string().trim().min(1, "Telefone é obrigatório"),
  email: z.string().email().optional().or(z.literal("")).transform(val => val === "" ? undefined : val),
  instagram: z.string().optional().transform(val => val === "" ? undefined : val),
});

export type Cliente = z.infer<typeof clienteSchema>;
export type InsertCliente = z.infer<typeof insertClienteSchema>;

// Servicos (Services) Schema
export const servicoSchema = z.object({
  id: z.number(),
  nome: z.string(),
  descricao: z.string().optional(),
  preco: z.number(),
  duracao: z.number(), // em minutos
});

export const insertServicoSchema = servicoSchema.omit({ id: true }).extend({
  nome: z.string().trim().min(1, "Nome é obrigatório"),
  duracao: z.number().min(1, "Duração deve ser pelo menos 1 minuto"),
  preco: z.number().min(0, "Preço não pode ser negativo"),
});

export type Servico = z.infer<typeof servicoSchema>;
export type InsertServico = z.infer<typeof insertServicoSchema>;

// Produtos (Products) Schema
export const produtoSchema = z.object({
  id: z.number(),
  nome: z.string(),
  marca: z.string().optional(),
  categoria: z.string(),
  colorHex: z.string().optional(),
  qty: z.number(),
  minQty: z.number(),
});

export const insertProdutoSchema = produtoSchema.omit({ id: true }).extend({
  qty: z.number().min(0).default(0),
  minQty: z.number().min(0).default(0),
});

export type Produto = z.infer<typeof produtoSchema>;
export type InsertProduto = z.infer<typeof insertProdutoSchema>;

// Agendamentos (Appointments) Schema
export const agendamentoSchema = z.object({
  id: z.number(),
  clienteId: z.number(),
  servicoId: z.number(),
  dataHora: z.string(), // ISO datetime string
  status: z.enum(["pending", "confirmed", "done", "cancelled"]),
  observacoes: z.string().optional(),
});

export const insertAgendamentoSchema = agendamentoSchema.omit({ id: true }).extend({
  status: z.enum(["pending", "confirmed", "done", "cancelled"]).default("pending"),
});

export type Agendamento = z.infer<typeof agendamentoSchema>;
export type InsertAgendamento = z.infer<typeof insertAgendamentoSchema>;

// Extended types for frontend display
export type AgendamentoComDetalhes = Agendamento & {
  cliente: Cliente;
  servico: Servico;
};

export type ClienteComHistorico = Cliente & {
  agendamentos?: AgendamentoComDetalhes[];
};
