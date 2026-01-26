import { Router, Request, Response } from 'express';
import {
    getAllPersonnes,
    getPersonneById,
    createPersonne,
    updatePersonne,
    deletePersonne,
    filterPersonnes,
    importPersonne,
} from '../crud/personne-crud';
import multer from "multer";

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

const upload = multer({
    dest: "uploads/",
    limits: { fileSize: 5 * 1024 * 1024 }
});

personneRouter.post(
    "/import",
    upload.single("file"),
    importPersonne
);

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
