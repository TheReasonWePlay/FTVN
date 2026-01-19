import { Router, Request, Response } from 'express';
import {
    getAllPersonnes,
    getPersonneById,
    createPersonne,
    updatePersonne,
    deletePersonne,
    filterPersonnes,
} from '../crud/personne-crud';

const personneRouter = Router();

// Filter and search routes
personneRouter.get('/filter', async (req: Request, res: Response) => {
    try {
        await filterPersonnes(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

personneRouter.get('/search', async (req: Request, res: Response) => {
    try {
        await filterPersonnes(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// CRUD routes
personneRouter.get('/', async (req: Request, res: Response) => {
    try {
        await getAllPersonnes(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

personneRouter.get('/:matricule', async (req: Request, res: Response) => {
    try {
        await getPersonneById(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

personneRouter.post('/', async (req: Request, res: Response) => {
    try {
        await createPersonne(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

personneRouter.put('/:matricule', async (req: Request, res: Response) => {
    try {
        await updatePersonne(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

personneRouter.delete('/:matricule', async (req: Request, res: Response) => {
    try {
        await deletePersonne(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

export default personneRouter;
