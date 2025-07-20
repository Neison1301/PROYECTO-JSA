import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { Ventanas } from '../domain/Ventanas';
import { generarId } from '../utils';

interface WindowContextType {
  windows: Ventanas[];
  openWindow: (title: string, component: string, size?: { width: number; height: number }, maximized?: boolean) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  updateWindowPosition: (id: string, position: { x: number; y: number }) => void;
  updateWindowSize: (id: string, size: { width: number; height: number }) => void;
  bringToFront: (id: string) => void;
}

const WindowContext = createContext<WindowContextType | undefined>(undefined);

const useWindows = () => {
  const context = useContext(WindowContext);
  if (context === undefined) {
    throw new Error('error');
  }
  return context;
};

interface WindowProviderProps {
  children: ReactNode;
}

const WindowProvider: React.FC<WindowProviderProps> = ({ children }) => {
  const [windows, setWindows] = useState<Ventanas[]>([]);
  const [highestZIndex, setHighestZIndex] = useState(100);

  // Inicializar dashboard una sola vez
  useEffect(() => {
    const hasDashboard = windows.some(w => w.component === 'dashboard');
    if (!hasDashboard) {
      const dashboardWindow: Ventanas = {
        id: generarId(),
        title: 'Dashboard',
        component: 'dashboard',
        position: { x: 0, y: 0 },
        size: { width: window.innerWidth, height: window.innerHeight },
        isMinimized: false,
        isMaximized: true,
        zIndex: 0
      };
      setWindows([dashboardWindow]);
    }
  }, []);

  // Memoizar la función de apertura de ventanas
  const openWindow = useCallback((
    title: string,
    component: string,
    size: { width: number; height: number } = { width: 800, height: 600 },
    maximized: boolean = false
  ) => {
    setWindows(prev => {
      const existingWindow = prev.find(w => w.component === component);

      if (existingWindow) {
        const newZIndex = highestZIndex + 1;
        setHighestZIndex(newZIndex);
        return prev.map(w =>
          w.id === existingWindow.id
            ? { ...w, isMinimized: false, zIndex: newZIndex }
            : w
        );
      }

      const nonMaximizedWindows = prev.filter(w => !w.isMaximized);
      const offsetX = nonMaximizedWindows.length * 30;
      const offsetY = nonMaximizedWindows.length * 30;

      let newZIndex: number;
      let initialPosition = { x: Math.min(50 + offsetX, 300), y: Math.min(50 + offsetY, 200) };
      let initialSize = size;

      if (component === 'dashboard') {
        newZIndex = 0;
        maximized = true;
        initialPosition = { x: 0, y: 0 };
        initialSize = { width: window.innerWidth, height: window.innerHeight };
      } else {
        newZIndex = highestZIndex + 1;
        setHighestZIndex(newZIndex);
      }

      const newWindow: Ventanas = {
        id: generarId(),
        title,
        component,
        position: maximized ? { x: 0, y: 0 } : initialPosition,
        size: maximized ? { width: window.innerWidth, height: window.innerHeight } : initialSize,
        isMinimized: false,
        isMaximized: maximized,
        zIndex: newZIndex
      };

      return [...prev, newWindow];
    });
  }, [highestZIndex]);

  // Funciones optimizadas con batching automático de React
  const closeWindow = useCallback((id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, isMinimized: !w.isMinimized } : w
    ));
  }, []);

  const maximizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? {
        ...w,
        isMaximized: !w.isMaximized,
        previousPosition: w.isMaximized ? w.previousPosition : w.position,
        previousSize: w.isMaximized ? w.previousSize : w.size,
        position: !w.isMaximized ? { x: 0, y: 0 } : w.previousPosition || { x: 50, y: 50 },
        size: !w.isMaximized ? { width: window.innerWidth, height: window.innerHeight } : w.previousSize || { width: 800, height: 600 }
      } : w
    ));
  }, []);

  // Actualización de posición sin throttle - React ya maneja el batching
  const updateWindowPosition = useCallback((id: string, position: { x: number; y: number }) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, position, previousPosition: position } : w
    ));
  }, []);

  const updateWindowSize = useCallback((id: string, size: { width: number; height: number }) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, size, previousSize: size } : w
    ));
  }, []);

  const bringToFront = useCallback((id: string) => {
    setWindows(prev => {
      const windowToBringFront = prev.find(w => w.id === id);
      if (windowToBringFront && windowToBringFront.component !== 'dashboard') {
        if (windowToBringFront.zIndex !== highestZIndex) {
          const newZIndex = highestZIndex + 1;
          setHighestZIndex(newZIndex);
          return prev.map(w =>
            w.id === id ? { ...w, zIndex: newZIndex } : w
          );
        }
      }
      return prev;
    });
  }, [highestZIndex]);

  // Memoizar el valor del contexto
  const value = useMemo<WindowContextType>(() => ({
    windows,
    openWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    updateWindowPosition,
    updateWindowSize,
    bringToFront
  }), [
    windows,
    openWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    updateWindowPosition,
    updateWindowSize,
    bringToFront
  ]);

  return (
    <WindowContext.Provider value={value}>
      {children}
    </WindowContext.Provider>
  );
};

export { useWindows, WindowProvider };