# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Key commands

All commands are intended to be run from the repository root (`MidCar/`). The project uses **Next.js (App Router)** with **npm**.

- **Install dependencies**
  - `npm install`
- **Run development server** (Next.js dev mode on port 3000)
  - `npm run dev`
- **Build static site for production** (used by Netlify; outputs to `out/` via `next.config.js`)
  - `npm run build`
- **Start Next.js production server**
  - `npm run start`
  - Note: with `output: 'export'` configured in `next.config.js`, production deployments typically serve the static `out/` folder (see `netlify.toml`). Use this mainly if the project is reconfigured away from static export.
- **Lint**
  - `npm run lint`
- **Type-check (no emit)**
  - `npx tsc --noEmit`
- **Environment setup**
  - Copy example env file and edit with real values (Supabase, etc.):
    - Unix shells: `cp .env.example .env.local`
    - PowerShell: `Copy-Item .env.example .env.local`

There are **no test scripts configured** in `package.json` yet; if you add a test runner (Jest, Vitest, Playwright, etc.), also add explicit `test` / `test:watch` scripts and document focused test commands there.

## High-level architecture

### App structure and routing

- The app uses the **Next.js App Router** under `src/app/`.
  - `src/app/layout.tsx` defines the root HTML shell (Manrope font, metadata, viewport, global CSS import) and wraps all routes.
  - `src/app/page.tsx` immediately redirects `/` to `/dashboard` using `next/navigation`.
- The main product UI lives under the **`(dashboard)` route group**:
  - `src/app/(dashboard)/layout.tsx` is the shared layout for all backoffice pages; it wraps pages with the top `Header`, bottom `BottomNav` (mobile), and a `TooltipProvider`.
  - Feature routes under this group correspond to the main modules of the backoffice:
    - `/dashboard` – overview KPIs and charts (dashboard module).
    - `/crm` – sales/lead pipeline views.
    - `/contactos` – contacts CRM table + filters + detail modals.
    - `/inventario` – vehicle inventory list; `/inventario/[id]` for details; `/inventario/[id]/editar` for editing; `/inventario/nuevo` for new vehicles.
    - `/seguro` – insurance/policies backoffice.
    - `/informes` and `/reportes` – reporting/analytics sections.
- Navigation is duplicated in two main places:
  - `src/components/layout/Header.tsx` (desktop + mobile header, including search and notifications).
  - `src/components/layout/BottomNav.tsx` (mobile bottom nav bar).
  - The same conceptual nav structure is also encoded in `src/lib/constants.ts` as `NAV_ITEMS` and `UTILIDADES_MENU`. When adding or renaming top-level sections, keep these three in sync.

### Components by area

- **Layout & shell** (`src/components/layout/`)
  - `Header.tsx`: sticky top navigation, global search over mock vehicles/clients, notification dropdown using `mockNotifications` and `mock-data`.
  - `BottomNav.tsx`: fixed bottom nav for mobile, aligned with main sections (`/dashboard`, `/inventario`, `/crm`, `/contactos`).
- **Dashboard** (`src/components/dashboard/`)
  - Components such as `KPICard`, `Charts`, and `Gauge` render high-level metrics and charts, typically backed by mock KPI and chart data from `src/lib/mock-data.ts`.
- **Contacts / CRM**
  - `src/components/contacts/`: collection of modals for contact details and workflows (`ContactDetailModal`, `NewContactModal`, `NewInteractionModal`, `AssignCommercialModal`, `AddTaskModal`, etc.). These are driven by `Contact`, `ContactInteraction`, and billing types from `src/types/index.ts` plus enumerations like `ESTADOS_BACKOFFICE`, `CATEGORIAS_CONTACTO`, etc. from `src/lib/constants.ts`.
  - `src/components/crm/`: CRM-specific components like `LeadDetailModal`, `NewLeadModal`, and `StatusBadge`, which use `Lead` types and lead-related constants.
- **Inventory** (`src/components/inventory/`)
  - Contains all vehicle-related UI: cards/tables (`VehicleCard`, `VehicleTable`), forms (`VehicleForm`, `EditVehicleForm`), document and photo uploaders (`DocumentUploader`, `PhotoUploader`), and tools like `PrintableAd`, `VehicleAdGenerator`, `ShareModal`, `WebLinkModal`.
  - These components are tightly coupled to `Vehicle`, `VehicleEquipment`, and related types in `src/types/index.ts` and the vehicle enums/constants in `src/lib/constants.ts`.
