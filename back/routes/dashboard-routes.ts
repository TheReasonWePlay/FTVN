import { Router, Request, Response } from 'express';
import { getDashboardStats, getRecentOperations, getMonthlyEvolution } from '../crud/dashboard-crud';

const dashboardRouter = Router();

// GET /api/dashboard/stats - Get aggregated dashboard statistics
dashboardRouter.get('/stats', async (req: Request, res: Response) => {
  try {
    await getDashboardStats(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/dashboard/recent-operations - Get recent operations from all entities
dashboardRouter.get('/recent-operations', async (req: Request, res: Response) => {
  try {
    await getRecentOperations(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/dashboard/monthly-evolution - Get monthly evolution of movements
dashboardRouter.get('/monthly-evolution', async (req: Request, res: Response) => {
  try {
    await getMonthlyEvolution(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default dashboardRouter;
