//CRUD Salle

import { Request, Response } from 'express';
import { db } from '../conndb';

//Type de données de salle
export interface Salle {
    refSalle: string;
    nomSalle: string;
    etage?: number;
    site?: string;
}

//Récupération de toutes les salles
export const getAllSalles = async (req: Request, res: Response) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM salle ORDER BY nomSalle ASC'
        );
        res.json(rows);
    } catch (err) {
        console.error("Erreur lors de la récupération des données des salles :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

//Récupérer une salle par la référence
export const getSalleById = async (req: Request, res: Response) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM salle WHERE refSalle = ?', [req.params.refSalle]
        );
        if ((rows as Salle[]).length === 0)
            return res.status(404).json({ message: "Salle introuvable" });
        res.json((rows as Salle[])[0]);
    } catch (err) {
        console.error("Erreur lors de la récupération des données de la salle :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

//Ajouter une nouvelle salle
export const createSalle = async (req: Request, res: Response) => {
    try {
        const { refSalle, nomSalle, etage, site } = req.body as Salle;
        await db.query(
            'INSERT INTO salle (refSalle, nomSalle, etage, site) VALUES (?, ?, ?, ?)',
            [refSalle, nomSalle, etage, site,]
        );
        res.status(201).json({ message: "Salle ajoutée avec succès" });
    } catch (err) {
        console.error("Erreur lors de la création de la salle :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

//Modifier une salle existante
export const updateSalle = async (req: Request, res: Response) => {
    try {
        const { refSalle, nomSalle, etage, site } = req.body as Salle;
        const [result] = await db.query(
            'UPDATE salle SET refSalle=?, nomSalle=?, etage=?, site=? WHERE refSalle=?',
            [refSalle, nomSalle, etage, site, req.params.refSalle,]
        );
        if ((result as any).affectedRows === 0)
            return res.status(404).json({ message: "Salle introuvable" });
        res.json({ message: "Salle mise à jour avec succès" });
    } catch (err) {
        console.error("Erreur lors de la modification des données de la salle :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

//Supprimer une salle
export const deleteSalle = async (req: Request, res: Response) => {
    try {
        const [result] = await db.query(
            'DELETE FROM salle WHERE refSalle =?', [req.params.refSalle]
        );
        if ((result as any).affectedRows === 0)
            return res.status(404).json({ message: "Salle introuvable" });
        res.json({ message: "Salle supprimée avec succès" });
    } catch (err) {
        console.error("Erreur lors de la suppression de la salle :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

//Filtrer salle par refSalle ou nomSalle
export const filterSallesByRefOrName = async (req: Request, res: Response) => {
    try {
        const { refSalle, nomSalle } = req.query;
        let query = 'SELECT * FROM salle WHERE 1=1';
        const params: any[] = [];

        if (refSalle) {
            query += ' AND refSalle LIKE ?';
            params.push(`%${refSalle}%`);
        }
        if (nomSalle) {
            query += ' AND nomSalle LIKE ?';
            params.push(`%${nomSalle}%`);
        }

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error("Erreur lors de la récupération des données filtrées :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

//Récupération de salle par site
export const filterSalleBySite = async (req: Request, res: Response) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM salle WHERE site = ?', [req.params.site]
        );
        res.json(rows);
    } catch (err) {
        console.error("Erreur lors de la récupération des salles par site :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

//Récupération des statistiques de matériels par salle (catégorie et marque)
export const getMaterielsStatsBySalle = async (req: Request, res: Response) => {
    try {
        const { refSalle } = req.params;
        const [rows] = await db.query(
            `SELECT m.categorie, m.marque, COUNT(m.numSerie) AS count
            FROM MATERIEL m
            JOIN AFFECTATION a ON m.refAffectation = a.refAffectation
            JOIN POSITION p ON a.refPosition = p.refPosition
            JOIN SALLE s ON p.refSalle = s.refSalle
            WHERE s.refSalle = ?
            GROUP BY m.categorie, m.marque
            ORDER BY m.categorie, m.marque;`,
            [refSalle]
        );
        res.json(rows);
    } catch (err) {
        console.error("Erreur lors de la récupération des statistiques de matériels par salle :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};
