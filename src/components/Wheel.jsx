import { useEffect, useMemo, useRef, useState } from "react";

const ITEM_HEIGHT = 64;
const MAX_TRAVEL_STEPS = 160; // caps reel length regardless of how big the player pool gets

function easeOutQuint(t) {
  return 1 - Math.pow(1 - t, 5);
}

export default function Wheel({
  options,
  targetValue,
  spinToken,
  spinMs = 1400,
  label,
  onLanded,
}) {
  const [translateY, setTranslateY] = useState(0);
  const [phase, setPhase] = useState("idle");
  const rafRef = useRef(null);
  const onLandedRef = useRef(onLanded);
  onLandedRef.current = onLanded;

  const { strip, travelSteps } = useMemo(() => {
    if (options.length === 0 || targetValue == null) {
      return { strip: [], travelSteps: 0 };
    }
    const targetIndex = options.indexOf(targetValue);
    const safeIndex = targetIndex === -1 ? 0 : targetIndex;

    // Fewer loops when the pool is huge, so travel distance stays capped.
    const loops = options.length <= 20 ? 4 : options.length <= 60 ? 2 : 1;
    const travel = Math.min(
      loops * options.length + safeIndex,
      MAX_TRAVEL_STEPS
    );

    const items = [];
    for (let i = 0; i <= travel; i++) {
      const idx =
        (safeIndex - travel + i + options.length * 1000) % options.length;
      items.push(options[idx]);
    }

    return { strip: items, travelSteps: travel };
  }, [options, targetValue]);

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  useEffect(() => {
    if (!spinToken || strip.length === 0) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    setPhase("spinning");
    setTranslateY(0);

    const settledPixels = travelSteps * ITEM_HEIGHT;
    const start = performance.now();

    const frame = (now) => {
      const t = Math.min((now - start) / spinMs, 1);
      const pixels = settledPixels * easeOutQuint(t);
      setTranslateY(-pixels);

      if (t >= 1) {
        setTranslateY(-settledPixels);
        setPhase("done");
        onLandedRef.current?.(targetValue);
        return;
      }
      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinToken]);

  return (
    <div className="wheel">
      {label && <div className="wheel-label">{label}</div>}
      <div className={`wheel-window wheel-${phase}`}>
        {strip.length > 0 ? (
          <div
            className="wheel-strip"
            style={{ transform: `translate3d(0, ${translateY}px, 0)` }}>
            {strip.map((value, i) => (
              <div key={i} className="wheel-item">
                {value}
              </div>
            ))}
          </div>
        ) : (
          <div className="wheel-placeholder">?</div>
        )}
      </div>
    </div>
  );
}
