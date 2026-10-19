import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * Global top loading bar.
 *
 * The app uses <BrowserRouter> (not a data router), so there is no
 * `useNavigation` state to observe. Instead the bar animates on every
 * location change — covering both eager and lazy-loaded routes — and
 * stands in for the previous per-shell RouteProgress indicator.
 *
 * Uses the `accent-500` gold token from the design system.
 */
export function GlobalLoadingBar() {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    // Don't animate on the very first mount
    if (first.current) {
      first.current = false;
      return;
    }

    setVisible(true);
    setProgress(25);
    const t1 = window.setTimeout(() => setProgress(70), 80);
    const t2 = window.setTimeout(() => setProgress(100), 260);
    const t3 = window.setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 480);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [location.pathname]);

  return (
    <div
      aria-hidden
      className="fixed top-0 left-0 right-0 z-[500] h-[2px] pointer-events-none"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 200ms ease" }}
    >
      <div
        className="h-full bg-accent-500"
        style={{
          width: `${progress}%`,
          transition: "width 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </div>
  );
}
