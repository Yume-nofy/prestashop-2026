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
    const response = await apiGlpi(itemType, { method: 'GET' });
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