import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./database";
import {
  insertClienteSchema,
  insertAgendamentoSchema,
  insertServicoSchema,
  insertProdutoSchema,
  type Cliente,
  type Agendamento,
  type Servico,
  type Produto,
  type AgendamentoComDetalhes,
} from "@shared/schema";
import {
  addAppointmentTag,
  removeAppointmentTag,
  sendInactiveClientNotification,
} from "./onesignal-service";

export async function registerRoutes(app: Express): Promise<Server> {
  // ===== CLIENTES ROUTES =====
  
  // GET /api/clientes - List all clients
  app.get("/api/clientes", (req, res) => {
    try {
      const clientes = db.prepare("SELECT * FROM clientes ORDER BY nome").all() as Cliente[];
      res.json(clientes);
    } catch (error) {
      console.error("Error fetching clientes:", error);
      res.status(500).json({ error: "Failed to fetch clientes" });
    }
  });

  // GET /api/clientes/:id - Get single client
  app.get("/api/clientes/:id", (req, res) => {
    try {
      const cliente = db.prepare("SELECT * FROM clientes WHERE id = ?").get(req.params.id) as Cliente | undefined;
      if (!cliente) {
        return res.status(404).json({ error: "Cliente not found" });
      }
      res.json(cliente);
    } catch (error) {
      console.error("Error fetching cliente:", error);
      res.status(500).json({ error: "Failed to fetch cliente" });
    }
  });

  // GET /api/clientes/:id/agendamentos - Get client's appointments with details
  app.get("/api/clientes/:id/agendamentos", (req, res) => {
    try {
      const agendamentos = db.prepare(`
        SELECT 
          a.*,
          c.id as 'cliente.id',
          c.nome as 'cliente.nome',
          c.telefone as 'cliente.telefone',
          c.email as 'cliente.email',
          c.pontos as 'cliente.pontos',
          s.id as 'servico.id',
          s.nome as 'servico.nome',
          s.descricao as 'servico.descricao',
          s.preco as 'servico.preco',
          s.duracao as 'servico.duracao'
        FROM agendamentos a
        JOIN clientes c ON a.clienteId = c.id
        JOIN servicos s ON a.servicoId = s.id
        WHERE a.clienteId = ?
        ORDER BY a.dataHora DESC
      `).all(req.params.id) as any[];

      const formatted: AgendamentoComDetalhes[] = agendamentos.map((row) => ({
        id: row.id,
        clienteId: row.clienteId,
        servicoId: row.servicoId,
        dataHora: row.dataHora,
        status: row.status,
        observacoes: row.observacoes,
        cliente: {
          id: row["cliente.id"],
          nome: row["cliente.nome"],
          telefone: row["cliente.telefone"],
          email: row["cliente.email"],
          pontos: row["cliente.pontos"],
        },
        servico: {
          id: row["servico.id"],
          nome: row["servico.nome"],
          descricao: row["servico.descricao"],
          preco: row["servico.preco"],
          duracao: row["servico.duracao"],
        },
      }));

      res.json(formatted);
    } catch (error) {
      console.error("Error fetching client agendamentos:", error);
      res.status(500).json({ error: "Failed to fetch client agendamentos" });
    }
  });

  // POST /api/clientes - Create new client
  app.post("/api/clientes", (req, res) => {
    try {
      const data = insertClienteSchema.parse(req.body);
      const result = db.prepare(`
        INSERT INTO clientes (nome, telefone, email, pontos)
        VALUES (?, ?, ?, 0)
      `).run(data.nome, data.telefone, data.email || null);

      const cliente = db.prepare("SELECT * FROM clientes WHERE id = ?").get(result.lastInsertRowid) as Cliente;
      res.status(201).json(cliente);
    } catch (error: any) {
      console.error("Error creating cliente:", error);
      res.status(400).json({ error: error.message || "Failed to create cliente" });
    }
  });

  // PATCH /api/clientes/:id - Update client
  app.patch("/api/clientes/:id", (req, res) => {
    try {
      const data = insertClienteSchema.parse(req.body);
      db.prepare(`
        UPDATE clientes
        SET nome = ?, telefone = ?, email = ?
        WHERE id = ?
      `).run(data.nome, data.telefone, data.email || null, req.params.id);

      const cliente = db.prepare("SELECT * FROM clientes WHERE id = ?").get(req.params.id) as Cliente;
      res.json(cliente);
    } catch (error: any) {
      console.error("Error updating cliente:", error);
      res.status(400).json({ error: error.message || "Failed to update cliente" });
    }
  });

  // DELETE /api/clientes/:id - Delete client
  app.delete("/api/clientes/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM clientes WHERE id = ?").run(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting cliente:", error);
      res.status(500).json({ error: "Failed to delete cliente" });
    }
  });

  // ===== SERVICOS ROUTES =====
  
  // GET /api/servicos - List all services
  app.get("/api/servicos", (req, res) => {
    try {
      const servicos = db.prepare("SELECT * FROM servicos ORDER BY nome").all() as Servico[];
      res.json(servicos);
    } catch (error) {
      console.error("Error fetching servicos:", error);
      res.status(500).json({ error: "Failed to fetch servicos" });
    }
  });

  // POST /api/servicos - Create new service
  app.post("/api/servicos", (req, res) => {
    try {
      const data = insertServicoSchema.parse(req.body);
      const result = db.prepare(`
        INSERT INTO servicos (nome, descricao, preco, duracao)
        VALUES (?, ?, ?, ?)
      `).run(data.nome, data.descricao || null, data.preco, data.duracao);

      const servico = db.prepare("SELECT * FROM servicos WHERE id = ?").get(result.lastInsertRowid) as Servico;
      res.status(201).json(servico);
    } catch (error: any) {
      console.error("Error creating servico:", error);
      res.status(400).json({ error: error.message || "Failed to create servico" });
    }
  });

  // ===== PRODUTOS ROUTES =====
  
  // GET /api/produtos - List all products
  app.get("/api/produtos", (req, res) => {
    try {
      const produtos = db.prepare("SELECT * FROM produtos ORDER BY nome").all() as Produto[];
      res.json(produtos);
    } catch (error) {
      console.error("Error fetching produtos:", error);
      res.status(500).json({ error: "Failed to fetch produtos" });
    }
  });

  // POST /api/produtos - Create new product
  app.post("/api/produtos", (req, res) => {
    try {
      const data = insertProdutoSchema.parse(req.body);
      const result = db.prepare(`
        INSERT INTO produtos (nome, descricao, preco, estoque)
        VALUES (?, ?, ?, ?)
      `).run(data.nome, data.descricao || null, data.preco, data.estoque);

      const produto = db.prepare("SELECT * FROM produtos WHERE id = ?").get(result.lastInsertRowid) as Produto;
      res.status(201).json(produto);
    } catch (error: any) {
      console.error("Error creating produto:", error);
      res.status(400).json({ error: error.message || "Failed to create produto" });
    }
  });

  // ===== AGENDAMENTOS ROUTES =====
  
  // GET /api/agendamentos - List all appointments with details
  app.get("/api/agendamentos", (req, res) => {
    try {
      const agendamentos = db.prepare(`
        SELECT 
          a.*,
          c.id as 'cliente.id',
          c.nome as 'cliente.nome',
          c.telefone as 'cliente.telefone',
          c.email as 'cliente.email',
          c.pontos as 'cliente.pontos',
          s.id as 'servico.id',
          s.nome as 'servico.nome',
          s.descricao as 'servico.descricao',
          s.preco as 'servico.preco',
          s.duracao as 'servico.duracao'
        FROM agendamentos a
        JOIN clientes c ON a.clienteId = c.id
        JOIN servicos s ON a.servicoId = s.id
        ORDER BY a.dataHora DESC
      `).all() as any[];

      const formatted: AgendamentoComDetalhes[] = agendamentos.map((row) => ({
        id: row.id,
        clienteId: row.clienteId,
        servicoId: row.servicoId,
        dataHora: row.dataHora,
        status: row.status,
        observacoes: row.observacoes,
        cliente: {
          id: row["cliente.id"],
          nome: row["cliente.nome"],
          telefone: row["cliente.telefone"],
          email: row["cliente.email"],
          pontos: row["cliente.pontos"],
        },
        servico: {
          id: row["servico.id"],
          nome: row["servico.nome"],
          descricao: row["servico.descricao"],
          preco: row["servico.preco"],
          duracao: row["servico.duracao"],
        },
      }));

      res.json(formatted);
    } catch (error) {
      console.error("Error fetching agendamentos:", error);
      res.status(500).json({ error: "Failed to fetch agendamentos" });
    }
  });

  // POST /api/agendamentos - Create new appointment
  app.post("/api/agendamentos", async (req, res) => {
    try {
      const data = insertAgendamentoSchema.parse(req.body);
      const result = db.prepare(`
        INSERT INTO agendamentos (clienteId, servicoId, dataHora, status, observacoes)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        data.clienteId,
        data.servicoId,
        data.dataHora,
        data.status,
        data.observacoes || null
      );

      // Add OneSignal tag for appointment reminder
      await addAppointmentTag(Number(result.lastInsertRowid), data.dataHora);

      const agendamento = db.prepare("SELECT * FROM agendamentos WHERE id = ?").get(result.lastInsertRowid) as Agendamento;
      res.status(201).json(agendamento);
    } catch (error: any) {
      console.error("Error creating agendamento:", error);
      res.status(400).json({ error: error.message || "Failed to create agendamento" });
    }
  });

  // PATCH /api/agendamentos/:id - Update appointment
  app.patch("/api/agendamentos/:id", async (req, res) => {
    try {
      const data = insertAgendamentoSchema.parse(req.body);
      const id = Number(req.params.id);

      // Get previous status
      const previous = db.prepare("SELECT * FROM agendamentos WHERE id = ?").get(id) as Agendamento | undefined;
      
      if (!previous) {
        return res.status(404).json({ error: "Agendamento not found" });
      }

      // Update appointment
      db.prepare(`
        UPDATE agendamentos
        SET clienteId = ?, servicoId = ?, dataHora = ?, status = ?, observacoes = ?
        WHERE id = ?
      `).run(
        data.clienteId,
        data.servicoId,
        data.dataHora,
        data.status,
        data.observacoes || null,
        id
      );

      // Loyalty points system: Award 10 points when status changes to "done"
      if (previous.status !== "done" && data.status === "done") {
        db.prepare("UPDATE clientes SET pontos = pontos + 10 WHERE id = ?").run(data.clienteId);
        console.log(`✅ Awarded 10 loyalty points to client ${data.clienteId}`);
      }

      // Update OneSignal tags
      if (data.status === "done" || data.status === "cancelled") {
        await removeAppointmentTag(id);
      } else {
        await addAppointmentTag(id, data.dataHora);
      }

      const agendamento = db.prepare("SELECT * FROM agendamentos WHERE id = ?").get(id) as Agendamento;
      res.json(agendamento);
    } catch (error: any) {
      console.error("Error updating agendamento:", error);
      res.status(400).json({ error: error.message || "Failed to update agendamento" });
    }
  });

  // DELETE /api/agendamentos/:id - Delete appointment
  app.delete("/api/agendamentos/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      await removeAppointmentTag(id);
      db.prepare("DELETE FROM agendamentos WHERE id = ?").run(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting agendamento:", error);
      res.status(500).json({ error: "Failed to delete agendamento" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
