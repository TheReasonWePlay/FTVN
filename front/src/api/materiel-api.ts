import apiClient from './api';

interface RawMateriel {
  numSerie: string;
  marque: string;
  modele: string;
  status: string;
  categorie: string;
  dateAjout: string;
  refAffectation: string;
  // Add other fields as necessary
}

interface Materiel extends RawMateriel {
  uc?: {
    nomPC: string;
    systemeExploitation: string;
    ram: string;
    disque: string;
    processeur: string;
  };
}

export const getAllMateriels = async (): Promise<Materiel[]> => {
  try {
    const response = await apiClient.get('/materiels');
    return response.data;
  } catch {
    throw new Error('Échec de la récupération de tous les matériels');
  }
};

export const getMaterielById = async (numSerie: string): Promise<Materiel> => {
  try {
    const response = await apiClient.get(`/materiels/${numSerie}`);
    return response.data;
  } catch {
    throw new Error(`Échec de la récupération du matériel avec numSerie ${numSerie}`);
  }
};

export const createMateriel = async (data: object): Promise<void> => {
  try {
    await apiClient.post('/materiels', data);
  } catch {
    throw new Error('Échec de la création du matériel');
  }
};

export const bulkAddMateriel = async (data: object[]): Promise<void> => {
  try {
    await apiClient.post('/materiels/bulk', data);
  } catch {
    throw new Error('Échec de l\'ajout en bulk des matériels');
  }
};

export const updateMateriel = async (numSerie: string, data: object): Promise<void> => {
  try {
    await apiClient.put(`/materiels/${numSerie}`, data);
  } catch {
    throw new Error(`Échec de la mise à jour du matériel avec numSerie ${numSerie}`);
  }
};

export const deleteMateriel = async (numSerie: string): Promise<void> => {
  try {
    await apiClient.delete(`/materiels/${numSerie}`);
  } catch {
    throw new Error(`Échec de la suppression du matériel avec numSerie ${numSerie}`);
  }
};

export const filterMateriels = async (filters: object): Promise<Materiel[]> => {
  try {
    const response = await apiClient.get('/materiels/filter', { params: filters });
    return response.data;
  } catch {
    throw new Error('Échec de la filtration des matériels');
  }
};

export const getMaterielByBarcode = async (barcode: string): Promise<Materiel> => {
  try {
    const response = await apiClient.get(`/materiels/barcode/${barcode}`);
    return response.data;
  } catch {
    throw new Error(`Échec de la récupération du matériel avec code-barres ${barcode}`);
  }
};

export const generateBarcode = async (numSerie: string): Promise<string> => {
  try {
    const response = await apiClient.get(`/materiels/generate-barcode/${numSerie}`);
    return response.data.barcode;
  } catch {
    throw new Error(`Échec de la génération du code-barres pour numSerie ${numSerie}`);
  }
};

export const getTotalMateriels = async (): Promise<number> => {
  try {
    const response = await apiClient.get('/materiels/count');
    return response.data.total;
  } catch {
    throw new Error('Échec de la récupération du nombre total de matériels');
  }
};

export const getMaterielsCountByStatut = async (): Promise<Record<string, number>> => {
  try {
    const response = await apiClient.get('/materiels/count/statut');
    return response.data;
  } catch {
    throw new Error('Échec de la récupération du nombre de matériels par statut');
  }
};

export const getMaterielsCountByCategory = async (): Promise<Record<string, number>> => {
  try {
    const response = await apiClient.get('/materiels/count/categorie');
    return response.data;
  } catch {
    throw new Error('Échec de la récupération du nombre de matériels par catégorie');
  }
};

export const countmaterielsBySallecategoriemarque = async (): Promise<Record<string, number>> => {
  try {
    const response = await apiClient.get('/materiels/count/marque');
    return response.data;
  } catch {
    throw new Error('Échec de la récupération du nombre de matériels par marque');
  }
};
