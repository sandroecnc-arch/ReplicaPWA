import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "db.sqlite");
export const db = new Database(dbPath);

// Enable foreign keys
db.pragma("foreign_keys = ON");

export function initializeDatabase() {
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      nome TEXT NOT NULL,
      telefone TEXT NOT NULL,
      email TEXT,
      instagram TEXT,
      pontos INTEGER DEFAULT 0,
      alergias TEXT,
      preferencias TEXT,
      FOREIGN KEY (userId) REFERENCES usuarios(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS servicos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      nome TEXT NOT NULL,
      descricao TEXT,
      preco REAL NOT NULL,
      duracao INTEGER NOT NULL,
      FOREIGN KEY (userId) REFERENCES usuarios(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      nome TEXT NOT NULL,
      marca TEXT,
      categoria TEXT NOT NULL,
      colorHex TEXT,
      qty INTEGER NOT NULL DEFAULT 0,
      minQty INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (userId) REFERENCES usuarios(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS agendamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      clienteId INTEGER NOT NULL,
      servicoId INTEGER NOT NULL,
      dataHora TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'confirmed', 'done', 'cancelled')),
      observacoes TEXT,
      FOREIGN KEY (userId) REFERENCES usuarios(id) ON DELETE CASCADE,
      FOREIGN KEY (clienteId) REFERENCES clientes(id) ON DELETE CASCADE,
      FOREIGN KEY (servicoId) REFERENCES servicos(id) ON DELETE CASCADE
    );
  `);

  // No default seeding for services - each user creates their own

  // Add alergias and preferencias columns if they don't exist (migration)
  try {
    const clientesTableInfo = db.pragma("table_info(clientes)") as Array<{ name: string }>;
    const clientesColumns = clientesTableInfo.map(col => col.name);
    
    if (!clientesColumns.includes("alergias")) {
      db.exec("ALTER TABLE clientes ADD COLUMN alergias TEXT");
      console.log("✅ Added 'alergias' column to clientes table");
    }
    
    if (!clientesColumns.includes("preferencias")) {
      db.exec("ALTER TABLE clientes ADD COLUMN preferencias TEXT");
      console.log("✅ Added 'preferencias' column to clientes table");
    }

    // Add userId columns to existing tables if they don't exist (migration for auth)
    if (!clientesColumns.includes("userId")) {
      db.exec("ALTER TABLE clientes ADD COLUMN userId INTEGER");
      console.log("✅ Added 'userId' column to clientes table");
    }

    const servicosTableInfo = db.pragma("table_info(servicos)") as Array<{ name: string }>;
    const servicosColumns = servicosTableInfo.map(col => col.name);
    if (!servicosColumns.includes("userId")) {
      db.exec("ALTER TABLE servicos ADD COLUMN userId INTEGER");
      console.log("✅ Added 'userId' column to servicos table");
    }

    const produtosTableInfo = db.pragma("table_info(produtos)") as Array<{ name: string }>;
    const produtosColumns = produtosTableInfo.map(col => col.name);
    if (!produtosColumns.includes("userId")) {
      db.exec("ALTER TABLE produtos ADD COLUMN userId INTEGER");
      console.log("✅ Added 'userId' column to produtos table");
    }

    const agendamentosTableInfo = db.pragma("table_info(agendamentos)") as Array<{ name: string }>;
    const agendamentosColumns = agendamentosTableInfo.map(col => col.name);
    if (!agendamentosColumns.includes("userId")) {
      db.exec("ALTER TABLE agendamentos ADD COLUMN userId INTEGER");
      console.log("✅ Added 'userId' column to agendamentos table");
    }
  } catch (error) {
    console.error("Error during migration:", error);
  }

  console.log("✅ Database initialized successfully at:", dbPath);
}
