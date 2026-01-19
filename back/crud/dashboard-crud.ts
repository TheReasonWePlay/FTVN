import { Request, Response } from 'express';
import { db } from '../conndb';
import { getTotalMateriels, getMaterielsCountByStatut, getMaterielsCountByCategory } from './materiel-crud';
import { getTotalIncidents, getIncidentsCountByStatut, getOpenIncidentsCount } from './incident-crud';
import { getTotalInventaires, getRecentInventairesCount } from './inventaire-crud';
import { getTotalAffectations, getRecentAffectationsCount } from './affectation-crud';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Fetch all statistics in parallel
    const [
      totalMateriels,
      materielsByStatus,
      materielsByCategory,
      totalIncidents,
      openIncidents,
      totalInventaires,
      recentInventaires,
      totalAffectations,
      recentAffectations
    ] = await Promise.all([
      getTotalMateriels(),
      getMaterielsCountByStatut(),
      getMaterielsCountByCategory(),
      getTotalIncidents(),
      getOpenIncidentsCount(),
      getTotalInventaires(),
      getRecentInventairesCount(),
      getTotalAffectations(),
      getRecentAffectationsCount()
    ]);

    // Extract data from responses
    const stats = {
      totalMateriels: totalMateriels.total || 0,
      materielsByStatus: materielsByStatus || {},
      materielsByCategory: materielsByCategory || {},
      totalIncidents: totalIncidents.total || 0,
      openIncidents: openIncidents.total || 0,
      totalInventaires: totalInventaires.total || 0,
      recentInventaires: recentInventaires.total || 0,
      totalAffectations: totalAffectations.total || 0,
      recentAffectations: recentAffectations.total || 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
};

export const getRecentOperations = async (req: Request, res: Response) => {
  try {
    // Fetch recent operations from all entities (only open incidents)
    const [incidents] = await db.query(`
      SELECT
        CONCAT('incident_', refIncident) as id,
        'incident' as type,
        CONCAT('Incident signalé sur ', m.marque, ' ', m.modele) as description,
        DATE_FORMAT(dateInc, '%Y-%m-%d') as date,
        statutIncident as status
      FROM Incident i
      JOIN Materiel m ON i.numSerie = m.numSerie
      WHERE statutIncident = 'Ouvert'
      ORDER BY dateInc DESC
      LIMIT 5
    `) as any[];

    const [affectations] = await db.query(`
      SELECT
        CONCAT('affectation_', refAffectation) as id,
        'affectation' as type,
        CONCAT('Matériel affecté à ', p.nom, ' ', p.prenom) as description,
        DATE_FORMAT(dateDebut, '%Y-%m-%d') as date,
        'Terminé' as status
      FROM Affectation a
      JOIN Personne p ON a.matricule = p.matricule
      ORDER BY dateDebut DESC
      LIMIT 5
    `) as any[];

    const [inventaires] = await db.query(`
      SELECT
        CONCAT('inventaire_', refInventaire) as id,
        'inventaire' as type,
        CONCAT('Inventaire réalisé en salle ', s.nomSalle) as description,
        DATE_FORMAT(date, '%Y-%m-%d') as date,
        'Validé' as status
      FROM Inventaire i
      JOIN Salle s ON i.refSalle = s.refSalle
      ORDER BY date DESC
      LIMIT 5
    `) as any[];

    const [materiels] = await db.query(`
      SELECT
        CONCAT('materiel_', numSerie) as id,
        'ajout-materiel' as type,
        CONCAT('Nouveau matériel ajouté: ', marque, ' ', modele) as description,
        DATE_FORMAT(dateAjout, '%Y-%m-%d') as date,
        'Ajouté' as status
      FROM Materiel
      WHERE dateAjout IS NOT NULL
      ORDER BY dateAjout DESC
      LIMIT 5
    `) as any[];

    // Combine and sort all operations by date
    const allOperations = [
      ...incidents,
      ...affectations,
      ...inventaires,
      ...materiels
    ].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Return only the most recent 10 operations
    res.json(allOperations.slice(0, 10));
  } catch (error) {
    console.error('Error fetching recent operations:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des opérations récentes' });
  }
};

export const getMonthlyEvolution = async (req: Request, res: Response) => {
  try {
    // Get data for the last 6 months
    const [affectations] = await db.query(`
      SELECT
        DATE_FORMAT(dateDebut, '%Y-%m') as month,
        COUNT(*) as count
      FROM Affectation
      WHERE dateDebut >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(dateDebut, '%Y-%m')
      ORDER BY month
    `) as any[];

    const [incidents] = await db.query(`
      SELECT
        DATE_FORMAT(dateInc, '%Y-%m') as month,
        COUNT(*) as count
      FROM Incident
      WHERE dateInc >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(dateInc, '%Y-%m')
      ORDER BY month
    `) as any[];

    const [inventaires] = await db.query(`
      SELECT
        DATE_FORMAT(date, '%Y-%m') as month,
        COUNT(*) as count
      FROM Inventaire
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(date, '%Y-%m')
      ORDER BY month
    `) as any[];

    const [materiels] = await db.query(`
      SELECT
        DATE_FORMAT(dateAjout, '%Y-%m') as month,
        COUNT(*) as count
      FROM Materiel
      WHERE dateAjout >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(dateAjout, '%Y-%m')
      ORDER BY month
    `) as any[];

    // Generate last 6 months
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(date.toISOString().slice(0, 7)); // YYYY-MM format
    }

    // Combine data
    const evolutionData = months.map(month => {
      const affectation = (affectations as any[]).find(a => a.month === month)?.count || 0;
      const incident = (incidents as any[]).find(i => i.month === month)?.count || 0;
      const inventaire = (inventaires as any[]).find(inv => inv.month === month)?.count || 0;
      const materiel = (materiels as any[]).find(m => m.month === month)?.count || 0;

      return {
        month,
        affectations: affectation,
        incidents: incident,
        inventaires: inventaire,
        materiels: materiel,
        total: affectation + incident + inventaire + materiel
      };
    });

    res.json(evolutionData);
  } catch (error) {
    console.error('Error fetching monthly evolution:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'évolution mensuelle' });
  }
};
