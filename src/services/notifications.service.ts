import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';

let permissionGranted = false;

export async function initNotifications(): Promise<void> {
  permissionGranted = await isPermissionGranted();
  if (!permissionGranted) {
    const permission = await requestPermission();
    permissionGranted = permission === 'granted';
  }
}

export async function notify(title: string, body: string): Promise<void> {
  if (!permissionGranted) return;
  await sendNotification({ title, body });
}

export async function notifyDeadline(taskTitle: string, minutesLeft: number): Promise<void> {
  const timeLabel = minutesLeft <= 0 ? 'OVERDUE' : `${minutesLeft}m left`;
  await notify(`[${timeLabel}] ${taskTitle}`, 'Task deadline approaching');
}

export async function notifyP1(taskTitle: string): Promise<void> {
  await notify(`P1 Task: ${taskTitle}`, 'Critical task requires immediate attention');
}
