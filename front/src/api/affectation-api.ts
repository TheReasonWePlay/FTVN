import apiClient from './api';

// Interfaces matching backend Affectation
export interface Affectation {
  refAffectation: number;
  dateDebut: string;
  dateFin?: string;
  matricule?: string;
  refPosition?: string;
  nom?: string; // From JOIN with personne
  prenom?: string; // From JOIN with personne
}

// Input interfaces for operations
export interface CreateAffectationInput {
  matricule?: string;
  refPosition?: string;
  numSerie?: string;
}

export interface UpdateAffectationInput {
  matricule?: string;
  refPosition?: string;
}

// Search filter interfaces
export interface DateRangeFilter {
  startDate: string;
  endDate: string;
}

export interface MatriculeFilter {
  matricule: string;
}

export interface PositionFilter {
  refPosition: string;
}

export interface DateAndMatriculeFilter extends DateRangeFilter, MatriculeFilter { }

export interface DateAndPositionFilter extends DateRangeFilter, PositionFilter { }

// CRUD functions
export const getAllAffectations = async (): Promise<Affectation[]> => {
  try {
    const response = await apiClient.get('/affectations');
    return response.data;
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { error?: string } } };
    throw new Error(axiosError.response?.data?.error || 'Erreur lors de la récupération des affectations');
  }
};

export const getAffectationById = async (id: number): Promise<Affectation> => {
  try {
    const response = await apiClient.get(`/affectations/${id}`);
    return response.data;
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    throw new Error(axiosError.response?.data?.message || `Erreur lors de la récupération de l'affectation ${id}`);
  }
};

export const createAffectation = async (data: CreateAffectationInput): Promise<{ refAffectation: number; message: string }> => {
  try {
    const response = await apiClient.post('/affectations', data);
    return response.data;
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { error?: string } } };
    throw new Error(axiosError.response?.data?.error || 'Erreur lors de la création de l\'affectation');
  }
};

export const updateAffectation = async (id: number, data: UpdateAffectationInput): Promise<{ message: string }> => {
  try {
    const response = await apiClient.put(`/affectations/${id}`, data);
    return response.data;
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    throw new Error(axiosError.response?.data?.message || `Erreur lors de la mise à jour de l'affectation ${id}`);
  }
};

export const deleteAffectation = async (id: number): Promise<{ message: string }> => {
  try {
    const response = await apiClient.delete(`/affectations/${id}`);
    return response.data;
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    throw new Error(axiosError.response?.data?.message || `Erreur lors de la suppression de l'affectation ${id}`);
  }
};

export const closeAffectation = async (
  id: number,
  idMateriel: string
): Promise<{ message: string }> => {
  try {
    const response = await apiClient.put(
      `/affectations/${id}/close`,
      { idMateriel } // 👈 body
    );
    return response.data;
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    throw new Error(
      axiosError.response?.data?.message ||
      `Erreur lors de la clôture de l'affectation ${id}`
    );
  }
};

// Search functions
export const searchAffectationsByDateRange = async (filters: DateRangeFilter): Promise<Affectation[]> => {
  try {
    const response = await apiClient.get('/affectations/search/date-range', { params: filters });
    return response.data;
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { error?: string } } };
    throw new Error(axiosError.response?.data?.error || 'Erreur lors de la recherche par plage de dates');
  }
};

export const searchAffectationsByMatricule = async (filters: MatriculeFilter): Promise<Affectation[]> => {
  try {
    const response = await apiClient.get('/affectations/search/matricule', { params: filters });
    return response.data;
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { error?: string } } };
    throw new Error(axiosError.response?.data?.error || 'Erreur lors de la recherche par matricule');
  }
};

export const searchAffectationsByPosition = async (filters: PositionFilter): Promise<Affectation[]> => {
  try {
    const response = await apiClient.get('/affectations/search/position', { params: filters });
    return response.data;
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { error?: string } } };
    throw new Error(axiosError.response?.data?.error || 'Erreur lors de la recherche par position');
  }
};

export const searchAffectationsByDateAndMatricule = async (filters: DateAndMatriculeFilter): Promise<Affectation[]> => {
  try {
    const response = await apiClient.get('/affectations/search/date-matricule', { params: filters });
    return response.data;
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { error?: string } } };
    throw new Error(axiosError.response?.data?.error || 'Erreur lors de la recherche combinée par date et matricule');
  }
};

export const searchAffectationsByDateAndPosition = async (filters: DateAndPositionFilter): Promise<Affectation[]> => {
  try {
    const response = await apiClient.get('/affectations/search/date-position', { params: filters });
    return response.data;
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { error?: string } } };
    throw new Error(axiosError.response?.data?.error || 'Erreur lors de la recherche combinée par date et position');
  }
};

// Get affectations by salle
export const getAffectationsBySalle = async (refSalle: string): Promise<Affectation[]> => {
  try {
    const response = await apiClient.get(`/affectations/salle/${refSalle}`);
    return response.data;
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { error?: string } } };
    throw new Error(axiosError.response?.data?.error || 'Erreur lors de la récupération des affectations par salle');
  }
};

// Generic search function
export const searchAffectations = async (params: Record<string, unknown>): Promise<Affectation[]> => {
  try {
    // Determine the appropriate endpoint based on params
    if (params.startDate && params.endDate && params.matricule) {
      return searchAffectationsByDateAndMatricule(params as unknown as DateAndMatriculeFilter);
    } else if (params.startDate && params.endDate && params.refPosition) {
      return searchAffectationsByDateAndPosition(params as unknown as DateAndPositionFilter);
    } else if (params.startDate && params.endDate) {
      return searchAffectationsByDateRange(params as unknown as DateRangeFilter);
    } else if (params.matricule) {
      return searchAffectationsByMatricule(params as unknown as MatriculeFilter);
    } else if (params.refPosition) {
      return searchAffectationsByPosition(params as unknown as PositionFilter);
    } else {
      throw new Error('Paramètres de recherche invalides');
    }
  } catch (error: unknown) {
    const customError = error as { message?: string };
    throw new Error(customError.message || 'Erreur lors de la recherche des affectations');
  }
};
