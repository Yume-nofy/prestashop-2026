import React, { useState, useEffect } from 'react';
import { deleteUser, getGlpiUsers } from '../services/testApi'; // Ajuste le chemin

const TestUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les utilisateurs au montage du composant
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await getGlpiUsers();
        
        // GLPI peut renvoyer les données directement dans un tableau 
        // ou encapsulées si tu utilises le paramètre 'range' (parfois un objet contenant la clé 'data')
        // On s'assure ici d'avoir un tableau
        const usersList = Array.isArray(data) ? data : (data.resources || []);
        // console.log(" hhh: ", usersList);        
        setUsers(usersList);
      } catch (err) {
        setError(err.message || "Impossible de charger les utilisateurs.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Affichage pendant le chargement
  if (loading) {
    return <div style={styles.center}>Chargement des utilisateurs GLPI...</div>;
  }

  // Affichage en cas d'erreur
  if (error) {
    return (
      <div style={{ ...styles.center, color: 'red' }}>
        <h3>Erreur détectée :</h3>
        <p>{error}</p>
        <p>Vérifie que la session GLPI est bien initialisée et active.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2>Test API GLPI : Liste des Utilisateurs</h2>
      <p style={styles.subtitle}>Total récupéré : {users.length}</p>

      {users.length === 0 ? (
        <p>Aucun utilisateur trouvé ou accès refusé.</p>
      ) : (
        <ul style={styles.list}>
          {users.map((user) => (
            <li key={user.id} style={styles.listItem}>
              <strong>{user.name || user.realname || 'Sans nom'}</strong> 
              <span style={styles.textMuted}> (ID: {user.id})</span>
              {user.email && <div style={styles.email}>{user.email}</div>}
            </li>
          ))}
        </ul>
      )}
      {/* <button onClick={()=>deleteUser(7)}>
        supprimer kiady
      </button> */}
    </div>
  );
};

// Styles rapides pour le composant de test
const styles = {
  container: { maxWidth: '600px', margin: '30px auto', fontFamily: 'Arial, sans-serif', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  subtitle: { color: '#666', fontStyle: 'italic' },
  center: { textAlign: 'center', marginTop: '50px', fontFamily: 'Arial, sans-serif' },
  list: { listStyleType: 'none', padding: 0 },
  listItem: { padding: '12px', borderBottom: '1px solid #eee', backgroundColor: '#fdfdfd', marginBottom: '5px', borderRadius: '4px' },
  textMuted: { color: '#888', fontSize: '0.85rem' },
  email: { fontSize: '0.9rem', color: '#007bff', marginTop: '4px' }
};

export default TestUsers;