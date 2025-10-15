# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Development Server
```bash
npm run serve
```
Starts the Vue.js development server with hot-reload

### Build
```bash
npm run build
```
Compiles and minifies for production. Output goes to `dist/` directory.

### Linting
```bash
npm run lint
```
Note: The lint command is configured to deploy to gh-pages, not actual linting. For ESLint checking, use your IDE or install eslint globally.

### Deployment
```bash
npm run deploy
```
Deploys the built application to GitHub Pages from the `dist/` directory.

## Architecture Overview

### Technology Stack
- **Frontend Framework**: Vue 3 with Composition API
- **Router**: Vue Router 4 with hash-based routing
- **State Management**: Custom reactive store (not Vuex) in `src/store.js`
- **Authentication**: Firebase Auth with Google Sign-In
- **Database**: Firestore for data persistence
- **Calendar**: FullCalendar for reservation management
- **Build Tool**: Vue CLI with Webpack

### Project Structure

```
src/
├── main.js              # App entry point, global setup
├── App.vue              # Root component
├── store.js             # Custom reactive state management
├── firebase.js          # Firebase configuration and auth helpers
├── router/
│   └── index.js         # Route definitions with auth guards
├── views/               # Page-level components
│   ├── HomePage.vue     # Dashboard with favorites and PDFs
│   ├── ServerList.vue   # Server management interface
│   ├── DeviceList.vue   # Device inventory management
│   ├── ReservationCalendar.vue  # FullCalendar booking system
│   ├── AdminView.vue    # Admin panel with tabs
│   └── NoticePage.vue   # Announcements/notices
├── components/          # Reusable components
│   ├── GoogleLogin.vue  # Authentication component
│   └── DeviceFormModal.vue  # Device creation/editing modal
├── utils/
│   └── deviceFieldConfig.js  # Device type field configurations
└── assets/
    └── styles/          # Global CSS files
```

### State Management
The application uses a custom reactive store instead of Vuex:
- Located in `src/store.js`
- Manages user authentication state, roles, and dark mode
- Available globally via `this.$store` in components
- Key state: `user`, `userRole`, `isAuthenticated`, `darkMode`

### Authentication & Authorization
- Firebase Auth with Google OAuth
- Role-based access control (guest/normal/admin)
- User roles stored in Firestore `authorizedUsers` collection
- Route guards in `router/index.js` protect authenticated routes
- Auth state synchronized between Firebase and local store

### Firebase Integration
- Configuration in `src/firebase.js`
- Firestore collections: `authorizedUsers`, device/server data
- Real-time listeners for data synchronization
- Helper functions: `getUserRole()`, `isAdmin()`, `isUser()`

### Device Management System
- Centralized field configuration in `utils/deviceFieldConfig.js`
- Support for multiple device types: NIC, FPGA, CXL(FPGA), CXL(ASIC), SSD, GPU
- Type-specific fields and validation
- Reusable form modal component for CRUD operations

### Calendar System
- FullCalendar Vue 3 integration
- Supports day/week/month views with time grids
- Real-time reservation updates
- Handles reservations exceeding midnight (24+ hour bookings)

## Development Guidelines

### Path Aliases
- `@/` maps to `src/` directory (configured in `jsconfig.json`)
- Use `@/components/`, `@/views/`, etc. for imports

### Vue Router Configuration
- Hash-based routing (`createWebHashHistory`) for GitHub Pages compatibility
- Authentication guards on protected routes
- Lazy-loaded components for better performance
- Admin routes with role-based access

### Firebase Security
- API keys are exposed in client code (normal for Firebase web apps)
- Security rules should be configured in Firebase Console
- User authentication required for all main functionality

### Style Organization
All styles are organized under `src/assets/styles/` with the following structure:
- `common/` - Shared styles used across multiple components
  - `common-ui.css` - Common UI components and utilities
  - `modal-common.css` & `modal-styles.css` - Modal styling
  - `icon-styles.css` - Shared icon and color schemes
- `views/` - Page-specific styles
  - `HomePage.css`, `NoticePage.css`, `ServerList.css`, `ReservationCalendar.css`
- `components/` - Component-specific styles
  - `GoogleLogin.css`, `DeviceFormModal.css`

**Style Guidelines:**
- No inline styles in `.vue` files - all styles must be in dedicated CSS files
- Import styles at the component level using `import '@/assets/styles/...'`
- Shared styles (icons, common UI patterns) should be in `common/` directory
- Component-specific styles should be scoped to that component
- Maintain consistent color schemes using the shared icon styles

### Deployment Notes
- Production build uses `/ServerReservation/` as publicPath
- Deployed to GitHub Pages via `gh-pages` package
- Hash routing ensures proper navigation on static hosting