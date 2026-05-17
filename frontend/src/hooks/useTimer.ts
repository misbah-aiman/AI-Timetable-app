import { useEffect, useRef, useState } from 'react';

// Returns elapsed seconds since the given startTime (Date/ISO string)
export const useTimer = (startTime: string | null, isActive: boolean) => {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isActive || !startTime) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setElapsed(0);
      return;
    }

    const start = new Date(startTime).getTime();

    const tick = () => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    };

    tick(); // immediate first tick
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startTime, isActive]);

  // Format as HH:MM:SS
  const formatted = (() => {
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
  })();

  return { elapsed, formatted };
};
