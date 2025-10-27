declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred?: any[];
  }
}

let isInitialized = false;

export async function initializeOneSignal() {
  if (isInitialized) return;

  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;

  if (!appId) {
    console.warn('OneSignal App ID não configurado. Configure VITE_ONESIGNAL_APP_ID para habilitar notificações.');
    return;
  }

  return new Promise<void>((resolve) => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function (OneSignal: any) {
      try {
        await OneSignal.init({
          appId: appId,
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerParam: { scope: '/push/onesignal/' },
          serviceWorkerPath: 'push/onesignal/OneSignalSDKWorker.js',
          notifyButton: {
            enable: false,
          },
        });
        isInitialized = true;
        console.log('✅ OneSignal initialized successfully');
        resolve();
      } catch (error) {
        console.error('❌ Error initializing OneSignal:', error);
        resolve();
      }
    });
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!window.OneSignal) {
    console.error('OneSignal not loaded');
    return false;
  }

  try {
    const permission = await window.OneSignal.Notifications.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

export function getNotificationPermission(): NotificationPermission {
  if ('Notification' in window) {
    return Notification.permission;
  }
  return 'default';
}
