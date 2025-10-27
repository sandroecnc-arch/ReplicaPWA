# Manicure Studio Lite - PWA

## Overview

Manicure Studio Lite is a comprehensive Progressive Web App for managing manicure studio operations. The application provides appointment scheduling, client management, loyalty programs, analytics, and automated push notifications. Built as a mobile-first PWA, it offers native app-like experiences while maintaining web accessibility.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Application Type
**Progressive Web App (PWA)** - Full-stack web application with offline capabilities, installable on mobile devices, and native-like user experience.

### Frontend Architecture

**Core Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod validation

**UI Components & Styling**:
- **Component Library**: Radix UI primitives (headless, accessible components)
- **Design System**: Shadcn UI (pre-styled Radix components)
- **Styling**: Tailwind CSS with custom design tokens
- **Design Approach**: Material Design 3 inspired, professional beauty industry aesthetics
- **Typography**: Inter (primary), Playfair Display (accent/branding)
- **Theme Support**: Light/dark mode with persistent user preference

**Data Visualization**:
- Recharts for business analytics and reporting charts

### Backend Architecture

**Runtime & Framework**: Node.js with Express.js
- RESTful API architecture
- JSON-based request/response format
- Zod schema validation for API inputs

**Database Strategy**:
- **Primary Database**: SQLite with better-sqlite3 (synchronous operations)
- Single file storage (`db.sqlite`) for simplicity
- Foreign key constraints enabled
- Tables: `clientes`, `servicos`, `produtos`, `agendamentos`

**Note**: The codebase includes Drizzle ORM configuration for PostgreSQL (via Neon Database), but the current implementation uses SQLite directly. This suggests flexibility for future PostgreSQL migration if needed.

**Business Logic**:
- **Loyalty System**: Automatic points awarded (10 points per completed appointment)
- **Status Management**: Appointment lifecycle (pending → confirmed → done/cancelled)
- **Scheduled Tasks**: Node-cron for automated jobs (daily inactive client checks)

### External Dependencies

**Push Notifications**:
- **Provider**: OneSignal
- **Implementation**: Server-side SDK (@onesignal/node-onesignal)
- **Features**:
  - Appointment reminders via Data Tags
  - Inactive client reengagement notifications (30-day threshold)
  - Configurable via environment variables (`ONESIGNAL_APP_ID`, `ONESIGNAL_API_KEY`)

**Database**:
- **Development/Production**: SQLite (better-sqlite3) - file-based, no external service required
- **Optional**: PostgreSQL via Neon Database (@neondatabase/serverless) - configured but not actively used

**Process Management**:
- PM2 for production deployment (process supervision, auto-restart)
- Nginx as reverse proxy (mentioned in build scripts)

**PWA Features**:
- Service Worker registration
- Web App Manifest (`/manifest.json`)
- Installable on iOS and Android
- Offline-first capabilities

**Development Tools**:
- TypeScript for type safety across frontend, backend, and shared schemas
- Shared schema definitions (Zod) between client and server
- Vite plugins for Replit integration (error overlay, cartographer, dev banner)

### Deployment Architecture

**Build Process**:
- Frontend: Vite builds to `dist/public`
- Backend: esbuild bundles server to `dist/index.js`
- Single deployment artifact in `dist/` directory

**Production Environment**:
- VPS server deployment
- PM2 ecosystem configuration
- Nginx serving static files and proxying API requests
- Environment variable configuration for OneSignal integration

### Data Flow

1. **Client requests** → React components
2. **TanStack Query** manages caching and fetching
3. **API calls** to Express backend (`/api/*` endpoints)
4. **SQLite database** operations (CRUD)
5. **Business logic** triggers (loyalty points, notifications)
6. **OneSignal API** for push notifications
7. **Cron jobs** for scheduled tasks (background)

### Key Architectural Decisions

**SQLite over PostgreSQL**: Chosen for simplicity in deployment and operation. Single file database reduces infrastructure complexity while maintaining relational data integrity. Drizzle/PostgreSQL configuration exists for future scalability.

**Synchronous Database Operations**: better-sqlite3 provides synchronous API, simplifying error handling and avoiding async complexity in route handlers.

**TanStack Query for State**: Eliminates need for Redux/context-heavy state management. Server state lives in React Query cache with automatic invalidation and refetching.

**Wouter over React Router**: Lightweight routing solution reduces bundle size for mobile-first PWA.

**OneSignal Integration**: Handles all push notification complexity (device registration, delivery, scheduling) through external service rather than custom implementation.

**Shared Schemas**: Zod schemas in `/shared` directory ensure type safety and validation consistency between frontend and backend.

**Mobile-First Design**: Bottom navigation, touch-optimized UI, viewport constraints - all optimized for primary mobile usage in salon environments.