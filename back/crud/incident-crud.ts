// CRUD Incident

import { Request, Response } from 'express';
import { db } from '../conndb';
import { RowDataPacket } from 'mysql2';
import { error } from 'console';

// Définir les valeurs du statut
enum statut {
    OUVERT = "Ouvert",
    EN_COURS = "En cours",
    RESOLU = "Résolu",
    CLOS = "Clos",
}

// Type des données d'incident
export interface Incident {
    refIncident?: number;
    typeIncident: string;
    statutIncident?: statut;
    description?: string;
    dateInc: Date;
    refInventaire: number;
    matricule: number;
    numSerie: number;
}

// Récupérer tous les Incidents
export const getAllIncidents = async (req: Request, res: Response) => {
    try {
        const [rows] = await db.query<RowDataPacket[]>(
          `SELECT 
          i.refIncident,
          i.typeIncident,
          i.statutIncident,
          i.description,
          i.dateInc,
          p.nom,
          p.prenom,
          m.marque,
          m.modele,
          inv.date AS dateInventaire
        FROM incident i
        JOIN personne p ON i.matricule = p.matricule
        JOIN materiel m ON i.numSerie = m.numSerie
        LEFT JOIN inventaire inv ON i.refInventaire = inv.refInventaire;
        `
        );
        res.json(rows);
    } catch (error) {
        console.error("Erreur lors de la récupération des incidents, getAllIncidents :", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
    
};

// Récupérer un incident par sa référence
export const getIncidentById = async (req: Request, res: Response) => {
    try {
        const [rows] = await db.query(
            'SELECT i.*, u.nomUser AS nomUtilisateur, m.marque, m.modele, inv.date AS dateInventaire FROM Incident i JOIN utilisateur u ON i.matricule = u.matricule JOIN materiel m ON i.numSerie = m.numSerie JOIN inventaire inv ON i.refInventaire = inv.refInventaire WHERE refIncident = ?',
            [req.params.refIncident]
        );
        if ((rows as Incident[]).length === 0)
            return res.status(404).json({ message: "Incident introuvable" });
        res.json((rows as Incident[])[0]);
    } catch (err) {
        console.error("Erreur lors de la récupération de l'incident, getIncidentById :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// Signaler un nouvel incident
export const createIncident = async (req: Request, res: Response) => {
    try {
        const {
            typeIncident,
            description,
            dateInc,
            refInventaire,
            matricule,
            numSerie
        } = req.body as Incident;

        if (!typeIncident || !dateInc || !refInventaire || !matricule || !numSerie ) {
            return res.status(400).json({ error: "Champs obligatoires vide !" });
        }

        const statutIncident = "Ouvert";

        const [result] = await db.query(
            'INSERT INTO Incident (TypeIncident, statutIncident, description, dateInc, refInventaire, matricule, numSerie) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [typeIncident, statutIncident, description || null, dateInc, refInventaire, matricule, numSerie]
        );
        res.status(201).json({ message: "Incident signalé avec succès", refIncident: (result as any).insertId });
    } catch (err) {
        console.error("Erreur lors dpu signalement de l'incident, createIncident :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// Modifier un incident
export const updateIncident = async (req: Request, res: Response) => {
    const { refIncident } = req.params;
    const { statutIncident, description } = req.body as Partial<Incident>;

    if (statutIncident && !["Ouvert", "En cours", "Résolu", "Clos"].includes(statutIncident)) {
        return res.status(400).json({ error: "Statut de l'incident invalide" });
    }

    try {
        const [result] = await db.query(
            'UPDATE Incident SET statutIncident = COALESCE(?, statutIncident), description = COALESCE(?, description) WHERE refIncident = ?',
            [statutIncident, description, refIncident]
        );
        if ((result as any).affectedRows === 0)
            return res.status(404).json({ message: "Incident Introuvable" });
        res.json({ message: "Incident mis à jour avec succès" });
    } catch (err) {
        console.error("Erreur lors de la modification de l'incident, updateIncident :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// Supprimer un incident
export const deleteIncident = async (req: Request, res: Response) => {
    const { refIncident } = req.params;

    try {
        const [result] = await db.query(`DELETE FROM Incident WHERE refIncident = ?`, [refIncident]);
        if ((result as any).affectedRows === 0)
            return res.status(404).json({ message: "Incident introuvable" });
        res.json({ message: "Incident supprimé avec succès" });
    } catch (err) {
        console.error("Erreur lors de la suppression de l'incident, deleteIncident :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// Filtrer les incidents
export const filterIncidents = async (req: Request, res: Response) => {
    try {
        const { matricule, numSerie, refInventaire, statutIncident, dateInc, startDate, endDate } = req.query;

        let query = `SELECT i.*, u.nomUser AS nomUtilisateur,
                        m.marque, m.modele,
                        inv.date AS dateInventaire
                    FROM Incident i
                    JOIN Utilisateur u ON i.matricule = u.matricule
                    JOIN Materiel m ON i.numSerie = m.numSerie
                    JOIN Inventaire inv ON i.refInventaire = inv.refInventaire
                    WHERE 1=1`;
        const params: any[] = [];

        if (matricule) { query += " AND i.matricule = ?"; params.push(matricule); }
        if (numSerie) { query += " AND i.numSerie = ?"; params.push(numSerie); }
        if (refInventaire) { query += " AND i.refInventaire = ?"; params.push(refInventaire); }
        if (statutIncident) { query += " AND i.statutIncident = ?"; params.push(statutIncident); }
        if (dateInc) { query += " AND DATE(i.dateInc) = ?"; params.push(dateInc); }
        if (startDate && endDate) { query += " AND DATE(i.dateInc) BETWEEN ? AND ?"; params.push(startDate, endDate); }

        const [rows] = await db.query<RowDataPacket[]>(query, params);
        res.json(rows);
    } catch (error) {
        console.error("Erreur lors de la filtration des incidents, filterIncidents :", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// Obtenir le nombre total d'incidents
export const getTotalIncidents = async (): Promise<{ total: number }> => {
    try {
        const [rows]: any = await db.query(
            'SELECT COUNT(*) as total FROM incident'
        );
        return { total: rows[0].total };
    } catch (err) {
        console.error("Erreur lors de la récupération du nombre total d'incidents :", err);
        throw err;
    }
};

// Obtenir le nombre d'incidents par statut
export const getIncidentsCountByStatut = async (): Promise<Array<{ statutIncident: string; count: number }>> => {
    try {
        const [rows] = await db.query(
            'SELECT statutIncident, COUNT(*) as count FROM incident GROUP BY statutIncident'
        );
        return rows as Array<{ statutIncident: string; count: number }>;
    } catch (err) {
        console.error("Erreur lors de la récupération du nombre d'incidents par statut :", err);
        throw err;
    }
};

// Obtenir le nombre d'incidents ouverts
export const getOpenIncidentsCount = async (): Promise<{ total: number }> => {
    try {
        const [rows]: any = await db.query(
            'SELECT COUNT(*) as total FROM incident WHERE statutIncident = "Ouvert"'
        );
        return { total: rows[0].total };
    } catch (err) {
        console.error("Erreur lors de la récupération du nombre d'incidents ouverts :", err);
        throw err;
    }
};

module.exports = {
    getAllIncidents,
    getIncidentById,
    createIncident,
    updateIncident,
    deleteIncident,
    filterIncidents,
    getTotalIncidents,
    getIncidentsCountByStatut,
    getOpenIncidentsCount,
};
