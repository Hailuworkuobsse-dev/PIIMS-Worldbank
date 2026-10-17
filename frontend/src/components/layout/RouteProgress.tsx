import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export function RouteProgress() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setVisible(true);
    setProgress(20);
    const t1 = window.setTimeout(() => setProgress(70), 60);
    const t2 = window.setTimeout(() => setProgress(100), 240);
    const t3 = window.setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 420);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [location.pathname]);

  return (
    <div
      aria-hidden
      className="fixed top-0 left-0 right-0 z-[300] h-[2px] pointer-events-none"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 220ms ease" }}
    >
      <div
        className="h-full bg-accent-500"
        style={{
          width: `${progress}%`,
          transition: "width 240ms ease",
        }}
      />
    </div>
  );
}