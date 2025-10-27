# Design Guidelines: Manicure Studio Lite PWA

## Design Approach
**System-Based Approach**: Material Design 3 with refined, professional aesthetics tailored for beauty business management. This approach balances data-dense interfaces with an elegant, approachable feel suitable for a salon environment.

## Core Design Principles
1. **Professional Elegance**: Clean, sophisticated interface that reflects the beauty industry
2. **Data Clarity**: Clear hierarchy for managing appointments, clients, and business metrics
3. **Efficient Workflows**: Streamlined interactions for daily salon operations
4. **Mobile-First**: Optimized for on-the-go salon management

---

## Typography System

**Primary Font**: Inter (via Google Fonts CDN)
**Secondary Font**: Playfair Display (for elegant accents in headers/branding)

**Type Scale**:
- Display/Hero: 3xl to 4xl (Playfair Display, font-weight: 600)
- Page Titles: 2xl (Inter, font-weight: 600)
- Section Headers: xl (Inter, font-weight: 600)
- Card Titles: lg (Inter, font-weight: 500)
- Body Text: base (Inter, font-weight: 400)
- Captions/Metadata: sm (Inter, font-weight: 400)
- Labels: xs (Inter, font-weight: 500, uppercase tracking-wide)

---

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, and 16
- Micro spacing (buttons, form fields): p-2, gap-2
- Component internal spacing: p-4, gap-4
- Section spacing: p-6, py-8
- Page margins: p-8, py-16

**Container Strategy**:
- Main app container: max-w-7xl mx-auto px-4
- Content cards: max-w-4xl
- Form containers: max-w-2xl
- Mobile navigation: Full width

**Grid Patterns**:
- Dashboard metrics: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- Client cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Appointment calendar: Full-width responsive calendar component

---

## Component Library

### Navigation
**Bottom Tab Bar (Mobile PWA)**:
- Fixed bottom navigation with 4 tabs: Agenda, Clientes, Relatórios, Configurações
- Icons from Heroicons (outline style)
- Active state: Filled icon with accent indicator
- Height: h-16 with safe-area-inset-bottom

**Desktop Sidebar**:
- Fixed left sidebar (w-64)
- Logo/branding at top
- Navigation items with icons and labels
- Collapsible on tablet breakpoint

### Data Display Components

**Appointment Cards**:
- Elevated cards with subtle shadow (Material elevation-1)
- Left accent border indicating status (pending: yellow, confirmed: blue, done: green, cancelled: red)
- Client photo/avatar (circular, 48px)
- Service name (bold), time, duration
- Action buttons (edit, delete) in top-right
- Spacing: p-4 with gap-2 for content

**Client Cards**:
- Grid layout with hover elevation
- Profile section: Avatar, name, phone
- Loyalty badge: Circular progress indicator showing points
- "Ver Ficha" button (outlined style)
- Metadata: Last visit, total appointments

**Statistics Cards** (Relatórios):
- Large number display (text-3xl font-bold)
- Descriptive label below
- Icon in top-right corner
- Trend indicator (arrow up/down with percentage)
- Background: Subtle gradient or solid fill

### Forms & Inputs

**Form Fields**:
- Material Design filled variant (not outlined)
- Label floats above input when focused/filled
- Helper text below (text-sm)
- Error states with red accent and icon
- Consistent height: h-12 for text inputs
- Spacing between fields: gap-4

**Buttons**:
- Primary: Filled with shadow, rounded-lg, px-6 py-3
- Secondary: Outlined, rounded-lg, px-6 py-3
- Text: No border, px-4 py-2
- Icon buttons: Circular, p-2
- Minimum touch target: 44x44px for mobile

**Date/Time Pickers**:
- Custom calendar component with Material styling
- Selected dates highlighted with primary color
- Today indicator (subtle outline)
- Time slots in scrollable list format

### Calendar Component (Agenda)

**Layout**:
- Week view on desktop, day view on mobile
- Time slots in 30-minute increments
- Drag-and-drop appointment blocks
- Color-coded by service type
- Today indicator (vertical line or highlight)
- Spacing: Comfortable touch targets (min h-16 per slot)

### Client Detail Sheet (Ficha do Cliente)

**Structure**:
- Modal overlay (Mobile) or Side panel (Desktop, w-96)
- Header: Client photo, name, contact info, loyalty points badge
- Tabs: "Histórico" and "Informações"
- History tab: Timeline view of past appointments
- Timeline items: Date, service, points earned, status badge
- Action buttons at bottom: Edit, Delete, New Appointment

### Reports Dashboard (Relatórios)

**Layout**:
- Stats overview cards at top (4-column grid on desktop)
- Chart sections below:
  - Revenue chart (line or bar chart)
  - Popular services (horizontal bar chart)
  - Appointment status (donut chart)
- Charts library: Recharts or Chart.js
- Spacing: py-8 between sections, gap-6 for grid

### Settings Panel (Configurações)

**Sections**:
- Theme toggle: Switch component with sun/moon icons
- Notification preferences: List of toggle switches
- Business hours: Time picker grid
- OneSignal configuration: Expandable section
- Each section in card with p-6, gap-4 between sections

---

## Interaction Patterns

**Loading States**:
- Skeleton screens for data-heavy pages
- Shimmer effect on loading cards
- Spinner for button actions (replacing text)

**Empty States**:
- Illustration + heading + description + CTA button
- Centered in container
- Friendly, encouraging copy

**Confirmation Dialogs**:
- Modal overlay with backdrop blur
- Title, description, action buttons
- Dangerous actions use red accent
- Max-width: max-w-md

**Toast Notifications**:
- Fixed top-right on desktop, top-center on mobile
- Auto-dismiss after 4 seconds
- Success (green), Error (red), Info (blue), Warning (yellow)
- Icon + message + close button

---

## Theme System

**Light Theme**:
- Background: Soft warm white (#FAFAF9)
- Surface: Pure white (#FFFFFF)
- Text primary: Near-black (#1F2937)
- Text secondary: Medium gray (#6B7280)

**Dark Theme**:
- Background: Deep charcoal (#0F172A)
- Surface: Lighter charcoal (#1E293B)
- Text primary: Off-white (#F1F5F9)
- Text secondary: Light gray (#CBD5E1)

**Accent Colors** (Both themes):
- Primary: Elegant rose/mauve for salon context
- Success: Green
- Warning: Amber
- Error: Red
- Info: Blue

---

## Responsive Breakpoints

- Mobile: < 768px (single column, bottom nav)
- Tablet: 768px - 1024px (2-column grids, collapsible sidebar)
- Desktop: > 1024px (multi-column, full sidebar)

---

## Images

**Logo/Branding**:
- Location: Top of sidebar (desktop) or bottom nav center (mobile)
- Style: Minimalist icon or wordmark
- Size: 120px wide max

**Client Avatars**:
- Circular photos throughout
- Default avatar: Elegant monogram with soft gradient background
- Sizes: 32px (small), 48px (default), 96px (detail view)

**Empty State Illustrations**:
- Simple, line-art style illustrations
- Locations: Empty appointment list, no clients found, no reports yet
- Tone: Friendly and professional

**No large hero image** - this is a utility application focused on functionality over marketing.