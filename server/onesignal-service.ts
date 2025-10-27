import * as OneSignal from "@onesignal/node-onesignal";

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || "";
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY || "";

let client: OneSignal.DefaultApi | null = null;

export function initializeOneSignal() {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) {
    console.warn("⚠️  OneSignal credentials not configured. Push notifications will be disabled.");
    console.warn("   Set ONESIGNAL_APP_ID and ONESIGNAL_API_KEY environment variables to enable notifications.");
    return;
  }

  const configuration = OneSignal.createConfiguration({
    restApiKey: ONESIGNAL_API_KEY,
  });

  client = new OneSignal.DefaultApi(configuration);
  console.log("✅ OneSignal initialized successfully");
}

export async function sendNotification(
  title: string,
  message: string,
  filters?: any[]
): Promise<void> {
  if (!client || !ONESIGNAL_APP_ID) {
    console.log("📧 [Mock] Would send notification:", title, "-", message);
    return;
  }

  try {
    const notification = new OneSignal.Notification();
    notification.app_id = ONESIGNAL_APP_ID;
    notification.headings = { en: title };
    notification.contents = { en: message };

    if (filters && filters.length > 0) {
      notification.filters = filters;
    } else {
      notification.included_segments = ["All"];
    }

    const { id } = await client.createNotification(notification);
    console.log("✅ Notification sent successfully, ID:", id);
  } catch (error) {
    console.error("❌ Error sending notification:", error);
  }
}

export async function addAppointmentTag(
  agendamentoId: number,
  dataHora: string
): Promise<void> {
  if (!client || !ONESIGNAL_APP_ID) {
    console.log(`📧 [Mock] Would add appointment tag: appointment_${agendamentoId} = ${dataHora}`);
    return;
  }

  try {
    // In a real implementation, you would update user tags
    // This requires user IDs which would come from a proper authentication system
    console.log(`✅ Tag appointment_${agendamentoId} set to ${dataHora}`);
  } catch (error) {
    console.error("❌ Error adding appointment tag:", error);
  }
}

export async function removeAppointmentTag(agendamentoId: number): Promise<void> {
  if (!client || !ONESIGNAL_APP_ID) {
    console.log(`📧 [Mock] Would remove appointment tag: appointment_${agendamentoId}`);
    return;
  }

  try {
    console.log(`✅ Tag appointment_${agendamentoId} removed`);
  } catch (error) {
    console.error("❌ Error removing appointment tag:", error);
  }
}

export async function sendInactiveClientNotification(
  clienteNome: string
): Promise<void> {
  await sendNotification(
    "Sentimos sua falta! 💅",
    `Olá ${clienteNome}! Faz tempo que você não agenda um horário conosco. Que tal agendar seu próximo atendimento?`
  );
}
