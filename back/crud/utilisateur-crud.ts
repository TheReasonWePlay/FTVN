// CRUD Utilisateur

import { Request, Response } from 'express';
import { db } from '../conndb';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

declare global {
    namespace Express {
        interface Request {
            user?: {
                matricule: string;
                role: string;
            };
        }
    }
}

export interface Utilisateur {
    matricule: string;
    nomUser: string;
    motDePasse: string;
    role: 'Administrateur' | 'Responsable';
}

// Récupérer tous les utilisateurs avec info Personne
export const getAllUtilisateurs = async (req: Request, res: Response) => {
    try {
        const [rows] = await db.query(
            'SELECT u.*, p.nom, p.prenom, p.email FROM utilisateur u LEFT JOIN personne p ON u.matricule = p.matricule ORDER BY u.matricule ASC'
        );
        const users = (rows as any[]).map(row => {
            const { motDePasse, ...user } = row;
            return user;
        });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// Récupérer un utilisateur par matricule avec info Personne
export const getUtilisateurById = async (req: Request, res: Response) => {
    try {
        const [rows] = await db.query(
            'SELECT u.*, p.nom, p.prenom, p.email FROM utilisateur u LEFT JOIN personne p ON u.matricule = p.matricule WHERE u.matricule = ?',
            [req.params.matricule]
        );
        if ((rows as any[]).length === 0) {
            return res.status(404).json({ message: "Utilisateur introuvable" });
        }
        const { motDePasse, ...user } = (rows as any[])[0];
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// Créer un nouvel utilisateur
export const createUtilisateur = async (req: Request, res: Response) => {
    try {
        const { matricule, nomUser, motDePasse, role } = req.body as Utilisateur;
        const hashedPassword = await bcrypt.hash(motDePasse, 10);
        await db.query(
            'INSERT INTO utilisateur (matricule, nomUser, motDePasse, role) VALUES (?, ?, ?, ?)',
            [matricule, nomUser, hashedPassword, role || 'Responsable']
        );
        res.status(201).json({ message: "Utilisateur ajouté avec succès" });
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// Mettre à jour un utilisateur
export const updateUtilisateur = async (req: Request, res: Response) => {
    try {
        const { nomUser, motDePasse, role } = req.body as Partial<Utilisateur>;
        const updates: string[] = [];
        const params: any[] = [];

        if (nomUser !== undefined) {
            updates.push('nomUser = ?');
            params.push(nomUser);
        }
        if (motDePasse) {
            updates.push('motDePasse = ?');
            params.push(await bcrypt.hash(motDePasse, 10));
        }
        if (role !== undefined) {
            updates.push('role = ?');
            params.push(role);
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: "Aucune modification fournie" });
        }

        const query = `UPDATE utilisateur SET ${updates.join(', ')} WHERE matricule = ?`;
        params.push(req.params.matricule);

        const [result] = await db.query(query, params);
        if ((result as any).affectedRows === 0) {
            return res.status(404).json({ message: "Utilisateur introuvable" });
        }
        res.json({ message: "Utilisateur mis à jour avec succès" });
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// Supprimer un utilisateur
export const deleteUtilisateur = async (req: Request, res: Response) => {
    try {
        const [result] = await db.query('DELETE FROM utilisateur WHERE matricule = ?', [req.params.matricule]);
        if ((result as any).affectedRows === 0) {
            return res.status(404).json({ message: "Utilisateur introuvable" });
        }
        res.json({ message: "Utilisateur supprimé avec succès" });
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// Filtrer les utilisateurs
export const filterUtilisateurs = async (req: Request, res: Response) => {
    try {
        const { matricule, nomUser, role, nom, prenom, email } = req.query;
        let query = 'SELECT u.*, p.nom, p.prenom, p.email FROM utilisateur u LEFT JOIN personne p ON u.matricule = p.matricule WHERE 1=1';
        const params: any[] = [];

        if (matricule) {
            query += ' AND u.matricule LIKE ?';
            params.push(`%${matricule}%`);
        }
        if (nomUser) {
            query += ' AND u.nomUser LIKE ?';
            params.push(`%${nomUser}%`);
        }
        if (role) {
            query += ' AND u.role = ?';
            params.push(role);
        }
        if (nom) {
            query += ' AND p.nom LIKE ?';
            params.push(`%${nom}%`);
        }
        if (prenom) {
            query += ' AND p.prenom LIKE ?';
            params.push(`%${prenom}%`);
        }
        if (email) {
            query += ' AND p.email LIKE ?';
            params.push(`%${email}%`);
        }

        query += ' ORDER BY u.matricule ASC';
        const [rows] = await db.query(query, params);
        const users = (rows as any[]).map(row => {
            const { motDePasse, ...user } = row;
            return user;
        });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
