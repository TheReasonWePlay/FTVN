import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';

// Routers
import authRouter  from './routes/auth-routes';
import salleRouter from './routes/salle-routes';
import materielRouter from './routes/materiel-routes';
import utilisateurRouter from './routes/utilisateur-routes';
import incidentRouter from './routes/incident-routes';
import inventaireRouter from './routes/inventaire-routes';
import positionRouter from './routes/position-routes';
import affectationRouter from './routes/affectation-routes';
import dashboardRouter from './routes/dashboard-routes';
import personneRouter from './routes/personne-routes';

// Error handling
import { AppError } from './utils/errors';
import errorHandler from './middleware/error-handler';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Logger simple pour toutes les requêtes entrantes
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, req.body);
  next();
});

// API Routes
app.use('/api', authRouter);
app.use('/api/salles', salleRouter);
app.use('/api/materiels', materielRouter);
app.use('/api', utilisateurRouter);
app.use('/api/incidents', incidentRouter);
app.use('/api/inventaires', inventaireRouter);
app.use('/api', positionRouter);
app.use('/api/affectations', affectationRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/personnes', personneRouter)

// Catch-all route for undefined routes
app.all('/api', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Route ${req.originalUrl} non trouvée`, 404));
});

// Global error handler
app.use(errorHandler);

// Démarrage du serveur
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

export default app;
