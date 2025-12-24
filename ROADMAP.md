# Strava Dashboard - Roadmap

This document outlines potential features and improvements for the Strava Dashboard application.

## Current State

The application currently features:
- **3 chart types**: time-series, scatter plot, personal records
- **Period comparison** with smart presets
- **Dynamic sport groups** system (30+ sports supported)
- **Intelligent caching** (15-minute refresh)
- **Instagram export** functionality
- **Theme support** (light/dark)

## Upcoming Features

### 🎯 High Impact + Easy Implementation (Quick Wins)

#### 1. Streaks & Consistency ✅ COMPLETED
- Current streak (consecutive days with activity)
- Longest streak of the year
- Visual motivation badge
- Monthly calendar heatmap (GitHub-style)

**Value**: Immediate motivation and engagement boost
**Effort**: Low (2-3 days)
**Status**: ✅ COMPLETED (2025-12-23)

**Implementation details**:
- Created `StreakService` to calculate streaks and generate heatmap data
- Created `StreakBadgeComponent` to display current and longest streaks
- Created `ActivityHeatmapComponent` for GitHub-style calendar visualization
- Integrated into `DashboardComponent`
- Supports theme switching (light/dark mode)
- Mobile responsive design

#### 2. Weekly Summary Cards
- "This week vs last week" card on dashboard
- Quick progress indicators (↑ +15% distance)

**Value**: Quick insights without navigating to comparison page
**Effort**: Low (1 day)

#### 3. Pace Metrics
- Pace zone distribution
- Chart: % of activities per speed zone
- Detection of progressive vs negative splits

**Value**: Training quality insights
**Effort**: Low (2 days)

#### 4. Activity Patterns Analysis
- Heatmap: which day/time you're most active
- "You mostly run on Saturday mornings at 8am"
- Performance by time of day

**Value**: Self-awareness and optimization
**Effort**: Low (2 days)

#### 5. Simple Goal Tracking ✅ COMPLETED
- "100 km this month" with progress bar
- Projection: "At this pace, you'll reach 95 km"
- Customizable by period and metric
- Real-time progression tracking
- Visual status indicators (on track / completed / behind)

**Value**: Goal-oriented training
**Effort**: Medium (3 days)
**Status**: ✅ COMPLETED (2025-12-23)

**Implementation details**:
- Created `Goal` model and `GoalService` for managing goals
- Created `GoalCardComponent` with animated progress bar and smart projection
- Supports 3 goal types: distance (km), time (hours), count (activities)
- Supports 4 periods: week, month, year, custom
- Optional sport type filtering (Run, Ride, Walk, etc.)
- Stored in localStorage for persistence across sessions
- Smart projection calculation: "À ce rythme : 95 km (95%)"
- Visual indicators: ✅ completed, 📈 on track, ⚠️ behind
- Color-coded progress bars (green/blue/orange)
- Days remaining counter
- Edit/Delete functionality
- Integrated into DashboardComponent
- Bug fix: Goals now use all cached activities, not just dashboard period filter

---

### 🚀 High Impact + Medium Effort

#### 6. Training Load Dashboard
- Weekly training load chart
- Acute/chronic workload ratio (injury risk)
- Green/orange/red zones based on intensity
- ⚠️ Requires heart rate data or approximation

**Value**: Injury prevention and training optimization
**Effort**: Medium (4-5 days)

#### 7. Advanced Elevation Analysis
- Climbing rate (m/km) - identify hilly runs
- VAM (Vertical Ascent Meters per hour)
- Flat vs mountain comparison

**Value**: Terrain-specific insights
**Effort**: Medium (2-3 days)

#### 8. Personal Records Timeline
- Timeline of all PRs (not just marathon/5K)
- PRs for 1km, 1 mile, 15K, etc.
- "Your best period: March 2024"
- PR evolution chart

**Value**: Long-term progress tracking
**Effort**: Medium (3-4 days)

#### 9. Race Predictions
- Predicted marathon time based on your 10K
- Formulas: Riegel, VDOT, etc.
- "With your current 10K, you can aim for 3h45 marathon"

**Value**: Race planning and goal setting
**Effort**: Medium (2-3 days)

#### 10. Favorite Routes & Analysis
- Detect recurring routes (same name/distance)
- Stats per favorite route
- "You've done this route 12 times, best time: ..."

**Value**: Route-specific improvements
**Effort**: Medium (3-4 days)

---

### 🎨 Original Visualizations

#### 11. Distribution Chart
- Distance distribution (histogram)
- "You mostly run between 8-12 km"

**Value**: Training pattern awareness
**Effort**: Low (1-2 days)

#### 12. Multi-Dimensional Scatter Plot
- Distance vs Elevation with bubbles proportional to time
- Color-coded by month/season

**Value**: Multi-variable insights
**Effort**: Medium (2 days)

#### 13. Radial Chart (Spider/Radar)
- Compare your average metrics: speed, distance, frequency, elevation
- Overall athlete profile view

**Value**: Holistic performance overview
**Effort**: Low (1-2 days)

#### 14. Consistency Graph
- Timeline with dots: green = active day, gray = rest
- Visual patterns of regularity

**Value**: Consistency visualization
**Effort**: Low (1 day)

---

### 🏆 Gamification & Motivation

#### 15. Badges & Achievements
- "100 km runner" (reached 100 km in a month)
- "Early bird" (10 runs before 7am)
- "Century ride" (100+ km in one ride)
- "Summit seeker" (1000m+ elevation)

**Value**: Fun and motivation
**Effort**: Medium (3-4 days for system + initial badges)

