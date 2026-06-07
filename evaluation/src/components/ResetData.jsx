import React from 'react';
import GlpiReset from './GlpiReset';

const ResetData = () => {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.titleRow}>
          <div>
            <div style={styles.title}>Administration - Réinitialisation</div>
            <div style={styles.subtitle}>Espace de confirmation pour remettre l'application à zéro.</div>
          </div>
        </div>

        <div style={styles.confirmBox}>
          <div style={styles.confirmText}>
            Cette action purge proprement l'ensemble des données structurelles, les tickets, les liaisons matérielles ainsi que les utilisateurs configurés via l'API.
          </div>
        </div>

        <div style={styles.actionWrap}>
          <GlpiReset />
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: 'calc(100vh - 60px)',
    padding: '28px 18px',
    background: 'linear-gradient(180deg, #121212 0%, #1e1e1e 100%)',
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
    color: '#f8fafc'
  },
  card: {
    maxWidth: '980px',
    margin: '0 auto',
    background: '#121212',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '22px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '18px',
    marginBottom: '18px'
  },
  title: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#00d2ff' // Accent bleu ciel professionnel appliqué au titre principal
  },
  subtitle: {
    marginTop: 6,
    fontSize: '13px',
    color: '#cbd5e1'
  },
  confirmBox: {
    border: '1px dashed #334155',
    borderRadius: '10px',
    padding: '16px',
    marginBottom: '14px',
    background: 'rgba(56, 189, 248, 0.02)'
  },
  confirmText: {
    fontSize: '14px',
    color: '#cbd5e1',
    lineHeight: 1.5
  },
  actionWrap: {
    marginTop: 12
  }
};

export default ResetData;