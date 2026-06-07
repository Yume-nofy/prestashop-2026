import React, { useState, useEffect } from 'react';
import { fetchGlpiItems, fetchGlpiDocumentItems, fetchGlpiDocumentImage } from '../services/CrudService';
import { apiGlpi } from '../api/apiGlpi';

const GlpiItemList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // États pour la recherche multi-critères
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedManufacturer, setSelectedManufacturer] = useState('');

  // Listes de filtres uniques (Textuels)
  const [typesList] = useState(['Computer', 'Monitor', 'NetworkEquipment', 'Peripheral']);
  const [statusesList, setStatusesList] = useState([]);
  const [manufacturersList, setManufacturersList] = useState([]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Récupération des Référentiels (Fabricants & Statuts) en parallèle
      let manufacturerMap = {};
      let statusMap = {};

      try {
        const [manufacturersData, statusesData] = await Promise.all([
          apiGlpi('Manufacturer').catch(() => []),
          apiGlpi('State').catch(() => [])
        ]);

        // Construction du dictionnaire des Fabricants (ID -> Nom)
        if (Array.isArray(manufacturersData)) {
          manufacturersData.forEach(m => { manufacturerMap[m.id] = m.name; });
        }
        // Construction du dictionnaire des Statuts (ID -> Nom)
        if (Array.isArray(statusesData)) {
          statusesData.forEach(s => { statusMap[s.id] = s.name; });
        }
      } catch (e) {
        console.warn("Erreur lors du chargement des dictionnaires GLPI :", e);
      }

      // 2. Récupération en parallèle des équipements du parc
      const typesToFetch = ['Computer', 'Monitor', 'NetworkEquipment', 'Peripheral']; 
      const itemsPromises = typesToFetch.map(async (type) => {
        try {
          const res = await fetchGlpiItems(type);
          const cleanItems = Array.isArray(res) ? res : [];
          return cleanItems.map(item => ({ ...item, itemtype: type }));
        } catch {
          return []; 
        }
      });

      const allItemsResults = await Promise.all(itemsPromises);
      let combinedItems = allItemsResults.flat();

      // 3. Récupération des liaisons Documents <-> Items pour les images
      let docItemsMap = {};
      try {
        const docItems = await fetchGlpiDocumentItems();
        if (Array.isArray(docItems)) {
          docItems.forEach(link => {
            const key = `${link.itemtype}-${link.items_id}`;
            docItemsMap[key] = link.documents_id;
          });
        }
      } catch (e) {
        console.warn("Impossible de charger les liaisons d'images :", e);
      }

      // 4. Structuration finale (Liaison Fabricant textuel + Statut textuel + Image)
      combinedItems = combinedItems.map(item => {
        const key = `${item.itemtype}-${item.id}`;
        return {
          ...item,
          manufacturerName: manufacturerMap[item.manufacturers_id] || "Inconnu",
          statusName: statusMap[item.states_id] || "Par défaut", // Traduction de states_id en texte
          documentId: docItemsMap[key] || null,
          imageUrl: null 
        };
      });

      setItems(combinedItems);

      // 5. Extraction dynamique des listes de filtres textuels uniques
      const uniqueStatuses = [...new Set(combinedItems.map(i => i.statusName))];
      const uniqueManufacturers = [...new Set(combinedItems.map(i => i.manufacturerName))];
      
      setStatusesList(uniqueStatuses);
      setManufacturersList(uniqueManufacturers);

      // 6. Chargement asynchrone des images binaires (Blob URLs)
      combinedItems.forEach(async (item) => {
        if (item.documentId) {
          const blobUrl = await fetchGlpiDocumentImage(item.documentId);
          if (blobUrl) {
            setItems(prevItems => {
              const updated = [...prevItems];
              const itemIndex = updated.findIndex(i => i.itemtype === item.itemtype && i.id === item.id);
              if (itemIndex !== -1) {
                updated[itemIndex].imageUrl = blobUrl;
              }
              return updated;
            });
          }
        }
      });

    } catch (err) {
      setError(`Erreur lors du chargement des composants : ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 🎛️ Logique de filtrage multi-critères cumulatif
  const filteredItems = items.filter(item => {
    const matchesSearch = searchQuery === '' || 
      (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.inventoryNumber && item.inventoryNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.serial && item.serial.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedType === '' || item.itemtype === selectedType;
    
    // Filtrage basé sur les valeurs textuelles de statut et de fabricant
    const matchesStatus = selectedStatus === '' || item.statusName === selectedStatus;
    const matchesManufacturer = selectedManufacturer === '' || item.manufacturerName === selectedManufacturer;

    return matchesSearch && matchesType && matchesStatus && matchesManufacturer;
  });

  if (loading) return <div style={{ padding: '20px' }}>🔄 Chargement des équipements du parc GLPI...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>⚠️ {error}</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ borderBottom: '2px solid #007bff', paddingBottom: '10px' }}>FrontOffice - Liste des Éléments du Parc</h2>

      {/* 🔍 BARRE DE RECHERCHE MULTI-CRITÈRES */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '25px',
        border: '1px solid #e9ecef',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px'
      }}>
        {/* Critère 1 : Recherche globale */}
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '14px' }}>Recherche globale</label>
          <input 
            type="text" 
            placeholder="Nom, n° inventaire, série..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        {/* Critère 2 : Type */}
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '14px' }}>Type d'élément</label>
          <select 
            value={selectedType} 
            onChange={(e) => setSelectedType(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff' }}
          >
            <option value="">Tous les types</option>
            {typesList.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Critère 3 : Statut (Nom textuel propre) */}
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '14px' }}>Statut</label>
          <select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff' }}
          >
            <option value="">Tous les statuts</option>
            {statusesList.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Critère 4 : Fabricant (Nom textuel propre) */}
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '14px' }}>Fabricant</label>
          <select 
            value={selectedManufacturer} 
            onChange={(e) => setSelectedManufacturer(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff' }}
          >
            <option value="">Tous les fabricants</option>
            {manufacturersList.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* COMPTEUR */}
      <p style={{ fontWeight: 'bold', color: '#555' }}>
        🔍 {filteredItems.length} élément(s) trouvé(s) sur un total de {items.length} dans le parc.
      </p>

      {/* 🎴 GRILLE D'AFFICHAGE */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: '20px',
        marginTop: '15px' 
      }}>
        {filteredItems.map((item, index) => (
          <div 
            key={`${item.itemtype || 'item'}-${item.id || index}-${index}`} 
            style={{ 
              border: '1px solid #e0e0e0', 
              borderRadius: '8px', 
              overflow: 'hidden', 
              backgroundColor: '#fff',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* ZONE IMAGE */}
            <div style={{ 
              height: '160px', 
              backgroundColor: '#f1f3f5', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              borderBottom: '1px solid #e0e0e0',
              overflow: 'hidden'
            }}>
              {item.imageUrl ? (
                <img 
                  src={item.imageUrl} 
                  alt={item.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = "https://placehold.co/280x160?text=Image+Indisponible";
                  }}
                />
              ) : (
                <div style={{ color: '#adb5bd', fontSize: '13px', textAlign: 'center', padding: '10px' }}>
                  📷 <br /> Aucune image disponible
                </div>
              )}
            </div>

            {/* CONTENU CARD */}
            <div style={{ padding: '15px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span style={{ 
                  fontSize: '11px', 
                  textTransform: 'uppercase', 
                  backgroundColor: '#e7f5ff', 
                  color: '#007bff', 
                  padding: '3px 8px', 
                  borderRadius: '12px', 
                  fontWeight: 'bold' 
                }}>
                  {item.itemtype}
                </span>
                
                <h4 style={{ margin: '10px 0 5px 0', color: '#212529', fontSize: '16px' }}>{item.name || "Élément sans nom"}</h4>
                
                <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#6c757d' }}>
                  <strong>N° Inventaire :</strong> {item.inventoryNumber || item.otherserial || '—'}
                </p>
              </div>

              <div style={{ borderTop: '1px dashed #eee', paddingTop: '10px', marginTop: 'auto', fontSize: '12px', color: '#495057' }}>
                {/* 🟢 AFFICHAGE DU TEXTE DU STATUT ICI */}
                <div style={{ marginBottom: '4px' }}>🟢 <strong>Statut :</strong> {item.statusName}</div>
                {/* 🏢 AFFICHAGE DU TEXTE DU FABRICANT ICI */}
                <div>🏢 <strong>Fabricant :</strong> {item.manufacturerName}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d', border: '1px dashed #ccc', borderRadius: '8px', marginTop: '20px' }}>
          Aucun équipement ne correspond à vos critères de recherche.
        </div>
      )}
    </div>
  );
};

export default GlpiItemList;