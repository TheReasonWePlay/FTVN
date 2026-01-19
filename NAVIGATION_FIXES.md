# Navigation Fixes Required

## Issues Found

### 1. Route Path Inconsistencies

- Sidebar uses `/admin/dashboard` and `/user/dashboard` but App.tsx only has `/dashboard`
- Some routes use English paths (`/equipment`, `/inventory`, `/rooms`) while others use French (`/liste-salles`)
- Sidebar settings items reference `/projets` but App.tsx doesn't have this route

### 2. Missing Functions

- Sidebar imports `logoutUtilisateur` from utilisateur-api.ts but this function doesn't exist

### 3. Navigation Links Missing

- Dashboard cards don't have navigation links to respective pages
- No way to navigate from dashboard to other sections

### 4. Active State Issues

- Sidebar active state logic may not work correctly with current path mismatches

## Fixes Needed

### 1. Fix Sidebar Navigation Paths

- Update sidebar to use correct paths that match App.tsx routes
- Standardize route naming (decide on English or French consistently)

### 2. Add Missing logoutUtilisateur Function

- Add logoutUtilisateur function to utilisateur-api.ts

### 3. Add Navigation Links to Dashboard

- Make dashboard cards clickable to navigate to respective pages
- Add navigation to recent operations items

### 4. Fix Active State Logic

- Ensure sidebar correctly highlights active page

### 5. Verify All Routes Exist

- Check that all referenced pages exist and are properly imported
