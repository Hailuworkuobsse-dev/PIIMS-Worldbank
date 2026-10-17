import { useEffect, useState } from "react";
import { useNavigation } from "react-router-dom";

/**
 * Combined loading indicator:
 * - Shows for React Router navigations (`useNavigation`)
 * - Shows for slow Suspense boundaries (> 150ms)
 *
 * Uses the `accent-500` gold token from the design system.
 */
export function GlobalLoadingBar() {
  const navigation = useNavigation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const loading = navigation.state === "loading";
    if (!loading) {
      // fade out
      setProgress(100);
      const t = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
      return () => clearTimeout(t);
    }

    // show with slow start, then ease
    setVisible(true);
    const t1 = setTimeout(() => setProgress(30), 30);
    const t2 = setTimeout(() => setProgress(65), 300);
    const t3 = setTimeout(() => setProgress(85), 900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [navigation.state]);

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