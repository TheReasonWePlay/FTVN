import apiClient from './api';

// Interface pour les données brutes de la salle depuis le backend
interface RawSalle {
  refSalle: string;
  nomSalle: string;
  etage: string;
  site: string;
}

// Interface pour la salle avec des champs frontend optionnels
interface Salle extends RawSalle {
  count?: number; // Nombre d'affectations, par exemple
}

// Fonction pour récupérer toutes les salles
export const getAllSalles = async (): Promise<Salle[]> => {
  try {
    const response = await apiClient.get('/salles');
    return response.data;
  } catch {
    throw new Error('Échec de la récupération de toutes les salles');
  }
};

// Fonction pour récupérer une salle par son refSalle
export const getSalleById = async (refSalle: string): Promise<Salle> => {
  try {
    const response = await apiClient.get(`/salles/${refSalle}`);
    return response.data;
  } catch {
    throw new Error(`Échec de la récupération de la salle avec refSalle ${refSalle}`);
  }
};

// Fonction pour créer une nouvelle salle
export const createSalle = async (data: object): Promise<void> => {
  try {
    await apiClient.post('/salles', data);
  } catch {
    throw new Error('Échec de la création de la salle');
  }
};

// Fonction pour mettre à jour une salle existante
export const updateSalle = async (refSalle: string, data: object): Promise<void> => {
  try {
    await apiClient.put(`/salles/${refSalle}`, data);
  } catch {
    throw new Error(`Échec de la mise à jour de la salle avec refSalle ${refSalle}`);
  }
};

// Fonction pour supprimer une salle
export const deleteSalle = async (refSalle: string): Promise<void> => {
  try {
    await apiClient.delete(`/salles/${refSalle}`);
  } catch {
    throw new Error(`Échec de la suppression de la salle avec refSalle ${refSalle}`);
  }
};

// Fonction pour filtrer les salles avec des critères multiples (nomSalle, etage, site)
export const filterSalles = async (filters: object): Promise<Salle[]> => {
  try {
    const response = await apiClient.get('/salles', { params: filters });
    return response.data;
  } catch {
    throw new Error('Échec du filtrage des salles');
  }
};

// Fonction pour récupérer les statistiques de matériels par salle
export const getMaterielsStatsBySalle = async (refSalle: string): Promise<Array<{ categorie: string; marque: string; count: number }>> => {
  try {
    const response = await apiClient.get(`/salles/${refSalle}/materiels-stats`);
    return response.data;
  } catch {
    throw new Error('Échec de la récupération des statistiques de matériels par salle');
  }
};
