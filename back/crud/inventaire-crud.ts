// CRUD Inventaire

import { Request, Response } from 'express';
import { db } from '../conndb';

export interface Inventaire {
    refInventaire?: number;
    date?: string; // Automatiquement défini
    debut?: string; // Automatiquement défini lors du démarrage
    fin?: string; // Automatiquement défini lors de la validation
    observation?: string;
    refSalle: string;
    matricule: string;
}

// Récupérer tous les inventaires avec info Utilisateur (ayant effectué l'inventaire) et Salle
export const getAllInventaires = async (req: Request, res: Response) => {
    try {
        const [rows] = await db.query(
            'SELECT i.*, u.nomUser AS nomUtilisateur, s.nomSalle FROM inventaire i LEFT JOIN utilisateur u ON i.matricule = u.matricule LEFT JOIN salle s ON i.refSalle = s.refSalle ORDER BY i.date DESC'
        );
        res.json(rows);
    } catch (err) {
        console.error("Erreur lors de la récupération des inventaires, getAllInventaires :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// Récupérer un inventaire par refInventaire
export const getInventaireById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(
            'SELECT i.*, p.nom, p.prenom, s.nomSalle FROM inventaire i LEFT JOIN personne p ON i.matricule = p.matricule LEFT JOIN salle s ON i.refSalle = s.refSalle WHERE i.refInventaire = ?',
            [id]
        );
        if ((rows as Inventaire[]).length === 0) {
            return res.status(404).json({ message: "Inventaire introuvable" });
        }
        res.json((rows as Inventaire[])[0]);
    } catch (err) {
        console.error("Erreur lors de la récupération de l'inventaire, getInventaireById :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// Démarrer un nouvel inventaire (crée l'inventaire avec date et debut automatiques)
export const startInventaire = async (req: Request, res: Response) => {
    try {
        const { observation, refSalle } = req.body as { observation?: string; refSalle: string };
        const matricule = req.user?.matricule; // Utilisateur authentifié

        if (!matricule) {
            return res.status(401).json({ error: "Utilisateur non authentifié" });
        }

        // Date et heure actuelles
        const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const currentTime = new Date().toISOString().slice(11, 19); // HH:MM:SS

        // Insérer l'inventaire avec date et debut automatiques
        const [result]: any = await db.query(
            'INSERT INTO inventaire (date, debut, observation, refSalle, matricule) VALUES (CURDATE(), NOW(), ?, ?, ?)',
            [observation || null, refSalle, matricule]
        );

        res.status(201).json({ message: "Inventaire démarré avec succès", refInventaire: result.insertId });
    } catch (err) {
        console.error("Erreur lors du démarrage de l'inventaire, startInventaire :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// Valider un inventaire (définit fin automatiquement)
export const validateInventaire = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { observation } = req.body as { observation?: string };

        // Mettre à jour l'inventaire avec fin automatique et observation si fournie
        const [result]: any = await db.query(
            'UPDATE inventaire SET fin = NOW(), observation = COALESCE(?, observation) WHERE refInventaire = ?',
            [observation, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Inventaire introuvable" });
        }

        res.json({ message: "Inventaire validé avec succès" });
    } catch (err) {
        console.error("Erreur lors de la validation de l'inventaire, validateInventaire :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// Mettre à jour un inventaire (seulement observation et refSalle, pas les timestamps)
export const updateInventaire = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { observation, refSalle } = req.body as { observation?: string; refSalle?: string };

        // Mettre à jour seulement les champs autorisés
        const [result]: any = await db.query(
            'UPDATE inventaire SET observation = COALESCE(?, observation), refSalle = COALESCE(?, refSalle) WHERE refInventaire = ?',
            [observation, refSalle, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Inventaire introuvable" });
        }

        res.json({ message: "Inventaire mis à jour avec succès" });
    } catch (err) {
        console.error("Erreur lors de la mise à jour de l'inventaire, updateInventaire :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// Supprimer un inventaire
export const deleteInventaire = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Supprimer l'inventaire
        const [result]: any = await db.query(
            'DELETE FROM inventaire WHERE refInventaire = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Inventaire introuvable" });
        }

        res.json({ message: "Inventaire supprimé avec succès" });
    } catch (err) {
        console.error("Erreur lors de la suppression de l'inventaire, deleteInventaire :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// Filtrer les inventaires
export const filterInventaires = async (req: Request, res: Response) => {
    try {
        const { matricule, refSalle, date, startDate, endDate } = req.query;
        let query = 'SELECT i.*, u.nomUser AS nomUtilisateur, s.nomSalle FROM inventaire i LEFT JOIN utilisateur u ON i.matricule = u.matricule LEFT JOIN salle s ON i.refSalle = s.refSalle WHERE 1=1';
        const params: any[] = [];

        if (matricule) {
            query += ' AND i.matricule = ?';
            params.push(matricule);
        }
        if (refSalle) {
            query += ' AND i.refSalle = ?';
            params.push(refSalle);
        }
        if (date) {
            query += ' AND i.date = ?';
            params.push(date);
        }
        if (startDate && endDate) {
            query += ' AND i.date BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        query += ' ORDER BY i.date DESC';
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error("Erreur lors de la filtration des inventaires, filterInventaires :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// Obtenir le nombre total d'inventaires
export const getTotalInventaires = async (): Promise<{ total: number }> => {
    try {
        const [rows]: any = await db.query(
            'SELECT COUNT(*) as total FROM inventaire'
        );
        return { total: rows[0].total };
    } catch (err) {
        console.error("Erreur lors de la récupération du nombre total d'inventaires :", err);
        throw err;
    }
};

// Obtenir le nombre d'inventaires récents (derniers 30 jours)
export const getRecentInventairesCount = async (): Promise<{ total: number }> => {
    try {
        const [rows]: any = await db.query(
            'SELECT COUNT(*) as total FROM inventaire WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)'
        );
        return { total: rows[0].total };
    } catch (err) {
        console.error("Erreur lors de la récupération du nombre d'inventaires récents :", err);
        throw err;
    }
};
