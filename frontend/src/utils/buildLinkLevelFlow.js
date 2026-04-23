const LEVEL_GAP_X = 320;
const LEAF_ROW_GAP_Y = 150;
const POP_GROUP_GAP_Y = 220;
const START_X = 80;
const START_Y = 70;

const compareText = (a, b) => String(a || "").localeCompare(String(b || ""));

const parseConnectivityOrder = (value = "") => {
  const match = String(value).match(/(\d+)/);
  return match ? Number(match[1]) : 999;
};

const normalizeId = (value = "") => String(value || "").trim().toUpperCase();

const formatCapacity = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const text = String(value).trim();
  if (/mbps/i.test(text)) return text.replace(/\s+/g, " ");
  return `${text} Mbps`;
};

const pickFirstValue = (...values) => {
  for (const value of values) {
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return value;
    }
  }
  return "-";
};

const getVendorKey = (vendor = "", status = "") => {
  const v = String(vendor || "").trim().toUpperCase();
  const s = String(status || "").trim().toUpperCase();

  if (s.includes("PLANNED")) return "PLANNED";
  if (v.includes("NEC")) return "NEC";
  if (v.includes("ZTE")) return "ZTE";
  if (v.includes("ALU")) return "ALU";
  if (v.includes("SIAE")) return "SIAE";
  return "DEFAULT";
};

const getEdgeStyleByVendor = (vendorKey) => {
  switch (vendorKey) {
    case "NEC":
      return { stroke: "#8BC34A", strokeWidth: 2 };
    case "ZTE":
      return { stroke: "#8DB3E2", strokeWidth: 2 };
    case "ALU":
      return { stroke: "#E8B200", strokeWidth: 2 };
    case "SIAE":
      return { stroke: "#FF4D4F", strokeWidth: 2, strokeDasharray: "5 4" };
    case "PLANNED":
      return { stroke: "#2F5597", strokeWidth: 2, strokeDasharray: "2 5" };
    default:
      return { stroke: "#94A3B8", strokeWidth: 2 };
  }
};

function makeNodeId(siteId, linkId = "NO_LINK") {
  return `node-${normalizeId(siteId)}-${normalizeId(linkId)}`;
}

function buildBranchGraph(groupRows, popSite) {
  const popKey = normalizeId(popSite);
  const recordBySite = new Map();
  const childrenMap = new Map();

  const ensureBucket = (key) => {
    if (!childrenMap.has(key)) childrenMap.set(key, []);
  };

  ensureBucket(popKey);

  const sortedRows = [...groupRows].sort((a, b) => {
    const levelA = parseConnectivityOrder(a.connectivity_label);
    const levelB = parseConnectivityOrder(b.connectivity_label);

    if (levelA !== levelB) return levelA - levelB;

    const depA = Number(a.dependency || 0);
    const depB = Number(b.dependency || 0);
    if (depA !== depB) return depA - depB;

    return compareText(a.site_id, b.site_id);
  });

  sortedRows.forEach((row, index) => {
    const childSite = normalizeId(
      row.site_id || row.child_site_name || row.sitea_id
    );
    const parentSite = normalizeId(
      row.parent_site || row.siteb_id || row.pop_site
    );

    if (!childSite || childSite === popKey) return;

    const vendorKey = getVendorKey(row.vendor, row.status);
    const existing = recordBySite.get(childSite);

    const normalizedRecord = {
      ...row,
      sortIndex: index,
      site_id: childSite,
      label: row.label || childSite,
      parent_key: parentSite || popKey,
      nodeId: existing?.nodeId || makeNodeId(childSite, row.link_id),
      vendorKey,
      capacityText: formatCapacity(
        row.capacity || row.planning_capacity || row.bandwidth
      ),
      children: [],
    };

    if (!existing) {
      recordBySite.set(childSite, normalizedRecord);
    } else {
      recordBySite.set(childSite, {
        ...existing,
        ...normalizedRecord,
        children: existing.children || [],
      });
    }

    ensureBucket(parentSite || popKey);

    const currentChildren = childrenMap.get(parentSite || popKey) || [];
    if (!currentChildren.includes(childSite)) {
      currentChildren.push(childSite);
      childrenMap.set(parentSite || popKey, currentChildren);
    }
  });

  for (const [parentKey, childKeys] of childrenMap.entries()) {
    const uniqueChildren = [...new Set(childKeys)].filter(Boolean);

    uniqueChildren.sort((a, b) => {
      const rowA = recordBySite.get(a);
      const rowB = recordBySite.get(b);

      const levelA = parseConnectivityOrder(rowA?.connectivity_label);
      const levelB = parseConnectivityOrder(rowB?.connectivity_label);
      if (levelA !== levelB) return levelA - levelB;

      const depA = Number(rowA?.dependency || 0);
      const depB = Number(rowB?.dependency || 0);
      if (depA !== depB) return depA - depB;

      const sortA = Number(rowA?.sortIndex || 0);
      const sortB = Number(rowB?.sortIndex || 0);
      if (sortA !== sortB) return sortA - sortB;

      return compareText(a, b);
    });

    childrenMap.set(parentKey, uniqueChildren);
  }

  for (const [siteKey, record] of recordBySite.entries()) {
    const ownChildren = childrenMap.get(siteKey) || [];
    record.children = ownChildren.filter((childKey) => childKey !== siteKey);
  }

  return {
    popKey,
    recordBySite,
    firstLevelChildren: (childrenMap.get(popKey) || []).filter(
      (key) => key !== popKey
    ),
  };
}

