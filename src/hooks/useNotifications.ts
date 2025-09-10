import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export const useNotifications = () => {
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        setPermissionGranted(permission === 'granted');
      });
    }
  }, []);

  const notifyChargingTimeExceeded = (userName: string, pointId: number, elapsedHours: number) => {
    const message = `${userName}, portes ${elapsedHours} hores carregant al punt ${pointId}. 
                    Si us plau, mou el vehicle quan puguis per permetre l'accés a altres usuaris.`;

    // Notificació del sistema
    if (permissionGranted) {
      new Notification('Temps de Càrrega Excedit', {
        body: message,
        icon: '/favicon.ico',
        tag: `charging-${pointId}` // Evita duplicats
      });
    }

    // Notificació in-app
    toast.warning('Temps de càrrega excedit', {
      description: message,
      duration: 0, // La notificació no desapareix fins que l'usuari la tanqui
      action: {
        label: "D'acord",
        onClick: () => toast.dismiss()
      }
    });
  };

  return { notifyChargingTimeExceeded };
};