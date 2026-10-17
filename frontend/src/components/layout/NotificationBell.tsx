import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/components/ui/utils/cn";

interface Notification {
  id: string;
  type: "info" | "warning" | "success";
  title: string;
  body?: string;
  to?: string;
  read: boolean;
  at: string;
}

const MOCK: Notification[] = [
  {
    id: "n1",
    type: "warning",
    title: "3 inception reports overdue",
    body: "PIIMS-2026-0038, 0041, 0044",
    to: "/inception",
    read: false,
    at: "2 h ago",
  },
  {
    id: "n2",
    type: "info",
    title: "New no-objection request",
    body: "PIIMS-2026-0042 · Inception v1",
    to: "/inception",
    read: false,
    at: "5 h ago",
  },
  {
    id: "n3",
    type: "success",
    title: "FMIS sync completed",
    body: "1,247 records reconciled",
    to: "/financial/fmis",
    read: true,
    at: "Yesterday",
  },
];

export function NotificationBell() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>(MOCK);
  const ref = useRef<HTMLDivElement>(null);

  const unread = items.filter((i) => !i.read).length;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const markAll = () => setItems((s) => s.map((i) => ({ ...i, read: true })));

  const icons = {
    info: <Info className="h-4 w-4 text-blue-500" aria-hidden />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden />,
    success: <CheckCircle2 className="h-4 w-4 text-green-500" aria-hidden />,
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        aria-label={t("shell.notifications")}
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative h-9 w-9 rounded-md text-white hover:bg-white/10 transition-colors flex items-center justify-center"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span
            aria-hidden
            className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-danger text-white text-[10px] font-bold grid place-items-center"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-[340px] rounded-md bg-white shadow-lg border border-neutral-300 overflow-hidden z-50"
        >
          <header className="flex items-center justify-between px-3 py-2 border-b border-neutral-300">
            <span className="text-caption font-bold text-primary-900 uppercase tracking-wide">
              {t("shell.notifications")}
            </span>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAll}
                className="inline-flex items-center gap-1 text-caption font-semibold text-primary-700 hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" aria-hidden />
                {t("shell.markAllRead")}
              </button>
            )}
          </header>

          <ul className="max-h-[340px] overflow-y-auto divide-y divide-neutral-100">
            {items.length === 0 && (
              <li className="p-6 text-center text-caption text-neutral-600">
                {t("shell.noNotifications")}
              </li>
            )}
            {items.map((n) => (
              <li key={n.id}>
                <Link
                  to={n.to ?? "#"}
                  onClick={() => {
                    setItems((s) =>
                      s.map((i) => (i.id === n.id ? { ...i, read: true } : i)),
                    );
                    setOpen(false);
                  }}
                  className={cn(
                    "flex gap-3 px-3 py-2.5 hover:bg-neutral-50 transition-colors",
                    !n.read && "bg-primary-100/40",
                  )}
                >
                  <span className="shrink-0 mt-0.5">{icons[n.type]}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-body-sm font-semibold text-neutral-900 truncate">
                      {n.title}
                    </span>
                    {n.body && (
                      <span className="block text-caption text-neutral-600 truncate">
                        {n.body}
                      </span>
                    )}
                    <span className="block text-[10px] text-neutral-500 mt-0.5">
                      {n.at}
                    </span>
                  </span>
                  {!n.read && (
                    <span
                      aria-hidden
                      className="shrink-0 h-2 w-2 rounded-full bg-accent-500 mt-2"
                    />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}