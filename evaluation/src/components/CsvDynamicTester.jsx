import React, { useState } from 'react';
import { useCsvParser, useTicketCsvParser } from '../services/ParserCsv'; 
import JSZip from 'jszip';
import {  
  createGlpiGroup, 
  createGlpiManufacturer, 
  createGlpiCustomStatus, 
  createGlpiModel, 
  createDetailedGlpiItem,
  createGlpiTicket,  
  linkItemToTicket,
  addUserProfileAndEntity,
  addGlpiTicketCost,updateTicketExternalId,
  uploadGlpiDocument, 
  linkDocumentToItem
} from '../services/CrudService';
import { getGlpiUserId, createGlpiUser, linkUserToGroup } from '../services/testApi';
import GlpiReset from './GlpiReset';

const GlpiImporter = () => {
  const { data: devicesData, parseFile: parseDevicesFile } = useCsvParser({ separator: ',' });
  const { ticketData, parseTicketFile } = useTicketCsvParser({ separator: ',' });
  const [zipFile, setZipFile] = useState(null);
  const [costsData, setCostsData] = useState([]);
  const [importing, setImporting] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (msg) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

  const handleDevicesUpload = (e) => {
    const file = e.target.files[0];
    if (file) parseDevicesFile(file);
  };

  const handleTicketsUpload = (e) => {
    const file = e.target.files[0];
    if (file) parseTicketFile(file);
  };

  const handleCostsUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const rows = text.split('\n').map(row => row.split(','));
        const headers = rows[0].map(h => h.trim());
        
        const parsed = rows.slice(1)
          .filter(row => row.length === headers.length)
          .map(row => {
            const obj = {};
            headers.forEach((h, i) => obj[h] = row[i] ? row[i].trim() : "");
            return obj;
          });
        
        setCostsData(parsed);
      };
      reader.readAsText(file);
    }
  };
  const handleZipUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setZipFile(file);
      addLog(`Fichier ZIP d'images sélectionné : ${file.name}`);
    }
  };
  const startImport = async () => {
    setImporting(true);
    setLogs([]);
    
    const createdDevicesMap = {};

    try {
      addLog("Initialisation de la session GLPI...");
      
      addLog("Création des groupes...");
      const groupMap = {};
      await Promise.all(devicesData.locations.map(async (loc) => {
        const res = await createGlpiGroup(loc);
        groupMap[loc] = res.id;
      }));

      addLog("Création des fabricants...");
      const manufacturerMap = {};
      await Promise.all(devicesData.manufacturers.map(async (m) => {
        const res = await createGlpiManufacturer(m);
        manufacturerMap[m] = res.id;
      }));

      addLog("Création des statuts...");
      const statusMap = {};
      await Promise.all(devicesData.statuses.map(async (s) => {
        const res = await createGlpiCustomStatus(s);
        statusMap[s] = res.id;
      }));

      addLog("Vérification et création des utilisateurs uniques...");
      const userMap = {};
      const linkedUserGroups = new Set();
      const uniqueUsersList = [];
      const seenUserFields = new Set();

      for (const type in devicesData.devicesByType) {
        for (const device of devicesData.devicesByType[type]) {
          const userName = device.userEmailOrName;
          const locationGroup = device.locationName;
          if (!userName) continue;

          const uniqueKey = `${userName}||${locationGroup}`;
          if (!seenUserFields.has(uniqueKey)) {
            seenUserFields.add(uniqueKey);
            uniqueUsersList.push({ userName, locationGroup });
          }
        }
      }

      for (const userItem of uniqueUsersList) {
        const { userName, locationGroup } = userItem;
        try {
          let userId = userMap[userName];
          if (!userId) {
            userId = await getGlpiUserId(userName);
            if (!userId || userId === 0) {
              addLog(`👤 Utilisateur inconnu. Tentative de création pour : ${userName}...`);
              const newUserRes = await createGlpiUser(userName);
              if (newUserRes && newUserRes.id) {
                userId = newUserRes.id;
                await addUserProfileAndEntity(userId, 2, 0);
                addLog(`   -> Créé et activé dans l'Entité Racine (ID GLPI: ${userId})`);
              } else {
                throw new Error("L'API GLPI n'a pas renvoyé d'ID valide lors de la création.");
              }
            } else {
              addLog(`🔍 Utilisateur existant trouvé dans GLPI : ${userName} (ID: ${userId})`);
            }
            userMap[userName] = userId;
          }

          const matchedGroupId = groupMap[locationGroup];
          if (userId && matchedGroupId) {
            const relationKey = `${userId}-${matchedGroupId}`;
            if (!linkedUserGroups.has(relationKey)) {
              await linkUserToGroup(userId, matchedGroupId);
              linkedUserGroups.add(relationKey);
              addLog(`   -> Associé au groupe : ${locationGroup}`);
            }
          }
        } catch (userErr) {
          addLog(`⚠️ Échec sur l'utilisateur ${userName} : ${userErr.message}`);
        }
      }

      addLog("Création des modèles...");
      const modelMap = {};
      for (const type in devicesData.devicesByType) {
        const uniqueModelsForType = [...new Set(devicesData.devicesByType[type].map(d => d.modelName))];
        await Promise.all(uniqueModelsForType.map(async (mName) => {
          if(!mName) return;
          const modelType = `${type}Model`;
          const res = await createGlpiModel(modelType, mName);
          modelMap[`${type}_${mName}`] = res.id;
        }));
      }

      addLog("Création des équipements...");
      for (const type in devicesData.devicesByType) {
        await Promise.all(devicesData.devicesByType[type].map(async (device) => {
          const details = {
            name: device.name,
            statusId: statusMap[device.statusName],
            groupId: groupMap[device.locationName],
            manufacturerId: manufacturerMap[device.manufacturerName],
            modelId: modelMap[`${type}_${device.modelName}`],
            inventoryNumber: device.inventoryNumber,
            userId: userMap[device.userEmailOrName] || 0 
          };
          
          const res = await createDetailedGlpiItem(type, details);
          if (res && res.id) {
            const glpiCorrectType = type.charAt(0).toUpperCase() + type.slice(1);
            createdDevicesMap[device.name] = { id: res.id, type: glpiCorrectType };
          }
        }));
      }
      if (zipFile && Object.keys(createdDevicesMap).length > 0) {
        addLog(`Désarchivage et traitement des images depuis : ${zipFile.name}...`);
        try {
          const zip = new JSZip();
          const jsonContent = await zip.loadAsync(zipFile);
          
          // Filtrer uniquement les extensions d'images en évitant les sous-dossiers vides
          const imageFiles = Object.keys(jsonContent.files).filter(fileName => {
            const isFolder = jsonContent.files[fileName].dir;
            const isImage = /\.(jpe?g|png)$/i.test(fileName);
            return !isFolder && isImage;
          });

          addLog(`${imageFiles.length} image(s) détectée(s) dans le ZIP.`);

          for (const filePath of imageFiles) {
            const fileNameWithExt = filePath.split('/').pop();
            const assetKey = fileNameWithExt.replace(/\.[^/.]+$/, "").trim(); // ex: "PC-ADM-001"

            const matchedAsset = createdDevicesMap[assetKey];

            if (!matchedAsset) {
              addLog(`   ⚠️ Image ignorée : ${fileNameWithExt} (Aucun matériel nommé "${assetKey}" trouvé)`);
              continue;
            }

            const fileData = await zip.files[filePath].async('blob');
            const imageBlob = new File([fileData], fileNameWithExt, { type: fileData.type });

            const uploadRes = await uploadGlpiDocument(imageBlob, fileNameWithExt);

            if (uploadRes && uploadRes.id) {
              await linkDocumentToItem(uploadRes.id, matchedAsset.type, matchedAsset.id);
              addLog(`   -> Image ${fileNameWithExt} liée à l'équipement : ${assetKey}`);
            }
          }
        } catch (zipErr) {
          addLog(`⚠️ Échec de l'importation des images ZIP : ${zipErr.message}`);
          console.error(zipErr);
        }
      }
   // =========================================================
      // 2. IMPORTATION ET LIAISON DES TICKETS AVEC DOSSIER COÛTS
      // =========================================================
      if (ticketData && ticketData.length > 0) {
        addLog(`Traitement de ${ticketData.length} ticket(s) avec analyse des coûts...`);

        // Indexation propre et sans espaces des coûts
        const costsMapByTicketNum = {};
        costsData.forEach(item => {
          // On cherche toutes les variantes possibles de clé pour le numéro de ticket
          const numTicketKey = item.Num_Ticket || item.num_ticket || item.Num_ticket;
          if (numTicketKey) {
            costsMapByTicketNum[String(numTicketKey).trim()] = item;
          }
        });

        for (const ticket of ticketData) {
          try {
            // 🔍 NORMALISATION DES CLÉS DU CSV TICKETS (Accepte les majuscules et minuscules)
            const csvRef = String(ticket.Ref_Ticket || ticket.refTicket || ticket.Ref_ticket || ticket.id || "").trim();
            const csvDate = String(ticket.Date || ticket.date || "").trim();
            const csvTime = String(ticket.Heure || ticket.time || ticket.heure || "").trim();
            const csvTitle = ticket.Titre || ticket.title || ticket.Titre_Ticket || "";
            const csvDesc = ticket.Description || ticket.description || "";
            const csvType = ticket.Type || ticket.type || "Incident";
            const csvPriority = ticket.Priority || ticket.priority || "Medium";
            const csvStatus = ticket.Status || ticket.status || "New";

            // Si on n'a pas de référence de ticket, impossible de faire la liaison
            if (!csvRef || csvRef === "undefined" || csvRef === "") {
              console.warn("Ticket sauté car Ref_Ticket introuvable dans la ligne :", ticket);
              continue; 
            }

            // Formatage de la date GLPI (JJ/MM/AAAA -> AAAA-MM-JJ)
            const [day, month, year] = csvDate.split('/');
            const formattedDate = `${year}-${month}-${day}`;
            let formattedTime = csvTime;
            if (csvTime.split(':').length === 2) {
              formattedTime = `${csvTime}:00`; 
            }
            const finalGlpiDateTime = `${formattedDate} ${formattedTime}`;

            // Récupération des données du 3ème CSV via la clé normalisée
            const matchedCostRow = costsMapByTicketNum[csvRef];

            const parseCsvNumber = (val) => {
              if (!val) return 0;
              return parseFloat(String(val).replace(',', '.').trim());
            };

            let durationSeconds = 0;
            let costTime = 0;
            let costFixed = 0;

            if (matchedCostRow) {
              // Extraction des durées et coûts du 3ème CSV (avec fallbacks de clés)
              durationSeconds = parseInt(matchedCostRow.Duration_second || matchedCostRow.duration_second || 0, 10);
              costTime = parseCsvNumber(matchedCostRow.secondTime_Cost || matchedCostRow.Time_Cost || matchedCostRow.time_cost);
              costFixed = parseCsvNumber(matchedCostRow.CostFixed || matchedCostRow.cost_fixed || matchedCostRow.Fixed_Cost);
            } else {
              console.warn(`[Liaison Coûts] Aucune correspondance financière trouvée pour la Ref_Ticket : ${csvRef}`);
            }

            // Étape A : Création du ticket principal (transmet bien duration et externalRef)
            const ticketRes = await createGlpiTicket({
              title: csvTitle,
              description: csvDesc,
              type: csvType,
              priority: csvPriority,
              status: csvStatus,
              fullDateTime: finalGlpiDateTime,
              duration: durationSeconds, 
              externalRef: csvRef
            });

            const newTicketId = ticketRes.id;

              await updateTicketExternalId(newTicketId, csvRef);
            
            
            if (newTicketId) {
              addLog(`Ticket #${newTicketId} créé avec succès (Ref CSV: ${csvRef}) | Durée: ${durationSeconds}s`);

              // Étape B : Injection des coûts dans l'endpoint TicketCost si des montants existent
              if (costFixed > 0 || costTime > 0) {
                const costRes = await addGlpiTicketCost(newTicketId, costFixed, costTime);
                console.log(`[GLPI API] Réponse création coût pour Ticket #${newTicketId}:`, costRes);
                addLog(`   -> Coûts associés | Fixe: ${costFixed} MGA | Temps: ${costTime} MGA`);
              }

              // Étape C : Liaison des équipements (Gestion du tableau ou de la String JSON)
              let itemsArray = [];
              const rawItems = ticket.Items1 || ticket.items || ticket.Items;
              
              if (rawItems) {
                if (typeof rawItems === 'string') {
                  try {
                    itemsArray = JSON.parse(rawItems);
                  } catch {
                    // Nettoyage au cas où les guillemets ou crochets foirent dans le CSV brut
                    itemsArray = rawItems.split(',').map(i => i.replace(/["'[\]]/g, '').trim());
                  }
                } else if (Array.isArray(rawItems)) {
                  itemsArray = rawItems;
                }
              }

              if (itemsArray.length > 0) {
                for (const itemName of itemsArray) {
                  const matchedDevice = createdDevicesMap[itemName];
                  if (matchedDevice) {
                    await linkItemToTicket(newTicketId, matchedDevice.type, matchedDevice.id);
                    addLog(`   -> Équipement lié : ${itemName} (${matchedDevice.type})`);
                  } else {
                    addLog(`   ⚠️ Équipement "${itemName}" introuvable dans le parc.`);
                  }
                }
              }
            } else {
              throw new Error("L'API GLPI n'a pas renvoyé d'ID de ticket valide.");
            }

          } catch (ticketError) {
            addLog(`❌ Erreur traitement ticket (Ligne CSV) : ${ticketError.message}`);
            console.error(ticketError);
          }
        }
      }
      addLog("🚀 Processus d'importation globale terminé avec succès !");
    } catch (error) {
      addLog(`ERREUR CRITIQUE GLOBALE : ${error.message}`);
      console.error(error);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
      <h2>Importateur GLPI Automatisé</h2>
      
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div style={{ flex: 1, padding: '15px', border: '1px solid #ddd', borderRadius: '4px' }}>
          <h4>1. Fichier du Parc (CSV)</h4>
          <input type="file" accept=".csv" onChange={handleDevicesUpload} disabled={importing} />
          {devicesData.statuses.length > 0 && (
            <p style={{ color: 'green', fontSize: '13px' }}>✅ Fichier parc chargé.</p>
          )}
        </div>

        <div style={{ flex: 1, padding: '15px', border: '1px solid #ddd', borderRadius: '4px' }}>
          <h4>2. Fichier des Tickets (CSV)</h4>
          <input type="file" accept=".csv" onChange={handleTicketsUpload} disabled={importing} />
          {ticketData.length > 0 && (
            <p style={{ color: 'green', fontSize: '13px' }}>✅ Fichier tickets chargé ({ticketData.length} lignes).</p>
          )}
        </div>

        <div style={{ flex: 1, padding: '15px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#fcfcfc' }}>
          <h4>3. Coûts & Durées (CSV)</h4>
          <input type="file" accept=".csv" onChange={handleCostsUpload} disabled={importing} />
          {costsData.length > 0 && (
            <p style={{ color: 'green', fontSize: '13px' }}>✅ {costsData.length} lignes financières prêtes.</p>
          )}
        </div>
        <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#fcfcfc' }}>
          <h4>4. Images Assets (ZIP)</h4>
          <input type="file" accept=".zip" onChange={handleZipUpload} disabled={importing} />
          {zipFile && (
            <p style={{ color: 'green', fontSize: '13px' }}>✅ Archive ZIP prête ({zipFile.name}).</p>
          )}
        </div>
      </div>
      
      {devicesData.statuses.length > 0 && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button 
            onClick={startImport} 
            disabled={importing}
            style={{ 
              padding: '12px 30px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: importing ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '15px'
            }}
          >
            {importing ? "Importation globale en cours..." : "Lancer l'importation complète"}
          </button>
        </div>
      )}

      <GlpiReset />

      <div style={{ marginTop: '20px', backgroundColor: '#1e1e1e', color: '#39ff14', padding: '15px', height: '300px', overflowY: 'auto', borderRadius: '4px', fontFamily: 'monospace' }}>
        <h4 style={{ color: 'white', marginTop: 0 }}>Console d'importation :</h4>
        <div>
          {logs.map((log, i) => <div key={i} style={{ fontSize: '12px', marginBottom: '4px' }}>{log}</div>)}
        </div>
      </div>
    </div>
  );
};

export default GlpiImporter;