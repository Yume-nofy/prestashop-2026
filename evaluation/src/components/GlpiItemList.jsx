import React, { useState, useEffect } from 'react';
import { fetchGlpiItems, fetchGlpiDocumentItems, fetchGlpiDocumentImage } from '../services/CrudService';
import { apiGlpi } from '../api/apiGlpi';
import AdminLayout from './AdminLayout'; 

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

  // Vérification de la session pour savoir s'il faut inclure le Layout admin
  const isAdmin = localStorage.getItem('adminSession') === 'admin';

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      let manufacturerMap = {};
      let statusMap = {};

      try {
        const [manufacturersData, statusesData] = await Promise.all([
          apiGlpi('Manufacturer').catch(() => []),
          apiGlpi('State').catch(() => [])
        ]);

        if (Array.isArray(manufacturersData)) {
          manufacturersData.forEach(m => { manufacturerMap[m.id] = m.name; });
        }
        if (Array.isArray(statusesData)) {
          statusesData.forEach(s => { statusMap[s.id] = s.name; });
        }
      } catch (e) {
        console.warn("Erreur lors du chargement des dictionnaires GLPI :", e);
      }

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

      combinedItems = combinedItems.map(item => {
        const key = `${item.itemtype}-${item.id}`;
        return {
          ...item,
          manufacturerName: manufacturerMap[item.manufacturers_id] || "Inconnu",
          statusName: statusMap[item.states_id] || "Par defaut",
          documentId: docItemsMap[key] || null,
          imageUrl: null 
        };
      });

      setItems(combinedItems);

      const uniqueStatuses = [...new Set(combinedItems.map(i => i.statusName))];
      const uniqueManufacturers = [...new Set(combinedItems.map(i => i.manufacturerName))];
      
      setStatusesList(uniqueStatuses);
      setManufacturersList(uniqueManufacturers);

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

  const filteredItems = items.filter(item => {
    const matchesSearch = searchQuery === '' || 
      (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.inventoryNumber && item.inventoryNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.serial && item.serial.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedType === '' || item.itemtype === selectedType;
    const matchesStatus = selectedStatus === '' || item.statusName === selectedStatus;
    const matchesManufacturer = selectedManufacturer === '' || item.manufacturerName === selectedManufacturer;

    return matchesSearch && matchesType && matchesStatus && matchesManufacturer;
  });

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Indexation et resolution du parc GLPI...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorText}>Erreur systeme : {error}</div>
      </div>
    );
  }

  // Contenu principal de la liste
  const renderContent = () => (
    <div style={styles.pageContent}>
      <div style={styles.header}>
        <h2 style={styles.mainTitle}>Inventaire du Parc Informatique</h2>
        <p style={styles.subtitle}>Index global triable, recherche multicriteres et statut en temps reel.</p>
      </div>

      {/* 🔍 FILTRES DE RECHERCHE */}
      <div style={styles.filterSection}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Recherche globale</label>
          <input 
            type="text" 
            placeholder="Nom, num inventaire, serie..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Categorie</label>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} style={styles.select}>
            <option value="">Toutes les categories</option>
            {typesList.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Statut operationnel</label>
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} style={styles.select}>
            <option value="">Tous les statuts</option>
            {statusesList.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Constructeur</label>
          <select value={selectedManufacturer} onChange={(e) => setSelectedManufacturer(e.target.value)} style={styles.select}>
            <option value="">Tous les fabricants</option>
            {manufacturersList.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* COMPTEUR METRIQUE */}
      <div style={styles.metaCounter}>
        Filtre actif : {filteredItems.length} element(s) liste(s) sur un total de {items.length} actifs enregistres.
      </div>

      {/* 🎴 GRILLE DES CARTES ACTIFS */}
      <div style={styles.grid}>
        {filteredItems.map((item, index) => (
          <div key={`${item.itemtype || 'item'}-${item.id || index}-${index}`} style={styles.card}>
            
            {/* ZONE IMAGE BLOB / COUVERTURE */}
            <div style={styles.imageContainer}>
              {item.imageUrl ? (
                <img 
                  src={item.imageUrl} 
                  alt={item.name} 
                  style={styles.image}
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = "https://placehold.co/280x160/1e1e1e/64748b?text=Image+Indisponible";
                  }}
                />
              ) : (
                <div style={styles.noImageText}>Aucun rendu visuel</div>
              )}
            </div>

            {/* DESCRIPTION DU MATERIEL */}
            <div style={styles.cardBody}>
              <div>
                <span style={styles.typeBadge}>{item.itemtype}</span>
                <h4 style={styles.itemTitle}>{item.name || "Actif sans label"}</h4>
                <div style={styles.inventoryLine}>
                  <span style={styles.metaLabel}>N° Inventaire :</span> {item.inventoryNumber || item.otherserial || '—'}
                </div>
              </div>

              <div style={styles.cardFooter}>
                <div style={styles.footerLine}>
                  <span style={styles.statusDot}></span>
                  <span style={styles.metaLabel}>Statut :</span> {item.statusName}
                </div>
                <div style={styles.footerLine}>
                  <span style={styles.metaLabel}>Fabricant :</span> {item.manufacturerName}
                </div>
              </div>
            </div>

          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div style={styles.emptyContainer}>
          Aucun element du parc informatique ne correspond aux criteres de filtrage selectionnes.
        </div>
      )}
    </div>
  );

  // Condition d'affichage : si connecté en admin, on encapsule dans le Layout, sinon affichage brut complet
  return isAdmin ? <AdminLayout>{renderContent()}</AdminLayout> : <div style={styles.standalonePage}>{renderContent()}</div>;
};

