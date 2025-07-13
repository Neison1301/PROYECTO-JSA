import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WindowProvider } from './contexts/WindowContext'; 
import { dataService } from './services/dataService';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import WindowManager from './components/GestorVentanas';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {

    dataService.initializeDefaultData();
  }, []);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="app-container">
      <div className="main-content">
        <Sidebar 
          estaColapsada={sidebarCollapsed}
          alAlternar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <div className="content-area">
          <WindowManager />
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <WindowProvider>
        <AppContent />
      </WindowProvider>
    </AuthProvider>
  );
};

export default App;