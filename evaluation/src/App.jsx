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

// Importation de tes deux nouveaux layouts séparés
import BackOfficeLayout from './components/BackOfficeLayout';
import FrontOfficeLayout from './components/FrontOfficeLayout';

import ResetData from './components/ResetData';
import TicketsListKanban from './components/TicketsListKanban';
import StatusConfigPage from './components/StatusConfigPage';
import TicketsCost from './components/TicketsCost';

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
  // --- ROUTES PUBLIQUES (SANS LAYOUT COMPLEXE) ---
  {
    path: '/',
    element: <Home />
  },{
    path: '/cost',
    element: <TicketsCost />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/LoginBack',
    element: <LoginBack />
  },

  // --- ROUTES FRONTOFFICE / ESPACE SUPPORT (ENCAPSULÉES) ---
  {
    path: '/list',
    element: (
      <FrontOfficeLayout>
        <GlpiItemList />
      </FrontOfficeLayout>
    )
  },
  {
    path: '/ticket', 
    element: (
      <FrontOfficeLayout>
        <CreateTicket />
      </FrontOfficeLayout>
    )
  },

  // --- ROUTES BACKOFFICE / ADMINISTRATION (PROTÉGÉES + BACKOFFICE LAYOUT) ---
  {
    path: '/admin',
    element: (
      <ProtectedAdmin>
        <BackOfficeLayout>
          <GlpiDashboard />
        </BackOfficeLayout>
      </ProtectedAdmin>
    )
  },
  {
    path: '/statusConfig',
    element: (
      <ProtectedAdmin>
        <BackOfficeLayout>
          <StatusConfigPage />
        </BackOfficeLayout>
      </ProtectedAdmin>
    )
  },
  {
    path: '/ticketkanban',
    element: (
        <FrontOfficeLayout>
          <TicketsListKanban />
        </FrontOfficeLayout>
      
    )
  },
  {
    path: '/adminTicket',
    element: (
      <ProtectedAdmin>
        <BackOfficeLayout>
          <TicketsList />
        </BackOfficeLayout>
      </ProtectedAdmin>
    )
  },
  {
    path: '/testCsv', 
    element: (
      <ProtectedAdmin>
        <BackOfficeLayout>
          <CsvDynamicTester />
        </BackOfficeLayout>
      </ProtectedAdmin>
    )
  },
  {
    path: '/admin/reset', 
    element: (
      <ProtectedAdmin>
        <BackOfficeLayout>
          <ResetData />
        </BackOfficeLayout>
      </ProtectedAdmin>
    )
  },

  // --- ANCIENNES ROUTES DE TEST ---
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