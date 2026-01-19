import apiClient from './api';

// Interface pour les données de connexion
interface LoginData {
  emailOrUsername: string;
  password: string;
}

// Interface pour la réponse de connexion
interface LoginResponse {
  message: string;
  user: {
    matricule: string;
    nomUser: string;
    role: string;
    nom?: string;
    prenom?: string;
    email?: string;
  };
}

// Interface pour les erreurs personnalisées de l'API
interface ApiError {
  type: string;
  message: string;
  status: number;
  data?: unknown;
  originalError?: unknown;
}

// Fonction pour se connecter
export const loginUtilisateur = async (data: LoginData): Promise<LoginResponse> => {
  try {
    const payload = {
      emailOrUsername: data.emailOrUsername,
      motDePasse: data.password
    };

    const response = await apiClient.post('/auth/login', payload);

    return response.data;
  } catch (error: unknown) {
    const apiError = error as ApiError;

    if (apiError?.type === "network") {
      throw new Error("Impossible de se connecter au serveur. Vérifier votre connexion.");
    }

    switch (apiError?.status) {
      case 400:
        throw new Error("Données de connexion invalides");
      case 401:
        throw new Error("Email / nom d'utilisateur ou mot de passe incorrect");
      case 403:
        throw new Error("Accès refusé");
      case 500:
        throw new Error("Erreur interne du serveur");
      default:
        throw new Error(
          apiError?.message || "Erreur lors de la connexion"
        );
    }
  }
};

// Fonction pour se déconnecter
export const logoutUtilisateur = async (): Promise<void> => {
  try {
    // Call logout endpoint if it exists (optional)
    await apiClient.post('/auth/logout');
  } catch {
    // Logout endpoint might not exist, that's okay
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// Fonction pour récupérer les infos utilisateur
export const getUserInfo = async (matricule: string): Promise<LoginResponse['user']> => {
  try {
    const response = await apiClient.post('/auth/user-info', { matricule });
    return response.data;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(apiError?.message || "Erreur lors de la récupération des infos utilisateur");
  }
};
