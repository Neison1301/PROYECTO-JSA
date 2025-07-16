import React, { useRef, useEffect, useCallback, memo } from "react";
import { useWindows } from "../contexts/WindowContext";
import { Ventanas } from '../domain/Ventanas';
import { Minimize2, Maximize2, X, Square } from "lucide-react";

import Dashboard from "./Ventas/Dashboard";
import ProductsWindow from "./Ventas/VentanaProductos";
import ClientsWindow from "./Ventas/VentanaClientes";
import SalesWindow from "./Ventas/VentanaVentas";
import ReportsWindow from "./Ventas/VentanaInformes";
import SettingsWindow from "./Ventas/VentanaAjustes";
import FormularioUsuario from "./Ventas/VentanaUsuario";

const GestorVentanas: React.FC = () => {
  // Obtiene funciones y estado de las ventanas del contexto
  const {
    windows,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    updateWindowPosition,
    bringToFront,
  } = useWindows();

  // Retorna el componente de React según el nombre
  const obtenerComponenteVentana = useCallback(
    (componente: string, currentWindowId: string) => {
      switch (componente) {
        case "dashboard": return <Dashboard />;
        case "products": return <ProductsWindow />;
        case "clients": return <ClientsWindow />;
        case "sales": return <SalesWindow />;
        case "reports": return <ReportsWindow />;
        case "settings": return <SettingsWindow />;
        case "addUserForm": return (<FormularioUsuario onUserSaved={() => {}} windowId={currentWindowId} />);
        default: return <div>Componente '{componente}' no encontrado.</div>;
      }
    },
    []
  );

  // Filtra las ventanas minimizadas
  const ventanasMinimizadas = windows.filter((w) => w.isMinimized);

  return (
    <>
      {/* Barra de tareas para ventanas minimizadas */}
      {ventanasMinimizadas.length > 0 && (
        <div className="taskbar">
          <div className="taskbar-content">
            <span className="taskbar-label">Ventanas minimizadas:</span>
            {ventanasMinimizadas.map((ventana) => (
              <button
                key={ventana.id}
                className="taskbar-item"
                onClick={() => {
                  minimizeWindow(ventana.id);
                  bringToFront(ventana.id);
                }}
                title={`Restaurar ${ventana.title}`}
              >
                <Square size={16} className="me-2" />
                {ventana.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Renderiza las ventanas activas */}
      {windows.map((ventana) => (
        <MemorizedComponenteVentana
          key={ventana.id}
          ventana={ventana}
          onClose={() => closeWindow(ventana.id)}
          onMinimize={() => minimizeWindow(ventana.id)}
          onMaximize={() => maximizeWindow(ventana.id)}
          onMove={(posicion) => updateWindowPosition(ventana.id, posicion)}
          onFocus={() => bringToFront(ventana.id)}
        >
          {obtenerComponenteVentana(ventana.component, ventana.id)}
        </MemorizedComponenteVentana>
      ))}
    </>
  );
};

// Define las propiedades para el ComponenteVentana
interface PropiedadesComponenteVentana {
  ventana: Ventanas;
  children: React.ReactNode;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onMove: (posicion: { x: number; y: number }) => void;
  onFocus: () => void;
}

const ComponenteVentana: React.FC<PropiedadesComponenteVentana> = memo(
  ({ ventana, children, onClose, onMinimize, onMaximize, onMove, onFocus }) => {
    const referenciaVentana = useRef<HTMLDivElement>(null); // Ref al elemento DOM de la ventana
    const estaArrastrando = useRef(false); // Estado para arrastrar
    const posicionInicialRaton = useRef({ x: 0, y: 0 }); // Posición inicial del ratón
    const posicionInicialVentana = useRef({ x: 0, y: 0 }); // Posición inicial de la ventana
    const sePuedeArrastrar = !ventana.isMaximized && ventana.component !== "dashboard"; // Si la ventana se puede arrastrar
    const sePuedeMaximizar = ventana.component !== "dashboard"; // Si la ventana se puede maximizar

    // Maneja el inicio del arrastre
    const manejarMouseDown = useCallback(
      (e: React.MouseEvent) => {
        if (!sePuedeArrastrar || (e.target as HTMLElement).closest(".window-controls")) return;
        estaArrastrando.current = true;
        posicionInicialRaton.current = { x: e.clientX, y: e.clientY };
        const rect = referenciaVentana.current?.getBoundingClientRect();
        if (rect) { posicionInicialVentana.current = { x: rect.left, y: rect.top }; }
      },
      [sePuedeArrastrar]
    );

    useEffect(() => {
      // Maneja el movimiento del ratón durante el arrastre
      const manejarMouseMove = (e: MouseEvent) => {
        if (!estaArrastrando.current || !sePuedeArrastrar) return;
        const deltaX = e.clientX - posicionInicialRaton.current.x;
        const deltaY = e.clientY - posicionInicialRaton.current.y;
        const nuevaPosicion = { x: posicionInicialVentana.current.x + deltaX, y: posicionInicialVentana.current.y + deltaY, };
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const currentWindowWidth = referenciaVentana.current?.offsetWidth || ventana.size.width;
        const currentWindowHeight = referenciaVentana.current?.offsetHeight || ventana.size.height;
        const clampedX = Math.max(0, Math.min(nuevaPosicion.x, viewportWidth - currentWindowWidth));
        const clampedY = Math.max(0, Math.min(nuevaPosicion.y, viewportHeight - currentWindowHeight));
        onMove({ x: clampedX, y: clampedY });
      };

      // Maneja la liberación del botón del ratón (fin del arrastre)
      const manejarMouseUp = () => {
        estaArrastrando.current = false;
      };

      // Añade/remueve event listeners para el arrastre
      if (sePuedeArrastrar) {
        document.addEventListener("mousemove", manejarMouseMove);
        document.addEventListener("mouseup", manejarMouseUp);
      }
      return () => {
        document.removeEventListener("mousemove", manejarMouseMove);
        document.removeEventListener("mouseup", manejarMouseUp);
      };
    }, [onMove, sePuedeArrastrar]);

    // No renderiza si la ventana está minimizada
    if (ventana.isMinimized) { return null; }

    // Estilos CSS dinámicos de la ventana
    const estiloVentana: React.CSSProperties = {
      left: ventana.isMaximized ? 0 : ventana.position.x,
      top: ventana.isMaximized ? 0 : ventana.position.y,
      width: ventana.isMaximized ? "100%" : ventana.size.width,
      height: ventana.isMaximized ? "100%" : ventana.size.height,
      zIndex: ventana.zIndex,
    };

    // Clases CSS adicionales
    const nombreClaseVentana = `window ${ventana.component === "dashboard" ? "is-dashboard" : ""}`;

    return (
      <div
        ref={referenciaVentana}
        className={nombreClaseVentana}
        style={estiloVentana}
        onClick={onFocus} // Trae la ventana al frente
      >
        <div
          className="window-header"
          onMouseDown={sePuedeArrastrar ? manejarMouseDown : undefined} // Habilita arrastre
          style={!sePuedeArrastrar ? { cursor: "default" } : undefined} // Cambia el cursor
        >
          <h6 className="window-title">{ventana.title}</h6>
          <div className="window-controls">
            <button className="window-control minimize" onClick={onMinimize} title="Minimizar"><Minimize2 size={12} /></button>
            {sePuedeMaximizar && (
              <button className="window-control maximize" onClick={onMaximize} title={ventana.isMaximized ? "Restaurar" : "Maximizar"}><Maximize2 size={12} /></button>
            )}
            <button className="window-control close" onClick={onClose} title="Cerrar"><X size={12} /></button>
          </div>
        </div>
        <div className="window-content">{children}</div> {/* Contenido de la ventana */}
      </div>
    );
  }
);

const MemorizedComponenteVentana = ComponenteVentana;
export default GestorVentanas; 