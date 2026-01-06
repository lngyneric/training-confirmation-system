# Project Context

## Purpose
Training Confirmation System: A web application designed to track and confirm training tasks. It serves as a dashboard for users to view assigned training modules, track progress, and confirm completion.

## Tech Stack
- **Language**: TypeScript (ESNext, React JSX runtime)
- **Frontend Framework**: React 19
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4
- **Routing**: wouter (hash-based navigation)
- **State Management**: React Context (AuthContext, ThemeContext)
- **Forms/Validation**: React Hook Form + Zod
- **UI**: Radix UI primitives; shadcn-style components under `components/ui`; Lucide React (icons); Sonner (toasts)
- **Charts**: Recharts (radar chart)
- **Dates**: date-fns (heatmap, formatting)
- **Testing**: Vitest
- **Linting**: ESLint (flat config)
- **Formatter**: Prettier
- **Package Manager**: npm
- **Module Alias**: `@/*` → `src/*` (TypeScript + Vite)

## Project Conventions

### Code Style
- **Linting**: ESLint flat config ([eslint.config.js](file:///c:/Users/lingyun/Documents/trae_projects/Trainingreport/eslint.config.js))
- **Formatting**: Prettier
- **TypeScript**:
  - `verbatimModuleSyntax: true` → use `import type` for type-only imports
  - `moduleResolution: bundler`, `jsx: react-jsx`, `paths` alias `@/*`
- **Naming**:
  - Page/feature components: PascalCase (e.g., [TaskCard.tsx](file:///c:/Users/lingyun/Documents/trae_projects/Trainingreport/src/components/TaskCard.tsx))
  - UI library files: kebab-case under `components/ui` (e.g., [button.tsx](file:///c:/Users/lingyun/Documents/trae_projects/Trainingreport/src/components/ui/button.tsx))
  - Hooks/utils: camelCase (e.g., [utils.ts](file:///c:/Users/lingyun/Documents/trae_projects/Trainingreport/src/lib/utils.ts))
- **CSS**: Tailwind utility-first; prefer Tailwind v4 tokens (e.g., `bg-linear-to-t` instead of `bg-gradient-to-t`). Use `cn()` for class merging.

### Architecture Patterns
- **Structure**:
  - `components/ui`: Atomic reusable building blocks (shadcn-style)
  - `components`: Feature components (e.g., charts, cards)
  - `pages`: Route-level views (e.g., [Home.tsx](file:///c:/Users/lingyun/Documents/trae_projects/Trainingreport/src/pages/Home.tsx), [Login.tsx](file:///c:/Users/lingyun/Documents/trae_projects/Trainingreport/src/pages/Login.tsx))
  - `contexts`: Global providers ([AuthContext](file:///c:/Users/lingyun/Documents/trae_projects/Trainingreport/src/contexts/AuthContext.tsx), [ThemeContext](file:///c:/Users/lingyun/Documents/trae_projects/Trainingreport/src/contexts/ThemeContext.tsx))
  - `lib`: Utilities, parsers ([data-parser.ts](file:///c:/Users/lingyun/Documents/trae_projects/Trainingreport/src/lib/data-parser.ts))
- **State**:
  - Global UI/auth via Context API; view state inside pages with React state/hooks
- **Routing**:
  - Hash-based with wouter; AuthContext redirects between `/login` and `/`
- **Data Persistence**:
  - LocalStorage keys: `training-confirmations`, `training-system-user`

### Testing Strategy
- Vitest for unit/integration tests; example parser tests ([data-parser.test.ts](file:///c:/Users/lingyun/Documents/trae_projects/Trainingreport/src/lib/data-parser.test.ts))

### Git Workflow
- Default branch: `master` (tracked) 

## Domain Context
- **Entities**:
  - **Tasks**: Training modules or items to be confirmed.
  - **Users**: Authenticated entities accessing the system.
- **Sections**: Tasks grouped by section with titles derived from source data.
- **Data Source**: Static JSON assets ([tasks.json](file:///c:/Users/lingyun/Documents/trae_projects/Trainingreport/src/assets/tasks.json), [meta.json](file:///c:/Users/lingyun/Documents/trae_projects/Trainingreport/src/assets/meta.json)) used to render initial content.
- **Import/Export**:
  - CSV/JSON import builds `sections` and reconstructs confirmations ([parseCSV](file:///c:/Users/lingyun/Documents/trae_projects/Trainingreport/src/lib/data-parser.ts#L97-L160))
  - CSV export includes BOM for Excel compatibility ([exportToCSV](file:///c:/Users/lingyun/Documents/trae_projects/Trainingreport/src/lib/data-parser.ts#L183-L206))

## Important Constraints
- Hash routing simplifies static hosting (no server-side rewrites).
- React 19 with the new JSX runtime; TypeScript `verbatimModuleSyntax` enforces type-only imports.
- Tailwind CSS v4 tokens and utilities; use updated class names.

## Runbook
- Dev: `npm run dev` (Vite, default port 5173 or next available)
- Lint: `npm run lint`
- Build: `npm run build`
- Preview: `npm run preview`

## Feature Highlights
- Training dimensions radar chart ([TrainingDimensionsChart.tsx](file:///c:/Users/lingyun/Documents/trae_projects/Trainingreport/src/components/TrainingDimensionsChart.tsx))
- Activity heatmap by completion dates ([ActivityHeatmap.tsx](file:///c:/Users/lingyun/Documents/trae_projects/Trainingreport/src/components/ActivityHeatmap.tsx))
