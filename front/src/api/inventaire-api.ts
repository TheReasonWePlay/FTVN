import apiClient from './api';

interface RawInventaire {
  refInventaire: number;
  date: string;
  debut?: string;
  fin?: string;
  observation?: string;
  refSalle: string;
  matricule: string;
  // Add other fields as necessary
}

interface Inventaire extends RawInventaire {
  salle?: {
    nomSalle: string;
    etage: string;
    site: string;
  };
  personne?: {
    nom: string;
    prenom: string;
  };
}

export const getAllInventaires = async (): Promise<Inventaire[]> => {
  try {
    const response = await apiClient.get('/inventaires');
    return response.data;
  } catch {
    throw new Error('Failed to fetch all inventaires');
  }
};

export const getInventaireByRef = async (refInventaire: number): Promise<Inventaire> => {
  try {
    const response = await apiClient.get(`/inventaires/${refInventaire}`);
    return response.data;
  } catch {
    throw new Error(`Échec de la récupération de l'inventaire avec référence ${refInventaire}`);
  }
};

export const startInventaire = async (data: { observation?: string; refSalle: string }): Promise<{ message: string; refInventaire: number }> => {
  try {
    const response = await apiClient.post('/inventaires/start', data);
    return response.data;
  } catch {
    throw new Error('Échec du démarrage de l\'inventaire');
  }
};

export const validateInventaire = async (refInventaire: number, data?: { observation?: string }): Promise<{ message: string }> => {
  try {
    const response = await apiClient.put(`/inventaires/${refInventaire}/validate`, data);
    return response.data;
  } catch {
    throw new Error(`Échec de la validation de l'inventaire avec référence ${refInventaire}`);
  }
};

export const updateInventaire = async (refInventaire: number, data: object): Promise<void> => {
  try {
    await apiClient.put(`/inventaires/${refInventaire}`, data);
  } catch {
    throw new Error(`Échec de la mise à jour de l'inventaire avec référence ${refInventaire}`);
  }
};

export const deleteInventaire = async (refInventaire: number): Promise<void> => {
  try {
    await apiClient.delete(`/inventaires/${refInventaire}`);
  } catch {
    throw new Error(`Échec de la suppression de l'inventaire avec référence ${refInventaire}`);
  }
};

export const filterInventaires = async (filters: object): Promise<Inventaire[]> => {
  try {
    const response = await apiClient.get('/inventaires', { params: filters });
    return response.data;
  } catch {
    throw new Error('Failed to filter inventaires');
  }
};

export const getInventairesBySalle = async (refSalle: string): Promise<Inventaire[]> => {
  try {
    const response = await apiClient.get(`/inventaires/salle/${refSalle}`);
    return response.data;
  } catch {
    throw new Error(`Failed to fetch inventaires for salle ${refSalle}`);
  }
};

export const getInventairesByUtilisateur = async (matricule: string): Promise<Inventaire[]> => {
  try {
    const response = await apiClient.get('/inventaires/search/matricule', { params: { matricule } });
    return response.data;
  } catch {
    throw new Error(`Échec de la récupération des inventaires pour l'utilisateur ${matricule}`);
  }
};
