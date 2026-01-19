import axios from "axios";

//Création d'une instance Axios avec la configuration de base
const apiClient = axios.create({
    baseURL: "http://127.0.0.1:5000/api",
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: false,
});

//Intercepteur de requête : configuration de base
apiClient.interceptors.request.use(
    (config) => {
        return config;
    },
    (error) => Promise.reject(error)
);

//Intercepteur de réponse : gestion des erreurs globalement
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Gestion des erreurs réseau
        if (!error.response) {
            const networkError = {
                type: 'network',
                message: 'Erreur de connexion réseau. Vérifiez votre connexion internet.',
                status: 0
            };
            return Promise.reject(networkError);
        }

        const { status, data } = error.response;
        let errorMessage = 'Une erreur inattendue s\'est produite.';
        let errorType = 'error';

        // Gestion des différents statuts d'erreur
        switch (status) {
            case 400:
                errorMessage = data?.error?.message || 'Données invalides. Vérifiez vos informations.';
                errorType = 'validation';
                break;
            case 401:
                errorMessage = 'Session expirée. Veuillez vous reconnecter.';
                // Redirection vers la page de connexion après un court délai
                setTimeout(() => {
                    localStorage.removeItem('token');
                    window.location.href = "/";
                }, 2000);
                break;
            case 403:
                errorMessage = 'Accès refusé. Vous n\'avez pas les permissions nécessaires.';
                errorType = 'authorization';
                break;
            case 404:
                errorMessage = data?.error?.message || 'Ressource non trouvée.';
                errorType = 'not_found';
                break;
            case 409:
                errorMessage = data?.error?.message || 'Conflit de données. L\'élément existe déjà.';
                errorType = 'conflict';
                break;
            case 422:
                errorMessage = data?.error?.message || 'Données non traitables.';
                errorType = 'validation';
                break;
            case 500:
                errorMessage = 'Erreur interne du serveur. Réessayez plus tard.';
                errorType = 'server';
                break;
            default:
                if (status >= 500) {
                    errorMessage = 'Erreur du serveur. Veuillez réessayer.';
                    errorType = 'server';
                } else if (status >= 400) {
                    errorMessage = data?.error?.message || 'Erreur de requête.';
                    errorType = 'client';
                }
        }

        const customError = {
            type: errorType,
            message: errorMessage,
            status,
            originalError: error,
            data: data?.error
        };

        return Promise.reject(customError);
    }
);

export default apiClient;