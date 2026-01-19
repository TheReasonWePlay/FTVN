// ====== CRUD Matériel

import { Request, Response } from 'express';
import { db } from '../conndb';
import { v4 as uuidv4 } from 'uuid';
import bwipjs from 'bwip-js';
import { handleDatabaseError } from '../utils/errors';

// Définir les valeurs du statut
enum statusMateriel {
    DISPONIBLE = "Disponible",
    AFFECTED = "Affecté",
    EN_PANNE = "En panne",
    HORS_SERVICE = "Hors service",
}

// Type des données de matériel
export interface Materiel {
    numSerie: string;
    marque: string;
    modele: string;
    status: statusMateriel;
    categorie: string;
    refAffectation?: number;
    dateAjout?: Date;
    nomPC?: string;
    ram?: number;
    disque?: number;
    processeur?: number;
    systemeExploitation?: string;
}

//Obtenir le nombre total de matériels
export const getTotalMateriels = async (): Promise<{ total: number }> => {
    try {
        const [rows]: any = await db.query(
            'SELECT COUNT(*) as total FROM materiel'
        );
        return { total: rows[0].total };
    } catch (err) {
        console.error("Erreur lors de la récupération du nombre total de matériels :", err);
        throw handleDatabaseError(err);
    }
};

//Obtenir le nombre de matériels par statut
export const getMaterielsCountByStatut = async (): Promise<Array<{ statut: string; count: number }>> => {
    try {
        const [rows] = await db.query(
            'SELECT status AS statut, COUNT(*) as count FROM materiel GROUP BY status'
        );
        return rows as Array<{ statut: string; count: number }>;
    } catch (err) {
        console.error("Erreur lors de la récupération du nombre de matériels par statut :", err);
        throw handleDatabaseError(err);
    }
};

// Obtenir le nombre de matériels par catégorie
export const getMaterielsCountByCategory = async (): Promise<Array<{ categorie: string; count: number }>> => {
    try {
        const [rows] = await db.query(
            'SELECT categorie, COUNT(*) as count FROM materiel GROUP BY categorie'
        );
        return rows as Array<{ categorie: string; count: number }>;
    } catch (err) {
        console.error("Erreur lors de la récupération du nombre de matériels par catégorie :", err);
        throw handleDatabaseError(err);
    }
};

