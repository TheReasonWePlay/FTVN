import { Router, Request, Response } from 'express';
import {
    getAllIncidents,
    getIncidentById,
    createIncident,
    updateIncident,
    deleteIncident,
    filterIncidents,
    getTotalIncidents,
    getIncidentsCountByStatut,
    getOpenIncidentsCount,
} from '../crud/incident-crud';

const incidentRouter = Router();

// Filter routes
incidentRouter.get('/filter', async (req: Request, res: Response) => {
    try {
        await filterIncidents(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// CRUD routes
incidentRouter.get('/', async (req: Request, res: Response) => {
    try {
        await getAllIncidents(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

incidentRouter.get('/:refIncident', async (req: Request, res: Response) => {
    try {
        await getIncidentById(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

incidentRouter.post('/', async (req: Request, res: Response) => {
    try {
        await createIncident(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

incidentRouter.put('/:refIncident', async (req: Request, res: Response) => {
    try {
        await updateIncident(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

incidentRouter.delete('/:refIncident', async (req: Request, res: Response) => {
    try {
        await deleteIncident(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Statistics routes
incidentRouter.get('/stats/total', async (req: Request, res: Response) => {
    try {
        const result = await getTotalIncidents();
        res.json(result);
    } catch (error) {
        console.error("Erreur lors de la récupération du nombre total d'incidents :", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

incidentRouter.get('/stats/by-statut', async (req: Request, res: Response) => {
    try {
        const result = await getIncidentsCountByStatut();
        res.json(result);
    } catch (error) {
        console.error("Erreur lors de la récupération du nombre d'incidents par statut :", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

incidentRouter.get('/stats/open', async (req: Request, res: Response) => {
    try {
        const result = await getOpenIncidentsCount();
        res.json(result);
    } catch (error) {
        console.error("Erreur lors de la récupération du nombre d'incidents ouverts :", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

export default incidentRouter;
