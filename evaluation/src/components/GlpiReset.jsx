import React, { useState } from 'react';
import {
  getGlpiItems, deleteGlpiItem,
  getGlpiModels, deleteGlpiModel,
  getGlpiGroups, deleteGlpiGroup,
  getGlpiManufacturers, deleteGlpiManufacturer,
  getGlpiStatuses, deleteGlpiStatus, purgeAllGlpiTickets,
  getGlpiDocuments, deleteGlpiDocument,
  getGlpiDocumentItems, deleteGlpiDocumentItem
} from '../services/CrudService';
import { deleteUser, getGlpiUsers } from '../services/testApi';

const ITEM_TYPES = ['Computer', 'Monitor', 'NetworkEquipment', 'Peripheral']; 

const GlpiReset = () => {
  const [isResetting, setIsResetting] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (msg) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

  const handleReset = async () => {
    setIsResetting(true);
    setLogs([]);

    try {
      addLog("🚀 Début de la réinitialisation globale de GLPI...");

      // ==========================================
      // ETAPE 1 : Suppression des Tickets
      // ==========================================
      addLog("🎫 Élimination des tickets et de leurs liaisons...");
      const ticketResult = await purgeAllGlpiTickets(addLog); 
      addLog(`   -> Suppression définitive de ${ticketResult.count} ticket(s) terminée.`);

      // ==========================================
      // ETAPE 1.5 : NETTOYAGE DES IMAGES & LIAISONS (Nouveau)
      // ==========================================
      addLog("🖼️ Analyse et suppression des liaisons de documents (Document_Item)...");
      const docItems = await getGlpiDocumentItems();
      if (Array.isArray(docItems) && docItems.length > 0) {
        addLog(`   -> Suppression de ${docItems.length} liaison(s) de document...`);
        await Promise.all(docItems.map(link => deleteGlpiDocumentItem(link.id)));
      } else {
        addLog("   -> Aucune liaison de document trouvée.");
      }

      addLog("📁 Suppression des fichiers documents physiques de la base...");
      const documents = await getGlpiDocuments();
      if (Array.isArray(documents) && documents.length > 0) {
        addLog(`   -> Suppression de ${documents.length} fichier(s) image/document...`);
        await Promise.all(documents.map(doc => deleteGlpiDocument(doc.id)));
      } else {
        addLog("   -> Aucun document orphelin à purger.");
      }

      // ==========================================
      // ETAPE 2 : Supprimer les équipements du parc
      // ==========================================
      addLog("💻 Récupération et suppression des équipements...");
      for (const type of ITEM_TYPES) {
        const items = await getGlpiItems(type);
        if (Array.isArray(items) && items.length > 0) {
          addLog(`   -> Suppression de ${items.length} équipement(s) de type ${type}...`);
          await Promise.all(items.map(item => deleteGlpiItem(type, item.id)));
        }
      }

      // ==========================================
      // ETAPE 3 : Supprimer les modèles d'équipements
      // ==========================================
      addLog("🔄 Récupération et suppression des modèles...");
      for (const type of ITEM_TYPES) {
        const modelType = `${type}Model`;
        const models = await getGlpiModels(modelType);
        if (Array.isArray(models) && models.length > 0) {
          addLog(`   -> Suppression de ${models.length} modèle(s) pour ${modelType}...`);
          await Promise.all(models.map(model => deleteGlpiModel(modelType, model.id)));
        }
      }

      // ==========================================
      // ETAPE 4 : Supprimer les Utilisateurs personnalisés (ID >= 7)
      // ==========================================
      addLog("👤 Récupération et filtrage des utilisateurs...");
      const users = await getGlpiUsers();
      if (Array.isArray(users) && users.length > 0) {
        const usersToDelete = users.filter(user => Number(user.id) >= 7);
        
        if (usersToDelete.length > 0) {
          addLog(`   -> Suppression de ${usersToDelete.length} utilisateur(s) (ID >= 7)...`);
          await Promise.all(usersToDelete.map(user => deleteUser(user.id)));
        } else {
          addLog("   -> Aucun utilisateur personnalisé à supprimer (comptes système protégés).");
        }
      }

      // ==========================================
      // ETAPE 5 : Supprimer les structures d'organisation parents
      // ==========================================
      
      // 5.1. Les Groupes
      addLog("🏢 Suppression des groupes...");
      const groups = await getGlpiGroups();
      if (Array.isArray(groups) && groups.length > 0) {
        await Promise.all(groups.map(g => deleteGlpiGroup(g.id)));
        addLog(`   -> ${groups.length} groupe(s) supprimé(s).`);
      }

      // 5.2. Les Fabricants
      addLog("🏭 Suppression des fabricants...");
      const manufacturers = await getGlpiManufacturers();
      if (Array.isArray(manufacturers) && manufacturers.length > 0) {
        await Promise.all(manufacturers.map(m => deleteGlpiManufacturer(m.id)));
        addLog(`   -> ${manufacturers.length} fabricant(s) supprimé(s).`);
      }

      // 5.3. Les Statuts
      addLog("⚙️ Suppression des statuts personnalisés...");
      const statuses = await getGlpiStatuses('State');
      if (Array.isArray(statuses) && statuses.length > 0) {
        await Promise.all(statuses.map(s => deleteGlpiStatus('State', s.id)));
        addLog(`   -> ${statuses.length} statut(s) supprimé(s).`);
      }

      addLog("GLPI a été entièrement nettoyé et réinitialisé avec succès !");

    } catch (error) {
      addLog(` ERREUR lors de la réinitialisation : ${error.message}`);
      console.error(error);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ border: '1px solid #ffcccb', backgroundColor: '#fff5f5', padding: '20px', borderRadius: '8px' }}>
        <button
          onClick={handleReset}
          disabled={isResetting}
          style={{
            padding: '12px 24px',
            backgroundColor: isResetting ? '#cca3a3' : '#d9534f',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isResetting ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            width: '100%'
          }}
        >
          {isResetting ? "Purge complète (Fichiers, Équipements & Coûts)..." : "TOUT RÉINITIALISER DE FORCE"}
        </button>
      </div>

      {logs.length > 0 && (
        <div style={{ marginTop: '20px', backgroundColor: '#1e1e1e', color: '#39ff14', padding: '15px', height: '280px', overflowY: 'auto', borderRadius: '4px', fontFamily: 'monospace' }}>
          <strong style={{ color: 'white' }}>Console de reset :</strong>
          <div style={{ marginTop: '10px' }}>
            {logs.map((log, i) => (
              <div key={i} style={{ marginBottom: '4px', fontSize: '13px' }}>{log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlpiReset;