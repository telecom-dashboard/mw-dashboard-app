import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Controls, ReactFlow } from "@xyflow/react";
import { useShallow } from "zustand/react/shallow";
import "@xyflow/react/dist/style.css";

import {
  fetchLinkLevelFlow,
  getLinkLevelView,
  linkLevelQueryKeys,
  pingNodeIp,
} from "../../api/linkLevelApi";
import { buildLinkLevelFlow } from "../../utils/buildLinkLevelFlow";
import { useLinkLevelStore } from "../../stores/useLinkLevelStore";

import LinkLevelNode from "../../components/flow/LinkLevelNode";
import LinkLevelEdge from "../../components/flow/LinkLevelEdge";
import LinkLevelContextMenu from "../../components/flow/LinkLevelContextMenu";
import LinkLevelIpInfoModal from "../../components/flow/LinkLevelIpInfoModal";
import LinkLevelViewModal from "../../components/flow/LinkLevelViewModal";

const nodeTypes = {
  linkLevelNode: LinkLevelNode,
};

const edgeTypes = {
  linkLevelEdge: LinkLevelEdge,
};

const linkLevelFlowDerivedCache = new WeakMap();

function getCachedBuiltFlow(rows) {
  if (!Array.isArray(rows)) {
    return buildLinkLevelFlow([]);
  }

  const cachedFlow = linkLevelFlowDerivedCache.get(rows);
  if (cachedFlow) {
    return cachedFlow;
  }

  const nextFlow = buildLinkLevelFlow(rows);
  linkLevelFlowDerivedCache.set(rows, nextFlow);
  return nextFlow;
}

function SearchCard({
  searchInput,
  setSearchInput,
  handleSearchEnter,
  handleClear,
  findError,
  searching,
  onHide,
}) {
  return (
    <div className="absolute right-3 top-3 z-30 w-[220px] border border-slate-200 bg-white/95 p-2 shadow-sm">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="text-[11px] font-semibold text-slate-700">Search</div>
        <div className="flex items-center gap-1.5">
          {searching && (
            <div className="flex items-center gap-1 text-[9px] text-sky-600">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-sky-200 border-t-blue-600" />
            </div>
          )}
          <button
            type="button"
            onClick={onHide}
            className="border border-slate-300 px-1.5 py-0.5 text-[9px] font-medium text-slate-600 hover:bg-slate-50"
          >
            Hide
          </button>
        </div>
      </div>

      <div className="relative">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleSearchEnter}
          placeholder="Site ID / POP / Link ID"
          className="h-8 w-full border border-slate-300 bg-white pl-2 pr-12 text-[11px] text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        />

        {searchInput && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-1 text-[9px] font-medium text-slate-500 hover:text-rose-500"
          >
            Clear
          </button>
        )}
      </div>

      {findError && (
        <div className="mt-1.5 border border-amber-200 bg-amber-50 px-2 py-1 text-[9px] text-amber-700">
          {findError}
        </div>
      )}
    </div>
  );
}

