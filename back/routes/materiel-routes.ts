import { Router, Request, Response } from 'express';
import {
    getAllMateriels,
    getMaterielById,
    createMateriel,
    bulkAddMateriel,
    updateMateriel,
    deleteMateriel,
    filterMateriel,
    getTotalMateriels,
    getMaterielsCountByStatut,
    getMaterielsCountByCategory,
    countmaterielsBySallecategoriemarque,
    getMaterielByBarcode,
    generateBarcode,
} from '../crud/materiel-crud';

const materielRouter = Router();

// Filter routes
materielRouter.get('/filter', async (req: Request, res: Response) => {
    try {
        await filterMateriel(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Stats routes
materielRouter.get('/count', async (req: Request, res: Response) => {
    try {
        const result = await getTotalMateriels();
        res.json(result);
    } catch (err) {
        console.error("Erreur lors de la récupération du nombre total de matériels :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

materielRouter.get('/count/statut', async (req: Request, res: Response) => {
    try {
        const result = await getMaterielsCountByStatut();
        res.json(result);
    } catch (err) {
        console.error("Erreur lors de la récupération du nombre de matériels par statut :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

materielRouter.get('/count/category', async (req: Request, res: Response) => {
    try {
        const result = await getMaterielsCountByCategory();
        res.json(result);
    } catch (err) {
        console.error("Erreur lors de la récupération du nombre de matériels par catégorie :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

materielRouter.get('/count/marque', async (req: Request, res: Response) => {
    try {
        const result = await countmaterielsBySallecategoriemarque(req, res);
        res.json(result);
    } catch (err) {
        console.error("Erreur lors de la récupération du nombre de matériels par marque :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Code-barre routes
materielRouter.get('/barcode/:codeBarre', async (req: Request, res: Response) => {
    try {
        await getMaterielByBarcode(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

materielRouter.get('/generate-barcode/:numSerie', async (req: Request, res: Response) => {
    try {
        await generateBarcode(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// CRUD routes
materielRouter.get('/', async (req: Request, res: Response) => {
    try {
        await getAllMateriels(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

materielRouter.get('/:numSerie', async (req: Request, res: Response) => {
    try {
        await getMaterielById(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

materielRouter.post('/', async (req: Request, res: Response) => {
    try {
        await createMateriel(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

materielRouter.post('/bulk', async (req: Request, res: Response) => {
    try {
        await bulkAddMateriel(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

materielRouter.put('/:numSerie', async (req: Request, res: Response) => {
    try {
        await updateMateriel(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

materielRouter.delete('/:numSerie', async (req: Request, res: Response) => {
    try {
        await deleteMateriel(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

export default materielRouter;
