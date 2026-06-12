import { apiGlpi } from "../api/apiGlpi";
export const createGlpiGroup = async (groupName) => {
  try {
    const payload = {
      input: {
        name: groupName
      }
    };

    const response = await apiGlpi('Group', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    return response;
  } catch (error) {
    console.error("Erreur lors de la création du groupe GLPI :", error);
    throw error;
  }
};
export const getGlpiGroups = async () => {
  try {
    const groups = await apiGlpi('Group', {
      method: 'GET'
    });
    return groups;
  } catch (error) {
    console.error("Erreur lors de la récupération des groupes GLPI :", error);
    throw error;
  }
};
export const deleteGlpiGroup = async (groupId) => {
  try {
    const payload = {
      input: {
        id: Number(groupId) 
      }
    };

    const response = await apiGlpi('Group', {
      method: 'DELETE',
      body: JSON.stringify(payload)
    });

    return response;
  } catch (error) {
    console.error(`Erreur lors de la suppression du groupe ${groupId} :`, error);
    throw error;
  }
};
export const getGlpiManufacturers = async () => {
  try {
    const manufacturers = await apiGlpi('Manufacturer', {
      method: 'GET'
    });
    return manufacturers;
  } catch (error) {
    console.error("Erreur lors de la récupération des fabricants GLPI :", error);
    throw error;
  }
};
export const createGlpiManufacturer = async (manufacturerName) => {
  try {
    const payload = {
      input: {
        name: manufacturerName
      }
    };

    const response = await apiGlpi('Manufacturer', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    return response;
  } catch (error) {
    console.error("Erreur lors de la création du fabricant GLPI :", error);
    throw error;
  }
};
export const deleteGlpiManufacturer = async (manufacturerId) => {
  try {
    const payload = {
      input: {
        id: Number(manufacturerId)
      }
    };

    const response = await apiGlpi('Manufacturer', {
      method: 'DELETE',
      body: JSON.stringify(payload)
    });

    return response;
  } catch (error) {
    console.error(`Erreur lors de la suppression du fabricant ${manufacturerId} :`, error);
    throw error;
  }
};
export const getGlpiModels = async (modelType) => {
  try {
    const response = await apiGlpi(modelType, { method: 'GET' });
    return response;
  } catch (error) {
    console.error(`Erreur GET sur le modèle ${modelType} :`, error);
    throw error;
  }
};
export const createGlpiModel = async (modelType, name) => {
  try {
    const payload = {
      input: {
        name: name
      }
    };

    const response = await apiGlpi(modelType, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    return response;
  } catch (error) {
    console.error(`Erreur POST sur le modèle ${modelType} :`, error);
    throw error;
  }
};
export const deleteGlpiModel = async (modelType, id) => {
  try {
    const payload = {
      input: {
        id: Number(id)
      }
    };

    const response = await apiGlpi(modelType, {
      method: 'DELETE',
      body: JSON.stringify(payload)
    });

    return response;
  } catch (error) {
    console.error(`Erreur DELETE sur le modèle ${modelType} pour l'ID ${id} :`, error);
    throw error;
  }
};
export const getGlpiStatuses = async (statusType) => {
  try {
    const response = await apiGlpi(statusType, { method: 'GET' });
    return response;
  } catch (error) {
    console.error(`Erreur GET sur le statut ${statusType} :`, error);
    throw error;
  }
};
export const createGlpiStatus = async (statusType, name) => {
  try {
    const payload = {
      input: {
        name: name
      }
    };

    const response = await apiGlpi(statusType, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    return response;
  } catch (error) {
    console.error(`Erreur POST sur le statut ${statusType} :`, error);
    throw error;
  }
};
export const deleteGlpiStatus = async (statusType, id) => {
  try {
    const payload = {
      input: {
        id: Number(id)
      }
    };

    const response = await apiGlpi(statusType, {
      method: 'DELETE',
      body: JSON.stringify(payload)
    });

    return response;
  } catch (error) {
    console.error(`Erreur DELETE sur le statut ${statusType} pour l'ID ${id} :`, error);
    throw error;
  }
};
export const getGlpiItems = async (itemType) => {
  try {
    const response = await apiGlpi(`${itemType}?range=0-500`, { method: 'GET' });
    return response;
  } catch (error) {
    console.error(`Erreur GET sur le matériel ${itemType} :`, error);
    throw error;
  }
};

export const deleteGlpiItem = async (itemType, id) => {
  try {
    const payload = {
      input: {
        id: Number(id)
      }
    };

    const response = await apiGlpi(itemType, {
      method: 'DELETE',
      body: JSON.stringify(payload)
    });

    return response;
  } catch (error) {
    console.error(`Erreur DELETE sur le matériel ${itemType} pour l'ID ${id} :`, error);
    throw error;
  }
};
export const createDetailedGlpiItem = async (itemType, details) => {
  try {
    const payload = {
      input: {
        name: details.name,
        states_id: details.statusId || 0,
        groups_id: details.groupId || 0,
        manufacturers_id: details.manufacturerId || 0,
        [`${itemType.toLowerCase()}models_id`]: details.modelId || 0,
        otherserial: details.inventoryNumber || "", 
        users_id: details.userId || 0
      }
    };

    const response = await apiGlpi(itemType, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    return response;
  } catch (error) {
    console.error(`Erreur lors de la création détaillée de ${itemType} :`, error);
    throw error;
  }
};
export const getDetailedGlpiItems = async (itemType) => {
  try {
    const response = await apiGlpi(itemType, { method: 'GET' });
    return response;
  } catch (error) {
    console.error(`Erreur lors de la récupération de ${itemType} :`, error);
    throw error;
  }
};
export const createGlpiCustomStatus = async (statusName, options = {}) => {
  try {
    const payload = {
      input: {
        name: statusName,
        // 1 = Oui, 0 = Non. Par défaut, on peut les mettre à 1 pour qu'ils soient partout.
        is_visible_computer: options.isComputer !== false ? 1 : 0,
        is_visible_monitor: options.isMonitor !== false ? 1 : 0,
        is_visible_peripheral: options.isPeripheral !== false ? 1 : 0,
        is_visible_phone: options.isPhone !== false ? 1 : 0,
        is_visible_networkequipment: options.isNetwork !== false ? 1 : 0,
      }
    };

    const response = await apiGlpi('State', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    return response; 
  } catch (error) {
    console.error("Erreur lors de la création du statut global :", error);
    throw error;
  }
};
export const linkItemToTicket = async (ticketId, itemType, itemId) => {
  try {
    const payload = {
      input: [
        {
          tickets_id: parseInt(ticketId, 10),
          itemtype: itemType,
          items_id: parseInt(itemId, 10)
        }
      ]
    };

    return await apiGlpi('Item_Ticket', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error(`Erreur liaison ticket ${ticketId} avec ${itemType} ID ${itemId} :`, error);
  }
};
export const deleteGlpiTicket = async (ticketId) => {
  try {
    const payload = {
      input: {
        id: Number(ticketId),
        force_purge: true // Pour nettoyer proprement lors du reset
      }
    };

    return await apiGlpi('Ticket', {
      method: 'DELETE',
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error(`Erreur lors de la suppression du ticket ${ticketId} :`, error);
    throw error;
  }
};
// =========================================================
// CRÉATION DE TICKET (AVEC ID EXTERNE & DURÉE)
// =========================================================
export const createGlpiTicket = async (ticketDetails) => {
  try {
    const priorities = { low: 2, medium: 3, high: 4, urgent: 5 };
    const types = { incident: 1, request: 2, demande: 2 };
    
    const statuses = { 
      new: 1, incoming: 1, nouveau: 1,
      processing: 2, assigned: 2, encours: 2,inprogress:2,
      planned: 3, planifie: 3,
      pending: 4, enattente: 4,
      solved: 5, resolu: 5,
      closed: 6, clos: 6
    };

    const csvType = String(ticketDetails.type).toLowerCase();
    const csvPriority = String(ticketDetails.priority).toLowerCase();
    const csvStatus = String(ticketDetails.status).toLowerCase().replace(/\s+/g, '');
    
    const payload = {
      input: {
        name: ticketDetails.title,
        content: ticketDetails.description,
        type: types[csvType] || 1,         
        priority: priorities[csvPriority] || 3, 
        status: statuses[csvStatus] || 1,     
        date: ticketDetails.fullDateTime,
        actiontime: ticketDetails.duration || 0,
        externalid: String(ticketDetails.externalRef || "").trim()
      }
    };
    console.log("json:",payload);
    console.log("external_id: "+String(ticketDetails.externalRef || "").trim());
    const response = await apiGlpi('Ticket', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    return response; 
  } catch (error) {
    console.error("Erreur lors de la création du ticket GLPI :", error);
    throw error;
  }
};
export const updateTicketExternalId = async (ticketId, externalId) => {
  return await apiGlpi(`Ticket/${ticketId}`, {
    method: 'PUT',
    body: JSON.stringify({
      input: {
        external_id: String(externalId)
      }
    })
  });
};
export const addGlpiTicketCost = async (ticketId, fixedCost, timeCost, duration = 0) => {
  try {
    const payload = {
      input: {
        tickets_id: Number(ticketId),
        name: "Coût analytique d'importation",
        cost_fixed: parseFloat(fixedCost) || 0,
        cost_time: parseFloat(timeCost) || 0,
        actiontime: parseInt(duration, 10) || 0
      }
    };

    return await apiGlpi('TicketCost', {
      method: 'POST',
      body: JSON.stringify(payload) 
    });
    
  } catch (error) {
    console.error(`Impossible d'ajouter le coût au ticket #${ticketId}:`, error);
  }
};
export const purgeAllGlpiTickets = async (onProgressLog) => {
  try {
    let totalPurged = 0;
    let hasMoreTickets = true;

    while (hasMoreTickets) {
      const response = await apiGlpi('Ticket?range=0-500', {
        method: 'GET'
      });

      if (!response || !Array.isArray(response) || response.length === 0) {
        hasMoreTickets = false;
        break;
      }

      if (onProgressLog) {
        onProgressLog(`Purger un bloc de ${response.length} tickets...`);
      }

      for (const ticket of response) {
        if (!ticket.id) continue;

        await apiGlpi(`Ticket/${ticket.id}`, { method: 'DELETE' });
        await apiGlpi(`Ticket/${ticket.id}?force_purge=true`, { method: 'DELETE' });

        totalPurged++;
      }

      await new Promise(resolve => setTimeout(resolve, 50));
    }

    return { success: true, count: totalPurged };
  } catch (error) {
    console.error("Erreur lors de la purge massive des tickets GLPI :", error);
    throw error;
  }
};

export const addUserProfileAndEntity = async (userId, profileId = 1, entityId = 0) => {
  try {
    const payload = {
      input: {
        users_id: userId,
        profiles_id: profileId, 
        entities_id: entityId,   
        is_recursive: 1
      }
    };

    return await apiGlpi('Profile_User', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error(`Erreur d'affectation de profil/entité pour l'user ${userId}:`, error);
  }
};
export const uploadGlpiDocument = async (fileBlob, fileName) => {
  try {
    const formData = new FormData();
    
    const uploadManifest = {
      input: {
        name: fileName,
        filename: fileName
      }
    };
    
    formData.append('uploadManifest', JSON.stringify(uploadManifest));
    formData.append('filename[]', fileBlob, fileName);

    const response = await apiGlpi('Document', {
      method: 'POST',
      body: formData,
      isFormData: true 
    });

    return response; // Retourne { id: X, message: "..." }
  } catch (error) {
    console.error(`Erreur lors de l'upload du document ${fileName} :`, error);
    throw error;
  }
};

export const linkDocumentToItem = async (documentId, itemType, itemId) => {
  try {
    const payload = {
      input: {
        documents_id: Number(documentId),
        itemtype: itemType, // ex: "Computer", "Monitor"
        items_id: Number(itemId),
        is_recursive: 1
      }
    };

    return await apiGlpi('Document_Item', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error(`Erreur de liaison document ${documentId} avec ${itemType} #${itemId}:`, error);
  }
};
export const fetchGlpiItems = async (itemType) => {
  return await apiGlpi(`${itemType}?range=0-1000`);
};
export const fetchGlpiDocumentItems = async () => {
  return await apiGlpi('Document_Item');
};
export const getGlpiDocumentDownloadUrl = (documentId) => {
  const sessionToken = localStorage.getItem('glpi_session_token');
  const appToken = "wEcFt3X7Ce1rXnwb3mMDi132vcLDmLbDQ8yeLJAH"; 
  
  return `http://glpi.localhost/apirest.php/Document/${documentId}/Base64?app_token=${appToken}&session_token=${sessionToken}`;
};
export const fetchGlpiDocumentImage = async (documentId) => {
  try {
    const sessionToken = localStorage.getItem('glpi_session_token');
    const appToken = "wEcFt3X7Ce1rXnwb3mMDi132vcLDmLbDQ8yeLJAH"; 

    const url = `http://glpi.localhost/apirest.php/Document/${documentId}?app_token=${appToken}&alt=media`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Session-Token': sessionToken
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération du média : ${response.status}`);
    }

    const imageBlob = await response.blob();
    
    return URL.createObjectURL(imageBlob);
  } catch (error) {
    console.error(`Impossible de charger l'image du document ${documentId}:`, error);
    return null;
  }
};
export const fetchGlpiTickets = async () => {
  return await apiGlpi('Ticket');
};
export const fetchGlpiTicketDetails = async (ticketId) => {
  return await apiGlpi(`Ticket/${ticketId}`);
};
export const fetchItemsLinkedToTicket = async (ticketId) => {
  return await apiGlpi(`Item_Ticket?items_id=${ticketId}`);
};
export const fetchTicketCosts = async (ticketId) => {
  return await apiGlpi(`TicketCost?tickets_id=${ticketId}`);
};
export const deleteGlpiDocumentItem = async (id) => {
  return await apiGlpi(`Document_Item/${id}`, { method: 'DELETE' });
};
export const getGlpiDocuments = async () => {
  return await apiGlpi('Document');
};

export const deleteGlpiDocument = async (id) => {
  return await apiGlpi(`Document/${id}`, { method: 'DELETE' });
};
export const updateGlpiTicketStatus = async (ticketId, statusId) => {
  try {
    const payload = {
      input: {
        id: Number(ticketId),
        status: Number(statusId)
      }
    };

    const response = await apiGlpi(`Ticket/${ticketId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    return response;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du statut pour le ticket #${ticketId} :`, error);
    throw error;
  }
};
export const getGlpiDocumentItems = async () => {
  return await apiGlpi('Document_Item');
};
export const getGlpiUsersByGroup = async () => {
  try {
    const response = await apiGlpi('Group_User?expand_dropdowns=true&range=0-1000', {
      method: 'GET'
    });
    return response;
  } catch (error) {
    console.error("Erreur lors de la récupération des liaisons Group_User :", error);
    throw error;
  }
};