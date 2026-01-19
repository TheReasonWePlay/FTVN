import apiClient from './api';

export interface DashboardStats {
  totalMateriels: number;
  materielsByStatus: Record<string, number>;
  materielsByCategory: Record<string, number>;
  totalIncidents: number;
  openIncidents: number;
  totalInventaires: number;
  recentInventaires: number;
  totalAffectations: number;
  recentAffectations: number;
}

export interface RecentOperation {
  id: string;
  type: 'affectation' | 'incident' | 'inventaire' | 'ajout-materiel';
  description: string;
  date: string;
  status: string;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const response = await apiClient.get('/dashboard/stats');
    return response.data;
  } catch {
    throw new Error('Échec de la récupération des statistiques du tableau de bord');
  }
};

export const getRecentOperations = async (): Promise<RecentOperation[]> => {
  try {
    const response = await apiClient.get('/dashboard/recent-operations');
    return response.data;
  } catch {
    throw new Error('Échec de la récupération des opérations récentes');
  }
};

export interface MonthlyEvolutionData {
  month: string;
  affectations: number;
  incidents: number;
  inventaires: number;
  materiels: number;
  total: number;
}

export const getMonthlyEvolution = async (): Promise<MonthlyEvolutionData[]> => {
  try {
    const response = await apiClient.get('/dashboard/monthly-evolution');
    return response.data;
  } catch {
    throw new Error('Échec de la récupération de l\'évolution mensuelle');
  }
};
