import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate, useNavigate } from 'react-router-dom';
import TestUsers from './components/TestUsers';
import AddUser from './components/addUser';
import FormulaireSquelette from './squelette/Formulaire';
import TableauSquelette from './squelette/Tableau';
import Popup from './squelette/Popup';
import LoginBack from './components/LoginBack';
import Home from './components/Home'; 
import CsvDynamicTester from './components/CsvDynamicTester';
import GlpiItemList from './components/GlpiItemList';
import CreateTicket from './components/CreateTicket';
import GlpiDashboard from './components/GlpiDashboard';
import TicketsList from './components/TicketsList';

import AdminLayout from './components/AdminLayout';
import ResetData from './components/ResetData';

const Login = () => {
  const navigate = useNavigate(); 
  return (
    <div style={styles.center}>
      <h2>Page de Connexion</h2>
      <button 
        onClick={() => navigate("/LoginBack")}
        style={{ padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold' }}
      >
        Se connecter au Backoffice
      </button>
    </div>
  );
};

const ProtectedAdmin = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('adminSession'); 
  if (!isAuthenticated) {
    return <Navigate to="/LoginBack" replace />;
  }
  return children;
};

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('token'); 
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const styles = {
  center: { textAlign: 'center', marginTop: '100px', fontFamily: 'Arial, sans-serif' }
};

const router = createBrowserRouter([
  // --- ROUTES PUBLIQUES / FRONTOFFICE ---
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/LoginBack',
    element: <LoginBack />
  },
  {
    path: '/list',
    element: <GlpiItemList />
  },
  {
    path: '/ticket', // Création de ticket utilisateur
    element: <CreateTicket />
  },

  // --- ROUTES BACKOFFICE (PROTÉGÉES + LAYOUT COMMUN) ---
  {
    path: '/admin',
    element: (
      <ProtectedAdmin>
        <AdminLayout>
          <GlpiDashboard />
        </AdminLayout>
      </ProtectedAdmin>
    )
  },
  {
    path: '/adminTicket',
    element: (
      <ProtectedAdmin>
        <AdminLayout>
          <TicketsList />
        </AdminLayout>
      </ProtectedAdmin>
    )
  },
  {
    path: '/testCsv', // Page pour importer tes 4 fichiers (3 CSV + 1 ZIP)
    element: (
      <ProtectedAdmin>
        <AdminLayout>
          <CsvDynamicTester />
        </AdminLayout>
      </ProtectedAdmin>
    )
  },
  {
    path: '/admin/reset', // Page dédiée pour la réinitialisation de l'application
    element: (
      <ProtectedAdmin>
        <AdminLayout>
          <ResetData />
        </AdminLayout>
      </ProtectedAdmin>
    )
  },

  // --- ENCIENNES ROUTES DE TEST (À GARDER OU TRIER PLUS TARD) ---
  {
    path: '/tableau',
    element: (
      <ProtectedRoute>
        <TableauSquelette />
      </ProtectedRoute>
    )
  },
  {
    path: '/popup',
    element: (
      <ProtectedRoute>
        <Popup />
      </ProtectedRoute>
    )
  },
  {
    path: '/test-users',
    element: (
      <ProtectedRoute>
        <TestUsers />
      </ProtectedRoute>
    )
  },
  {
    path: '/test-AddUsers',
    element: (
      <ProtectedRoute>
        <AddUser />
      </ProtectedRoute>
    )
  },
  {
    path: '*', 
    element: <div style={styles.center}><h2>404 - Page introuvable</h2></div>
  }
]);

const AppRoutes = () => {
  return <RouterProvider router={router} />;
};

export default AppRoutes;