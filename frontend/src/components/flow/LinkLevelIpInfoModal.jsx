import React, { memo, useEffect, useRef, useState } from "react";

function IpInfoRow({ label, value, relatedSite, onPing, onLogin, canLogin }) {
  const hasValue = Boolean(value && String(value).trim());

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
      <div className="min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
          {label}
        </div>
        <div className="mt-1 truncate text-sm text-slate-800">{value || "-"}</div>
        <div className="mt-1 truncate text-[11px] text-slate-500">
          Site: {relatedSite || "-"}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onPing}
          disabled={!hasValue}
          className="rounded-md border border-sky-300 bg-white px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Ping
        </button>
        <button
          type="button"
          onClick={onLogin}
          disabled={!canLogin}
          className="rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Login
        </button>
      </div>
    </div>
  );
}

function LinkLevelIpInfoModal({
  open,
  loading,
  error,
  data,
  onClose,
  onPingNe,
  onPingFe,
  onLoginNe,
  onLoginFe,
}) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const dragOriginRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (!draggingRef.current) {
        return;
      }

      setOffset({
        x: event.clientX - dragOriginRef.current.x,
        y: event.clientY - dragOriginRef.current.y,
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

  if (!open) return null;

  const neIp = data?.site_name_s1_ip || "";
  const feIp = data?.site_name_s2_ip || "";
  const neSite = data?.site_name_s1 || data?.sitea_id || "";
  const feSite = data?.site_name_s2 || data?.siteb_id || "";
  const canLoginNe = Boolean(neIp && String(neIp).trim());
  const canLoginFe = Boolean(feIp && String(feIp).trim());

  const handleDragStart = (event) => {
    draggingRef.current = true;
    dragOriginRef.current = {
      x: event.clientX - offset.x,
      y: event.clientY - offset.y,
    };
  };

  return (
    <div className="fixed inset-0 z-[92] flex items-center justify-center bg-black/40 p-4">
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      >
        <div
          className="flex cursor-move items-center justify-between border-b bg-gradient-to-r from-slate-50 via-white to-sky-50 px-5 py-4"
          onMouseDown={handleDragStart}
        >
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              View and Ping NE/FE IP
            </h2>
            <p className="text-sm text-slate-500">{data?.link_id || "-"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="space-y-3 p-5">
          {loading ? (
            <div className="border border-sky-200 bg-sky-50 px-3 py-3 text-sm text-sky-700">
              Loading NE/FE IP information...
            </div>
          ) : error ? (
            <div className="border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : (
            <>
              <IpInfoRow
                label="NE IP"
                value={neIp}
                relatedSite={neSite}
                onPing={onPingNe}
                onLogin={onLoginNe}
                canLogin={canLoginNe}
              />
              <IpInfoRow
                label="FE IP"
                value={feIp}
                relatedSite={feSite}
                onPing={onPingFe}
                onLogin={onLoginFe}
                canLogin={canLoginFe}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(LinkLevelIpInfoModal);
