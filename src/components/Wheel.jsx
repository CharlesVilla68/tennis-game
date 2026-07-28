import { useEffect, useMemo, useRef, useState } from "react";

const ITEM_HEIGHT = 64;
const LOOPS = 4;
const SETTLE_MS = 260;

export default function Wheel({
  options,
  targetValue,
  spinToken,
  spinMs = 1500,
  label,
  onLanded,
}) {
  const [translateY, setTranslateY] = useState(0);
  const [transitionMs, setTransitionMs] = useState(0);
  const [easing, setEasing] = useState("linear");
  const [phase, setPhase] = useState("idle");
  const timersRef = useRef([]);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  useEffect(() => clearTimers, []);

  // Build the long vertical strip: several full loops of the options,
  // then a run up to the target, then one extra item to overshoot into,
  // then the target again so the reel can rock back onto it.
  const strip = useMemo(() => {
    if (options.length === 0 || targetValue == null) return [];
    const targetIndex = options.indexOf(targetValue);
    const safeIndex = targetIndex === -1 ? 0 : targetIndex;

    const items = [];
    for (let i = 0; i < LOOPS; i++) items.push(...options);
    items.push(...options.slice(0, safeIndex + 1));

    const overshootValue = options[(safeIndex + 1) % options.length];
    items.push(overshootValue);
    items.push(options[safeIndex]);

    return items;
  }, [options, targetValue]);

  useEffect(() => {
    if (!spinToken || strip.length === 0) return;
    clearTimers();

    // Snap back to the top instantly, no animation, before spinning again.
    setTransitionMs(0);
    setEasing("linear");
    setTranslateY(0);
    setPhase("spinning");

    const startTimer = setTimeout(() => {
      const overshootIndex = strip.length - 2;
      const finalIndex = strip.length - 1;
      const mainDurationMs = Math.max(spinMs - SETTLE_MS, 300);

      // Phase 1: fast scroll that decelerates, sliding one item past the winner.
      setTransitionMs(mainDurationMs);
      setEasing("cubic-bezier(0.15, 0.7, 0.25, 1)");
      setTranslateY(-overshootIndex * ITEM_HEIGHT);

      const settleTimer = setTimeout(() => {
        // Phase 2: rock back up one item to land on the actual winner.
        setPhase("settling");
        setTransitionMs(SETTLE_MS);
        setEasing("ease-in-out");
        setTranslateY(-finalIndex * ITEM_HEIGHT);

        const doneTimer = setTimeout(() => {
          setPhase("done");
          onLanded?.(targetValue);
        }, SETTLE_MS);
        timersRef.current.push(doneTimer);
      }, mainDurationMs);
      timersRef.current.push(settleTimer);
    }, 20);
    timersRef.current.push(startTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinToken]);

  return (
    <div className="wheel">
      {label && <div className="wheel-label">{label}</div>}
      <div className={`wheel-window wheel-${phase}`}>
        {strip.length > 0 ? (
          <div
            className="wheel-strip"
            style={{
              transform: `translateY(${translateY}px)`,
              transition: `transform ${transitionMs}ms ${easing}`,
            }}>
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
