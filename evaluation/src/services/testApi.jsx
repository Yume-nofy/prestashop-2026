import { apiGlpi } from "../api/apiGlpi";
/**
 * Récupère la liste des utilisateurs depuis GLPI
 * Endpoint GLPI : /User
 */
export const getGlpiUsers = async () => {
  try {
    // Par défaut, GLPI limite le nombre de résultats (ex: 20). 
    // Tu peux ajouter des paramètres comme ?expand_dropdowns=true ou ?range=0-50
    const users = await apiGlpi('User?range=0-20');
    return users;
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs GLPI :", error);
    throw error;
  }
};
export const addUser = async({formdata}) =>{
  try{
      await apiGlpi('User', {
  method: 'POST',
  body: JSON.stringify({ input: formdata })
});
  }catch(error){
    console.log(error);
    throw error;
  }
};
export const deleteUser = async (id) => {
  try {
    const response = await apiGlpi(`User/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({
        force_purge: true
      })
    });

    return response;
  } catch (error) {
    console.error(`Erreur suppression user ${id}:`, error);
    throw error;
  }
};
export const getGlpiUserId = async (userFullName) => {
  try {
    if (!userFullName) return 0;

    const [lastName, firstName] = userFullName.split(' ');

    const query = `User?criteria[0][field]=2&criteria[0][searchtype]=contains&criteria[0][value]=${lastName}
                   &criteria[1][link]=AND
                   &criteria[1][field]=34&criteria[1][searchtype]=contains&criteria[1][value]=${firstName}`;

    const response = await apiGlpi(query, { method: 'GET' });

    if (response?.data?.length > 0) {
      return response.data[0].id;
    }

    return 0;
  } catch (error) {
    console.error(error);
    return 0;
  }
};
export const linkUserToGroup = async (userId, groupId) => {
  try {
    const payload = {
      input: {
        users_id: userId,
        groups_id: groupId
      }
    };

    return await apiGlpi('Group_User', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error(`Erreur lors de la liaison User ${userId} <-> Group ${groupId} :`, error);
  }
};
export const createGlpiUser = async (userNameOrEmail) => {
  try {
    const login = userNameOrEmail;
    
    const payload = {
      input: {
        name: login,
        realname: login,
        is_active: 1
      }
    };

    return await apiGlpi('User', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error(`Erreur lors de la création de l'utilisateur ${userNameOrEmail} :`, error);
    throw error;
  }
};