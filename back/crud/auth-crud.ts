// Authentification

import { Request, Response } from 'express';
import { db } from '../conndb';
import bcrypt from 'bcrypt';

/**
 * Connexion d'un utilisateur (email ou nom d'utilisateur)
 */
export const loginUtilisateur = async (req: Request, res: Response) => {
    try {
        const { emailOrUsername, motDePasse } = req.body;

        // Vérifications
        if (!emailOrUsername) {
            return res.status(400).json({ message: "Email ou nom d'utilisateur requis" });
        }

        if (!motDePasse) {
            return res.status(400).json({ message: "Mot de passe requis" });
        }

        // Choix de la requête selon email ou nom d'utilisateur
        let query: string;
        let params: any[];

        if (emailOrUsername.includes('@')) {
            // Connexion via email
            query = `
                SELECT u.matricule, u.nomUser, u.motDePasse, u.role
                FROM utilisateur u
                JOIN personne p ON u.matricule = p.matricule
                WHERE p.email = ?
            `;
            params = [emailOrUsername];
        } else {
            // Connexion via nom d'utilisateur
            query = `
                SELECT matricule, nomUser, motDePasse, role
                FROM utilisateur
                WHERE nomUser = ?
            `;
            params = [emailOrUsername];
        }

        const [rows] = await db.query(query, params);
        const users = rows as any[];

        if (users.length === 0) {
            return res.status(401).json({ message: "Utilisateur introuvable" });
        }

        const user = users[0];

        console.log(user);

        // Vérification du mot de passe
        const isPasswordValid = await bcrypt.compare(motDePasse, user.motDePasse);
        console.log(motDePasse);
        console.log(user.motDePasse);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Mot de passe incorrect" });
        }

        // Suppression du mot de passe avant envoi fdf
        const userInfo = { ...user };
        delete userInfo.motDePasse;

        return res.json({
            message: "Connexion réussie",
            user: userInfo
        });

    } catch (err) {
        console.error('Erreur serveur loginUtilisateur :', err);
        return res.status(500).json({ error: "Erreur serveur" });
    }
};

/**
 * Déconnexion (stateless)
 */
export const logoutUtilisateur = async (_req: Request, res: Response) => {
    try {
        return res.json({ message: "Déconnexion réussie" });
    } catch (err) {
        return res.status(500).json({ error: "Erreur serveur" });
    }
};

/**
 * Récupération des informations utilisateur via matricule
 */
export const getAuthenticatedUserInfo = async (req: Request, res: Response) => {
    try {
        const { matricule } = req.body;

        if (!matricule) {
            return res.status(400).json({ message: "Matricule requis" });
        }

        const [rows] = await db.query(
            `
            SELECT 
                u.matricule,
                p.nom,
                p.prenom,
                u.nomUser,
                p.email,
                u.role
            FROM utilisateur u
            JOIN personne p ON u.matricule = p.matricule
            WHERE u.matricule = ?
            `,
            [matricule]
        );

        const users = rows as any[];

        if (users.length === 0) {
            return res.status(404).json({ message: "Utilisateur introuvable" });
        }

        const userInfo = users[0];

        return res.json({
            matricule: userInfo.matricule,
            nom: userInfo.nom,
            prenom: userInfo.prenom,
            nomUser: userInfo.nomUser,
            email: userInfo.email,
            role: userInfo.role
        });

    } catch (err) {
        console.error('Erreur serveur getAuthenticatedUserInfo :', err);
        return res.status(500).json({ error: "Erreur serveur" });
    }
};
