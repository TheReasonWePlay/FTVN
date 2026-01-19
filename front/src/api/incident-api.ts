import apiClient from './api';

interface RawIncident {
  refIncident: string;
  typeIncident: string;
  statutIncident: string;
  description: string;
  dateInc: string;
  refInventaire: string;
  matricule: string;
  numSerie: string;
  // Add other fields as necessary
}

interface Incident extends RawIncident {
  utilisateur?: {
    nomUser: string;
  };
  materiel?: {
    marque: string;
    modele: string;
  };
  inventaire?: {
    date: string;
  };
}

export const getAllIncidents = async (): Promise<Incident[]> => {
  try {
    const response = await apiClient.get('/incidents');
    console.log("response.data:");
    console.log(response.data);
    return response.data;
  } catch {
    throw new Error('Échec de la récupération de tous les incidents');
  }
};

export const getIncidentByRef = async (refIncident: string): Promise<Incident> => {
  try {
    const response = await apiClient.get(`/incidents/${refIncident}`);
    return response.data;
  } catch {
    throw new Error(`Échec de la récupération de l'incident avec ref ${refIncident}`);
  }
};

export const createIncident = async (data: object): Promise<void> => {
  try {
    await apiClient.post('/incidents', data);
  } catch {
    throw new Error('Échec de la création de l\'incident');
  }
};

export const updateIncident = async (refIncident: string, data: object): Promise<void> => {
  try {
    await apiClient.put(`/incidents/${refIncident}`, data);
  } catch {
    throw new Error(`Échec de la mise à jour de l'incident avec ref ${refIncident}`);
  }
};

export const deleteIncident = async (refIncident: string): Promise<void> => {
  try {
    await apiClient.delete(`/incidents/${refIncident}`);
  } catch {
    throw new Error(`Échec de la suppression de l'incident avec ref ${refIncident}`);
  }
};

export const filterIncidents = async (filters: object): Promise<Incident[]> => {
  try {
    const response = await apiClient.get('/incidents/filter', { params: filters });
    return response.data;
  } catch {
    throw new Error('Échec de la filtration des incidents');
  }
};

export const getTotalIncidents = async (): Promise<{ total: number }> => {
  try {
    const response = await apiClient.get('/incidents/stats/total');
    return response.data;
  } catch {
    throw new Error('Échec de la récupération du nombre total d\'incidents');
  }
};

export const getIncidentsCountByStatut = async (): Promise<Array<{ statutIncident: string; count: number }>> => {
  try {
    const response = await apiClient.get('/incidents/stats/by-statut');
    return response.data;
  } catch {
    throw new Error('Échec de la récupération du nombre d\'incidents par statut');
  }
};

export const getOpenIncidentsCount = async (): Promise<{ total: number }> => {
  try {
    const response = await apiClient.get('/incidents/stats/open');
    return response.data;
  } catch {
    throw new Error('Échec de la récupération du nombre d\'incidents ouverts');
  }
};
