import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";

function getNodeStyle(vendorKey, isPop) {
  if (isPop) {
    return {
      headerClass: "bg-[#4472C4] text-white border-[#2F5597]",
      bodyClass: "bg-white text-slate-600",
      boxClass: "border-[#4472C4]",
    };
  }

  switch (vendorKey) {
    case "NEC":
      return {
        headerClass: "bg-[#C6E0B4] text-black border-[#8BC34A]",
        bodyClass: "bg-white text-slate-600",
        boxClass: "border-[#8BC34A]",
      };
    case "ZTE":
      return {
        headerClass: "bg-[#D9E2F3] text-black border-[#8DB3E2]",
        bodyClass: "bg-white text-slate-600",
        boxClass: "border-[#8DB3E2]",
      };
    case "ALU":
      return {
        headerClass: "bg-[#FFF200] text-black border-[#E8B200]",
        bodyClass: "bg-white text-slate-600",
        boxClass: "border-[#E8B200]",
      };
    case "SIAE":
      return {
        headerClass: "bg-white text-black border-[#FF4D4F]",
        bodyClass: "bg-white text-slate-600",
        boxClass: "border-[#FF4D4F] border-dashed",
      };
    case "PLANNED":
      return {
        headerClass: "bg-white text-black border-[#2F5597]",
        bodyClass: "bg-white text-slate-600",
        boxClass: "border-[#2F5597] border-dotted",
      };
    default:
      return {
        headerClass: "bg-slate-100 text-black border-slate-300",
        bodyClass: "bg-white text-slate-600",
        boxClass: "border-slate-300",
      };
  }
}

function showValue(value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "-";
  }
  return value;
}

function extractHostFromUrl(url) {
  if (!url) return "";

  try {
    const parsed = new URL(url);
    return parsed.hostname || "";
  } catch {
    return "";
  }
}

function LinkLevelNode({ data, selected }) {
  const styles = getNodeStyle(data.vendorKey, data.isPop);

  const handlePingClick = (e) => {
    e.stopPropagation();

    const ip =
      data?.pingIp ||
      data?.managementIp ||
      data?.site_name_s1_ip ||
      data?.site_name_s2_ip ||
      extractHostFromUrl(data?.loginUrl);

    if (data?.onPing) {
      data.onPing({
        ...data,
        pingIp: ip,
        managementIp: ip,
      });
    }
  };

  return (
    <div
      className={[
        "inline-block min-w-[120px] max-w-[190px] rounded-md border bg-white transition",
        styles.boxClass,
        selected ? "border-red-600 ring-2 ring-red-500" : "",
      ].join(" ")}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border-0 !bg-transparent"
      />

      <div
        className={`border-b px-2 py-1 text-center text-[10px] font-semibold leading-tight ${styles.headerClass}`}
      >
        <div className="break-words">{data.label}</div>

        {data.vendor && !data.isPop && (
          <div className="mt-0.5 text-center text-[8px] font-medium opacity-90">
            {data.vendor}
          </div>
        )}
      </div>

      <div className={`px-2 py-1 text-[9px] leading-tight ${styles.bodyClass}`}>
        {!data.isPop ? (
          <>
            <div className="text-center font-medium">
              Capacity: {data.capacityText || "-"}
            </div>

            <div className="mt-1 border-t border-slate-100 pt-1 text-[8px]">
              <div className="text-center">
                <span className="font-medium text-slate-700">TX Power:</span>{" "}
                {showValue(data.txPowerS1)}
              </div>

              <div className="mt-0.5 text-center">
                <span className="font-medium text-slate-700">ATPC:</span>{" "}
                {showValue(data.atpcS1)}
              </div>
            </div>

            <div className="mt-1.5 border-t border-slate-100 pt-1.5">
              <button
                type="button"
                onClick={handlePingClick}
                className="w-full rounded-sm border border-sky-300 bg-sky-50 px-2 py-1 text-[8px] font-medium text-sky-700 transition hover:bg-sky-100"
              >
                Ping
              </button>
            </div>
          </>
        ) : (
          <div className="text-center">{data.capacityText || ""}</div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-0 !bg-transparent"
      />
    </div>
  );
}

function areNodePropsEqual(previousProps, nextProps) {
  const previousData = previousProps.data || {};
  const nextData = nextProps.data || {};

  return (
    previousProps.selected === nextProps.selected &&
    previousData.label === nextData.label &&
    previousData.vendor === nextData.vendor &&
    previousData.vendorKey === nextData.vendorKey &&
    previousData.isPop === nextData.isPop &&
    previousData.capacityText === nextData.capacityText &&
    previousData.txPowerS1 === nextData.txPowerS1 &&
    previousData.atpcS1 === nextData.atpcS1 &&
    previousData.isSelected === nextData.isSelected &&
    previousData.isPathHighlighted === nextData.isPathHighlighted &&
    previousData.loginUrl === nextData.loginUrl &&
    previousData.pingIp === nextData.pingIp &&
    previousData.managementIp === nextData.managementIp &&
    previousData.onPing === nextData.onPing
  );
}

export default memo(LinkLevelNode, areNodePropsEqual);
