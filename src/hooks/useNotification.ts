import { useState } from "react";

const NOTIFICATION_DURATION_MS = 2500;

export function useNotification(): [string | null, (msg: string) => void] {
  const [notification, setNotification] = useState<string | null>(null);

  function showNotification(msg: string) {
    setNotification(msg);
    setTimeout(() => setNotification(null), NOTIFICATION_DURATION_MS);
  }

  return [notification, showNotification];
}
