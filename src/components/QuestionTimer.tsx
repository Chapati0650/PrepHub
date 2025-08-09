import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  secondsPerQuestion: number;        // e.g., 75
  questionKey: string | number;      // change this when the question changes (id or index)
  running: boolean;                  // true if Timed Mode is on
  warnAt?: number;                   // when to switch to "danger" UI (default 10s)
  onExpire: () => void;              // called when time hits 0
};

export default function QuestionTimer({
  secondsPerQuestion,
  questionKey,
  running,
  warnAt = 10,
  onExpire,
}: Props) {
  const [remaining, setRemaining] = useState(secondsPerQuestion);
  const raf = useRef<number | null>(null);
  const endAt = useRef<number>(performance.now() + secondsPerQuestion * 1000);
  const pausedAt = useRef<number | null>(null);

  // Reset when the question changes or secondsPerQuestion changes
  useEffect(() => {
    setRemaining(secondsPerQuestion);
    endAt.current = performance.now() + secondsPerQuestion * 1000;
    pausedAt.current = null;
  }, [questionKey, secondsPerQuestion]);

  // Ticker
  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const msLeft = Math.max(0, endAt.current - performance.now());
      setRemaining(Math.ceil(msLeft / 1000));
      if (msLeft <= 0) {
        if (raf.current) cancelAnimationFrame(raf.current);
        onExpire();
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [running, onExpire, questionKey]);

  const isWarn = remaining <= warnAt;
  const pct = useMemo(() => Math.max(0, remaining / secondsPerQuestion), [remaining, secondsPerQuestion]);

  const pause = () => {
    if (pausedAt.current !== null) return;
    pausedAt.current = performance.now();
  };
  const resume = () => {
    if (pausedAt.current === null) return;
    const pausedFor = performance.now() - pausedAt.current;
    endAt.current += pausedFor;
    pausedAt.current = null;
  };

  // Auto-pause UI state follows running prop; expose manual control for users too
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-8 w-8">
        <svg viewBox="0 0 36 36" className="h-8 w-8 -rotate-90">
          <path
            className="text-gray-300"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            d="M18 2 a 16 16 0 1 1 0 32 a 16 16 0 1 1 0 -32"
          />
          <path
            className={isWarn ? "text-red-500" : "text-green-500"}
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeDasharray={`${pct * 100}, 100`}
            d="M18 2 a 16 16 0 1 1 0 32 a 16 16 0 1 1 0 -32"
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center text-xs font-semibold">
          {remaining}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={pause}
          className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
        >
          Pause
        </button>
        <button
          type="button"
          onClick={resume}
          className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
        >
          Resume
        </button>
      </div>
    </div>
  );
}
