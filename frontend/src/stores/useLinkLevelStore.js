import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const DEFAULT_MENU = {
  visible: false,
  x: 0,
  y: 0,
  node: null,
};

const DEFAULT_STATE = {
  searchInput: "",
  selectedNodeId: null,
  focusedNodeId: null,
  viewport: null,
  menu: DEFAULT_MENU,
  viewData: null,
};

export const useLinkLevelStore = create(
  persist(
    (set) => ({
      ...DEFAULT_STATE,
      setSearchInput: (searchInput) => set({ searchInput }),
      setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
      setFocusedNodeId: (focusedNodeId) => set({ focusedNodeId }),
      focusNode: (nodeId) =>
        set({
          selectedNodeId: nodeId,
          focusedNodeId: nodeId,
        }),
      setViewport: (viewport) => set({ viewport }),
      openMenu: (x, y, node) =>
        set({
          menu: {
            visible: true,
            x,
            y,
            node,
          },
          selectedNodeId: node?.id || null,
          focusedNodeId: node?.id || null,
        }),
      closeMenu: () =>
        set((state) => ({
          menu:
            state.menu.visible || state.menu.node
              ? DEFAULT_MENU
              : state.menu,
        })),
      setViewData: (viewData) => set({ viewData }),
      clearViewData: () => set({ viewData: null }),
      clearWorkspace: () =>
        set({
          searchInput: "",
          selectedNodeId: null,
          focusedNodeId: null,
          viewport: null,
          menu: DEFAULT_MENU,
          viewData: null,
        }),
    }),
    {
      name: "admin-link-level-ui-state",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        searchInput: state.searchInput,
        selectedNodeId: state.selectedNodeId,
        focusedNodeId: state.focusedNodeId,
        viewport: state.viewport,
      }),
    }
  )
);