// Nombre de matériel d'une salle et d'une catégorie par marque
export const countmaterielsBySallecategoriemarque = async (req: Request, res: Response) => {
    try {
        const [rows] = await db.query(
            `SELECT s.refSalle, s.nomSalle, m.categorie, m.marque, COUNT(m.numSerie) AS totalMateriels
            FROM MATERIEL m
            JOIN AFFECTATION a ON m.refAffectation = a.refAffectation
            JOIN POSITION p ON a.refPosition = p.refPosition
            JOIN SALLE s ON p.refSalle = s.refSalle
            GROUP BY s.refSalle, m.categorie, m.marque
            ORDER BY s.nomSalle, m.categorie, m.marque;`
        );
        res.json(rows);
    } catch (err) {
        console.error("Erreur lors de la récupération du nombre de matériels par salle, catégorie et marque :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// Récupérer tous les matériels
export const getAllMateriels = async (req: Request, res: Response) => {
    try {
        const [rows] = await db.query(
            'SELECT m.*, ordinateur.nomPC, ordinateur.systemeExploitation, ordinateur.ram, ordinateur.disque, ordinateur.processeur FROM materiel m LEFT JOIN ordinateur ON m.numSerie = ordinateur.numSerie ORDER BY m.dateAjout DESC'
        );
        res.json(rows);
    } catch (err) {
        console.error("Erreur lors de la récupération des matériels, getAllMateriels :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// Récupérer un matériel par le numéro de série
export const getMaterielById = async (req: Request, res: Response) => {
    try {
        const { numSerie } = req.params;
        const [rows]: any = await db.query(
            'SELECT m.*, ordinateur.nomPC, ordinateur.systemeExploitation, ordinateur.ram, ordinateur.disque, ordinateur.processeur FROM materiel m LEFT JOIN ordinateur ON m.numSerie = ordinateur.numSerie WHERE m.numSerie = ?',
            [numSerie]
        );
        if (rows.length === 0)
            return res.status(404).json({ message: "Matériel introuvable." });
        res.json(rows[0]);
    } catch (err) {
        console.error("Erreur lors de la récupération du matériel, getMaterielById :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// Ajouter un nouveau matériel
export const createMateriel = async (req: Request, res: Response) => {
    try {
        const {
            numSerie,
            marque,
            modele,
            status,
            categorie,
            dateAjout,
            nomPC,
            systemeExploitation,
            ram,
            disque,
            processeur,
        } = req.body;

        // Validation du status
        if (!Object.values(statusMateriel).includes(status)) {
            return res.status(400).json({ error: "Statut invalide." });
        }

        // Insertion matériel
        await db.query(
            `INSERT INTO Materiel 
            (numSerie, marque, modele, status, categorie, dateAjout)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [numSerie, marque, modele, status, categorie, dateAjout]
        );

        // Si c’est un ordinateur
        if (["UC", "Laptop", "Ordinateur"].includes(categorie)) {
            await db.query(
                `INSERT INTO Ordinateur 
                (numSerie, nomPC, ram, disque, processeur, systemeExploitation)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [numSerie, nomPC, ram, disque, processeur, systemeExploitation]
            );
        }

        res.status(201).json({ message: "Matériel ajouté avec succès." });

    } catch (error) {
        console.error("Erreur lors de l'ajout du matériel, createMateriel :", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// Modifier un matériel existant
export const updateMateriel = async (req: Request, res: Response) => {
    try {
        const { numSerie } = req.params;
        const {
            marque,
            modele,
            status,
            categorie,
            dateAjout,
            nomPC,
            systemeExploitation,
            ram,
            disque,
            processeur,
        } = req.body;

        // Validation du status
        if (status && !Object.values(statusMateriel).includes(status)) {
            return res.status(400).json({ error: "Statut invalide." });
        }

        // Mise à jour matériel
        const [result]: any = await db.query(
            `UPDATE Materiel SET 
                marque = ?, 
                modele = ?, 
                status = ?, 
                categorie = ?, 
                dateAjout = ?
            WHERE numSerie = ?`,
            [marque, modele, status, categorie, dateAjout, numSerie]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Matériel introuvable." });
        }

        // Gestion ordinateur
        if (["UC", "Laptop", "Ordinateur"].includes(categorie)) {
            const [exist]: any = await db.query(
                "SELECT * FROM Ordinateur WHERE numSerie = ?", [numSerie]
            );

            if (exist.length > 0) {
                await db.query(
                    `UPDATE Ordinateur SET
                        nomPC = ?,
                        ram = ?,
                        disque = ?,
                        processeur = ?,
                        systemeExploitation = ?
                    WHERE numSerie = ?`,
                    [nomPC, ram, disque, processeur, systemeExploitation, numSerie]
                );
            } else {
                await db.query(
                    `INSERT INTO Ordinateur
                    (numSerie, nomPC, ram, disque, processeur, systemeExploitation)
                    VALUES (?, ?, ?, ?, ?, ?)`,
                    [numSerie, nomPC, ram, disque, processeur, systemeExploitation]
                );
            }
        }

        res.json({ message: "Matériel mis à jour avec succès." });

    } catch (error) {
        console.error("Erreur lors de la modification du matériel, updateMateriel :", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

//Supprimer un matériel
export const deleteMateriel = async (req: Request, res: Response) => {
    try {
        const { numSerie } = req.params;
        const [result]: any = await db.query(
            "DELETE FROM materiel WHERE numSerie = ?", [numSerie]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Matériel introuvable." });
        }
        res.json({ message: "Matériel supprimé avec succès." });
    } catch (error) {
        console.error("Erreur lors de la supppression du matériel :", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// Filtrer les matériels
export const filterMateriel = async (req: Request, res: Response) => {
    try {
        const { marque, modele, categorie, status, dateAjout } = req.query;

        let query = `
            SELECT m.*, ordinateur.nomPC, ordinateur.systemeExploitation, ordinateur.ram, ordinateur.disque, ordinateur.processeur
            FROM materiel m
            LEFT JOIN ordinateur ON m.numSerie = ordinateur.numSerie
        `;
        const conditions: string[] = [];
        const params: any[] = [];

        if (marque) {
            conditions.push('m.marque = ?');
            params.push(marque);
        }
        if (modele) {
            conditions.push('m.modele = ?');
            params.push(modele);
        }
        if (categorie) {
            conditions.push('m.categorie = ?');
            params.push(categorie);
        }
        if (status) {
            conditions.push('m.status = ?');
            params.push(status);
        }
        if (dateAjout) {
            conditions.push('m.dateAjout = ?');
            params.push(dateAjout);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY m.dateAjout DESC';

        const [rows]: any = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error("Erreur lors du filtrage des matériels, filterMateriel :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// Ajouter plusieurs matériels en bulk
export const bulkAddMateriel = async (req: Request, res: Response) => {
    try {
        const materials: Materiel[] = req.body;
        let inserted = 0;
        let skipped = 0;

        for (const material of materials) {
            const { numSerie, marque, modele, status, categorie, dateAjout } = material;

            // Validation de la catégorie
            if (!['Souris', 'Clavier'].includes(categorie)) {
                skipped++;
                continue;
            }

            // Validation du status
            if (!Object.values(statusMateriel).includes(status)) {
                skipped++;
                continue;
            }

            // Vérification de l'unicité du numSerie
            const [existing]: any = await db.query(
                'SELECT numSerie FROM materiel WHERE numSerie = ?',
                [numSerie]
            );
            if (existing.length > 0) {
                skipped++;
                continue;
            }

            // Insertion du matériel
            await db.query(
                `INSERT INTO Materiel 
                (numSerie, marque, modele, status, categorie, dateAjout)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [numSerie, marque, modele, status, categorie, dateAjout]
            );
            inserted++;
        }

        res.status(201).json({ inserted, skipped });
    } catch (error) {
        console.error("Erreur lors de l'ajout en bulk des matériels, bulkAddMateriel :", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// Générer un code-barres pour un matériel
export const generateBarcode = async (req: Request, res: Response) => {
    try {
        const { numSerie } = req.params;

        if (!numSerie) {
            return res.status(400).json({ error: "numSerie requis." });
        }

        // Vérifier si le matériel existe
        const [rows]: any = await db.query(
            'SELECT numSerie FROM materiel WHERE numSerie = ?',
            [numSerie]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: "Matériel introuvable." });
        }

        // Générer le code-barres en utilisant bwip-js
        const barcodeBuffer = await new Promise<Buffer>((resolve, reject) => {
            bwipjs.toBuffer({
                bcid: 'code128',       // Type de code-barres (Code 128 est commun)
                text: numSerie,        // Texte à encoder
                scale: 3,              // Échelle pour la taille
                height: 10,            // Hauteur en millimètres
                includetext: true,     // Inclure le texte sous le code-barres
                textxalign: 'center',  // Alignement du texte
            }, (err: any, png: Buffer) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(png);
                }
            });
        });

        // Convertir en base64
        const barcodeBase64 = barcodeBuffer.toString('base64');

        res.json({
            numSerie,
            barcode: `data:image/png;base64,${barcodeBase64}`
        });
    } catch (error) {
        console.error("Erreur lors de la génération du code-barres, generateBarcode :", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// Récupérer un matériel par le code-barres
export const getMaterielByBarcode = async (req: Request, res: Response) => {
    try {
        const { codeBarre } = req.params;

        if (!codeBarre) {
            return res.status(400).json({ error: "codeBarre requis." });
        }

        const [rows]: any = await db.query(
            'SELECT m.*, ordinateur.nomPC, ordinateur.systemeExploitation, ordinateur.ram, ordinateur.disque, ordinateur.processeur FROM materiel m LEFT JOIN ordinateur ON m.numSerie = ordinateur.numSerie WHERE m.codeBarre = ?',
            [codeBarre]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Matériel introuvable." });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error("Erreur lors de la récupération du matériel par code-barres, getMaterielByBarcode :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

module.exports = {
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
    getMaterielByBarcode,
    generateBarcode,
};
