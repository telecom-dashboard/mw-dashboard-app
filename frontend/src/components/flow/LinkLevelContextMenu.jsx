import React, { memo, useEffect, useRef, useState } from "react";

function LinkLevelContextMenu({
  x,
  y,
  node,
  onView,
  onPing,
  onOpenIpInfo,
  onLogin,
  onClose,
}) {
  const [position, setPosition] = useState({ x, y });
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const draggingRef = useRef(false);

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (!draggingRef.current) {
        return;
      }

      setPosition({
        x: event.clientX - dragOffsetRef.current.x,
        y: event.clientY - dragOffsetRef.current.y,
      });
    };

    const handleMouseUp = () => {
      draggingRef.current = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  if (!node) return null;

  const handleDragStart = (event) => {
    draggingRef.current = true;
    dragOffsetRef.current = {
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    };
  };

  const actionClass =
    "group flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 hover:text-sky-800";

  return (
    <div
      className="fixed z-[80] w-[280px] overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-[0_24px_60px_rgba(15,23,42,0.20)] backdrop-blur-md"
      style={{ left: position.x, top: position.y }}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div
        className="cursor-move border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-sky-50 px-3 py-2.5"
        onMouseDown={handleDragStart}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-700">
              Quick Actions
            </div>
            <div className="truncate text-sm font-semibold text-slate-800">
              {node.data?.label || "-"}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          >
            Close
          </button>
        </div>
      </div>

      <div className="space-y-1.5 p-2">
        <button
          type="button"
          onClick={() => {
            onView(node);
            onClose();
          }}
          className={actionClass}
        >
          <span>1. View</span>
          <span className="text-[10px] text-slate-400 transition group-hover:text-sky-600">
            Open
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            onPing(node);
            onClose();
          }}
          className={actionClass}
        >
          <span>2. Ping</span>
          <span className="text-[10px] text-slate-400 transition group-hover:text-sky-600">
            Check
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            onLogin(node);
            onClose();
          }}
          className={actionClass}
        >
          <span>3. Login</span>
          <span className="text-[10px] text-slate-400 transition group-hover:text-sky-600">
            Open
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            onOpenIpInfo(node);
            onClose();
          }}
          className={actionClass}
        >
          <span>4. View and Ping and Login NE/FE IP</span>
          <span className="text-[10px] text-slate-400 transition group-hover:text-sky-600">
            Details
          </span>
        </button>
      </div>
    </div>
  );
}

export default memo(LinkLevelContextMenu);
