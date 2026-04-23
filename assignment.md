# Network Ops Dashboard Assignment

## Objective
Use the current codebase as the baseline and complete the missing admin and integration work across the frontend and backend without reworking the already functional modules.

## Current Status

### Working end-to-end modules
- Authentication and protected routing
- Sites management
- Microwave links management
- Microwave link budget management
- Site connectivity management
- Link status monitoring
- Link level topology flow
- Client page builder
- Client dynamic page rendering and export

### Placeholder or incomplete admin modules
- Ping page UI
- Templates page
- Topology page
- Users page
- Audit logs page

### Technical gaps noticed during scan
- Backend auth protection is inconsistent across routers
- Some backend routers use shared `get_db`, others redefine their own DB session
- No test suite was found
- Admin menu exposes pages that do not yet have full backend support

## Assignment By Area

### 1. Backend Assignment
Owner: Backend developer

Deliverables:
- Standardize authentication and role enforcement across all routers
- Add missing admin APIs for user management
- Add missing admin APIs for audit logs
- Review `client-pages`, `site-connectivity`, `link-level`, and `microwave-link-budgets` for proper access control
- Standardize DB session handling to one shared approach
- Add validation and error consistency across CRUD and import/export endpoints

Primary files involved:
- [backend/app/main.py](<c:/Web App/network-ops-dashboard/backend/app/main.py>)
- [backend/app/routers/auth.py](<c:/Web App/network-ops-dashboard/backend/app/routers/auth.py>)
- [backend/app/routers/sites.py](<c:/Web App/network-ops-dashboard/backend/app/routers/sites.py>)
- [backend/app/routers/microwave_links.py](<c:/Web App/network-ops-dashboard/backend/app/routers/microwave_links.py>)
- [backend/app/routers/microwave_link_budgets.py](<c:/Web App/network-ops-dashboard/backend/app/routers/microwave_link_budgets.py>)
- [backend/app/routers/site_connectivity.py](<c:/Web App/network-ops-dashboard/backend/app/routers/site_connectivity.py>)
- [backend/app/routers/link_level.py](<c:/Web App/network-ops-dashboard/backend/app/routers/link_level.py>)
- [backend/app/routers/client_pages.py](<c:/Web App/network-ops-dashboard/backend/app/routers/client_pages.py>)
- [backend/app/routers/tools.py](<c:/Web App/network-ops-dashboard/backend/app/routers/tools.py>)

Priority:
- High

### 2. Frontend Assignment
Owner: Frontend developer

Deliverables:
- Build real UI for Ping page
- Build real UI for Templates page
- Build real UI for Topology page
- Build real UI for Users page
- Build real UI for Audit Logs page
- Keep new pages aligned with existing admin layout, sidebar, loading, and auth patterns
- Connect placeholder pages to backend endpoints once APIs are ready

Primary files involved:
- [frontend/src/app/router.jsx](<c:/Web App/network-ops-dashboard/frontend/src/app/router.jsx>)
- [frontend/src/components/layout/AdminLayout.jsx](<c:/Web App/network-ops-dashboard/frontend/src/components/layout/AdminLayout.jsx>)
- [frontend/src/constants/adminMenuConfig.js](<c:/Web App/network-ops-dashboard/frontend/src/constants/adminMenuConfig.js>)
- [frontend/src/pages/admin/AdminPingPage.jsx](<c:/Web App/network-ops-dashboard/frontend/src/pages/admin/AdminPingPage.jsx>)
- [frontend/src/pages/admin/AdminTemplatesPage.jsx](<c:/Web App/network-ops-dashboard/frontend/src/pages/admin/AdminTemplatesPage.jsx>)
- [frontend/src/pages/admin/AdminTopologyPage.jsx](<c:/Web App/network-ops-dashboard/frontend/src/pages/admin/AdminTopologyPage.jsx>)
- [frontend/src/pages/admin/AdminUsersPage.jsx](<c:/Web App/network-ops-dashboard/frontend/src/pages/admin/AdminUsersPage.jsx>)
- [frontend/src/pages/admin/AdminAuditLogsPage.jsx](<c:/Web App/network-ops-dashboard/frontend/src/pages/admin/AdminAuditLogsPage.jsx>)

Priority:
- High

### 3. Full-Stack Integration Assignment
Owner: Full-stack developer

Deliverables:
- Verify every admin page has a matching backend route set
- Create a page-to-API mapping checklist
- Align request and response shapes across frontend API modules and backend routers
- Standardize loading, error, empty-state, and success handling across major admin pages
- Confirm role behavior for `admin` and `client` users end-to-end

Primary frontend modules already active:
- [frontend/src/pages/admin/AdminSitesPage.jsx](<c:/Web App/network-ops-dashboard/frontend/src/pages/admin/AdminSitesPage.jsx>)
- [frontend/src/pages/admin/AdminLinksPage.jsx](<c:/Web App/network-ops-dashboard/frontend/src/pages/admin/AdminLinksPage.jsx>)
- [frontend/src/pages/admin/AdminMicrowaveLinkBudgetPage.jsx](<c:/Web App/network-ops-dashboard/frontend/src/pages/admin/AdminMicrowaveLinkBudgetPage.jsx>)
- [frontend/src/pages/admin/AdminSiteConnectivityPage.jsx](<c:/Web App/network-ops-dashboard/frontend/src/pages/admin/AdminSiteConnectivityPage.jsx>)
- [frontend/src/pages/admin/AdminLinkLevelPage.jsx](<c:/Web App/network-ops-dashboard/frontend/src/pages/admin/AdminLinkLevelPage.jsx>)
- [frontend/src/pages/admin/AdminClientPageBuilder.jsx](<c:/Web App/network-ops-dashboard/frontend/src/pages/admin/AdminClientPageBuilder.jsx>)
- [frontend/src/pages/client/ClientDynamicPage.jsx](<c:/Web App/network-ops-dashboard/frontend/src/pages/client/ClientDynamicPage.jsx>)

Priority:
- Medium to High

### 4. QA Assignment
Owner: QA engineer

Deliverables:
- Create smoke test coverage for login and protected routes
- Test CRUD flows for sites, links, budgets, and site connectivity
- Test Excel import and export flows
- Test link level graph data loading, search, view, and ping actions
- Test client page builder and published client page behavior
- Validate role restrictions for admin and client users

Test focus areas:
- Auth
- Route protection
- Import/export reliability
- Search and filtering
- Pagination
- Permission boundaries

Priority:
- High

## Suggested Execution Order
1. Backend access control and missing admin APIs
2. Frontend implementation for placeholder admin pages
3. Full-stack integration pass for route and payload alignment
4. QA smoke tests and regression coverage

## Short Ownership Summary
- Backend: secure and complete the API surface
- Frontend: finish the missing admin pages and connect them cleanly
- Full-stack: close page-to-endpoint gaps and unify behavior
- QA: validate business flows, permissions, and imports/exports
