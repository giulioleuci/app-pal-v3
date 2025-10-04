# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Blueprint Fitness is a Progressive Web App (PWA) for fitness tracking built with React, TypeScript, and WatermelonDB. The application follows a strict layered architecture inspired by Domain-Driven Design (DDD) and Clean Architecture principles.

## Development Commands

### Running the Application
```bash
npm run dev              # Start development server (Vite)
npm run build            # Build for production
npm run preview          # Preview production build
```

### Testing
```bash
npm test                 # Run tests in watch mode (Vitest)
npm run test:run         # Run tests once
npm run test:e2e         # Run end-to-end tests (Cypress)
npm run cypress          # Open Cypress interactive mode
npm run cypress:headless # Run Cypress headless
npm run test:mutate      # Run mutation testing (Stryker)
```

### Code Quality
```bash
npm run lint             # Run ESLint
```

### Storybook (Component Development)
```bash
npm run storybook        # Start Storybook dev server on port 6006
npm run build-storybook  # Build static Storybook
```

### Code Generation
```bash
npm run generate:component  # Generate new component with Plop
npm run generate:feature    # Generate new feature module with Plop
npm run i18n:sync          # Sync i18n types from locale files
```

### Documentation Generation
```bash
npm run docs:domain        # Generate domain layer documentation
npm run docs:persistence   # Generate persistence layer documentation
npm run docs:app          # Generate application layer documentation
npm run docs:ui-logic     # Generate UI logic layer documentation
```

## Architecture Overview

The application follows a **7-layer architecture** with strict dependency rules:

### Layer 1: Domain Layer (`src/shared/domain/`)
**Pure business logic with no external dependencies**

- **Value Objects**: Immutable domain primitives (Weight, RPE, Duration, Counter, etc.)
- **Domain Events**: Event-driven communication (`ProfileCreatedEvent`, `WorkoutFinishedEvent`, etc.)
- **Event Handlers**: Domain-level event handlers
- **BaseModel**: Abstract base class for domain entities

**Key Rules:**
- No dependencies on infrastructure, UI, or framework code
- All business rules enforced here
- Value objects are immutable and self-validating

### Layer 2: Persistence Layer (`src/app/db/`)
**WatermelonDB models and database schema**

- **Schema** (`schema.ts`): WatermelonDB schema definitions for all tables
- **Models** (`model/`): WatermelonDB ORM models (Profile, Exercise, TrainingPlan, etc.)
- **Transactions** (`transaction.ts`): Database transaction utilities
- **Fixtures** (`fixtures/`): Sample data for development and testing

**Key Rules:**
- Models handle only data persistence - no business logic
- All database operations go through WatermelonDB
- Schema migrations tracked by version number

**Database Tables:**
- Profile system: `profiles`, `user_settings`, `user_details`, `custom_themes`
- Exercise system: `exercises`, `exercise_templates`
- Training plans: `training_cycles`, `training_plans`, `workout_sessions`, `exercise_groups`, `applied_exercises`
- Workout logs: `workout_logs`, `performed_groups`, `performed_exercise_logs`, `performed_sets`
- Body metrics: `height_records`, `weight_records`
- Max logs: `max_logs`
- Workout state: `workout_states`

### Layer 3: Application Services Layer (`src/features/*/services/`)
**Stateless orchestrators coordinating domain and persistence**

Each feature has its own service directory with:
- Domain-specific business operations
- Multi-repository coordination
- Transaction management
- Error handling and logging

**Dependency Injection:** Uses `tsyringe` for constructor injection

### Layer 4: Query Services Layer (`src/features/*/query-services/`)
**Optimized read operations for UI consumption**

- Fetch and aggregate data from multiple sources
- Transform persistence models into UI-friendly formats
- No write operations (read-only layer)

### Layer 5: UI Logic Layer (`src/features/*/hooks/`)
**React Query hooks integrating services with UI**

- **Query hooks**: Fetch and cache data (`useQuery`)
- **Mutation hooks**: Execute write operations (`useMutation`)
- Manages loading, error, and success states
- Provides optimistic updates and cache invalidation

**Key Patterns:**
- All hooks use `@tanstack/react-query`
- Query keys centralized in `src/app/queryKeys.ts`
- Mutations trigger cache invalidation and optimistic updates

### Layer 6: Presentation Layer (`src/features/*/components/`, `src/shared/components/`)
**"Dumb" UI components that only render**

- Receive all data via props
- Emit events via function props
- No direct data fetching or state management
- Fully documented in Storybook

**Component Types:**
- **Feature Components**: Domain-specific UI (`src/features/*/components/`)
- **Shared Components**: Reusable primitives (`src/shared/components/`)

**Storybook Requirements:**
- Every component must have a `.stories.tsx` file
- Complete `argTypes` definition for all props
- Multiple stories showing different states

### Layer 7: Application Composition (`src/app/`, `src/App.tsx`)
**Top-level app assembly**

- **Routing** (`AppRoutes.tsx`, `routes.ts`): React Router configuration
- **Providers** (`providers/`): Context providers (Theme, Snackbar, Query Client)
- **Pages** (`pages/`): Smart container components that compose hooks + dumb components
- **Layout** (`MainLayout.tsx`): App shell and navigation
- **Store** (`store/`): Zustand stores for global state (profile, theme)

## Key Technical Patterns

### Dependency Injection
- Uses `tsyringe` container
- Services registered with `@injectable()` decorator
- Dependencies injected via `@inject()` in constructors
- Configuration in `src/app/services/index.ts`

### State Management
- **Server State**: React Query (`@tanstack/react-query`)
- **Global Client State**: Zustand (`src/app/store/`)
  - `profileStore`: Active profile management
  - `themeStore`: Theme preferences