- **Insurance** (`src/components/insurance/`)
  - Components for the insurance module (`InsuranceDetailPanel`, `InsurancePolicyModal`, `ImportPreviewModal`) rely on insurance-related types (`PolizaSeguro`, `InsuranceCoverages`, etc.) from `src/types/index.ts` and mock insurance data in `src/lib/mock-insurance.ts`.
- **Shared UI primitives** (`src/components/ui/`)
  - shadcn-style primitives (`button`, `card`, `dialog`, `table`, `tabs`, `tooltip`, etc.) used across all features.
  - When creating new UI, prefer composing these primitives rather than introducing ad-hoc elements, to maintain consistency with the existing design system.

### Data, domain modeling, and mocks

- **Types** (`src/types/index.ts`)
  - This file is the **single source of truth for domain models**:
    - Core entities: `Vehicle`, `VehicleImage`, `VehicleEquipment`, `Lead`, `Client`, `User`, `Interaction`, `Sale`, `Contact`, `ContactInteraction`, insurance types (`InsuranceState`, `InsurancePolicyType`, `InsuranceCoverages`, `PolizaSeguro`), dashboard-related types (`KPI`, `Notification`, `ReportFilter`, `ChatbotConversation`, `ChatMessage`), and various enums/constants (`INSURANCE_COMPANIES`, `POLICY_TYPES`, `INSURANCE_STATE_CONFIG`).
  - Any change to the business data model (e.g., adding vehicle fields, new lead states, additional insurance fields) should start here, then be propagated to constants and mocks.
- **Business constants** (`src/lib/constants.ts`)
  - Encodes domain vocabularies and configuration for the UI: DGT labels, vehicle states, lead states/priorities, fuel types, transmissions, body types, brands, contact states/categories/subjects, payment/document/client types, Spanish autonomous communities, main nav items, utilities menu, required vehicle documents, and a rich `EQUIPAMIENTO_VEHICULO` structure.
  - Many UI controls (selects, filters, badges) are driven directly from these arrays; when adjusting labels/colors or adding new options, prefer editing them here rather than hardcoding inside components.
- **Mock data** (`src/lib/mock-data.ts`, `src/lib/mock-insurance.ts`)
  - Provides realistic sample data for all modules (users, vehicles, clients, leads, KPIs, charts, chatbot stats, contacts, etc.).
  - Components like `Header` and dashboard/CRM/inventory pages use these mocks to render a fully functional backoffice **without a real backend**.
  - When adding new fields to core types, update mocks to keep the demo flows working and avoid runtime `undefined` issues in UI components.
- **Backend integration**
  - The project is designed to eventually connect to **Supabase** (see environment variables in `.env.example` and documentation in `README.md` / `WALKTHROUGH.md`), but currently operates entirely on in-memory mock data.
  - When introducing real persistence or Supabase queries, keep `src/types/index.ts` and `src/lib/constants.ts` as the canonical domain definitions and align database schemas with them.

### Styling and theming

- **Tailwind configuration** (`tailwind.config.ts`)
  - Uses `darkMode: ["class"]` and extends theme tokens for `primary`, `background`, `surface`, `text`, `border`, status colors (`success`, `warning`, `danger`, `info`), and various `slate`/`gray` scales, plus custom shadows, radii, and animations.
  - The layout currently sets `<html lang="es" className="light">`; dark mode is available via class toggling rather than system preference.
- **Global styles** (`src/app/globals.css`)
  - Defines the base dark theme tokens (backgrounds, cards, primary color, etc.) referenced in the walkthrough and README.
  - When changing core colors or typography, prefer editing `tailwind.config.ts` and the CSS variables in `globals.css` instead of hardcoding values in components.

### Build and deployment behavior

- **Static export**
  - `next.config.js` sets `output: 'export'` and `images.unoptimized: true`, so `npm run build` produces a static export in `out/` rather than a Node server.
  - `netlify.toml` is configured to:
    - Run `npm run build` as the build command.
    - Publish the `out/` directory.
    - Redirect all routes (`/*`) to `/index.html` (SPA-style fallback), which is important for client-side routing.
- This means any new pages or API-like behavior should be compatible with **static generation**. Avoid adding server-only logic that requires `next start` unless you also adjust the deployment configuration away from `output: 'export'`.

### Design reference assets

- The `stitch_listado_de_inventario_de_veh_culos/` directory contains design exports (HTML + screenshots) for various MidCar backoffice screens (inventory list, contact details, insurance panels, etc.).
  - These files are **not part of the Next.js build** and serve only as design/UX references.
  - When implementing or refining UI, you can cross-check layouts/spacing/flows against these Stitch exports.
