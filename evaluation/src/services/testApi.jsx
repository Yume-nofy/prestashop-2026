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
export const deleteUser = async(id)=>{
  try{
      const idUser=id;
      await apiGlpi(`User/${idUser}?force_purge=1`, {
      method: 'DELETE'
    });
    }catch(error){
      console.log(error);
      throw error;
    }
};