function layoutTree({
  siteKey,
  level,
  graph,
  nodes,
  edges,
  currentLeafIndexRef,
  baseY,
  popNodeId,
  placedNodes,
  edgeIds,
  pathSet,
}) {
  const record = graph.recordBySite.get(siteKey);

  if (!record) {
    const fallbackY = baseY + currentLeafIndexRef.value * LEAF_ROW_GAP_Y;
    currentLeafIndexRef.value += 1;
    return { centerY: fallbackY };
  }

  if (pathSet.has(siteKey)) {
    const cycleY = baseY + currentLeafIndexRef.value * LEAF_ROW_GAP_Y;
    currentLeafIndexRef.value += 1;

    if (!placedNodes.has(record.nodeId)) {
      nodes.push({
        id: record.nodeId,
        type: "linkLevelNode",
        position: {
          x: START_X + level * LEVEL_GAP_X,
          y: cycleY,
        },
        draggable: false,
        data: {
          ...buildNodeData(record),
          isCycleNode: true,
          depthLevel: level,
          parentNodeId:
            level === 1
              ? popNodeId
              : graph.recordBySite.get(record.parent_key)?.nodeId || null,
        },
      });
      placedNodes.add(record.nodeId);
    }

    return { centerY: cycleY };
  }

  if (placedNodes.has(record.nodeId)) {
    const existingNode = nodes.find((n) => n.id === record.nodeId);
    return { centerY: existingNode?.position?.y ?? baseY };
  }

  const nextPathSet = new Set(pathSet);
  nextPathSet.add(siteKey);

  const children = (record.children || []).filter((childKey) => !pathSet.has(childKey));

  let centerY = baseY;

  if (children.length === 0) {
    centerY = baseY + currentLeafIndexRef.value * LEAF_ROW_GAP_Y;
    currentLeafIndexRef.value += 1;
  } else {
    const childCenters = children.map((childKey) =>
      layoutTree({
        siteKey: childKey,
        level: level + 1,
        graph,
        nodes,
        edges,
        currentLeafIndexRef,
        baseY,
        popNodeId,
        placedNodes,
        edgeIds,
        pathSet: nextPathSet,
      }).centerY
    );

    const minY = Math.min(...childCenters);
    const maxY = Math.max(...childCenters);
    centerY = (minY + maxY) / 2;
  }

  const x = START_X + level * LEVEL_GAP_X;
  const parentNodeId =
    level === 1
      ? popNodeId
      : graph.recordBySite.get(record.parent_key)?.nodeId || null;

  nodes.push({
    id: record.nodeId,
    type: "linkLevelNode",
    position: { x, y: centerY },
    draggable: false,
    data: {
      ...buildNodeData(record),
      depthLevel: level,
      parentNodeId,
    },
  });

  placedNodes.add(record.nodeId);

  if (parentNodeId) {
    const edgeId = `edge-${parentNodeId}-${record.nodeId}`;

    if (!edgeIds.has(edgeId)) {
      edges.push({
        id: edgeId,
        source: parentNodeId,
        target: record.nodeId,
        type: "linkLevelEdge",
        animated: false,
        style: getEdgeStyleByVendor(record.vendorKey),
        data: {
          vendor: record.vendor,
          vendorKey: record.vendorKey,
          sourceNodeId: parentNodeId,
          targetNodeId: record.nodeId,
          linkId: record.link_id,
          rslS1: pickFirstValue(
            record.receive_signal_dbm_s1,
            record.rsl_s1,
            record.rslS1,
            record["RSL S1"],
            record["RSL_S1"]
          ),
        },
      });
      edgeIds.add(edgeId);
    }
  }

  return { centerY };
}