#### 16. Social Comparisons (if API available)
- Your position in your Strava clubs
- Popular segments

**Value**: Community engagement
**Effort**: High (depends on API access)

---

### 🔧 Utilities

#### 17. Shoe Tracker (if gear data available)
- Mileage per pair of shoes
- Replacement alert (≈800 km)

**Value**: Equipment maintenance
**Effort**: Medium (2-3 days)

#### 18. Advanced Export
- CSV export of all your stats
- Automatic monthly PDF report
- Customizable sharing templates

**Value**: Data portability
**Effort**: Medium (3-4 days)

#### 19. Notes & Journal
- Add notes to your activities
- Custom tags
- Search/filter by notes

**Value**: Training context and memory
**Effort**: High (5+ days, requires backend changes)

---

### 📱 UX Improvements

#### 20. Customizable Dashboard
- Drag & drop widgets
- Save multiple layouts
- "Running Dashboard" vs "Cycling Dashboard"

**Value**: Personalization
**Effort**: High (5-7 days)

#### 21. Advanced Filters
- Filter by distance range (5-10 km)
- By elevation, by average speed
- Save custom filters

**Value**: Precise data exploration
**Effort**: Medium (3 days)

#### 22. Detailed Activity View
- Click on activity → modal with all details
- Splits if available
- Pace per km chart

**Value**: Activity deep-dive
**Effort**: Medium (3-4 days)

---

## 🌟 Unused Strava API Data

Currently the app does NOT use:
- ❤️ **Heart rate** (avg/max) → Cardio zones, intensity
- 🦵 **Cadence** → Stride/pedaling analysis
- ⚡ **Power/Watts** (cycling) → FTP, normalized power
- 🔥 **Calories** → Energy expenditure
- 🎖️ **Kudos/Comments** → Social aspect
- 📍 **Polyline** → Route map
- 🌤️ **Weather** → Performance/weather correlation
- 👟 **Gear** → Equipment tracking

### Future API Integration Ideas

#### Heart Rate Zones
- Zone distribution chart (Z1-Z5)
- Training intensity analysis
- Recovery monitoring

**Dependencies**: Fetch HR data from Strava API
**Effort**: Medium (3-4 days)

#### Cadence Analysis
- Running: steps per minute trends
- Cycling: pedal RPM optimization
- Cadence zones

**Dependencies**: Fetch cadence data from Strava API
**Effort**: Medium (2-3 days)

#### Power Metrics (Cycling)
- Average watts tracking
- Normalized power
- FTP estimation and tracking

**Dependencies**: Fetch power data from Strava API
**Effort**: Medium (3-4 days)

#### Route Visualization
- Interactive map with polylines
- Heatmap of all activities
- 3D elevation profiles

**Dependencies**: Fetch polyline data + mapping library (Leaflet/Mapbox)
**Effort**: High (7+ days)

#### Weather Impact Analysis
- Performance vs temperature
- Wind/humidity correlations
- Best conditions identification

**Dependencies**: Fetch weather data from Strava API
**Effort**: Medium (3-4 days)

---

## 🎯 Recommended Implementation Order

### Phase 1: Quick Wins (2-3 weeks)
1. ✅ **Streaks & Calendar Heatmap** → Instant motivation
2. **Weekly Summary Cards** → Quick insights
3. **Pace Zones Distribution** → Training quality
4. **Distribution Charts** → Pattern awareness
5. **Activity Patterns Heatmap** → Time optimization

### Phase 2: Core Analytics (1 month)
6. **Training Load Dashboard** → Health & performance
7. **Personal Records Timeline** → Progress tracking
8. **Simple Goal Tracking** → User engagement
9. **Advanced Elevation Analysis** → Terrain insights
10. **Race Predictions** → Planning tool

### Phase 3: Enhanced Experience (1-2 months)
11. **Badges & Achievements** → Gamification
12. **Favorite Routes Analysis** → Route-specific insights
13. **Advanced Filters** → Data exploration
14. **Detailed Activity View** → Deep-dive capability
15. **Advanced Export** → Data portability

### Phase 4: Advanced Features (2+ months)
16. **Heart Rate Zones** → Requires API integration
17. **Route Visualization** → Mapping integration
18. **Customizable Dashboard** → Major UX overhaul
19. **Training Plans** → Coaching features
20. **Social Features** → Community integration

---

## Technical Considerations

### Performance
- Consider virtual scrolling for large activity lists
- Implement lazy loading for charts
- Optimize bundle size (consider lazy-loaded routes for heavy features)

### Storage
- LocalStorage has size limits (~5-10MB)
- Consider IndexedDB for larger datasets
- Backend persistence for user preferences and custom data

### API Rate Limits
- Strava API has rate limits (100 requests/15min, 1000 requests/day)
- Current caching strategy (15min) helps
- Consider backend caching for shared data

### Mobile Experience
- Ensure all new charts are touch-friendly
- Test on various screen sizes
- Consider progressive web app (PWA) features

---

## Community & Feedback

Features to prioritize based on user feedback:
- [ ] User survey for most-wanted features
- [ ] Analytics on most-used existing features
- [ ] GitHub issues/discussions for feature requests

---

## Contributing

When implementing new features:
1. Follow existing patterns (services for logic, components for UI)
2. Add unit tests for new services
3. Update CLAUDE.md with new patterns/components
4. Ensure theme compatibility (light/dark)
5. Test with empty states and edge cases
6. Update this ROADMAP with implementation status

---

Last updated: 2025-12-23
