import React, { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
} from "@xyflow/react";

function getVendorStroke(vendor = "") {
  const key = String(vendor).trim().toUpperCase();

  switch (key) {
    case "NEC":
      return "#8BC34A";
    case "ZTE":
      return "#8DB3E2";
    case "ALU":
      return "#E8B200";
    case "SIAE":
      return "#FF4D4F";
    case "PLANNED":
      return "#2F5597";
    default:
      return "#94A3B8";
  }
}

function getVendorLineStyle(vendor = "") {
  const key = String(vendor).trim().toUpperCase();

  switch (key) {
    case "SIAE":
      return "8 5";
    case "PLANNED":
      return "3 5";
    default:
      return undefined;
  }
}

function showValue(value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "-";
  }
  return value;
}

function LinkLevelEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}) {
  const vendor = data?.vendor || "";
  const rslS1 = showValue(data?.rslS1);

  const isPathHighlighted = !!data?.isPathHighlighted;
  const isEdgeSelected = selected || isPathHighlighted;

  const normalStroke = getVendorStroke(vendor);
  const dashArray = getVendorLineStyle(vendor);

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
    offset: 28,
  });

  const computedStyle = {
    stroke: isPathHighlighted ? "#111827" : normalStroke,
    strokeWidth: isEdgeSelected ? 3.2 : 2,
    strokeDasharray: dashArray,
    opacity: 1,
    transition: "all 0.2s ease",
    filter: isPathHighlighted
      ? "drop-shadow(0 0 1px rgba(0,0,0,0.28))"
      : "none",
  };

  const labelX = targetX > sourceX ? targetX - 45 : targetX + 16;
  const labelY = targetY - 14;

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={computedStyle} />

      <EdgeLabelRenderer>
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-white/95 px-1.5 py-0.5 text-[8px] leading-tight text-slate-600 shadow-sm"
          style={{
            left: `${labelX}px`,
            top: `${labelY}px`,
            whiteSpace: "nowrap",
          }}
        >
          <div>
            <span className="font-medium text-slate-400">Designed RSL:</span>{" "}
            {rslS1}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

function areEdgePropsEqual(previousProps, nextProps) {
  const previousData = previousProps.data || {};
  const nextData = nextProps.data || {};

  return (
    previousProps.id === nextProps.id &&
    previousProps.sourceX === nextProps.sourceX &&
    previousProps.sourceY === nextProps.sourceY &&
    previousProps.targetX === nextProps.targetX &&
    previousProps.targetY === nextProps.targetY &&
    previousProps.sourcePosition === nextProps.sourcePosition &&
    previousProps.targetPosition === nextProps.targetPosition &&
    previousProps.selected === nextProps.selected &&
    previousData.vendor === nextData.vendor &&
    previousData.vendorKey === nextData.vendorKey &&
    previousData.rslS1 === nextData.rslS1 &&
    previousData.isPathHighlighted === nextData.isPathHighlighted
  );
}

export default memo(LinkLevelEdge, areEdgePropsEqual);
