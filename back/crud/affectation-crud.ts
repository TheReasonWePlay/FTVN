// CRUD Affectation
// Ce fichier implémente les opérations CRUD pour la table AFFECTATION, respectant le modèle de données et les règles métier.
// Règles Métier :
// - Une affectation peut être liée soit à une PERSONNE soit à une POSITION.
// - matricule et refPosition sont mutuellement exclusifs.
// - Au moins un des deux (matricule ou refPosition) doit être fourni.
// - dateDebut est automatiquement définie à la date actuelle lors de la création.
// - dateFin est initialement nulle et automatiquement définie à la date actuelle lors de la clôture d'une affectation.

import { Request, Response } from 'express';
import { db } from '../conndb';

// Interfaces
export interface Affectation {
    refAffectation: number;
    dateDebut: string; // Date in YYYY-MM-DD format, automatically set on creation
    dateFin?: string;   // Optional, Date in YYYY-MM-DD format, automatically set on closing
    matricule?: string; // Optional, FK to PERSONNE.matricule
    refPosition?: string; // Optional, FK to POSITION.refPosition
}

export interface CreateAffectationInput {
    matricule?: string;
    refPosition?: string;
    numSerie?: string;
}

export interface UpdateAffectationInput {
    matricule?: string;
    refPosition?: string;
}

// Fonction de validation pour les règles métier
const validateAffectationInput = (input: CreateAffectationInput | UpdateAffectationInput): { isValid: boolean; error?: string } => {
    const { matricule, refPosition } = input;

    // Vérifier l'exclusivité mutuelle et au moins un fourni
    if ((matricule && refPosition) || (!matricule && !refPosition)) {
        return { isValid: false, error: 'Soit matricule soit refPosition doit être fourni, mais pas les deux.' };
    }

    // Des validations supplémentaires peuvent être ajoutées si nécessaire (par exemple, existence FK)
    return { isValid: true };
};