function LegendBox({ onHide }) {
  return (
    <div className="absolute right-3 top-[86px] z-20 w-[220px] border border-slate-200 bg-white/95 p-2 shadow-sm">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="text-[11px] font-semibold text-slate-700">Legend</div>
        <button
          type="button"
          onClick={onHide}
          className="border border-slate-300 px-1.5 py-0.5 text-[9px] font-medium text-slate-600 hover:bg-slate-50"
        >
          Hide
        </button>
      </div>

      <div className="space-y-2">
        <div>
          <div className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
            Site
          </div>
          <div className="grid grid-cols-2 gap-1">
            <div className="border border-[#8BC34A] bg-[#C6E0B4] px-1.5 py-1 text-center text-[9px] text-slate-800">
              NEC
            </div>
            <div className="border border-[#8DB3E2] bg-[#D9E2F3] px-1.5 py-1 text-center text-[9px] text-slate-800">
              ZTE
            </div>
            <div className="border border-[#E8B200] bg-[#FFF200] px-1.5 py-1 text-center text-[9px] text-slate-800">
              ALU
            </div>
            <div className="border border-dashed border-[#FF4D4F] bg-white px-1.5 py-1 text-center text-[9px] text-slate-800">
              SIAE
            </div>
            <div className="col-span-2 border border-dotted border-[#2F5597] bg-white px-1.5 py-1 text-center text-[9px] text-slate-800">
              Planned
            </div>
          </div>
        </div>

        <div>
          <div className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
            Link
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[9px] text-slate-700">
              <span className="inline-block h-[2px] w-6 bg-[#8BC34A]" />
              NEC
            </div>
            <div className="flex items-center gap-1.5 text-[9px] text-slate-700">
              <span className="inline-block h-[2px] w-6 bg-[#8DB3E2]" />
              ZTE
            </div>
            <div className="flex items-center gap-1.5 text-[9px] text-slate-700">
              <span className="inline-block h-[2px] w-6 bg-[#E8B200]" />
              ALU
            </div>
            <div className="flex items-center gap-1.5 text-[9px] text-slate-700">
              <span
                className="inline-block h-[2px] w-6"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(to right, #FF4D4F 0, #FF4D4F 5px, transparent 5px, transparent 8px)",
                }}
              />
              SIAE
            </div>
            <div className="flex items-center gap-1.5 text-[9px] text-slate-700">
              <span
                className="inline-block h-[2px] w-6"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(to right, #2F5597 0, #2F5597 2px, transparent 2px, transparent 5px)",
                }}
              />
              Planned
            </div>
          </div>
        </div>

        <div className="border border-slate-200 bg-slate-50 px-2 py-1 text-[9px] text-slate-600">
          Highlighted path shows selected route to POP
        </div>
      </div>
    </div>
  );
}

function PanelToggles({
  showSearchCard,
  showLegendCard,
  onShowSearch,
  onShowLegend,
}) {
  if (showSearchCard && showLegendCard) {
    return null;
  }

  return (
    <div className="absolute right-3 top-3 z-30 flex items-center gap-2">
      {!showSearchCard && (
        <button
          type="button"
          onClick={onShowSearch}
          className="border border-slate-300 bg-white/95 px-2 py-1 text-[10px] font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Show Search
        </button>
      )}

      {!showLegendCard && (
        <button
          type="button"
          onClick={onShowLegend}
          className="border border-slate-300 bg-white/95 px-2 py-1 text-[10px] font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Show Legend
        </button>
      )}
    </div>
  );
}

function CenterLoadingOverlay({ show, text = "Processing..." }) {
  if (!show) return null;

  return (
    <div className="absolute inset-0 z-[70] flex items-center justify-center bg-white/35">
      <div className="flex flex-col items-center gap-3 border border-sky-100 bg-white px-5 py-4 shadow-lg">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-sky-200 border-t-blue-600" />
        <div className="text-sm font-medium text-slate-700">{text}</div>
      </div>
    </div>
  );
}

function PingStat({ label, value }) {
  return (
    <div className="border border-slate-200 bg-slate-50 px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-0.5 text-xs font-semibold text-slate-800">{value ?? "-"}</div>
    </div>
  );
}

