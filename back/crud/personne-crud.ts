// ====== CRUD Personne

import { Request, Response } from 'express';
import { db } from '../conndb';
import * as XLSX from "xlsx";
import fs from "fs";

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


export const importPersonne = async (req: Request, res: Response) => {
    console.log("🟢 [IMPORT] Requête reçue");

    if (!req.file) {
        console.error("🔴 [IMPORT] req.file est undefined");
        return res.status(400).json({ error: "Fichier Excel manquant." });
    }

    console.log("🟢 [IMPORT] Fichier reçu :", {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
    });

    const filePath = req.file.path;

    try {
        // 1️⃣ Lecture Excel
        console.log("🟢 [IMPORT] Lecture du fichier Excel :", filePath);
        const workbook = XLSX.readFile(filePath);

        console.log("🟢 [IMPORT] Feuilles trouvées :", workbook.SheetNames);

        const sheetNames = workbook.SheetNames;

        if (!sheetNames || sheetNames.length === 0) {
            console.error("🔴 [IMPORT] Aucune feuille dans le fichier");
            return res.status(400).json({ error: "Le fichier Excel ne contient aucune feuille." });
        }

        const sheetName = sheetNames[0] as string;
        console.log("🟢 [IMPORT] Feuille sélectionnée :", sheetName);

        const worksheet = workbook.Sheets[sheetName];

        if (!worksheet) {
            console.error("🔴 [IMPORT] Worksheet introuvable pour :", sheetName);
            return res.status(400).json({ error: "Feuille Excel invalide." });
        }

        // 2️⃣ Conversion JSON
        console.log("🟢 [IMPORT] Conversion sheet → JSON");
        const rows = XLSX.utils.sheet_to_json<any>(worksheet, { defval: "" });

        console.log(`🟢 [IMPORT] ${rows.length} lignes détectées`);

        if (rows.length === 0) {
            console.error("🔴 [IMPORT] Fichier Excel vide");
            return res.status(400).json({ error: "Fichier Excel vide." });
        }

        let inserted = 0;
        const errors: any[] = [];

        // 3️⃣ Parcours lignes
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];

            console.log(`🟡 [LIGNE ${i + 2}] Données brutes :`, row);

            const matricule = row["Matricule"]?.toString().trim();
            const nom = row["Nom"]?.toString().trim();
            const prenom = row["Prenom"]?.toString().trim();
            const email = row["Email"]?.toString().trim();
            const poste = row["Poste"]?.toString().trim();
            const projet = row["Projet"]?.toString().trim();

            console.log(`🟡 [LIGNE ${i + 2}] Champs parsés :`, {
                matricule, nom, prenom, email, poste, projet
            });

            // 4️⃣ Validation
            if (!matricule || !nom || !prenom || !email) {
                console.warn(`⚠️ [LIGNE ${i + 2}] Champs requis manquants`);
                errors.push({
                    line: i + 2,
                    error: "Champs requis manquants"
                });
                continue;
            }

            try {
                // 5️⃣ Insertion DB
                console.log(`🟢 [LIGNE ${i + 2}] Tentative insertion DB`);

                const [result]: any = await db.query(
                    `INSERT INTO Personne 
                    (matricule, nom, prenom, tel, email, poste, projet)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [matricule, nom, prenom, null, email, poste, projet]
                );

                console.log(`✅ [LIGNE ${i + 2}] Insertion OK`, result);
                inserted++;

            } catch (err: any) {
                console.error(`🔴 [LIGNE ${i + 2}] Erreur insertion`, err);

                if (err.code === "ER_DUP_ENTRY") {
                    errors.push({
                        line: i + 2,
                        error: "Matricule ou email déjà existant"
                    });
                } else {
                    errors.push({
                        line: i + 2,
                        error: "Erreur base de données"
                    });
                }
            }
        }

        // 6️⃣ Nettoyage
        console.log("🟢 [IMPORT] Suppression fichier temporaire :", filePath);
        fs.unlinkSync(filePath);

        // 7️⃣ Résumé
        console.log("🟢 [IMPORT] Résumé import :", {
            total: rows.length,
            inserted,
            rejected: errors.length
        });

        return res.status(200).json({
            message: "Import terminé",
            total: rows.length,
            inserted,
            rejected: errors.length,
            errors
        });

    } catch (error) {
        console.error("🔥 [IMPORT] ERREUR FATALE :", error);
        return res.status(500).json({ error: "Erreur lors de l'import du fichier Excel." });
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