- **Local UI State**: React hooks (`useState`, `useReducer`)
- **Form State**: `react-hook-form` with Zod validation

### Domain Events
- Event bus pattern in `src/shared/domain/events/DomainEvents.ts`
- Handlers registered at startup
- Cross-cutting concerns (e.g., progress tracking on workout completion)

### Error Handling
- Custom error hierarchy (`src/shared/errors/`)
  - `ApplicationError`: Base error class
  - `NotFoundError`, `ConflictError`, `BusinessRuleError`, etc.
- `Result<T, E>` pattern for error propagation (`src/shared/utils/Result.ts`)
- Global error boundaries in UI

### Form Validation
- Zod schemas for type-safe validation (`src/shared/validation/`)
- Integration with `react-hook-form-mui`
- Validation errors are i18n keys, translated by `t()` function

### Internationalization (i18n)
- `i18next` + `react-i18next`
- Locale files in `src/shared/locales/`
- Type-safe translation keys in `i18n.generated.ts`
- Sync types with `npm run i18n:sync`

### Testing Strategy

**Unit Tests** (Vitest):
- Domain value objects (`__tests__` in `src/shared/domain/value-objects/`)
- Services and query services
- Hooks (using `reactive-hook-test-utils.tsx`)

**Integration Tests** (Vitest):
- Page-level integration (`src/app/pages/__tests__/`)
- Feature flows (`src/features/*/hooks/__tests__/`)

**E2E Tests** (Cypress):
- Full user workflows
- Configuration in `cypress.config.ts`

**Mutation Testing** (Stryker):
- Run with `npm run test:mutate`

**Architecture Tests** (Vitest):
- Enforce layer boundaries (`src/architecture/`)
- Domain purity checks
- Repository interface conformance

## File Organization by Feature

Each feature in `src/features/` follows the same structure:

```
src/features/[feature-name]/
├── domain/              # Domain models and repository interfaces
│   ├── [Entity]Model.ts
│   ├── I[Entity]Repository.ts
│   └── __tests__/
├── data/                # Repository implementations
│   ├── [Entity]Repository.ts
│   └── __tests__/
├── services/            # Application services
│   ├── [Feature]Service.ts
│   └── __tests__/
├── query-services/      # Read-optimized query services
│   ├── [Feature]QueryService.ts
│   └── __tests__/
├── hooks/               # React Query hooks
│   ├── use[Feature].ts
│   └── __tests__/
└── components/          # Feature-specific UI components
    ├── [Component].tsx
    ├── [Component].stories.tsx
    └── __tests__/
```

## Important Development Guidelines

### When Creating New Components
1. Always create both `.tsx` and `.stories.tsx` files
2. Add semantic `data-testid` attributes for testing
3. Use MUI's `sx` prop for styling (reference theme tokens)
4. All user-facing text must use `t()` function with i18n keys
5. Components should be "dumb" - receive data via props, emit events via callbacks

### When Creating New Features
1. Use `npm run generate:feature` to scaffold the structure
2. Follow the 7-layer pattern
3. Start with domain models, then move outward to UI
4. Write tests for each layer as you go

### When Adding New Database Tables
1. Update `src/app/db/schema.ts` (increment version number)
2. Create corresponding WatermelonDB model in `src/app/db/model/`
3. Export from `src/app/db/model/index.ts`
4. Create repository interface in feature's `domain/` folder
5. Implement repository in feature's `data/` folder

### When Working with Forms
1. Define Zod schema in `src/shared/validation/`
2. Use `react-hook-form-mui` components
3. Error messages should be i18n keys resolved by `t()`
4. Handle form submission in page component, not in form component itself

### Path Aliases
Use `@/` as an alias for `src/`:
```typescript
import { MaxLogService } from '@/features/max-log/services/MaxLogService';
```

## Technology Stack

**Core Framework:**
- React 19 with TypeScript
- Vite (build tool)
- React Router (routing)

**UI Library:**
- Material-UI (MUI) v7
- Emotion (CSS-in-JS)
- Framer Motion (animations)

**Data & State:**
- WatermelonDB (local database)
- React Query (server state)
- Zustand (global client state)
- React Hook Form (form state)

**Testing:**
- Vitest (unit/integration tests)
- Cypress (E2E tests)
- Testing Library (React component testing)
- Stryker (mutation testing)

**Developer Tools:**
- ESLint (linting)
- Prettier (formatting)
- Storybook (component development)
- TypeScript (type safety)
- Plop (code generation)

## Common Pitfalls to Avoid

1. **Don't put business logic in UI components** - Use services and domain models
2. **Don't bypass the repository pattern** - Always access data through repositories
3. **Don't create circular dependencies** - Follow the layer dependency rules
4. **Don't use hardcoded strings in UI** - Use i18n keys
5. **Don't forget to update Storybook** - Components without stories are incomplete
6. **Don't mix data fetching in components** - Use hooks from the UI Logic layer
7. **Don't ignore TypeScript errors** - Fix them, don't suppress with `any` or `@ts-ignore`

## Performance Considerations

- WatermelonDB uses lazy loading and observables for efficient reactivity
- React Query handles caching and deduplication automatically
- Use `@tanstack/react-virtual` for large lists (see `VirtualizedCardList`)
- Debounce expensive inputs (search fields, filters)
- Optimize re-renders with `React.memo` when appropriate

## Deployment

The application is configured as a PWA:
- Service worker configuration in `vite-plugin-pwa`
- Offline-first with WatermelonDB
- Build with `npm run build`
- Preview production build with `npm run preview`
