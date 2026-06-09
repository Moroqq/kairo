export async function initNotifications(): Promise<void> {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
}

export async function notify(title: string, body: string): Promise<void> {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  new Notification(title, { body, icon: '/icon.png' });
}

export async function notifyDeadline(taskTitle: string, minutesLeft: number): Promise<void> {
  const timeLabel = minutesLeft <= 0 ? 'OVERDUE' : `${minutesLeft}m left`;
  await notify(`[${timeLabel}] ${taskTitle}`, 'Task deadline approaching');
}

export async function notifyP1(taskTitle: string): Promise<void> {
  await notify(`P1 Task: ${taskTitle}`, 'Critical task requires immediate attention');
}
