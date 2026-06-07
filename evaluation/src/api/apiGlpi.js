const BASE_URL = "http://glpi.localhost/apirest.php";
const appToken = "wEcFt3X7Ce1rXnwb3mMDi132vcLDmLbDQ8yeLJAH";
const tokenUser = "RnmHgRxaokT1hXEzgp1cdwcAgmm8VI7TKPAb8jC2";

export const apiGlpi = async (endpoint, options = {}) => {
  // Récupération dynamique du jeton de session stocké après l'initialisation
  const sessionToken = localStorage.getItem('glpi_session_token');

  // Construction de l'URL (GLPI attend généralement l'app_token soit en query param, soit en header)
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${BASE_URL}/${endpoint}${separator}app_token=${appToken}`;

  // 1. Initialisation des en-têtes standard de GLPI
  const headers = {
    'Accept': 'application/json',
    ...options.headers, // Garde les en-têtes spécifiques passés en option
  };

  // 2. GESTION DYNAMIQUE DU CONTENT-TYPE (Sécurisation des fichiers ZIP/Images)
  if (options.body instanceof FormData) {
    // ⚠️ On laisse le navigateur gérer le Content-Type pour le multipart/form-data
    // Ne SURTOUT PAS mettre 'application/json' ni 'multipart/form-data' manuellement
    if (headers['Content-Type']) {
      delete headers['Content-Type'];
    }
  } else {
    // Pour toutes les requêtes standard (JSON)
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
  }

  // Si on a déjà un token de session actif, on l'ajoute obligatoirement à la requête
  if (sessionToken && endpoint !== 'initSession') {
    headers['Session-Token'] = sessionToken;
  }

  const config = {
    ...options,
    mode: 'cors',
    headers: headers,
  };

  if (options.body) {
    config.body = options.body;
  }

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur ${response.status}: ${errorText}`);
    }

    // On retourne du JSON, plus simple à manipuler que du texte brut ou de l'XML
    return await response.json();
  } catch (error) {
    console.error(`Erreur API sur ${endpoint}:`, error);
    throw error;
  }
};
/**
 * Initialise la session GLPI et stocke le session_token
 */
export const initGlpiSession = async () => {
  try {
    const data = await apiGlpi('initSession', {
      method: 'GET',
      headers: {
        // Authentification par le token utilisateur (User Token)
        'Authorization': `user_token ${tokenUser}`
      }
    });

    // GLPI renvoie un objet contenant { session_token: "le_token_generé" }
    if (data && data.session_token) {
      console.log("Session GLPI initialisée avec succès !");
      // On sauvegarde le token pour les futures requêtes
      localStorage.setItem('glpi_session_token', data.session_token);
      return data.session_token;
    } else {
      throw new Error("Aucun session_token reçu de GLPI");
    }
  } catch (error) {
    console.error("Échec de l'initialisation de la session GLPI :", error);
    throw error;
  }
};

/**
 * Optionnel : Pour fermer proprement la session GLPI
 */
export const killGlpiSession = async () => {
  try {
    await apiGlpi('killSession', { method: 'GET' });
    localStorage.removeItem('glpi_session_token');
    console.log("Session GLPI fermée.");
  } catch (error) {
    console.error("Erreur lors de la fermeture de session :", error);
  }
};
