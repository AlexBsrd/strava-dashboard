# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Strava Dashboard is an Angular 18 application that visualizes Strava activity data through interactive charts and statistics. It features a modern UI with dark/light theme support and displays running, cycling, and hiking/walking statistics across different time periods.

The application integrates with a separate backend API ([strava-dashboard-api](https://github.com/AlexBsrd/strava-dashboard-api)) for session management and OAuth token handling.

## Development Commands

### Setup and Configuration
```bash
npm install                    # Install dependencies
npm run config                 # Generate environment.ts from .env file (required before first run)
```

### Development
```bash
npm start                      # Start dev server (ng serve) on http://localhost:4200
npm run watch                  # Build with watch mode
ng serve                       # Alternative to npm start
```

### Building
```bash
npm run build                  # Build for production (runs config + ng build)
npm run build:prod             # Production build (same as above)
```

### Testing
```bash
npm test                       # Run all tests with Karma
ng test                        # Alternative test command
ng test --include='**/stats.service.spec.ts'  # Run specific test file
```

### Deployment
```bash
npm run deploy                 # Deploy to GitHub Pages with auto-commit message
```

## Architecture

### Core Services

**StravaService** ([strava.service.ts](src/app/services/strava.service.ts))
- Handles OAuth authentication flow with Strava API
- Fetches activities from Strava API v3 with pagination support
- Manages token expiration and automatic logout
- Coordinates with ActivityCacheService for caching

**ActivityCacheService** ([activity-cache.service.ts](src/app/services/activity-cache.service.ts))
- Caches activities for 15 minutes to reduce API calls
- Implements intelligent refresh logic based on requested period
- Filters activities by period (week, month, current_year, 2024)
- Merges new activities with existing cache for year-based periods

**SessionService** ([session.service.ts](src/app/services/session.service.ts))
- Communicates with the backend API for session management
- Tracks user activity and session lifecycle
- Checks session validity via backend

**StatsService** ([stats.service.ts](src/app/services/stats.service.ts))
- Calculates aggregate statistics from activities
- Returns Stats objects with distance, speed, elevation, and time metrics

**ThemeService** ([theme.service.ts](src/app/services/theme.service.ts))
- Manages light/dark theme switching
- Persists theme preference in localStorage
- Supports system preference detection

### Authentication Flow

1. User initiates login via LoginComponent
2. StravaService redirects to Strava OAuth with required scopes (`read,activity:read_all`)
3. Strava redirects to `/callback` with authorization code
4. AuthCallbackComponent exchanges code for access/refresh tokens via StravaService
5. Tokens stored in localStorage (strava_token, strava_refresh_token, strava_token_expires_at, strava_athlete_id)
6. SessionService registers session with backend API
7. AuthGuard protects routes by validating tokens and checking backend session

### Data Flow

1. DashboardComponent requests activities for selected period
2. StravaService checks ActivityCacheService for cached data
3. If cache miss or expired, fetches from Strava API (all pages)
4. Activities filtered by type: Run, Ride, Hike/Walk
5. StatsService calculates statistics per activity type
6. Chart components receive filtered activities and render visualizations

### Key Components

**DashboardComponent** ([dashboard.component.ts](src/app/components/dashboard/dashboard.component.ts))
- Main view combining stats cards, charts, and period selector
- Filters activities by type (running, biking, walking)
- Orchestrates data loading and error handling

**PeriodSelectorComponent** ([period-selector](src/app/components/period-selector))
- Allows switching between week, month, current_year, and 2024 views
- Emits period changes to parent components

**Chart Components**
- ModernActivityChartComponent: Time-series activity visualization
- PaceScatterComponent: Scatter plot for pace analysis
- PerformanceDashboardComponent: Performance metrics visualization
- All use Chart.js with chartjs-plugin-zoom

**ShareModalComponent** ([share-modal](src/app/components/share-modal))
- Exports statistics as Instagram-ready story images
- InstagramCardComponent renders stats in shareable format

## Configuration

### Environment Variables

Environment configuration is managed via `.env` file and generated into [src/app/environments/environment.ts](src/app/environments/environment.ts) using [generate-env.cjs](generate-env.cjs).

Required variables:
```
STRAVA_CLIENT_ID=           # From Strava API settings
STRAVA_CLIENT_SECRET=       # From Strava API settings
REDIRECT_URI=               # OAuth callback URL (e.g., http://localhost:4200/callback)
API_URL=                    # Backend API URL (e.g., http://localhost:3000/api)
API_KEY=                    # Backend API authentication key
IS_PRODUCTION=              # true/false (only for production builds)
```

**IMPORTANT**: Always run `npm run config` after modifying `.env` to regenerate environment.ts. The environment file is gitignored for security.

### Backend API Dependency

This frontend requires the strava-dashboard-api backend to be running for:
- Session management and validation
- Activity tracking
- Token refresh coordination

Ensure the backend is running on the URL specified in API_URL before starting development.

## Routing

Routes use lazy loading for all components ([app.routes.ts](src/app/app.routes.ts)):
- `/` - Dashboard (protected by AuthGuard)
- `/activities` - Activities list (protected by AuthGuard)
- `/profile` - User profile (protected by AuthGuard)
- `/login` - OAuth login page
- `/callback` - OAuth callback handler

## TypeScript Configuration

- Strict mode enabled with all strict checks
- Target: ES2022
- Using Angular standalone components (no NgModules)
- Experimental decorators enabled for Angular

## Deployment

The app auto-deploys to GitHub Pages on push to master via [.github/workflows/deploy.yml](.github/workflows/deploy.yml):
1. Secrets are injected as environment variables
2. `generate-env.cjs` creates environment.ts
3. Production build with base-href `/strava-dashboard/`
4. Deploy via angular-cli-ghpages

Required GitHub secrets: STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, REDIRECT_URI, IS_PRODUCTION, API_URL, API_KEY

## Common Patterns

### Adding a New Activity Type
1. Update activity type filter in DashboardComponent
2. Add corresponding stats calculation
3. Create or update chart component to display the data
4. Update period filtering logic if needed

### Adding a New Chart
1. Create component extending Chart.js configuration
2. Import chartjs-plugin-zoom if pan/zoom needed
3. Implement theme-aware colors using CSS variables
4. Handle empty data states gracefully

### Modifying Period Types
1. Update PeriodType in [src/app/types/period.ts](src/app/types/period.ts)
2. Add period logic in ActivityCacheService.getFilteredActivities()
3. Update cache refresh logic in ActivityCacheService.needsRefresh()
4. Add UI option in PeriodSelectorComponent
