# TODO: Add "Ajout de Matériels" Counter to Dashboard

## Steps to Complete:

- [ ] Add getRecentMaterielsCount function to back/crud/materiel-crud.ts
- [ ] Update back/crud/dashboard-crud.ts to include recentMateriels in getDashboardStats
- [ ] Update front/src/api/dashboard-api.ts to include newMateriels in DashboardStats interface
- [ ] Update front/src/pages/Dashboard.tsx to include newMateriels in DashboardData interface and add the new counter
- [ ] Verify API changes work correctly
- [ ] Test responsive layout with four counters
- [ ] Ensure existing counters remain functional
