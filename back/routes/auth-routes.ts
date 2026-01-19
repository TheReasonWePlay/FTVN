import { Router, Request, Response } from "express";
import {
    loginUtilisateur,
    logoutUtilisateur,
    getAuthenticatedUserInfo
} from '../crud/auth-crud';

const authRouter = Router();

// Authentication routes - Public
authRouter.post('/auth/login', async (req: Request, res: Response) => {
    await  loginUtilisateur(req, res);
});
authRouter.post('/auth/logout', async (req: Request, res: Response) => {
    await logoutUtilisateur(req, res);
});

// Récupération infos utilisateur
authRouter.post('/auth/user-info', async (req: Request, res: Response) => {
    await getAuthenticatedUserInfo(req, res);
});

export default authRouter;
