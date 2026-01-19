// ====== CRUD Personne

import { Request, Response } from 'express';
import { db } from '../conndb';

// Type des données de personne
export interface Personne {
    matricule: string;
    nom: string;
    prenom: string;
    tel?: string;
    email: string;
    poste?: string;
    projet?: string;
}

// Récupérer toutes les personnes
export const getAllPersonnes = async (req: Request, res: Response) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM personne ORDER BY matricule ASC'
        );
        res.json(rows);
    } catch (err) {
        console.error("Erreur lors de la récupération des personnes, getAllPersonnes :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// Récupérer une personne par matricule
export const getPersonneById = async (req: Request, res: Response) => {
    try {
        const { matricule } = req.params;
        const [rows]: any = await db.query(
            'SELECT * FROM personne WHERE matricule = ?',
            [matricule]
        );
        if (rows.length === 0)
            return res.status(404).json({ message: "Personne introuvable." });
        res.json(rows[0]);
    } catch (err) {
        console.error("Erreur lors de la récupération de la personne, getPersonneById :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// Ajouter une nouvelle personne
export const createPersonne = async (req: Request, res: Response) => {
    try {
        const { matricule, nom, prenom, tel, email, poste, projet } = req.body;

        // Validation des champs requis
        if (!matricule || !nom || !prenom || !email) {
            return res.status(400).json({ error: "Matricule, nom, prénom et email sont requis." });
        }

        // Insertion personne
        await db.query(
            `INSERT INTO Personne
            (matricule, nom, prenom, tel, email, poste, projet)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [matricule, nom, prenom, tel, email, poste, projet]
        );

        res.status(201).json({ message: "Personne ajoutée avec succès." });

    } catch (error) {
        console.error("Erreur lors de l'ajout de la personne, createPersonne :", error);
        if ((error as any).code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: "Matricule ou email déjà existant." });
        } else {
            res.status(500).json({ error: "Erreur serveur" });
        }
    }
};

// Modifier une personne existante
export const updatePersonne = async (req: Request, res: Response) => {
    try {
        const { matricule } = req.params;
        const { nom, prenom, tel, email, poste, projet } = req.body;

        // Mise à jour personne
        const [result]: any = await db.query(
            `UPDATE Personne SET
                nom = ?,
                prenom = ?,
                tel = ?,
                email = ?,
                poste = ?,
                projet = ?
            WHERE matricule = ?`,
            [nom, prenom, tel, email, poste, projet, matricule]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Personne introuvable." });
        }

        res.json({ message: "Personne mise à jour avec succès." });

    } catch (error) {
        console.error("Erreur lors de la modification de la personne, updatePersonne :", error);
        if ((error as any).code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: "Email déjà existant." });
        } else {
            res.status(500).json({ error: "Erreur serveur" });
        }
    }
};

// Supprimer une personne
export const deletePersonne = async (req: Request, res: Response) => {
    try {
        const { matricule } = req.params;
        const [result]: any = await db.query(
            "DELETE FROM personne WHERE matricule = ?", [matricule]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Personne introuvable." });
        }
        res.json({ message: "Personne supprimée avec succès." });
    } catch (error) {
        console.error("Erreur lors de la suppression de la personne :", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// Filtrer les personnes
export const filterPersonnes = async (req: Request, res: Response) => {
    try {
        const { matricule, nom, prenom, email, poste, projet } = req.query;

        let query = 'SELECT * FROM personne';
        const conditions: string[] = [];
        const params: any[] = [];

        if (matricule) {
            conditions.push('matricule LIKE ?');
            params.push(`%${matricule}%`);
        }
        if (nom) {
            conditions.push('nom LIKE ?');
            params.push(`%${nom}%`);
        }
        if (prenom) {
            conditions.push('prenom LIKE ?');
            params.push(`%${prenom}%`);
        }
        if (email) {
            conditions.push('email LIKE ?');
            params.push(`%${email}%`);
        }
        if (poste) {
            conditions.push('poste LIKE ?');
            params.push(`%${poste}%`);
        }
        if (projet) {
            conditions.push('projet LIKE ?');
            params.push(`%${projet}%`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY matricule ASC';

        const [rows]: any = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error("Erreur lors du filtrage des personnes, filterPersonnes :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};
