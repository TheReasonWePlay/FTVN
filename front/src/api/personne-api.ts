import apiClient from './api';

interface RawPersonne {
  matricule: string;
  nom: string;
  prenom: string;
  tel: string;
  email: string;
  poste: string;
  projet: string;
  // Ajouter d'autres champs si nécessaire
}

type Personne = RawPersonne;

export const getAllPersonnes = async (): Promise<Personne[]> => {
  try {
    const response = await apiClient.get('/personnes');
    return response.data;
  } catch {
    throw new Error('Échec de la récupération de toutes les personnes');
  }
};

export const getPersonneByMatricule = async (matricule: string): Promise<Personne> => {
  try {
    const response = await apiClient.get(`/personnes/${matricule}`);
    return response.data;
  } catch {
    throw new Error(`Échec de la récupération de la personne avec matricule ${matricule}`);
  }
};

export const createPersonne = async (data: object): Promise<void> => {
  try {
    await apiClient.post('/personnes', data);
  } catch (error: any) {
    if (error.response?.status === 409) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Échec de la création de la personne');
  }
};

export const updatePersonne = async (matricule: string, data: object): Promise<void> => {
  try {
    await apiClient.put(`/personnes/${matricule}`, data);
  } catch {
    throw new Error(`Échec de la mise à jour de la personne avec matricule ${matricule}`);
  }
};

export const deletePersonne = async (matricule: string): Promise<void> => {
  try {
    await apiClient.delete(`/personnes/${matricule}`);
  } catch {
    throw new Error(`Échec de la suppression de la personne avec matricule ${matricule}`);
  }
};

export const filterPersonnes = async (filters: object): Promise<Personne[]> => {
  try {
    const response = await apiClient.get('/personnes', { params: filters });
    return response.data;
  } catch {
    throw new Error('Échec du filtrage des personnes');
  }
};