function buildNodeData(record) {
  return {
    id: record.id,
    label: record.label,
    siteId: record.site_id,
    linkId: record.link_id,
    popSite: record.pop_site,
    parentSite: record.parent_key,
    connectivityLabel: record.connectivity_label,
    depth: record.depth,
    dependency: record.dependency,
    categoryNe: record.category_ne,
    siteaId: record.sitea_id,
    sitebId: record.siteb_id,
    vendor: record.vendor,
    vendorKey: record.vendorKey,
    status: record.status,
    capacity: record.capacity,
    capacityText: record.capacityText,
    bandwidth: record.bandwidth,
    planningCapacity: record.planning_capacity,
    protocol: record.protocol,
    managementIp: record.management_ip,
    pingIp: record.ping_ip,
    loginUrl: record.login_url,
    siteNameS1: record.site_name_s1,
    siteNameS2: record.site_name_s2,
    txPowerS1:
      record.tx_power_dbm_s1 ??
      record.tx_power_s1 ??
      record.txPowerS1 ??
      record["TX Power S1"] ??
      "-",
    atpcS1:
      record.atpc_1_s1 ??
      record.atpc_s1 ??
      record.atpcS1 ??
      record["ATPC S1"] ??
      "-",
    isPop: false,
  };
}

export function buildLinkLevelFlow(rows = []) {
  const nodes = [];
  const edges = [];

  const groupedByPop = rows.reduce((acc, row) => {
    const pop = normalizeId(row.pop_site || "UNKNOWN_POP");
    if (!acc[pop]) acc[pop] = [];
    acc[pop].push(row);
    return acc;
  }, {});

  const sortedPops = Object.keys(groupedByPop).sort(compareText);
  let currentBaseY = START_Y;

  sortedPops.forEach((popSite) => {
    const graph = buildBranchGraph(groupedByPop[popSite], popSite);
    const popNodeId = `pop-${popSite}`;
    const tempNodes = [];
    const tempEdges = [];
    const leafCounter = { value: 0 };
    const placedNodes = new Set();
    const edgeIds = new Set();

    const childCenters = graph.firstLevelChildren.map((siteKey) =>
      layoutTree({
        siteKey,
        level: 1,
        graph,
        nodes: tempNodes,
        edges: tempEdges,
        currentLeafIndexRef: leafCounter,
        baseY: currentBaseY,
        popNodeId,
        placedNodes,
        edgeIds,
        pathSet: new Set(),
      }).centerY
    );

    const popCenterY =
      childCenters.length > 0
        ? (Math.min(...childCenters) + Math.max(...childCenters)) / 2
        : currentBaseY;

    nodes.push({
      id: popNodeId,
      type: "linkLevelNode",
      position: { x: START_X, y: popCenterY },
      draggable: false,
      data: {
        label: popSite,
        siteId: popSite,
        isPop: true,
        popSite,
        vendorKey: "POP",
        parentNodeId: null,
        depthLevel: 0,
      },
    });

    nodes.push(...tempNodes);
    edges.push(...tempEdges);

    const groupHeight =
      Math.max(leafCounter.value, 1) * LEAF_ROW_GAP_Y + POP_GROUP_GAP_Y;

    currentBaseY += groupHeight;
  });

  return { nodes, edges };
}