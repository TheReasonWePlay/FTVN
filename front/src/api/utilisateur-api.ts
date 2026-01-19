import apiClient from './api';

// Interface pour les données brutes de l'utilisateur depuis le backend
interface RawUtilisateur {
  matricule: string;
  nomUser: string;
  motDePasse: string;
  role: string;
}

// Interface pour l'utilisateur avec des champs frontend optionnels (infos Personne)
interface Utilisateur extends RawUtilisateur {
  nom?: string;
  prenom?: string;
  email?: string;
  poste?: string;
  projet?: string;
}

// Interface pour les erreurs personnalisées de l'API
interface ApiError {
  type: string;
  message: string;
  status: number;
  data?: unknown;
  originalError?: unknown;
}

// Fonction pour récupérer tous les utilisateurs
export const getAllUtilisateurs = async (): Promise<Utilisateur[]> => {
  try {
    const response = await apiClient.get('/utilisateurs');
    return response.data;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error('Erreur lors de la récupération de tous les utilisateurs:', {
      type: apiError.type,
      message: apiError.message,
      status: apiError.status,
      data: apiError.data,
      originalError: apiError.originalError
    });

    if (apiError.type === 'network') {
      throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
    }
    throw new Error('Échec de la récupération de tous les utilisateurs');
  }
};

// Fonction pour récupérer un utilisateur par son matricule
export const getUtilisateurByMatricule = async (matricule: string): Promise<Utilisateur> => {
  try {
    const response = await apiClient.get(`/utilisateurs/${matricule}`);
    return response.data;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error(`Erreur lors de la récupération de l'utilisateur ${matricule}:`, {
      type: apiError.type,
      message: apiError.message,
      status: apiError.status,
      data: apiError.data,
      originalError: apiError.originalError
    });

    if (apiError.type === 'network') {
      throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
    }
    throw new Error(`Échec de la récupération de l'utilisateur avec matricule ${matricule}`);
  }
};

// Fonction pour créer un nouvel utilisateur
export const createUtilisateur = async (data: object): Promise<void> => {
  try {
    await apiClient.post('/utilisateurs', data);
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error('Erreur lors de la création de l\'utilisateur:', {
      type: apiError.type,
      message: apiError.message,
      status: apiError.status,
      data: apiError.data,
      originalError: apiError.originalError
    });

    if (apiError.type === 'network') {
      throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
    }
    throw new Error('Échec de la création de l\'utilisateur');
  }
};

// Fonction pour mettre à jour un utilisateur existant
export const updateUtilisateur = async (matricule: string, data: object): Promise<void> => {
  try {
    await apiClient.put(`/utilisateurs/${matricule}`, data);
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error(`Erreur lors de la mise à jour de l'utilisateur ${matricule}:`, {
      type: apiError.type,
      message: apiError.message,
      status: apiError.status,
      data: apiError.data,
      originalError: apiError.originalError
    });

    if (apiError.type === 'network') {
      throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
    }
    throw new Error(`Échec de la mise à jour de l'utilisateur avec matricule ${matricule}`);
  }
};

// Fonction pour supprimer un utilisateur
export const deleteUtilisateur = async (matricule: string): Promise<void> => {
  try {
    await apiClient.delete(`/utilisateurs/${matricule}`);
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error(`Erreur lors de la suppression de l'utilisateur ${matricule}:`, {
      type: apiError.type,
      message: apiError.message,
      status: apiError.status,
      data: apiError.data,
      originalError: apiError.originalError
    });

    if (apiError.type === 'network') {
      throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
    }
    throw new Error(`Échec de la suppression de l'utilisateur avec matricule ${matricule}`);
  }
};

// Fonction pour filtrer les utilisateurs avec des critères multiples (matricule, nom, prenom, nomUser, email, role)
export const filterUtilisateurs = async (filters: object): Promise<Utilisateur[]> => {
  try {
    const response = await apiClient.get('/utilisateurs', { params: filters });
    return response.data;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error('Erreur lors du filtrage des utilisateurs:', {
      type: apiError.type,
      message: apiError.message,
      status: apiError.status,
      data: apiError.data,
      originalError: apiError.originalError
    });

    if (apiError.type === 'network') {
      throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
    }
    throw new Error('Échec du filtrage des utilisateurs');
  }
};

// Fonction pour récupérer le rôle de l'utilisateur connecté depuis localStorage
export const getUserRole = (): string | null => {
  try {
    const user = localStorage.getItem('user');
    if (user) {
      const parsedUser = JSON.parse(user);
      return parsedUser.role || null;
    }
    return null;
  } catch {
    return null;
  }
};

// Fonction pour récupérer le nom de l'utilisateur connecté depuis localStorage
export const getUserName = (): string | null => {
  try {
    const user = localStorage.getItem('user');
    if (user) {
      const parsedUser = JSON.parse(user);
      return parsedUser.nomUser || null;
    }
    return null;
  } catch {
    return null;
  }
};

// Fonction pour récupérer le prénom de l'utilisateur connecté depuis localStorage
export const getUserPrenom = (): string | null => {
  try {
    const user = localStorage.getItem('user');
    if (user) {
      const parsedUser = JSON.parse(user);
      return parsedUser.prenom || null;
    }
    return null;
  } catch {
    return null;
  }
};
