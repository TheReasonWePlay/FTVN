import { Router, Request, Response } from 'express';
import {
    getAllInventaires,
    getInventaireById,
    startInventaire,
    validateInventaire,
    updateInventaire,
    deleteInventaire,
    filterInventaires,
} from '../crud/inventaire-crud';

const inventaireRouter = Router();

// Filtre routes
inventaireRouter.get('/filter', async (req: Request, res: Response) => {
    try {
        await filterInventaires(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// CRUD routes
inventaireRouter.get('/', async (req: Request, res: Response) => {
    try {
        await getAllInventaires(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

inventaireRouter.get('/:refInventaire', async (req: Request, res: Response) => {
    try {
        await getInventaireById(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

inventaireRouter.post('/start', async (req: Request, res: Response) => {
    try {
        await startInventaire(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

inventaireRouter.put('/:refInventaire/validate', async (req: Request, res: Response) => {
    try {
        await validateInventaire(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

inventaireRouter.put('/:refInventaire', async (req: Request, res: Response) => {
    try {
        await updateInventaire(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

inventaireRouter.delete('/:refInventaire', async (req: Request, res: Response) => {
    try {
        await deleteInventaire(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

export default inventaireRouter;
