import { useState, useEffect, useRef, useCallback } from "react";

interface UseTimerProps {
  initialTime?: number;
  onTick?: (time: number) => void;
}

export function useTimer({ initialTime = 0, onTick }: UseTimerProps = {}) {
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTime(initialTime);
  }, [initialTime]);

  const stop = useCallback(() => {
    setIsRunning(false);
    setTime(initialTime);
  }, [initialTime]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setTime((prevTime) => {
          const newTime = prevTime + 1;
          onTick?.(newTime);
          return newTime;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, onTick]);

  return {
    time,
    isRunning,
    start,
    pause,
    reset,
    stop,
  };
}
