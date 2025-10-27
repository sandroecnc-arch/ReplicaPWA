import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "db.sqlite");
export const db = new Database(dbPath);

// Enable foreign keys
db.pragma("foreign_keys = ON");

export function initializeDatabase() {
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      telefone TEXT NOT NULL,
      email TEXT,
      instagram TEXT,
      pontos INTEGER DEFAULT 0,
      alergias TEXT,
      preferencias TEXT
    );

    CREATE TABLE IF NOT EXISTS servicos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      descricao TEXT,
      preco REAL NOT NULL,
      duracao INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      marca TEXT,
      categoria TEXT NOT NULL,
      colorHex TEXT,
      qty INTEGER NOT NULL DEFAULT 0,
      minQty INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS agendamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clienteId INTEGER NOT NULL,
      servicoId INTEGER NOT NULL,
      dataHora TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'confirmed', 'done', 'cancelled')),
      observacoes TEXT,
      FOREIGN KEY (clienteId) REFERENCES clientes(id) ON DELETE CASCADE,
      FOREIGN KEY (servicoId) REFERENCES servicos(id) ON DELETE CASCADE
    );
  `);

  // Insert default services if the table is empty
  const servicosCount = db.prepare("SELECT COUNT(*) as count FROM servicos").get() as { count: number };
  
  if (servicosCount.count === 0) {
    const insertServico = db.prepare(`
      INSERT INTO servicos (nome, descricao, preco, duracao)
      VALUES (?, ?, ?, ?)
    `);

    const servicos = [
      ["Manicure Simples", "Manicure básica com esmaltação", 35.0, 45],
      ["Manicure com Francesinha", "Manicure com aplicação de francesinha", 45.0, 60],
      ["Pedicure Simples", "Pedicure básica com esmaltação", 40.0, 50],
      ["Pedicure Completa", "Pedicure com hidratação e massagem", 55.0, 75],
      ["Alongamento de Unhas", "Alongamento com gel ou acrílico", 80.0, 120],
      ["Blindagem", "Tratamento de blindagem para fortalecimento", 60.0, 60],
      ["Esmaltação em Gel", "Aplicação de esmalte em gel", 50.0, 45],
      ["Design de Unhas", "Decoração artística nas unhas", 70.0, 90],
    ];

    for (const servico of servicos) {
      insertServico.run(...servico);
    }
  }

  // Add alergias and preferencias columns if they don't exist (migration)
  try {
    const tableInfo = db.pragma("table_info(clientes)") as Array<{ name: string }>;
    const columnNames = tableInfo.map(col => col.name);
    
    if (!columnNames.includes("alergias")) {
      db.exec("ALTER TABLE clientes ADD COLUMN alergias TEXT");
      console.log("✅ Added 'alergias' column to clientes table");
    }
    
    if (!columnNames.includes("preferencias")) {
      db.exec("ALTER TABLE clientes ADD COLUMN preferencias TEXT");
      console.log("✅ Added 'preferencias' column to clientes table");
    }
  } catch (error) {
    console.error("Error during migration:", error);
  }

  console.log("✅ Database initialized successfully at:", dbPath);
}
