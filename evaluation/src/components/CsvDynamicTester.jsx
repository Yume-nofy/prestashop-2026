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
  addGlpiTicketCost, updateTicketExternalId,
  uploadGlpiDocument, 
  linkDocumentToItem
} from '../services/CrudService';
import { getGlpiUserId, createGlpiUser, linkUserToGroup } from '../services/testApi';

const CsvDynamicTester = () => {
  const { data: devicesData, parseFile: parseDevicesFile } = useCsvParser({ separator: ',' });
  const { ticketData, parseTicketFile } = useTicketCsvParser({ separator: ',' });
  const [zipFile, setZipFile] = useState(null);
  const [costsData, setCostsData] = useState([]);
  const [importing, setImporting] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (msg) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

  const handleDevicesUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      parseDevicesFile(file);
      addLog(`Fichier Parc chargé : ${file.name}`);
    }
  };

  const handleTicketsUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      parseTicketFile(file);
      addLog(`Fichier Tickets chargé : ${file.name}`);
    }
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
        addLog(`Fichier Coûts & Durées chargé : ${file.name}`);
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
              addLog(`Utilisateur inconnu. Tentative de création pour : ${userName}...`);
              const newUserRes = await createGlpiUser(userName);
              if (newUserRes && newUserRes.id) {
                userId = newUserRes.id;
                await addUserProfileAndEntity(userId, 2, 0);
                addLog(`   -> Créé et activé dans l'Entité Racine (ID GLPI: ${userId})`);
              } else {
                throw new Error("L'API GLPI n'a pas renvoyé d'ID valide lors de la création.");
              }
            } else {
              addLog(`Utilisateur existant trouvé dans GLPI : ${userName} (ID: ${userId})`);
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
          addLog(`Échec sur l'utilisateur ${userName} : ${userErr.message}`);
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
          
          const imageFiles = Object.keys(jsonContent.files).filter(fileName => {
            const isFolder = jsonContent.files[fileName].dir;
            const isImage = /\.(jpe?g|png)$/i.test(fileName);
            return !isFolder && isImage;
          });

          addLog(`${imageFiles.length} image(s) détectée(s) dans le ZIP.`);

          for (const filePath of imageFiles) {
            const fileNameWithExt = filePath.split('/').pop();
            const assetKey = fileNameWithExt.replace(/\.[^/.]+$/, "").trim();

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
          addLog(`Échec de l'importation des images ZIP : ${zipErr.message}`);
          console.error(zipErr);
        }
      }

      if (ticketData && ticketData.length > 0) {
        addLog(`Traitement de ${ticketData.length} ticket(s) avec analyse des coûts...`);

        const costsMapByTicketNum = {};
        costsData.forEach(item => {
          const numTicketKey = item.Num_Ticket || item.num_ticket || item.Num_ticket;
          if (numTicketKey) {
            costsMapByTicketNum[String(numTicketKey).trim()] = item;
          }
        });

        for (const ticket of ticketData) {
          try {
            const csvRef = String(ticket.Ref_Ticket || ticket.refTicket || ticket.Ref_ticket || ticket.id || "").trim();
            const csvDate = String(ticket.Date || ticket.date || "").trim();
            const csvTime = String(ticket.Heure || ticket.time || ticket.heure || "").trim();
            const csvTitle = ticket.Titre || ticket.title || ticket.Titre_Ticket || "";
            const csvDesc = ticket.Description || ticket.description || "";
            const csvType = ticket.Type || ticket.type || "Incident";
            const csvPriority = ticket.Priority || ticket.priority || "Medium";
            const csvStatus = ticket.Status || ticket.status || "New";

            if (!csvRef || csvRef === "undefined" || csvRef === "") {
              continue; 
            }

            const [day, month, year] = csvDate.split('/');
            const formattedDate = `${year}-${month}-${day}`;
            let formattedTime = csvTime;
            if (csvTime.split(':').length === 2) {
              formattedTime = `${csvTime}:00`; 
            }
            const finalGlpiDateTime = `${formattedDate} ${formattedTime}`;

            const matchedCostRow = costsMapByTicketNum[csvRef];

            const parseCsvNumber = (val) => {
              if (!val) return 0;
              return parseFloat(String(val).replace(',', '.').trim());
            };

            let durationSeconds = 0;
            let costTime = 0;
            let costFixed = 0;

            if (matchedCostRow) {
              durationSeconds = parseInt(matchedCostRow.Duration_second || matchedCostRow.duration_second || 0, 10);
              costTime = parseCsvNumber(matchedCostRow.secondTime_Cost || matchedCostRow.Time_Cost || matchedCostRow.time_cost);
              costFixed = parseCsvNumber(matchedCostRow.CostFixed || matchedCostRow.cost_fixed || matchedCostRow.Fixed_Cost);
            }

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
              addLog(`Ticket #${newTicketId} créé (Ref CSV: ${csvRef}) | Durée: ${durationSeconds}s`);

              if (costFixed > 0 || costTime > 0) {
                await addGlpiTicketCost(newTicketId, costFixed, costTime);
                addLog(`   -> Coûts associés | Fixe: ${costFixed} MGA | Temps: ${costTime} MGA`);
              }

              let itemsArray = [];
              const rawItems = ticket.Items1 || ticket.items || ticket.Items;
              
              if (rawItems) {
                if (typeof rawItems === 'string') {
                  try {
                    itemsArray = JSON.parse(rawItems);
                  } catch {
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
                    addLog(`   -> Matériel "${itemName}" absent du parc.`);
                  }
                }
              }
            }

          } catch (ticketError) {
            addLog(`Erreur traitement ligne ticket : ${ticketError.message}`);
          }
        }
      }
      addLog("Processus d'importation globale terminé avec succès !");
    } catch (error) {
      addLog(`ERREUR CRITIQUE GLOBALE : ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.mainTitle}>Importation de Données Intégrales</h2>
        <p style={styles.subtitle}>Sélectionnez les fichiers CSV du contenu (Contenu Import-data-juin-26) ainsi que l'archive ZIP des images associées.</p>
      </div>

      <div style={styles.grid}>
        {/* Fichier 1 */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>1. Structure & Parc informatique</div>
          <div style={styles.inputWrapper}>
            <input type="file" accept=".csv" onChange={handleDevicesUpload} disabled={importing} style={styles.fileInput} id="file-parc"/>
            <label htmlFor="file-parc" style={styles.fileLabel}>Choisir un fichier CSV</label>
            {devicesData?.statuses?.length > 0 && <div style={styles.badgeSuccess}>Fichier prêt</div>}
          </div>
        </div>

        {/* Fichier 2 */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>2. Registre des Tickets d'Assistance</div>
          <div style={styles.inputWrapper}>
            <input type="file" accept=".csv" onChange={handleTicketsUpload} disabled={importing} style={styles.fileInput} id="file-tickets"/>
            <label htmlFor="file-tickets" style={styles.fileLabel}>Choisir un fichier CSV</label>
            {ticketData?.length > 0 && <div style={styles.badgeSuccess}>{ticketData.length} tickets chargés</div>}
          </div>
        </div>

        {/* Fichier 3 */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>3. Grille de Tarification & Coûts</div>
          <div style={styles.inputWrapper}>
            <input type="file" accept=".csv" onChange={handleCostsUpload} disabled={importing} style={styles.fileInput} id="file-costs"/>
            <label htmlFor="file-costs" style={styles.fileLabel}>Choisir un fichier CSV</label>
            {costsData?.length > 0 && <div style={styles.badgeSuccess}>{costsData.length} lignes financières</div>}
          </div>
        </div>

        {/* Fichier 4 */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>4. Album d'Images des Équipements</div>
          <div style={styles.inputWrapper}>
            <input type="file" accept=".zip" onChange={handleZipUpload} disabled={importing} style={styles.fileInput} id="file-zip"/>
            <label htmlFor="file-zip" style={styles.fileLabel}>Choisir une archive ZIP</label>
            {zipFile && <div style={styles.badgeSuccess}>Archive ZIP validée</div>}
          </div>
        </div>
      </div>

      {devicesData?.statuses?.length > 0 && (
        <div style={styles.actionSection}>
          <button onClick={startImport} disabled={importing} style={importing ? styles.btnDisabled : styles.btnActive}>
            {importing ? "Exécution du traitement de masse..." : "Déclencher l'injection globale"}
          </button>
        </div>
      )}

      <div style={styles.terminalContainer}>
        <div style={styles.terminalHeader}>Flux d'exécution de l'analyseur :</div>
        <div style={styles.terminalContent}>
          {logs.length === 0 ? (
            <div style={styles.emptyLog}>Aucun traitement en cours. En attente de fichiers d'entrée.</div>
          ) : (
            logs.map((log, i) => <div key={i} style={styles.logLine}>{log}</div>)
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: { backgroundColor: '#121212', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif', minHeight: '100vh' },
  header: { marginBottom: '32px' },
  mainTitle: { fontSize: '24px', fontWeight: '700', color: '#00d2ff', margin: '0 0 8px 0' },
  subtitle: { fontSize: '14px', color: '#cbd5e1', margin: 0 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' },
  card: { backgroundColor: '#1e1e1e', border: '1px solid #334155', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' },
  cardHeader: { fontSize: '14px', fontWeight: '600', color: '#cbd5e1', borderBottom: '1px solid #334155', paddingBottom: '10px' },
  inputWrapper: { display: 'flex', flexDirection: 'column', gap: '10px' },
  fileInput: { display: 'none' },
  fileLabel: { display: 'block', textAlign: 'center', backgroundColor: 'transparent', border: '1px solid #334155', color: '#00d2ff', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' },
  badgeSuccess: { backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', textAlign: 'center', fontWeight: '600' },
  actionSection: { display: 'flex', justifyContent: 'center', marginBottom: '32px' },
  btnActive: { backgroundColor: '#00d2ff', color: '#121212', border: 'none', padding: '14px 40px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '15px', transition: 'background 0.2s' },
  btnDisabled: { backgroundColor: '#1e293b', color: '#64748b', border: '1px solid #334155', padding: '14px 40px', borderRadius: '6px', cursor: 'not-allowed', fontWeight: '700', fontSize: '15px' },
  terminalContainer: { backgroundColor: '#121212', border: '1px solid #334155', borderRadius: '8px', padding: '20px', fontFamily: 'Consolas, Monaco, monospace' },
  terminalHeader: { fontSize: '13px', fontWeight: '600', color: '#00d2ff', textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.5px' },
  terminalContent: { height: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' },
  emptyLog: { color: '#64748b', fontSize: '13px', fontStyle: 'italic' },
  logLine: { fontSize: '13px', color: '#cbd5e1', borderLeft: '2px solid #334155', paddingLeft: '8px', lineHeight: '1.4' }
};

export default CsvDynamicTester;