function PingResultModal({ open, ip, siteId, loading, result, error, onClose }) {
  if (!open) return null;

  const reachable = !!result?.reachable;
  const statusText = reachable ? "Reachable" : "Unreachable";
  const statusClass = reachable
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-rose-200 bg-rose-50 text-rose-700";

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-900/30 p-4">
      <div className="w-full max-w-md overflow-hidden border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2.5">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-800">Ping Status</h2>
            <p className="truncate text-[11px] text-slate-500">{ip || "-"}</p>
            <p className="truncate text-[11px] text-slate-500">
              Site: {siteId || "-"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="border border-slate-300 px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="p-3">
          {loading ? (
            <div className="flex min-h-[120px] flex-col items-center justify-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-200 border-t-blue-600" />
              <div className="text-xs font-medium text-slate-600">Pinging...</div>
            </div>
          ) : error ? (
            <div className="border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </div>
          ) : result ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between border border-slate-200 bg-slate-50 px-3 py-2">
                <div>
                  <div className="text-[9px] uppercase tracking-wide text-slate-500">
                    Site Status
                  </div>
                  <div className="text-xs font-semibold text-slate-800">
                    Ping Result
                  </div>
                </div>

                <div className={`border px-2 py-1 text-[11px] font-semibold ${statusClass}`}>
                  {statusText}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <PingStat label="Sent" value={result?.sent} />
                <PingStat label="Recv" value={result?.received} />
                <PingStat
                  label="Loss"
                  value={result?.packet_loss != null ? `${result.packet_loss}%` : "-"}
                />
                <PingStat
                  label="Avg"
                  value={result?.avg_ms != null ? `${result.avg_ms}ms` : "-"}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <PingStat
                  label="Min"
                  value={result?.min_ms != null ? `${result.min_ms}ms` : "-"}
                />
                <PingStat
                  label="Avg"
                  value={result?.avg_ms != null ? `${result.avg_ms}ms` : "-"}
                />
                <PingStat
                  label="Max"
                  value={result?.max_ms != null ? `${result.max_ms}ms` : "-"}
                />
              </div>

              <div className="overflow-hidden border border-slate-200">
                <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-700">
                  Raw Output
                </div>
                <pre className="max-h-[180px] overflow-auto bg-slate-950 px-3 py-2 text-[10px] leading-relaxed text-slate-100">
                  {result?.raw_output || "No output returned."}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500">No ping result.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function buildHighlightedPath(selectedNodeId, nodesById) {
  const highlightedNodeIds = new Set();
  const highlightedEdgeIds = new Set();

  if (!selectedNodeId || !nodesById.has(selectedNodeId)) {
    return { highlightedNodeIds, highlightedEdgeIds };
  }

  let currentId = selectedNodeId;
  let guard = 0;

  while (currentId && nodesById.has(currentId) && guard < 500) {
    const currentNode = nodesById.get(currentId);
    highlightedNodeIds.add(currentId);

    const parentNodeId = currentNode?.data?.parentNodeId;
    if (!parentNodeId) break;

    highlightedNodeIds.add(parentNodeId);
    highlightedEdgeIds.add(`edge-${parentNodeId}-${currentId}`);

    currentId = parentNodeId;
    guard += 1;
  }

  return { highlightedNodeIds, highlightedEdgeIds };
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

function resolveLoginUrl(raw) {
  const loginUrl = String(raw?.loginUrl || raw?.login_url || "").trim();
  if (!loginUrl) {
    return "";
  }

  if (/^https?:\/\//i.test(loginUrl)) {
    return loginUrl;
  }

  const protocolValue = String(
    raw?.webProtocol || raw?.web_protocol || raw?.protocol || ""
  )
    .trim()
    .toLowerCase();

  const protocolPrefix = protocolValue === "http" ? "http://" : "https://";

  if (loginUrl.startsWith("//")) {
    return `${protocolPrefix}${loginUrl.slice(2)}`;
  }

  return `${protocolPrefix}${loginUrl}`;
}

function resolveLoginUrlForIp(raw, ipValue) {
  const ip = String(ipValue || "").trim();
  if (!ip) {
    return "";
  }

  const protocolValue = String(
    raw?.webProtocol || raw?.web_protocol || raw?.protocol || ""
  )
    .trim()
    .toLowerCase();

  const protocolPrefix = protocolValue === "https" ? "https://" : "http://";
  return `${protocolPrefix}${ip}`;
}

function getPingIpFromNode(raw) {
  return (
    raw?.pingIp ||
    raw?.ping_ip ||
    raw?.managementIp ||
    raw?.management_ip ||
    raw?.siteNameS1Ip ||
    raw?.site_name_s1_ip ||
    raw?.siteNameS2Ip ||
    raw?.site_name_s2_ip ||
    extractHostFromUrl(raw?.loginUrl || raw?.login_url) ||
    ""
  );
}

export default function AdminLinkLevelPage() {
  const flowRef = useRef(null);
  const didRestoreRef = useRef(false);
  const suppressViewportPersistRef = useRef(false);
  const restoreTimerRef = useRef(null);
  const snapshotTimerRef = useRef(null);
  const queryClient = useQueryClient();
  const {
    searchInput,
    selectedNodeId,
    focusedNodeId,
    storedViewport,
    menu,
    viewData,
    setSearchInput,
    focusNode,
    setViewport,
    openMenu,
    closeMenu,
    setViewData,
    clearViewData,
  } = useLinkLevelStore(
    useShallow((state) => ({
      searchInput: state.searchInput,
      selectedNodeId: state.selectedNodeId,
      focusedNodeId: state.focusedNodeId,
      storedViewport: state.viewport,
      menu: state.menu,
      viewData: state.viewData,
      setSearchInput: state.setSearchInput,
      focusNode: state.focusNode,
      setViewport: state.setViewport,
      openMenu: state.openMenu,
      closeMenu: state.closeMenu,
      setViewData: state.setViewData,
      clearViewData: state.clearViewData,
    }))
  );

  const restoredViewportRef = useRef(storedViewport || null);

  const [flowReady, setFlowReady] = useState(false);
  const [searching, setSearching] = useState(false);
  const [pingModalOpen, setPingModalOpen] = useState(false);
  const [pingLoading, setPingLoading] = useState(false);
  const [pingResult, setPingResult] = useState(null);
  const [pingError, setPingError] = useState("");
  const [pingIp, setPingIp] = useState("");
  const [pingSiteId, setPingSiteId] = useState("");
  const [findError, setFindError] = useState("");
  const [ipInfoModalOpen, setIpInfoModalOpen] = useState(false);
  const [ipInfoLoading, setIpInfoLoading] = useState(false);
  const [ipInfoError, setIpInfoError] = useState("");
  const [ipInfoData, setIpInfoData] = useState(null);
  const [showSearchCard, setShowSearchCard] = useState(true);
  const [showLegendCard, setShowLegendCard] = useState(true);
  const { data: rows = [], isLoading: loading } = useQuery({
    queryKey: linkLevelQueryKeys.flow,
    queryFn: fetchLinkLevelFlow,
  });

  const hasStoredViewport = useMemo(() => {
    return Boolean(
      storedViewport &&
        Number.isFinite(storedViewport.x) &&
        Number.isFinite(storedViewport.y) &&
        Number.isFinite(storedViewport.zoom)
    );
  }, [storedViewport]);

  const initialViewport = useMemo(() => {
    if (hasStoredViewport) {
      return storedViewport;
    }

    return undefined;
  }, [hasStoredViewport, storedViewport]);

  useEffect(() => {
    restoredViewportRef.current = storedViewport || null;
  }, [storedViewport]);

  const captureViewportState = useCallback(() => {
    const viewport = flowRef.current?.getViewport?.();

    if (
      viewport &&
      Number.isFinite(viewport.x) &&
      Number.isFinite(viewport.y) &&
      Number.isFinite(viewport.zoom)
    ) {
      restoredViewportRef.current = viewport;
      setViewport(viewport);
    }
  }, [setViewport]);

  const scheduleViewportSnapshot = useCallback((delay = 0) => {
    if (snapshotTimerRef.current) {
      window.clearTimeout(snapshotTimerRef.current);
    }

    snapshotTimerRef.current = window.setTimeout(() => {
      captureViewportState();
      suppressViewportPersistRef.current = false;
      snapshotTimerRef.current = null;
    }, delay);
  }, [captureViewportState]);

  useEffect(() => {
    return () => {
      if (restoreTimerRef.current) {
        window.clearTimeout(restoreTimerRef.current);
      }

      if (snapshotTimerRef.current) {
        window.clearTimeout(snapshotTimerRef.current);
      }

      const viewport = flowRef.current?.getViewport?.() || restoredViewportRef.current;
      restoredViewportRef.current = viewport;
      if (
        viewport &&
        Number.isFinite(viewport.x) &&
        Number.isFinite(viewport.y) &&
        Number.isFinite(viewport.zoom)
      ) {
        setViewport(viewport);
      }
    };
  }, [setViewport]);

  const flow = useMemo(() => getCachedBuiltFlow(rows), [rows]);

  const nodesById = useMemo(() => {
    return new Map(flow.nodes.map((node) => [node.id, node]));
  }, [flow.nodes]);

  const { highlightedNodeIds, highlightedEdgeIds } = useMemo(() => {
    return buildHighlightedPath(selectedNodeId, nodesById);
  }, [selectedNodeId, nodesById]);

  const searchableNodes = useMemo(() => {
    return flow.nodes.map((node) => {
      const siteId = String(node.data?.siteId || node.data?.label || "").trim().toLowerCase();
      const popSite = String(node.data?.popSite || "").trim().toLowerCase();
      const linkId = String(node.data?.linkId || "").trim().toLowerCase();

      return {
        node,
        siteId,
        popSite,
        linkId,
      };
    });
  }, [flow.nodes]);

  const searchableEdges = useMemo(() => {
    return flow.edges.map((edge) => {
      const linkId = String(edge.data?.linkId || "").trim().toLowerCase();

      return {
        edge,
        linkId,
        focusNodeId:
          (edge.target && nodesById.has(edge.target) && edge.target) ||
          (edge.source && nodesById.has(edge.source) && edge.source) ||
          null,
      };
    });
  }, [flow.edges, nodesById]);

  const handlePing = useCallback(async (nodeDataOrNode) => {
    const raw = nodeDataOrNode?.data ? nodeDataOrNode.data : nodeDataOrNode;
    const ip = getPingIpFromNode(raw);
    const relatedSiteId =
      raw?.relatedSite ||
      raw?.relatedSiteId ||
      raw?.siteId ||
      raw?.label ||
      raw?.site_name_s1 ||
      raw?.site_name_s2 ||
      raw?.sitea_id ||
      raw?.siteb_id ||
      "";

    setPingModalOpen(true);
    setPingIp(ip);
    setPingSiteId(relatedSiteId);
    setPingResult(null);
    setPingError("");

    if (!ip) {
      setPingLoading(false);
      setPingError("This node does not have a ping IP.");
      return;
    }

    setPingLoading(true);

    try {
      const result = await pingNodeIp(ip);
      setPingResult(result);
    } catch (error) {
      setPingError(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          error?.message ||
          "Ping request failed."
      );
    } finally {
      setPingLoading(false);
    }
  }, []);

  const nodes = useMemo(() => {
    return flow.nodes.map((node) => ({
      ...node,
      selected: node.id === selectedNodeId,
      data: {
        ...node.data,
        isSelected: node.id === selectedNodeId,
        isPathHighlighted: highlightedNodeIds.has(node.id),
        onPing: handlePing,
      },
    }));
  }, [flow.nodes, selectedNodeId, highlightedNodeIds, handlePing]);

  const edges = useMemo(() => {
    return flow.edges.map((edge) => ({
      ...edge,
      selected: highlightedEdgeIds.has(edge.id),
      data: {
        ...edge.data,
        isPathHighlighted: highlightedEdgeIds.has(edge.id),
      },
    }));
  }, [flow.edges, highlightedEdgeIds]);

  const centerTopologyInView = useCallback((duration = 0) => {
    const instance = flowRef.current;

    if (!instance || flow.nodes.length === 0) {
      return false;
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    flow.nodes.forEach((node) => {
      const nodeX = node.position.x + 70;
      const nodeY = node.position.y + 18;

      minX = Math.min(minX, nodeX);
      maxX = Math.max(maxX, nodeX);
      minY = Math.min(minY, nodeY);
      maxY = Math.max(maxY, nodeY);
    });

    if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
      return false;
    }

    suppressViewportPersistRef.current = true;
    instance.setCenter((minX + maxX) / 2, (minY + maxY) / 2, {
      zoom: 0.78,
      duration,
    });
    scheduleViewportSnapshot(duration + 40);
    return true;
  }, [flow.nodes, scheduleViewportSnapshot]);

  const centerNodeInView = useCallback((nodeId, duration = 0) => {
    const instance = flowRef.current;
    const node = nodesById.get(nodeId);

    if (!instance || !node) {
      return false;
    }

    suppressViewportPersistRef.current = true;
    instance.setCenter(node.position.x + 70, node.position.y + 18, {
      zoom: 0.95,
      duration,
    });
    scheduleViewportSnapshot(duration + 40);
    return true;
  }, [nodesById, scheduleViewportSnapshot]);

  useEffect(() => {
    if (!flowReady || loading || !flowRef.current || nodes.length === 0 || didRestoreRef.current) {
      return;
    }

    if (restoreTimerRef.current) {
      window.clearTimeout(restoreTimerRef.current);
    }

    suppressViewportPersistRef.current = true;
    restoreTimerRef.current = window.setTimeout(() => {
      const savedViewport = restoredViewportRef.current;
      const restoreNodeId = focusedNodeId || selectedNodeId;
      const shouldRestoreFocusedNode = Boolean(restoreNodeId) && nodesById.has(restoreNodeId);

      if (shouldRestoreFocusedNode && centerNodeInView(restoreNodeId, 0)) {
        // Restore the last focused node first so the user returns to the same topology context.
      } else if (
        savedViewport &&
        Number.isFinite(savedViewport.x) &&
        Number.isFinite(savedViewport.y) &&
        Number.isFinite(savedViewport.zoom)
      ) {
        flowRef.current?.setViewport(savedViewport, { duration: 0 });
        scheduleViewportSnapshot(40);
      } else {
        centerTopologyInView(0);
      }

      restoreTimerRef.current = null;
    }, 0);

    didRestoreRef.current = true;
  }, [
    flowReady,
    loading,
    nodes.length,
    focusedNodeId,
    selectedNodeId,
    nodesById,
    centerTopologyInView,
    centerNodeInView,
    scheduleViewportSnapshot,
  ]);

  const focusNodeBySearch = useCallback(async () => {
    const query = searchInput.trim().toLowerCase();
    setFindError("");

    if (!query) return;

    setSearching(true);

    try {
      const exactNodeMatch = searchableNodes.find(
        ({ siteId, popSite, linkId }) =>
          siteId === query || popSite === query || linkId === query
      );
      const exactEdgeMatch = searchableEdges.find(({ linkId }) => linkId === query);

      const partialNodeMatch =
        exactNodeMatch ||
        searchableNodes.find(
          ({ siteId, popSite, linkId }) =>
            siteId.includes(query) ||
            popSite.includes(query) ||
            linkId.includes(query)
        );
      const partialEdgeMatch =
        exactEdgeMatch ||
        searchableEdges.find(({ linkId }) => linkId.includes(query));

      const foundNode =
        partialNodeMatch?.node ||
        (partialEdgeMatch?.focusNodeId
          ? nodesById.get(partialEdgeMatch.focusNodeId)
          : null);

      if (!foundNode) {
        setFindError("Site ID or link connection not found on current topology.");
        return;
      }

      focusNode(foundNode.id);
      centerNodeInView(foundNode.id, 180);
    } finally {
      setSearching(false);
    }
  }, [searchInput, searchableNodes, searchableEdges, nodesById, focusNode, centerNodeInView]);

  const handleSearchEnter = useCallback(
    (e) => {
      if (e.key === "Enter") {
        focusNodeBySearch();
      }
    },
    [focusNodeBySearch]
  );

  const handleClear = useCallback(() => {
    setFindError("");
    setSearchInput("");
  }, [setSearchInput]);

  const handleNodeClick = useCallback(
    (event, node) => {
      closeMenu();
      setFindError("");
      focusNode(node.id);
      centerNodeInView(node.id, 160);
    },
    [closeMenu, focusNode, centerNodeInView]
  );

  const handleNodeDoubleClick = useCallback((event, node) => {
    const loginUrl = resolveLoginUrl(node?.data);
    if (loginUrl) {
      window.open(loginUrl, "_blank", "noopener,noreferrer");
    }
  }, []);

  const handleNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    openMenu(event.clientX, event.clientY, node);
  }, [openMenu]);

  const handleView = useCallback(async (node) => {
    const linkId = node?.data?.linkId;

    if (!linkId) {
      return;
    }

    try {
      const detail = await queryClient.fetchQuery({
        queryKey: linkLevelQueryKeys.view(linkId),
        queryFn: () => getLinkLevelView(linkId),
      });
      setViewData(detail);
    } catch (error) {
      console.error("Failed to load view detail", error);
    }
  }, [queryClient, setViewData]);

  const handleLoadIpInfo = useCallback(async (node) => {
    const linkId = node?.data?.linkId;

    if (!linkId) {
      throw new Error("This node does not have link detail.");
    }

    return queryClient.fetchQuery({
      queryKey: linkLevelQueryKeys.view(linkId),
      queryFn: () => getLinkLevelView(linkId),
    });
  }, [queryClient]);

  const handleOpenIpInfo = useCallback(async (node) => {
    setIpInfoModalOpen(true);
    setIpInfoLoading(true);
    setIpInfoError("");
    setIpInfoData(null);

    try {
      const detail = await handleLoadIpInfo(node);
      setIpInfoData(detail);
    } catch (error) {
      setIpInfoError(
        error?.response?.data?.detail ||
          error?.message ||
          "Failed to load NE/FE IP information."
      );
    } finally {
      setIpInfoLoading(false);
    }
  }, [handleLoadIpInfo]);

  const handleLogin = useCallback((node) => {
    const loginUrl = resolveLoginUrl(node?.data);
    if (!loginUrl) return;
    window.open(loginUrl, "_blank", "noopener,noreferrer");
  }, []);

  const handleViewportChange = useCallback((viewport) => {
    if (suppressViewportPersistRef.current) {
      return;
    }

    restoredViewportRef.current = viewport;
    setViewport(viewport);
  }, [setViewport]);

  return (
    <div className="h-[calc(100vh-64px)] w-full overflow-hidden bg-slate-50">
      <div className="relative h-full w-full">
        <PanelToggles
          showSearchCard={showSearchCard}
          showLegendCard={showLegendCard}
          onShowSearch={() => setShowSearchCard(true)}
          onShowLegend={() => setShowLegendCard(true)}
        />

        {showSearchCard && (
          <SearchCard
            searchInput={searchInput}
            setSearchInput={(value) => {
              setSearchInput(value);
              if (findError) setFindError("");
            }}
            handleSearchEnter={handleSearchEnter}
            handleClear={handleClear}
            findError={findError}
            searching={searching}
            onHide={() => setShowSearchCard(false)}
          />
        )}

        {showLegendCard && <LegendBox onHide={() => setShowLegendCard(false)} />}

        {loading ? (
          <div className="h-full w-full" />
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            {...(initialViewport ? { defaultViewport: initialViewport } : {})}
            onlyRenderVisibleElements
            defaultEdgeOptions={{
              type: "linkLevelEdge",
              zIndex: 1,
            }}
            onInit={(instance) => {
              flowRef.current = instance;
              setFlowReady(true);
            }}
            onMoveEnd={(_, viewport) => handleViewportChange(viewport)}
            onNodeClick={handleNodeClick}
            onNodeDoubleClick={handleNodeDoubleClick}
            onNodeContextMenu={handleNodeContextMenu}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable
            elevateEdgesOnSelect
            selectNodesOnDrag={false}
            panOnDrag
            panOnScroll
            selectionOnDrag={false}
            minZoom={0.2}
            maxZoom={1.5}
            proOptions={{ hideAttribution: true }}
          >
            <Controls />
          </ReactFlow>
        )}

        <CenterLoadingOverlay show={loading} text="Loading topology..." />

        {menu.visible && (
          <LinkLevelContextMenu
            x={menu.x}
            y={menu.y}
            node={menu.node}
            onView={handleView}
            onPing={handlePing}
            onOpenIpInfo={handleOpenIpInfo}
            onLogin={handleLogin}
            onClose={closeMenu}
          />
        )}

        <LinkLevelIpInfoModal
          open={ipInfoModalOpen}
          loading={ipInfoLoading}
          error={ipInfoError}
          data={ipInfoData}
          onClose={() => {
            setIpInfoModalOpen(false);
            setIpInfoLoading(false);
            setIpInfoError("");
            setIpInfoData(null);
          }}
          onPingNe={() =>
            handlePing({
              pingIp: ipInfoData?.site_name_s1_ip || "",
              relatedSite:
                ipInfoData?.site_name_s1 || ipInfoData?.sitea_id || "",
            })
          }
          onPingFe={() =>
            handlePing({
              pingIp: ipInfoData?.site_name_s2_ip || "",
              relatedSite:
                ipInfoData?.site_name_s2 || ipInfoData?.siteb_id || "",
            })
          }
          onLoginNe={() => {
            const loginUrl = resolveLoginUrlForIp(
              ipInfoData,
              ipInfoData?.site_name_s1_ip
            );
            if (!loginUrl) return;
            window.open(loginUrl, "_blank", "noopener,noreferrer");
          }}
          onLoginFe={() => {
            const loginUrl = resolveLoginUrlForIp(
              ipInfoData,
              ipInfoData?.site_name_s2_ip
            );
            if (!loginUrl) return;
            window.open(loginUrl, "_blank", "noopener,noreferrer");
          }}
        />

        <LinkLevelViewModal
          open={!!viewData}
          data={viewData}
          onClose={clearViewData}
        />

        <PingResultModal
          open={pingModalOpen}
          ip={pingIp}
          loading={pingLoading}
          result={pingResult}
          error={pingError}
          siteId={pingSiteId}
          onClose={() => {
            setPingModalOpen(false);
            setPingResult(null);
            setPingError("");
            setPingIp("");
            setPingSiteId("");
          }}
        />
      </div>
    </div>
  );
}
