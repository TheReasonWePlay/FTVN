// ====== Routes Salle

import { Router, Request, Response } from 'express';
import {
    getAllSalles,
    getSalleById,
    createSalle,
    updateSalle,
    deleteSalle,
    filterSallesByRefOrName,
    filterSalleBySite,
    getMaterielsStatsBySalle
} from '../crud/salle-crud';

const salleRouter = Router();

// Filter routes
salleRouter.get('/filter', async (req: Request, res: Response) => {
    try {
        await filterSallesByRefOrName(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

salleRouter.get('/filter/site/:site', async (req: Request, res: Response) => {
    try {
        await filterSalleBySite(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// CRUD routes
salleRouter.get('/', async (req: Request, res: Response) => {
    try {
        await getAllSalles(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

salleRouter.get('/:refSalle', async (req: Request, res: Response) => {
    try {
        await getSalleById(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

salleRouter.post('/', async (req: Request, res: Response) => {
    try {
        await createSalle(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

salleRouter.put('/:refSalle', async (req: Request, res: Response) => {
    try {
        await updateSalle(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

salleRouter.delete('/:refSalle', async (req: Request, res: Response) => {
    try {
        await deleteSalle(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

export default salleRouter;
