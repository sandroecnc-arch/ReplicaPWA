import cron from "node-cron";
import { db } from "./database";
import { sendInactiveClientNotification } from "./onesignal-service";
import type { Cliente } from "@shared/schema";

export function startCronJobs() {
  // Run daily at 10:00 AM to check for inactive clients
  cron.schedule("0 10 * * *", async () => {
    console.log("🔄 Running inactive clients check...");
    
    try {
      // Find clients who haven't had a completed appointment in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

      const inactiveClients = db.prepare(`
        SELECT DISTINCT c.*
        FROM clientes c
        WHERE NOT EXISTS (
          SELECT 1 FROM agendamentos a
          WHERE a.clienteId = c.id
          AND a.status = 'done'
          AND a.dataHora >= ?
        )
        AND EXISTS (
          SELECT 1 FROM agendamentos a2
          WHERE a2.clienteId = c.id
        )
      `).all(thirtyDaysAgoISO) as Cliente[];

      console.log(`📊 Found ${inactiveClients.length} inactive client(s)`);

      // Send reengagement notifications
      for (const cliente of inactiveClients) {
        await sendInactiveClientNotification(cliente.nome);
        console.log(`📧 Sent reengagement notification to: ${cliente.nome}`);
      }

      console.log("✅ Inactive clients check completed");
    } catch (error) {
      console.error("❌ Error in inactive clients cron job:", error);
    }
  });

  console.log("✅ Cron jobs started (Inactive clients check: Daily at 10:00 AM)");
}
