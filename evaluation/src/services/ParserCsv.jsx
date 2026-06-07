import { useState } from 'react';

/**
 * Extrait proprement les noms d'équipements sous forme de tableau.
 */
export const extractItemsArray = (rawItemsString) => {
  if (!rawItemsString) return [];
  
  // Nettoyage des espaces et suppression des crochets [ et ]
  let cleanStr = rawItemsString.trim().replace(/^\[|\]$/g, '');
  
  if (!cleanStr) return [];

  // Découpage par la virgule pour séparer les équipements
  return cleanStr.split(',').map(item => {
    return item
      .replace(/""/g, '')  
      .replace(/^"|"$/g, '') 
      .replace(/^'|'$/g, '') 
      .trim();             
  }).filter(item => item.length > 0); 
};
/**
 * Découpeur de ligne CSV intelligent : respecte les espaces ET les blocs entre guillemets
 */
const splitCsvLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
};
/**
 * Hook de parsing pour les fichiers du parc informatique
 */
export function useCsvParser({ separator = ',', hasHeader = true }) {
  const [data, setData] = useState({
    devicesByType: {}, 
    statuses: [],
    locations: [],
    manufacturers: [],
    models: [],
    users: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const parseFile = (file) => {
    setLoading(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (!text) throw new Error("Le fichier est vide.");
        const lines = text.split(/\r?\n/);
        
        const uniqueStatuses = new Set();
        const uniqueLocations = new Set();
        const uniqueManufacturers = new Set();
        const uniqueModels = new Set();
        const uniqueUsers = new Set();
        const devicesBucket = {};

        let startRow = hasHeader && lines.length > 0 ? 1 : 0;

        for (let i = startRow; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const fields = line.split(separator).map(field => field.trim());
          const [name, status, location, manufacturer, itemType, model, inventoryNumber, user] = fields;

          if (!name) continue;

          const rawType = itemType || 'Computer';
          const formattedType = rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase();

          if (status) uniqueStatuses.add(status);
          if (location) uniqueLocations.add(location);
          if (manufacturer) uniqueManufacturers.add(manufacturer);
          if (model) uniqueModels.add(model);
          if (user) uniqueUsers.add(user);

          const device = {
            name,
            statusName: status || "",
            locationName: location || "",
            manufacturerName: manufacturer || "",
            itemType: formattedType,
            modelName: model || "",
            inventoryNumber: inventoryNumber || "",
            userEmailOrName: user || ""
          };

          if (!devicesBucket[formattedType]) {
            devicesBucket[formattedType] = [];
          }
          devicesBucket[formattedType].push(device);
        }

        setData({
          devicesByType: devicesBucket,
          statuses: Array.from(uniqueStatuses),
          locations: Array.from(uniqueLocations),
          manufacturers: Array.from(uniqueManufacturers),
          models: Array.from(uniqueModels),
          users: Array.from(uniqueUsers)
        });

      } catch (err) {
        setError(err.message || "Erreur lors du parsing du fichier.");
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setError("Erreur de lecture du fichier.");
      setLoading(false);
    };

    reader.readAsText(file);
  };

  const clear = () => {
    setData({
      devicesByType: {},
      statuses: [],
      locations: [],
      manufacturers: [],
      models: [],
      users: []
    });
    setError(null);
  };

  return { data, loading, error, parseFile, clear };
}

/**
 * Hook de parsing pour le fichier de tickets de support
 */
export function useTicketCsvParser({ hasHeader = true }) {
  const [ticketData, setTicketData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const parseTicketFile = (file) => {
    setLoading(true);
    setError(null);

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (!text) throw new Error("Fichier vide");

        const lines = text.split(/\r?\n/);
        const parsedTickets = [];

        let startRow = hasHeader ? 1 : 0;

        for (let i = startRow; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const fields = splitCsvLine(line);

          const [
            refTicket,
            date,
            heure,
            type,
            titre,
            description,
            status,
            priority,
            itemsRaw
          ] = fields;

          const itemsArray = extractItemsArray(itemsRaw);

          parsedTickets.push({
            refTicket,
            date,
            time: heure,
            type: type || "Incident",
            title: titre?.replace(/^"|"$/g, '') || "",
            description: description?.replace(/^"|"$/g, '') || "",
            status: status || "New",
            priority: priority || "Medium",
            items: itemsArray
          });
        }

        setTicketData(parsedTickets);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    reader.readAsText(file);
  };

  return { ticketData, loading, error, parseTicketFile };
}