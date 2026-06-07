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

const Login = () => (
  <div style={styles.center}>
    <h2>Page de Connexion </h2>
    <button onClick={() => {const navigate= useNavigate(); navigate("/LoginBack"); }}>

    </button>
   
  </div>
);

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
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/admin',
    element: (
      <ProtectedAdmin>
        <GlpiDashboard/>  
      </ProtectedAdmin>
    )
  },
  {
    path: '/adminTicket',
    element: <TicketsList />
  },
  {
    path: '/list',
    element: <GlpiItemList />
  },
  {
    path: '/ticket',
    element: (
      <ProtectedAdmin>
        <CreateTicket />
      </ProtectedAdmin>
    )
  },
  {
    path: '/',
    element: <Home />
  },
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
    path: '/LoginBack',
    element: <LoginBack />
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
  },{
    path:'/testCsv',
    element:<ProtectedAdmin><CsvDynamicTester/></ProtectedAdmin>
  },
  {
    path: '*', 
    element: <div style={styles.center}><h2>404 - Page introuvable </h2></div>
  }
]);

const AppRoutes = () => {
  return <RouterProvider router={router} />;
};

export default AppRoutes;