const styles = {
  loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#121212' },
  loadingText: { color: '#00d2ff', fontSize: '14px', fontFamily: 'monospace' },
  errorContainer: { padding: '24px', backgroundColor: '#1e1e1e', border: '1px solid #ef4444', margin: '40px' },
  errorText: { color: '#ef4444', fontSize: '14px', margin: 0 },
  standalonePage: { backgroundColor: '#121212', minHeight: '100vh', padding: '40px', boxSizing: 'border-box', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' },
  pageContent: { width: '100%' },
  header: { borderBottom: '1px solid #334155', paddingBottom: '16px', marginBottom: '24px' },
  mainTitle: { fontSize: '22px', fontWeight: '700', color: '#00d2ff', margin: '0 0 6px 0' },
  subtitle: { fontSize: '13px', color: '#cbd5e1', margin: 0 },
  filterSection: { backgroundColor: '#1e1e1e', border: '1px solid #334155', padding: '20px', borderRadius: '8px', marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  filterLabel: { fontSize: '12px', fontWeight: '600', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { width: '100%', padding: '10px 12px', backgroundColor: '#121212', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px', boxSizing: 'border-box', outline: 'none' },
  select: { width: '100%', padding: '10px 12px', backgroundColor: '#121212', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px', boxSizing: 'border-box', outline: 'none' },
  metaCounter: { fontSize: '13px', color: '#cbd5e1', fontWeight: '500', marginBottom: '16px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' },
  card: { backgroundColor: '#1e1e1e', border: '1px solid #334155', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' },
  imageContainer: { height: '150px', backgroundColor: '#121212', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  image: { width: '100%', height: '100%', objectFit: 'cover' },
  noImageText: { color: '#64748b', fontSize: '12px', textTransform: 'uppercase', fontFamily: 'monospace' },
  cardBody: { padding: '18px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' },
  typeBadge: { fontSize: '10px', fontWeight: '700', color: '#00d2ff', backgroundColor: 'rgba(0, 210, 255, 0.08)', border: '1px solid #00d2ff', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase', display: 'inline-block' },
  itemTitle: { margin: '8px 0 4px 0', color: '#f8fafc', fontSize: '15px', fontWeight: '700' },
  inventoryLine: { fontSize: '12px', color: '#cbd5e1' },
  metaLabel: { color: '#64748b', fontWeight: '600' },
  cardFooter: { borderTop: '1px solid #334155', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' },
  footerLine: { display: 'flex', alignItems: 'center', gap: '6px', color: '#cbd5e1' },
  statusDot: { width: '6px', height: '6px', backgroundColor: '#10b981', borderRadius: '50%' },
  emptyContainer: { textAlign: 'center', padding: '40px', color: '#64748b', border: '1px dashed #334155', borderRadius: '8px', marginTop: '24px', fontSize: '13px' }
};

export default GlpiItemList;