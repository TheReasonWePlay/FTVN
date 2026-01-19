import { Router, Request, Response } from 'express';
import {
    getAllUtilisateurs,
    getUtilisateurById,
    createUtilisateur,
    updateUtilisateur,
    deleteUtilisateur,
    filterUtilisateurs,
} from '../crud/utilisateur-crud';

const utilisateurRouter = Router();

// Filter routes
utilisateurRouter.get('/utilisateurs/filter', async (req: Request, res: Response) => {
    try {
        await filterUtilisateurs(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// CRUD routes
utilisateurRouter.get('/utilisateurs', async (req: Request, res: Response) => {
    try {
        await getAllUtilisateurs(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

utilisateurRouter.get('/utilisateurs/:matricule', async (req: Request, res: Response) => {
    try {
        await getUtilisateurById(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

utilisateurRouter.post('/utilisateurs', async (req: Request, res: Response) => {
    try {
        await createUtilisateur(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

utilisateurRouter.put('/utilisateurs/:matricule', async (req: Request, res: Response) => {
    try {
        await updateUtilisateur(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

utilisateurRouter.delete('/utilisateurs/:matricule', async (req: Request, res: Response) => {
    try {
        await deleteUtilisateur(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
export default utilisateurRouter;
