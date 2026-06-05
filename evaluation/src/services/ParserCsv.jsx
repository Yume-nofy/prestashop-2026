import { useState } from 'react';

export function useCsvParser({ separator = ',', hasHeader = true, mapRow }) {
  const [data, setData] = useState([]);
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
        const parsedResults = [];

        let startRow = 0;
        if (hasHeader && lines.length > 0) {
          startRow = 1; 
        }

        for (let i = startRow; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue; // On ignore les lignes vides

          // Découpage de la ligne et nettoyage des espaces
          const fields = line.split(separator).map(field => field.trim());

          // Application de ta fonction de modelage personnalisé
          const mappedObject = mapRow(fields, i);
          if (mappedObject) {
            parsedResults.push(mappedObject);
          }
        }

        setData(parsedResults);
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
    setData([]);
    setError(null);
  };

  return { data, loading, error, parseFile, clear };
}