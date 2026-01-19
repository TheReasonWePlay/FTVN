//CRUD Position

import { Request, Response } from 'express';
import { db } from '../conndb';

export interface Position {
    refPosition: string;
    designPosition?: string;
    port: string;
    occupation: string;
    refSalle: string;
}

//Récupération de toutes les positions
export const getAllPositions = async (req: Request, res: Response) => {
    try {
        const [rows] = await db.query(
            'SELECT p.*, s.nomSalle FROM position p LEFT JOIN salle s ON p.refSalle = s.refSalle ORDER BY p.refPosition ASC'
        );
        res.json(rows);
    } catch (err) {
        console.error("Erreur lors de la récupération des données des positions, getAllPositions :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

//Récupérer une position par refPosition
export const getPositionById = async (req: Request, res: Response) => {
    try {
        const [rows] = await db.query(
            'SELECT p.*, s.nomSalle FROM position p LEFT JOIN salle s ON p.refSalle = s.refSalle WHERE p.refPosition = ?', [req.params.refPosition]
        );
        if ((rows as Position[]).length === 0)
            return res.status(404).json({ message: "Position introuvable" });
        res.json((rows as Position[])[0]);
    } catch (err) {
        console.error("Erreur lors de la récupération des données de la position, getPositionById :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

//Ajouter une nouvelle position
export const createPosition = async (req: Request, res: Response) => {
    try {
        const { refPosition, designPosition, port, occupation, refSalle } = req.body as Position;
        await db.query(
            'INSERT INTO position (refPosition, designPosition, port, occupation, refSalle) VALUES (?, ?, ?, ?, ?)',
            [refPosition, designPosition, port, occupation, refSalle]
        );
        res.status(201).json({ message: "Position ajoutée avec succès" });
    } catch (err) {
        console.error("Erreur lors de l'ajout de la position, createPosition :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

//Modifier une position existante
export const updatePosition = async (req: Request, res: Response) => {
    try {
        const { refPosition, designPosition, port, occupation, refSalle } = req.body as Position;
        const [result] = await db.query(
            'UPDATE position SET refPosition=?, designPosition=?, port=?, occupation=?, refSalle=? WHERE refPosition=?',
            [refPosition, designPosition, port, occupation, refSalle, req.params.refPosition]
        );
        if ((result as any).affectedRows === 0)
            return res.status(404).json({ message: "Position introuvable" });
        res.json({ message: "Position mise à jour avec succès" });
    } catch (err) {
        console.error("Erreur lors de la mise à jour de la position, updatePosition :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

//Supprimer une position
export const deletePosition = async (req: Request, res: Response) => {
    try {
        const [result] = await db.query(
            'DELETE FROM position WHERE refPosition =?', [req.params.refPosition]
        );
        if ((result as any).affectedRows === 0)
            return res.status(404).json({ message: "Position introuvable" });
        res.json({ message: "Position supprimée avec succès" });
    } catch (err) {
        console.error("Erreur lors de la suppression de la position, deletePosition :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

//Filtrer positions
export const filterPositions = async (req: Request, res: Response) => {
    try {
        const { designPosition, port, occupation, refSalle } = req.query;
        let query = 'SELECT p.*, s.nomSalle FROM position p LEFT JOIN salle s ON p.refSalle = s.refSalle WHERE 1=1';
        const params: any[] = [];

        if (designPosition) {
            query += ' AND p.designPosition LIKE ?';
            params.push(`%${designPosition}%`);
        }
        if (port) {
            query += ' AND p.port LIKE ?';
            params.push(`%${port}%`);
        }
        if (occupation !== undefined) {
            query += ' AND p.occupation = ?';
            params.push(occupation === 'true' ? 1 : 0);
        }
        if (refSalle) {
            query += ' AND p.refSalle = ?';
            params.push(refSalle);
        }

        query += ' ORDER BY p.refPosition ASC';
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error("Erreur lors de la filtration des positions, filterPositions :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

module.exports = {
    getAllPositions,
    getPositionById,
    createPosition,
    updatePosition,
    deletePosition,
    filterPositions,
};
