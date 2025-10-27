import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./database";
import {
  insertClienteSchema,
  insertAgendamentoSchema,
  insertServicoSchema,
  insertProdutoSchema,
  insertUsuarioSchema,
  loginSchema,
  type Cliente,
  type Agendamento,
  type Servico,
  type Produto,
  type Usuario,
  type AgendamentoComDetalhes,
} from "@shared/schema";
import {
  addAppointmentTag,
  removeAppointmentTag,
  sendInactiveClientNotification,
} from "./onesignal-service";
import { authMiddleware, generateToken, type AuthRequest } from "./auth-middleware";
import bcrypt from "bcryptjs";

export async function registerRoutes(app: Express): Promise<Server> {
  // ===== AUTH ROUTES =====
  
  // POST /api/auth/register - Register new user
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = insertUsuarioSchema.parse(req.body);

      const existing = db.prepare("SELECT id FROM usuarios WHERE email = ?").get(data.email);
      if (existing) {
        return res.status(400).json({ error: "Email já está em uso" });
      }

      const passwordHash = await bcrypt.hash(data.password, 10);
      
      const result = db.prepare(`
        INSERT INTO usuarios (email, passwordHash)
        VALUES (?, ?)
      `).run(data.email, passwordHash);

      const token = generateToken(Number(result.lastInsertRowid));

      res.status(201).json({
        token,
        user: {
          id: result.lastInsertRowid,
          email: data.email,
        },
      });
    } catch (error: any) {
      console.error("Error registering user:", error);
      res.status(400).json({ error: error.message || "Falha ao registrar usuário" });
    }
  });

  // POST /api/auth/login - Login user
  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);

      const user = db.prepare("SELECT * FROM usuarios WHERE email = ?").get(data.email) as Usuario | undefined;

      if (!user) {
        return res.status(401).json({ error: "Email ou senha inválidos" });
      }

      const isValid = await bcrypt.compare(data.password, user.passwordHash);

      if (!isValid) {
        return res.status(401).json({ error: "Email ou senha inválidos" });
      }

      const token = generateToken(user.id);

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
        },
      });
    } catch (error: any) {
      console.error("Error logging in:", error);
      res.status(400).json({ error: error.message || "Falha ao fazer login" });
    }
  });

  // GET /api/auth/me - Get current user
  app.get("/api/auth/me", authMiddleware, (req: AuthRequest, res) => {
    try {
      const user = db.prepare("SELECT id, email FROM usuarios WHERE id = ?").get(req.user!.id) as Omit<Usuario, "passwordHash"> | undefined;
      
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      res.json({ user });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Falha ao buscar usuário" });
    }
  });

  // ===== CLIENTES ROUTES =====
  
  // GET /api/clientes - List all clients
  app.get("/api/clientes", authMiddleware, (req: AuthRequest, res) => {
    try {
      const clientes = db.prepare("SELECT * FROM clientes WHERE userId = ? ORDER BY nome").all(req.user!.id) as Cliente[];
      res.json(clientes);
    } catch (error) {
      console.error("Error fetching clientes:", error);
      res.status(500).json({ error: "Failed to fetch clientes" });
    }
  });

  // GET /api/clientes/:id - Get single client
  app.get("/api/clientes/:id", authMiddleware, (req: AuthRequest, res) => {
    try {
      const cliente = db.prepare("SELECT * FROM clientes WHERE id = ? AND userId = ?").get(req.params.id, req.user!.id) as Cliente | undefined;
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
  app.get("/api/clientes/:id/agendamentos", authMiddleware, (req: AuthRequest, res) => {
    try {
      const agendamentos = db.prepare(`
        SELECT 
          a.*,
          c.id as 'cliente.id',
          c.nome as 'cliente.nome',
          c.telefone as 'cliente.telefone',
          c.email as 'cliente.email',
          c.instagram as 'cliente.instagram',
          c.pontos as 'cliente.pontos',
          s.id as 'servico.id',
          s.nome as 'servico.nome',
          s.descricao as 'servico.descricao',
          s.preco as 'servico.preco',
          s.duracao as 'servico.duracao'
        FROM agendamentos a
        JOIN clientes c ON a.clienteId = c.id
        JOIN servicos s ON a.servicoId = s.id
        WHERE a.clienteId = ? AND a.userId = ?
        ORDER BY a.dataHora DESC
      `).all(req.params.id, req.user!.id) as any[];

      const formatted: AgendamentoComDetalhes[] = agendamentos.map((row) => ({
        id: row.id,
        userId: row.userId,
        clienteId: row.clienteId,
        servicoId: row.servicoId,
        dataHora: row.dataHora,
        status: row.status,
        observacoes: row.observacoes,
        cliente: {
          id: row["cliente.id"],
          userId: row["cliente.userId"],
          nome: row["cliente.nome"],
          telefone: row["cliente.telefone"],
          email: row["cliente.email"],
          instagram: row["cliente.instagram"],
          pontos: row["cliente.pontos"],
        },
        servico: {
          id: row["servico.id"],
          userId: row["servico.userId"],
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
  app.post("/api/clientes", authMiddleware, (req: AuthRequest, res) => {
    try {
      const data = insertClienteSchema.parse(req.body);
      const result = db.prepare(`
        INSERT INTO clientes (userId, nome, telefone, email, instagram, pontos, alergias, preferencias)
        VALUES (?, ?, ?, ?, ?, 0, ?, ?)
      `).run(req.user!.id, data.nome, data.telefone, data.email || null, data.instagram || null, data.alergias || null, data.preferencias || null);

      const cliente = db.prepare("SELECT * FROM clientes WHERE id = ?").get(result.lastInsertRowid) as Cliente;
      res.status(201).json(cliente);
    } catch (error: any) {
      console.error("Error creating cliente:", error);
      res.status(400).json({ error: error.message || "Failed to create cliente" });
    }
  });

  // PATCH /api/clientes/:id - Update client
  app.patch("/api/clientes/:id", authMiddleware, (req: AuthRequest, res) => {
    try {
      const data = insertClienteSchema.parse(req.body);
      
      const existing = db.prepare("SELECT id FROM clientes WHERE id = ? AND userId = ?").get(req.params.id, req.user!.id);
      if (!existing) {
        return res.status(404).json({ error: "Cliente not found" });
      }

      db.prepare(`
        UPDATE clientes
        SET nome = ?, telefone = ?, email = ?, instagram = ?, alergias = ?, preferencias = ?
        WHERE id = ? AND userId = ?
      `).run(data.nome, data.telefone, data.email || null, data.instagram || null, data.alergias || null, data.preferencias || null, req.params.id, req.user!.id);

      const cliente = db.prepare("SELECT * FROM clientes WHERE id = ?").get(req.params.id) as Cliente;
      res.json(cliente);
    } catch (error: any) {
      console.error("Error updating cliente:", error);
      res.status(400).json({ error: error.message || "Failed to update cliente" });
    }
  });

  // DELETE /api/clientes/:id - Delete client
  app.delete("/api/clientes/:id", authMiddleware, (req: AuthRequest, res) => {
    try {
      const existing = db.prepare("SELECT id FROM clientes WHERE id = ? AND userId = ?").get(req.params.id, req.user!.id);
      if (!existing) {
        return res.status(404).json({ error: "Cliente not found" });
      }

      db.prepare("DELETE FROM clientes WHERE id = ? AND userId = ?").run(req.params.id, req.user!.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting cliente:", error);
      res.status(500).json({ error: "Failed to delete cliente" });
    }
  });

  // ===== SERVICOS ROUTES =====
  
  // GET /api/servicos - List all services
  app.get("/api/servicos", authMiddleware, (req: AuthRequest, res) => {
    try {
      const servicos = db.prepare("SELECT * FROM servicos WHERE userId = ? ORDER BY nome").all(req.user!.id) as Servico[];
      res.json(servicos);
    } catch (error) {
      console.error("Error fetching servicos:", error);
      res.status(500).json({ error: "Failed to fetch servicos" });
    }
  });

  // POST /api/servicos - Create new service
  app.post("/api/servicos", authMiddleware, (req: AuthRequest, res) => {
    try {
      const data = insertServicoSchema.parse(req.body);
      const result = db.prepare(`
        INSERT INTO servicos (userId, nome, descricao, preco, duracao)
        VALUES (?, ?, ?, ?, ?)
      `).run(req.user!.id, data.nome, data.descricao || null, data.preco, data.duracao);

      const servico = db.prepare("SELECT * FROM servicos WHERE id = ?").get(result.lastInsertRowid) as Servico;
      res.status(201).json(servico);
    } catch (error: any) {
      console.error("Error creating servico:", error);
      res.status(400).json({ error: error.message || "Failed to create servico" });
    }
  });

  // PATCH /api/servicos/:id - Update service
  app.patch("/api/servicos/:id", authMiddleware, (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const data = insertServicoSchema.partial().parse(req.body);
      
      const existing = db.prepare("SELECT id FROM servicos WHERE id = ? AND userId = ?").get(id, req.user!.id);
      if (!existing) {
        return res.status(404).json({ error: "Servico not found" });
      }

      const fields: string[] = [];
      const values: any[] = [];
      
      if (data.nome !== undefined) {
        fields.push("nome = ?");
        values.push(data.nome);
      }
      if (data.descricao !== undefined) {
        fields.push("descricao = ?");
        values.push(data.descricao || null);
      }
      if (data.preco !== undefined) {
        fields.push("preco = ?");
        values.push(data.preco);
      }
      if (data.duracao !== undefined) {
        fields.push("duracao = ?");
        values.push(data.duracao);
      }
      
      if (fields.length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }
      
      values.push(id);
      values.push(req.user!.id);
      
      db.prepare(`UPDATE servicos SET ${fields.join(", ")} WHERE id = ? AND userId = ?`).run(...values);
      
      const servico = db.prepare("SELECT * FROM servicos WHERE id = ?").get(id) as Servico;
      
      res.json(servico);
    } catch (error: any) {
      console.error("Error updating servico:", error);
      res.status(400).json({ error: error.message || "Failed to update servico" });
    }
  });

  // DELETE /api/servicos/:id - Delete service
  app.delete("/api/servicos/:id", authMiddleware, (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const existing = db.prepare("SELECT id FROM servicos WHERE id = ? AND userId = ?").get(id, req.user!.id);
      if (!existing) {
        return res.status(404).json({ error: "Servico not found" });
      }

      db.prepare("DELETE FROM servicos WHERE id = ? AND userId = ?").run(id, req.user!.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting servico:", error);
      res.status(500).json({ error: "Failed to delete servico" });
    }
  });

  // ===== PRODUTOS ROUTES =====
  
  // GET /api/produtos - List all products
  app.get("/api/produtos", authMiddleware, (req: AuthRequest, res) => {
    try {
      const produtos = db.prepare("SELECT * FROM produtos WHERE userId = ? ORDER BY nome").all(req.user!.id) as Produto[];
      res.json(produtos);
    } catch (error) {
      console.error("Error fetching produtos:", error);
      res.status(500).json({ error: "Failed to fetch produtos" });
    }
  });

  // POST /api/produtos - Create new product
  app.post("/api/produtos", authMiddleware, (req: AuthRequest, res) => {
    try {
      const data = insertProdutoSchema.parse(req.body);
      const result = db.prepare(`
        INSERT INTO produtos (userId, nome, marca, categoria, colorHex, qty, minQty)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(req.user!.id, data.nome, data.marca || null, data.categoria, data.colorHex || null, data.qty, data.minQty);

      const produto = db.prepare("SELECT * FROM produtos WHERE id = ?").get(result.lastInsertRowid) as Produto;
      res.status(201).json(produto);
    } catch (error: any) {
      console.error("Error creating produto:", error);
      res.status(400).json({ error: error.message || "Failed to create produto" });
    }
  });

  // PATCH /api/produtos/:id - Update product
  app.patch("/api/produtos/:id", authMiddleware, (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const data = insertProdutoSchema.partial().parse(req.body);
      
      const existing = db.prepare("SELECT id FROM produtos WHERE id = ? AND userId = ?").get(id, req.user!.id);
      if (!existing) {
        return res.status(404).json({ error: "Produto not found" });
      }

      const fields: string[] = [];
      const values: any[] = [];
      
      if (data.nome !== undefined) {
        fields.push("nome = ?");
        values.push(data.nome);
      }
      if (data.marca !== undefined) {
        fields.push("marca = ?");
        values.push(data.marca || null);
      }
      if (data.categoria !== undefined) {
        fields.push("categoria = ?");
        values.push(data.categoria);
      }
      if (data.colorHex !== undefined) {
        fields.push("colorHex = ?");
        values.push(data.colorHex || null);
      }
      if (data.qty !== undefined) {
        fields.push("qty = ?");
        values.push(data.qty);
      }
      if (data.minQty !== undefined) {
        fields.push("minQty = ?");
        values.push(data.minQty);
      }
      
      if (fields.length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }
      
      values.push(id);
      values.push(req.user!.id);
      
      db.prepare(`UPDATE produtos SET ${fields.join(", ")} WHERE id = ? AND userId = ?`).run(...values);
      
      const produto = db.prepare("SELECT * FROM produtos WHERE id = ?").get(id) as Produto;
      
      res.json(produto);
    } catch (error: any) {
      console.error("Error updating produto:", error);
      res.status(400).json({ error: error.message || "Failed to update produto" });
    }
  });

  // DELETE /api/produtos/:id - Delete product
  app.delete("/api/produtos/:id", authMiddleware, (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const existing = db.prepare("SELECT id FROM produtos WHERE id = ? AND userId = ?").get(id, req.user!.id);
      if (!existing) {
        return res.status(404).json({ error: "Produto not found" });
      }

      db.prepare("DELETE FROM produtos WHERE id = ? AND userId = ?").run(id, req.user!.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting produto:", error);
      res.status(500).json({ error: "Failed to delete produto" });
    }
  });

  // ===== AGENDAMENTOS ROUTES =====
  
  // GET /api/agendamentos - List all appointments with details
  app.get("/api/agendamentos", authMiddleware, (req: AuthRequest, res) => {
    try {
      const agendamentos = db.prepare(`
        SELECT 
          a.*,
          c.id as 'cliente.id',
          c.nome as 'cliente.nome',
          c.telefone as 'cliente.telefone',
          c.email as 'cliente.email',
          c.instagram as 'cliente.instagram',
          c.pontos as 'cliente.pontos',
          s.id as 'servico.id',
          s.nome as 'servico.nome',
          s.descricao as 'servico.descricao',
          s.preco as 'servico.preco',
          s.duracao as 'servico.duracao'
        FROM agendamentos a
        JOIN clientes c ON a.clienteId = c.id
        JOIN servicos s ON a.servicoId = s.id
        WHERE a.userId = ?
        ORDER BY a.dataHora DESC
      `).all(req.user!.id) as any[];

      const formatted: AgendamentoComDetalhes[] = agendamentos.map((row) => ({
        id: row.id,
        userId: row.userId,
        clienteId: row.clienteId,
        servicoId: row.servicoId,
        dataHora: row.dataHora,
        status: row.status,
        observacoes: row.observacoes,
        cliente: {
          id: row["cliente.id"],
          userId: row["cliente.userId"],
          nome: row["cliente.nome"],
          telefone: row["cliente.telefone"],
          email: row["cliente.email"],
          instagram: row["cliente.instagram"],
          pontos: row["cliente.pontos"],
        },
        servico: {
          id: row["servico.id"],
          userId: row["servico.userId"],
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
  app.post("/api/agendamentos", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertAgendamentoSchema.parse(req.body);
      const result = db.prepare(`
        INSERT INTO agendamentos (userId, clienteId, servicoId, dataHora, status, observacoes)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        req.user!.id,
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
  app.patch("/api/agendamentos/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertAgendamentoSchema.parse(req.body);
      const id = Number(req.params.id);

      // Get previous status
      const previous = db.prepare("SELECT * FROM agendamentos WHERE id = ? AND userId = ?").get(id, req.user!.id) as Agendamento | undefined;
      
      if (!previous) {
        return res.status(404).json({ error: "Agendamento not found" });
      }

      // Update appointment
      db.prepare(`
        UPDATE agendamentos
        SET clienteId = ?, servicoId = ?, dataHora = ?, status = ?, observacoes = ?
        WHERE id = ? AND userId = ?
      `).run(
        data.clienteId,
        data.servicoId,
        data.dataHora,
        data.status,
        data.observacoes || null,
        id,
        req.user!.id
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
  app.delete("/api/agendamentos/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      const existing = db.prepare("SELECT id FROM agendamentos WHERE id = ? AND userId = ?").get(id, req.user!.id);
      if (!existing) {
        return res.status(404).json({ error: "Agendamento not found" });
      }

      await removeAppointmentTag(id);
      db.prepare("DELETE FROM agendamentos WHERE id = ? AND userId = ?").run(id, req.user!.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting agendamento:", error);
      res.status(500).json({ error: "Failed to delete agendamento" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
