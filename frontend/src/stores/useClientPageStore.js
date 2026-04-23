import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const DEFAULT_CLIENT_PAGE_UI_STATE = {
  searchInput: "",
  search: "",
  selectedRowIds: [],
  viewingRow: null,
  sortConfig: {
    key: null,
    direction: "asc",
  },
  page: 1,
  pageSize: null,
};

function getPageState(state, slug) {
  return state.pagesBySlug[slug] || DEFAULT_CLIENT_PAGE_UI_STATE;
}

export const useClientPageStore = create(
  persist(
    (set, get) => ({
      pagesBySlug: {},
      ensurePage: (slug) => {
        if (!slug || get().pagesBySlug[slug]) {
          return;
        }

        set((state) => ({
          pagesBySlug: {
            ...state.pagesBySlug,
            [slug]: { ...DEFAULT_CLIENT_PAGE_UI_STATE },
          },
        }));
      },
      hydratePageSize: (slug, pageSize) => {
        if (!slug || !pageSize) {
          return;
        }

        set((state) => {
          const current = getPageState(state, slug);
          if (current.pageSize) {
            return state;
          }

          return {
            pagesBySlug: {
              ...state.pagesBySlug,
              [slug]: {
                ...current,
                pageSize,
              },
            },
          };
        });
      },
      setSearchInput: (slug, searchInput) =>
        set((state) => ({
          pagesBySlug: {
            ...state.pagesBySlug,
            [slug]: {
              ...getPageState(state, slug),
              searchInput,
            },
          },
        })),
      commitSearch: (slug, value) =>
        set((state) => ({
          pagesBySlug: {
            ...state.pagesBySlug,
            [slug]: {
              ...getPageState(state, slug),
              search: String(value || "").trim(),
              page: 1,
            },
          },
        })),
      clearSearch: (slug) =>
        set((state) => ({
          pagesBySlug: {
            ...state.pagesBySlug,
            [slug]: {
              ...getPageState(state, slug),
              searchInput: "",
              search: "",
              page: 1,
            },
          },
        })),
      setSelectedRowIds: (slug, selectedRowIds) =>
        set((state) => ({
          pagesBySlug: {
            ...state.pagesBySlug,
            [slug]: {
              ...getPageState(state, slug),
              selectedRowIds,
            },
          },
        })),
      toggleRowSelection: (slug, rowId) =>
        set((state) => {
          const current = getPageState(state, slug);
          const nextSelected = current.selectedRowIds.includes(rowId)
            ? current.selectedRowIds.filter((id) => id !== rowId)
            : [...current.selectedRowIds, rowId];

          return {
            pagesBySlug: {
              ...state.pagesBySlug,
              [slug]: {
                ...current,
                selectedRowIds: nextSelected,
              },
            },
          };
        }),
      toggleSelectAllRows: (slug, rowIds) =>
        set((state) => {
          const current = getPageState(state, slug);
          const safeRowIds = Array.isArray(rowIds) ? rowIds.filter(Boolean) : [];
          const allSelected =
            safeRowIds.length > 0 &&
            safeRowIds.every((id) => current.selectedRowIds.includes(id));

          const selectedRowIds = allSelected
            ? current.selectedRowIds.filter((id) => !safeRowIds.includes(id))
            : Array.from(new Set([...current.selectedRowIds, ...safeRowIds]));

          return {
            pagesBySlug: {
              ...state.pagesBySlug,
              [slug]: {
                ...current,
                selectedRowIds,
              },
            },
          };
        }),
      clearSelection: (slug) =>
        set((state) => ({
          pagesBySlug: {
            ...state.pagesBySlug,
            [slug]: {
              ...getPageState(state, slug),
              selectedRowIds: [],
            },
          },
        })),
      setViewingRow: (slug, viewingRow) =>
        set((state) => ({
          pagesBySlug: {
            ...state.pagesBySlug,
            [slug]: {
              ...getPageState(state, slug),
              viewingRow,
            },
          },
        })),
      clearViewingRow: (slug) =>
        set((state) => ({
          pagesBySlug: {
            ...state.pagesBySlug,
            [slug]: {
              ...getPageState(state, slug),
              viewingRow: null,
            },
          },
        })),
      setSort: (slug, key) =>
        set((state) => {
          const current = getPageState(state, slug);
          const nextSort =
            current.sortConfig.key !== key
              ? { key, direction: "asc" }
              : {
                  key,
                  direction:
                    current.sortConfig.direction === "asc" ? "desc" : "asc",
                };

          return {
            pagesBySlug: {
              ...state.pagesBySlug,
              [slug]: {
                ...current,
                sortConfig: nextSort,
              },
            },
          };
        }),
      setPage: (slug, page) =>
        set((state) => ({
          pagesBySlug: {
            ...state.pagesBySlug,
            [slug]: {
              ...getPageState(state, slug),
              page,
            },
          },
        })),
      setPageSize: (slug, pageSize) =>
        set((state) => ({
          pagesBySlug: {
            ...state.pagesBySlug,
            [slug]: {
              ...getPageState(state, slug),
              pageSize,
              page: 1,
            },
          },
        })),
    }),
    {
      name: "client-page-ui-state",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        pagesBySlug: Object.fromEntries(
          Object.entries(state.pagesBySlug).map(([slug, pageState]) => [
            slug,
            {
              searchInput: pageState.searchInput,
              search: pageState.search,
              selectedRowIds: pageState.selectedRowIds,
              sortConfig: pageState.sortConfig,
              page: pageState.page,
              pageSize: pageState.pageSize,
            },
          ])
        ),
      }),
    }
  )
);
