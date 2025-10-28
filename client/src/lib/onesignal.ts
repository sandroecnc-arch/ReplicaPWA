declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred?: any[];
  }
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

export async function getOneSignalUserId(): Promise<string | null> {
  if (!window.OneSignal) {
    return null;
  }

  try {
    const userId = await window.OneSignal.User.PushSubscription.id;
    return userId;
  } catch (error) {
    console.error('Error getting OneSignal user ID:', error);
    return null;
  }
}

export function isOneSignalInitialized(): boolean {
  return !!window.OneSignal;
}