// Récupérer toutes les affectations
export const getAllAffectations = async (req: Request, res: Response) => {
    try {
        const query = `
            SELECT a.refAffectation, a.dateDebut, a.dateFin, a.matricule, a.refPosition,
                   p.nom, p.prenom
            FROM affectation a
            LEFT JOIN personne p ON a.matricule = p.matricule AND a.matricule IS NOT NULL
            LEFT JOIN position pos ON a.refPosition = pos.refPosition AND a.refPosition IS NOT NULL
            ORDER BY a.dateDebut DESC
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (err) {
        console.error('Erreur lors de la récupération des affectations, getAllAffectations:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Récupérer une affectation par ID
export const getAffectationById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT a.refAffectation, a.dateDebut, a.dateFin, a.matricule, a.refPosition,
                   p.nom, p.prenom
            FROM affectation a
            LEFT JOIN personne p ON a.matricule = p.matricule AND a.matricule IS NOT NULL
            LEFT JOIN position pos ON a.refPosition = pos.refPosition AND a.refPosition IS NOT NULL
            WHERE a.refAffectation = ?
        `;
        const [rows] = await db.query(query, [id]);
        if ((rows as Affectation[]).length === 0) {
            return res.status(404).json({ message: 'Affectation introuvable' });
        }
        res.json((rows as Affectation[])[0]);
    } catch (err) {
        console.error('Erreur lors de la récupération de l\'affectation par ID, getAffectationById:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Créer une nouvelle affectation
export const createAffectation = async (req: Request, res: Response) => {
    try {
        const input: CreateAffectationInput = req.body;

        // Valider les entrées
        const validation = validateAffectationInput(input);
        if (!validation.isValid) {
            return res.status(400).json({ error: validation.error });
        }

        const { matricule, refPosition, numSerie } = input;

        // dateDebut est automatiquement définie à CURDATE()
        console.log("matricule");
        console.log(matricule);
        console.log("refPosition");
        console.log(refPosition);
        console.log("numSerie");
        console.log(numSerie);

        const query = 'INSERT INTO affectation (dateDebut, matricule, refPosition) VALUES (CURDATE(), ?, ?)';
        const [result] = await db.query(query, [matricule || null, refPosition || null]);

        const query1 = `UPDATE materiel SET status = 'Affecté', refAffectation = ? WHERE numSerie = ?`;
        const [result1] = await db.query(query1, [(result as any).insertId, numSerie]);

        res.status(201).json({
            message: 'Affectation créée avec succès',
            refAffectation: (result as any).insertId
        });
    } catch (err) {
        console.error('Erreur lors de la création de l\'affectation, createAffectation:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Mettre à jour une affectation
export const updateAffectation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const input: UpdateAffectationInput = req.body;

        // Valider les entrées si des champs sont fournis
        if (Object.keys(input).length > 0) {
            const validation = validateAffectationInput(input);
            if (!validation.isValid) {
                return res.status(400).json({ error: validation.error });
            }
        }

        const updates: string[] = [];
        const params: any[] = [];

        if (input.matricule !== undefined) {
            updates.push('matricule = ?');
            params.push(input.matricule);
        }
        if (input.refPosition !== undefined) {
            updates.push('refPosition = ?');
            params.push(input.refPosition);
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'Aucune mise à jour fournie' });
        }

        const query = `UPDATE affectation SET ${updates.join(', ')} WHERE refAffectation = ?`;
        params.push(id);

        const [result] = await db.query(query, params);
        if ((result as any).affectedRows === 0) {
            return res.status(404).json({ message: 'Affectation introuvable' });
        }
        res.json({ message: 'Affectation mise à jour avec succès' });
    } catch (err) {
        console.error('Erreur lors de la mise à jour de l\'affectation, updateAffectation:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Delete an affectation
export const deleteAffectation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM affectation WHERE refAffectation = ?', [id]);
        if ((result as any).affectedRows === 0) {
            return res.status(404).json({ message: 'Affectation not found' });
        }
        res.json({ message: 'Affectation supprimée avec succès' });
    } catch (err) {
        console.error('Error deleting affectation, deleteAffectation:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Clôturer une affectation (définir dateFin à la date actuelle)
export const closeAffectation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { idMateriel } = req.body;

        // Vérifier si déjà clôturée
        const [checkRows] = await db.query('SELECT dateFin FROM affectation WHERE refAffectation = ?', [id]);
        if ((checkRows as any[]).length === 0) {
            return res.status(404).json({ message: 'Affectation introuvable' });
        }
        if ((checkRows as any[])[0].dateFin) {
            return res.status(400).json({ message: 'Affectation déjà clôturée' });
        }

        // Définir dateFin à CURDATE()
        const [result] = await db.query('UPDATE affectation SET dateFin = CURDATE() WHERE refAffectation = ?', [id]);
        const [result1] = await db.query(`UPDATE materiel SET status = 'Disponible', refAffectation = null WHERE numSerie = ?`, [idMateriel]);

        if ((result as any).affectedRows === 0) {
            return res.status(404).json({ message: 'Affectation introuvable' });
        }
        res.json({ message: 'Affectation clôturée avec succès' });
    } catch (err) {
        console.error('Erreur lors de la clôture de l\'affectation, closeAffectation:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Recherche par plage de dates
export const searchAffectationsByDateRange = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Les paramètres startDate et endDate sont requis.' });
        }

        const query = `
            SELECT a.refAffectation, a.dateDebut, a.dateFin, a.matricule, a.refPosition,
                   p.nom, p.prenom
            FROM affectation a
            LEFT JOIN personne p ON a.matricule = p.matricule AND a.matricule IS NOT NULL
            LEFT JOIN position pos ON a.refPosition = pos.refPosition AND a.refPosition IS NOT NULL
            WHERE a.dateDebut BETWEEN ? AND ?
            ORDER BY a.dateDebut DESC
        `;
        const [rows] = await db.query(query, [startDate, endDate]);
        res.json(rows);
    } catch (err) {
        console.error('Erreur lors de la recherche par plage de dates, searchAffectationsByDateRange:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Recherche par matricule
export const searchAffectationsByMatricule = async (req: Request, res: Response) => {
    try {
        const { matricule } = req.query;

        if (!matricule) {
            return res.status(400).json({ error: 'Le paramètre matricule est requis.' });
        }

        const query = `
            SELECT a.refAffectation, a.dateDebut, a.dateFin, a.matricule, a.refPosition,
                   p.nom, p.prenom
            FROM affectation a
            LEFT JOIN personne p ON a.matricule = p.matricule AND a.matricule IS NOT NULL
            LEFT JOIN position pos ON a.refPosition = pos.refPosition AND a.refPosition IS NOT NULL
            WHERE a.matricule = ?
            ORDER BY a.dateDebut DESC
        `;
        const [rows] = await db.query(query, [matricule]);
        res.json(rows);
    } catch (err) {
        console.error('Erreur lors de la recherche par matricule, searchAffectationsByMatricule:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Recherche par refPosition
export const searchAffectationsByPosition = async (req: Request, res: Response) => {
    try {
        const { refPosition } = req.query;

        if (!refPosition) {
            return res.status(400).json({ error: 'Le paramètre refPosition est requis.' });
        }

        const query = `
            SELECT a.refAffectation, a.dateDebut, a.dateFin, a.matricule, a.refPosition,
                   p.nom, p.prenom
            FROM affectation a
            LEFT JOIN personne p ON a.matricule = p.matricule AND a.matricule IS NOT NULL
            LEFT JOIN position pos ON a.refPosition = pos.refPosition AND a.refPosition IS NOT NULL
            WHERE a.refPosition = ?
            ORDER BY a.dateDebut DESC
        `;
        const [rows] = await db.query(query, [refPosition]);
        res.json(rows);
    } catch (err) {
        console.error('Erreur lors de la recherche par position, searchAffectationsByPosition:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Recherche combinée : plage de dates + matricule
export const searchAffectationsByDateAndMatricule = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, matricule } = req.query;

        if (!startDate || !endDate || !matricule) {
            return res.status(400).json({ error: 'Les paramètres startDate, endDate et matricule sont requis.' });
        }

        const query = `
            SELECT a.refAffectation, a.dateDebut, a.dateFin, a.matricule, a.refPosition,
                   p.nom, p.prenom
            FROM affectation a
            LEFT JOIN personne p ON a.matricule = p.matricule AND a.matricule IS NOT NULL
            LEFT JOIN position pos ON a.refPosition = pos.refPosition AND a.refPosition IS NOT NULL
            WHERE a.dateDebut BETWEEN ? AND ? AND a.matricule = ?
            ORDER BY a.dateDebut DESC
        `;
        const [rows] = await db.query(query, [startDate, endDate, matricule]);
        res.json(rows);
    } catch (err) {
        console.error('Erreur lors de la recherche combinée par date et matricule, searchAffectationsByDateAndMatricule:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Recherche combinée : plage de dates + refPosition
export const searchAffectationsByDateAndPosition = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, refPosition } = req.query;

        if (!startDate || !endDate || !refPosition) {
            return res.status(400).json({ error: 'Les paramètres startDate, endDate et refPosition sont requis.' });
        }

        const query = `
            SELECT a.refAffectation, a.dateDebut, a.dateFin, a.matricule, a.refPosition,
                   p.nom, p.prenom
            FROM affectation a
            LEFT JOIN personne p ON a.matricule = p.matricule AND a.matricule IS NOT NULL
            LEFT JOIN position pos ON a.refPosition = pos.refPosition AND a.refPosition IS NOT NULL
            WHERE a.dateDebut BETWEEN ? AND ? AND a.refPosition = ?
            ORDER BY a.dateDebut DESC
        `;
        const [rows] = await db.query(query, [startDate, endDate, refPosition]);
        res.json(rows);
    } catch (err) {
        console.error('Erreur lors de la recherche combinée par date et position, searchAffectationsByDateAndPosition:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Get total number of affectations
export const getTotalAffectations = async () => {
    try {
        const [rows] = await db.query('SELECT COUNT(*) as total FROM affectation');
        return { total: (rows as any[])[0].total };
    } catch (err) {
        console.error('Erreur lors de la récupération du total des affectations:', err);
        throw err;
    }
};

// Get count of recent affectations (last 30 days)
export const getRecentAffectationsCount = async () => {
    try {
        const [rows] = await db.query('SELECT COUNT(*) as total FROM affectation WHERE dateDebut >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)');
        return { total: (rows as any[])[0].total };
    } catch (err) {
        console.error('Erreur lors de la récupération du nombre d\'affectations récentes:', err);
        throw err;
    }
};

// Recherche par refSalle
export const getAffectationsBySalle = async (req: Request, res: Response) => {
    try {
        const { refSalle } = req.params;

        if (!refSalle) {
            return res.status(400).json({ error: 'Le paramètre refSalle est requis.' });
        }

        const query = `
            SELECT a.refAffectation, a.dateDebut, a.dateFin, a.matricule, a.refPosition,
                   p.nom, p.prenom
            FROM affectation a
            LEFT JOIN personne p ON a.matricule = p.matricule AND a.matricule IS NOT NULL
            LEFT JOIN position pos ON a.refPosition = pos.refPosition AND a.refPosition IS NOT NULL
            WHERE pos.refSalle = ?
            ORDER BY a.dateDebut DESC
        `;
        const [rows] = await db.query(query, [refSalle]);
        res.json(rows);
    } catch (err) {
        console.error('Erreur lors de la recherche par salle, getAffectationsBySalle:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};
