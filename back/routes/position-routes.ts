import { Router, Request, Response } from 'express';
import {
    getAllPositions,
    getPositionById,
    createPosition,
    updatePosition,
    deletePosition,
    filterPositions,
} from '../crud/position-crud';

const positionRouter = Router();

// Filter routes
positionRouter.get('/positions/filter', async (req: Request, res: Response) => {
    try {
        await filterPositions(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// CRUD routes
positionRouter.get('/positions', async (req: Request, res: Response) => {
    try {
        await getAllPositions(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

positionRouter.get('/positions/:refPosition', async (req: Request, res: Response) => {
    try {
        await getPositionById(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

positionRouter.post('/positions', async (req: Request, res: Response) => {
    try {
        await createPosition(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

positionRouter.put('/positions/:refPosition', async (req: Request, res: Response) => {
    try {
        await updatePosition(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

positionRouter.delete('/positions/:refPosition', async (req: Request, res: Response) => {
    try {
        await deletePosition(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

export default positionRouter;
