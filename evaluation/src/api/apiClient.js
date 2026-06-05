const BASE_URL = "http://localhost/prestashop_edition_classic_version_8.2.6/api";
const API_KEY = "536MTLDXZ5TZ1EZGHTPM3CJX6MCVKX17";
const apiClient = async (endpoint, options = {}) => {
  const url = `${BASE_URL}/${endpoint}${endpoint.includes('?') ? '&' : '?'}ws_key=${API_KEY}`;
  const headers = {
    'Accept': 'application/xml',
    ...options.headers,
  };
  if (['POST', 'PUT'].includes(options.method)) {
    headers['Content-Type'] = 'application/xml';
  }

  const config = {
    ...options,
    mode: 'cors',
    headers: headers, 
  };

  if (options.method === 'DELETE') {
    delete config.headers['Content-Type'];
  }

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur ${response.status}: ${errorText}`);
    }
    return await response.text();
  } catch (error) {
    console.error(`Erreur API sur ${endpoint}:`, error);
    throw error;
  }
};

export default apiClient;