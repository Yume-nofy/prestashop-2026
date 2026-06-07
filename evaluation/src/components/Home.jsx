// components/Home.js (ou le nom de ton choix)
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { initGlpiSession } from '../api/apiGlpi'; 
import { createGlpiCustomStatus, createGlpiStatus } from '../services/CrudService';
import GlpiReset from './GlpiReset';
const Home = () => {
  const navigate = useNavigate();
   
  const handleLogin = async () => {
    try {
      await initGlpiSession();
      navigate("/LoginBack");
    } catch (error) {
      console.error("Erreur lors de la connexion GLPI :", error);
    }
  };
  const handleFront =()=>{
    navigate("/testCsv");
  }

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <h2>Bienvenue</h2>
        <p>Veuillez vous connecter pour accéder à l'application.</p>
        <button onClick={handleLogin} style={styles.button}>
          Se connecter admin
        </button>
        <button onClick={handleFront} style={styles.button}>
          voir le frontOffice
        </button>
        
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'Arial' },
  loginBox: { padding: '20px', border: '1px solid #ccc', borderRadius: '5px', textAlign: 'center' },
  button: { padding: '10px 20px', backgroundColor: '#007BFF', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }
};

export default Home;