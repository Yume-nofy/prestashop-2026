
const BASE_URL = 'http://localhost:5000';

export const apiLocalStatus = async (endpoint, options = {}) => {
  const url = `${BASE_URL}/${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      throw new Error(`Erreur API Locale: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Erreur lors de l'appel à ${url}:`, error);
    throw error;
  }
};