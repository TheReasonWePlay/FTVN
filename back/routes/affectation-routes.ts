import { Router, Request, Response } from 'express';
import {
    getAllAffectations,
    getAffectationById,
    createAffectation,
    updateAffectation,
    deleteAffectation,
    closeAffectation,
    searchAffectationsByDateRange,
    searchAffectationsByMatricule,
    searchAffectationsByPosition,
    searchAffectationsByDateAndMatricule,
    searchAffectationsByDateAndPosition,
    getAffectationsBySalle,
} from '../crud/affectation-crud';

const affectationRouter = Router();

// CRUD routes
affectationRouter.get('/', async (req: Request, res: Response) => {
    try {
        await getAllAffectations(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

affectationRouter.get('/:id', async (req: Request, res: Response) => {
    try {
        await getAffectationById(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

affectationRouter.post('/', async (req: Request, res: Response) => {
    try {
        await createAffectation(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

affectationRouter.put('/:id', async (req: Request, res: Response) => {
    try {
        await updateAffectation(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

affectationRouter.delete('/:id', async (req: Request, res: Response) => {
    try {
        await deleteAffectation(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

affectationRouter.put('/:id/close', async (req: Request, res: Response) => {
    try {
        await closeAffectation(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Recherche routes
affectationRouter.get('/search/date-range', async (req: Request, res: Response) => {
    try {
        await searchAffectationsByDateRange(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

affectationRouter.get('/search/matricule', async (req: Request, res: Response) => {
    try {
        await searchAffectationsByMatricule(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

affectationRouter.get('/search/position', async (req: Request, res: Response) => {
    try {
        await searchAffectationsByPosition(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

affectationRouter.get('/search/date-matricule', async (req: Request, res: Response) => {
    try {
        await searchAffectationsByDateAndMatricule(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

affectationRouter.get('/search/date-position', async (req: Request, res: Response) => {
    try {
        await searchAffectationsByDateAndPosition(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Get affectations by salle
affectationRouter.get('/salle/:refSalle', async (req: Request, res: Response) => {
    try {
        await getAffectationsBySalle(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

export default affectationRouter;
