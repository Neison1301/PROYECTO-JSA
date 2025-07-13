import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { Window } from '../types';
import { generarId } from '../utils';

interface WindowContextType {
  windows: Window[];
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
    throw new Error('useWindows must be used within a WindowProvider');
  }
  return context;
};

interface WindowProviderProps {
  children: ReactNode;
}

// Nuevo hook personalizado para funciones con throttling
// Este hook encapsula su propio useRef y useCallback.
const useThrottledCallback = (callback: Function, delay: number) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastArgsRef = useRef<any[] | null>(null);
  const lastThisRef = useRef<any>(null);

  const throttledCallback = useCallback(function(this: any, ...args: any[]) {
    lastArgsRef.current = args;
    lastThisRef.current = this;

    if (!timeoutRef.current) {
      callback.apply(this, args);
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        lastArgsRef.current = null;
        lastThisRef.current = null;
      }, delay);
    }
  }, [callback, delay]); // Dependencias: la función original y el retraso

  // Limpiar el timeout al desmontar el componente (o cuando el hook se limpia)
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []); // Se ejecuta solo una vez al montar/desmontar

  return throttledCallback;
};


const WindowProvider: React.FC<WindowProviderProps> = ({ children }) => {
  const [windows, setWindows] = useState<Window[]>([]);
  const [highestZIndex, setHighestZIndex] = useState(100);

  useEffect(() => {
    if (!windows.some(w => w.component === 'dashboard')) {
      openWindow('Dashboard', 'dashboard', { width: window.innerWidth, height: window.innerHeight }, true);
    }
  }, []);

  const openWindow = useCallback((
    title: string,
    component: string,
    size: { width: number; height: number } = { width: 800, height: 600 },
    maximized: boolean = false
  ) => {
    const existingWindow = windows.find(w => w.component === component);

    if (existingWindow) {
      const newZIndex = highestZIndex + 1;
      setWindows(prev => prev.map(w =>
        w.id === existingWindow.id
          ? { ...w, isMinimized: false, zIndex: newZIndex }
          : w
      ));
      setHighestZIndex(newZIndex);
      return;
    }

    const nonMaximizedWindows = windows.filter(w => !w.isMaximized);
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

    const newWindow: Window = {
      id: generarId(),
      title,
      component,
      position: maximized ? { x: 0, y: 0 } : initialPosition,
      size: maximized ? { width: window.innerWidth, height: window.innerHeight } : initialSize,
      isMinimized: false,
      isMaximized: maximized,
      zIndex: newZIndex
    };

    setWindows(prev => [...prev, newWindow]);
  }, [windows, highestZIndex]);

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

  // Definimos la función de actualización sin throttle/useCallback primero
  const _updateWindowPosition = (id: string, position: { x: number; y: number }) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, position, previousPosition: position } : w
    ));
  };

  // Luego, usamos el hook useThrottledCallback para obtener la versión throttled
  const updateWindowPosition = useThrottledCallback(_updateWindowPosition, 1000 / 60);

  const updateWindowSize = useCallback((id: string, size: { width: number; height: number }) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, size, previousSize: size } : w
    ));
  }, []);

  const bringToFront = useCallback((id: string) => {
    const windowToBringFront = windows.find(w => w.id === id);
    if (windowToBringFront && windowToBringFront.component !== 'dashboard') {
      if (windowToBringFront.zIndex !== highestZIndex) {
        const newZIndex = highestZIndex + 1;
        setWindows(prev => prev.map(w =>
          w.id === id ? { ...w, zIndex: newZIndex } : w
        ));
        setHighestZIndex(newZIndex);
      }
    }
  }, [windows, highestZIndex]);

  const value: WindowContextType = {
    windows,
    openWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    updateWindowPosition,
    updateWindowSize,
    bringToFront
  };

  return (
    <WindowContext.Provider value={value}>
      {children}
    </WindowContext.Provider>
  );
};

export { useWindows, WindowProvider };