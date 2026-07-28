import { useEffect, useRef, useState } from "react";

const BOUNCE_OFFSETS = [1, -1, 0];
const BOUNCE_STEP_MS = 160;

export default function Wheel({
  options,
  targetValue,
  spinToken,
  spinMs = 1200,
  label,
  onLanded,
}) {
  const [displayed, setDisplayed] = useState("?");
  const [phase, setPhase] = useState("idle");
  const rafRef = useRef(null);
  const timersRef = useRef([]);

  const clearAll = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  useEffect(() => clearAll, []);

  useEffect(() => {
    if (!spinToken || targetValue == null || options.length === 0) return;
    clearAll();

    const targetIndex = Math.max(options.indexOf(targetValue), 0);
    const totalSteps = options.length * 3 + targetIndex;
    const start = performance.now();

    setPhase("spinning");

    const tick = (now) => {
      const progress = Math.min((now - start) / spinMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const step = Math.floor(eased * totalSteps);
      setDisplayed(options[step % options.length]);

      if (progress >= 1) {
        bounce();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    const bounce = () => {
      setPhase("settling");
      BOUNCE_OFFSETS.forEach((offset, i) => {
        const t = setTimeout(() => {
          const idx = (targetIndex + offset + options.length) % options.length;
          setDisplayed(options[idx]);
          if (offset === 0) {
            setPhase("done");
            onLanded?.(targetValue);
          }
        }, i * BOUNCE_STEP_MS);
        timersRef.current.push(t);
      });
    };

    rafRef.current = requestAnimationFrame(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinToken]);

  return (
    <div className="wheel">
      {label && <div className="wheel-label">{label}</div>}
      <div className={`wheel-display wheel-${phase}`}>{displayed}</div>
    </div>
  );
}
