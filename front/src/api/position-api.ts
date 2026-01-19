import apiClient from './api';

// Interface pour les données brutes de la position depuis le backend
interface RawPosition {
  refPosition: string;
  designPosition: string;
  port: string;
  occupation: string;
  refSalle: string;
}

// Type pour la position, identique à RawPosition car aucun champ supplémentaire n'est nécessaire
type Position = RawPosition;

// Fonction pour récupérer toutes les positions
export const getAllPositions = async (): Promise<Position[]> => {
  try {
    const response = await apiClient.get('/positions');
    return response.data;
  } catch {
    throw new Error('Échec de la récupération de toutes les positions');
  }
};

// Fonction pour récupérer une position par son refPosition
export const getPositionById = async (refPosition: string): Promise<Position> => {
  try {
    const response = await apiClient.get(`/positions/${refPosition}`);
    return response.data;
  } catch {
    throw new Error(`Échec de la récupération de la position avec refPosition ${refPosition}`);
  }
};

// Fonction pour créer une nouvelle position
export const createPosition = async (data: object): Promise<void> => {
  try {
    await apiClient.post('/positions', data);
  } catch {
    throw new Error('Échec de la création de la position');
  }
};

// Fonction pour mettre à jour une position existante
export const updatePosition = async (refPosition: string, data: object): Promise<void> => {
  try {
    await apiClient.put(`/positions/${refPosition}`, data);
  } catch {
    throw new Error(`Échec de la mise à jour de la position avec refPosition ${refPosition}`);
  }
};

// Fonction pour supprimer une position
export const deletePosition = async (refPosition: string): Promise<void> => {
  try {
    await apiClient.delete(`/positions/${refPosition}`);
  } catch {
    throw new Error(`Échec de la suppression de la position avec refPosition ${refPosition}`);
  }
};

// Fonction pour filtrer les positions avec des critères multiples (refSalle, occupation, designPosition, port)
export const filterPositions = async (filters: object): Promise<Position[]> => {
  try {
    const response = await apiClient.get('/positions', { params: filters });
    return response.data;
  } catch {
    throw new Error('Échec du filtrage des positions');
  }
};
