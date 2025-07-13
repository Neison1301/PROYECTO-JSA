import React, { useRef, useEffect, useCallback, memo } from "react";
import { useWindows } from "../contexts/WindowContext";
import { Window } from "../types";
import { Minimize2, Maximize2, X, Square } from "lucide-react";

import Dashboard from "./Ventas/Dashboard";
import ProductsWindow from "./Ventas/VentanaProductos";
import ClientsWindow from "./Ventas/VentanaClientes";
import SalesWindow from "./Ventas/VentanaVentas";
import ReportsWindow from "./Ventas/VentanaInformes";
import SettingsWindow from "./Ventas/VentanaAjustes";
import FormularioUsuario from "./Ventas/VentanaUsuario";
// Componente principal para gestionar las ventanas.
const GestorVentanas: React.FC = () => {
  // Obtiene funciones y estado de las ventanas del contexto.
  const {
    windows,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    updateWindowPosition,
    bringToFront,
  } = useWindows();

  // Retorna el componente de React según el nombre del componente.
  // Se memoriza con useCallback para evitar recrear la función en cada render.
  const obtenerComponenteVentana = useCallback(
    (componente: string, currentWindowId: string) => {
      switch (componente) {
        case "dashboard":
          return <Dashboard />;
        case "products":
          return <ProductsWindow />;
        case "clients":
          return <ClientsWindow />;
        case "sales":
          return <SalesWindow />;
        case "reports":
          return <ReportsWindow />;
        case "settings":
          return <SettingsWindow />;
        // --- ¡INICIO DE LA MODIFICACIÓN! ---
        case "addUserForm": 
          return (
            <FormularioUsuario
              onUserSaved={() => {}}
              windowId={currentWindowId}
            />
          );
        // --- ¡FIN DE LA MODIFICACIÓN! ---
        default:
          // Mensaje si el componente no se encuentra.
          return <div>Componente '{componente}' no encontrado.</div>;
      }
    },
    []
  ); // Sin dependencias, ya que los componentes importados son estáticos

  // Filtra las ventanas minimizadas.
  const ventanasMinimizadas = windows.filter((w) => w.isMinimized);

  // Renderiza el gestor de ventanas.
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
                  minimizeWindow(ventana.id); // Vuelve a minimizar (desminimizar).
                  bringToFront(ventana.id); // Trae la ventana al frente.
                }}
                title={`Restaurar ${ventana.title}`} // Título para el botón de restaurar.
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
        <MemorizedComponenteVentana // Usamos el componente memoizado
          key={ventana.id}
          ventana={ventana}
          onClose={() => closeWindow(ventana.id)} // Cierra la ventana.
          onMinimize={() => minimizeWindow(ventana.id)} // Minimiza la ventana.
          onMaximize={() => maximizeWindow(ventana.id)} // Maximiza/restaura la ventana.
          onMove={(posicion) => updateWindowPosition(ventana.id, posicion)} // Actualiza la posición de la ventana.
          onFocus={() => bringToFront(ventana.id)} // Trae la ventana al frente al hacer clic.
        >
          {obtenerComponenteVentana(ventana.component, ventana.id)}
        </MemorizedComponenteVentana>
      ))}
    </>
  );
};

// Define las propiedades para el ComponenteVentana.
interface PropiedadesComponenteVentana {
  // Objeto de la ventana a renderizar.
  ventana: Window;
  // Contenido de la ventana.
  children: React.ReactNode;
  // Función para cerrar la ventana.
  onClose: () => void;
  // Función para minimizar la ventana.
  onMinimize: () => void;
  // Función para maximizar/restaurar la ventana.
  onMaximize: () => void;
  // Función para mover la ventana.
  onMove: (posicion: { x: number; y: number }) => void;
  // Función para enfocar la ventana (traer al frente).
  onFocus: () => void;
}

// Componente individual para cada ventana.
// Se envuelve en React.memo para optimizar re-renders.
const ComponenteVentana: React.FC<PropiedadesComponenteVentana> = memo(
  ({ ventana, children, onClose, onMinimize, onMaximize, onMove, onFocus }) => {
    // Referencia al elemento DOM de la ventana.
    const referenciaVentana = useRef<HTMLDivElement>(null);
    // Estado para saber si la ventana está siendo arrastrada.
    const estaArrastrando = useRef(false);
    // Almacena la posición inicial del ratón al hacer clic
    const posicionInicialRaton = useRef({ x: 0, y: 0 });
    // Almacena la posición inicial de la ventana al hacer clic
    const posicionInicialVentana = useRef({ x: 0, y: 0 });

    // Determina si la ventana se puede arrastrar.
    const sePuedeArrastrar =
      !ventana.isMaximized && ventana.component !== "dashboard";

    // Determina si la ventana se puede maximizar.
    const sePuedeMaximizar = ventana.component !== "dashboard";

    // Maneja el evento de presionar el botón del ratón (inicio de arrastre).
    // Se memoriza la función para evitar re-creación.
    const manejarMouseDown = useCallback(
      (e: React.MouseEvent) => {
        // Si no se puede arrastrar o el clic es en los controles, no hace nada.
        if (
          !sePuedeArrastrar ||
          (e.target as HTMLElement).closest(".window-controls")
        ) {
          return;
        }

        estaArrastrando.current = true;
        // Captura la posición inicial del ratón
        posicionInicialRaton.current = { x: e.clientX, y: e.clientY };

        const rect = referenciaVentana.current?.getBoundingClientRect();
        if (rect) {
          // Captura la posición inicial de la ventana
          posicionInicialVentana.current = { x: rect.left, y: rect.top };
        }
      },
      [sePuedeArrastrar]
    ); // Dependencia: sePuedeArrastrar

    // Efecto para manejar los eventos de movimiento y soltar el ratón.
    useEffect(() => {
      // Maneja el movimiento del ratón al arrastrar.
      const manejarMouseMove = (e: MouseEvent) => {
        // Si no se está arrastrando o no se puede arrastrar, no hace nada.
        if (!estaArrastrando.current || !sePuedeArrastrar) return;

        // Calcula la diferencia de movimiento del ratón
        const deltaX = e.clientX - posicionInicialRaton.current.x;
        const deltaY = e.clientY - posicionInicialRaton.current.y;

        // Calcula la nueva posición de la ventana sumando el delta a la posición inicial de la ventana
        const nuevaPosicion = {
          x: posicionInicialVentana.current.x + deltaX,
          y: posicionInicialVentana.current.y + deltaY,
        };

        // Opcional: Limitar la posición dentro de los límites de la ventana del navegador
        // Obtener las dimensiones del viewport para evitar que se salga por completo
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const currentWindowWidth =
          referenciaVentana.current?.offsetWidth || ventana.size.width;
        const currentWindowHeight =
          referenciaVentana.current?.offsetHeight || ventana.size.height;

        const clampedX = Math.max(
          0,
          Math.min(nuevaPosicion.x, viewportWidth - currentWindowWidth)
        );
        const clampedY = Math.max(
          0,
          Math.min(nuevaPosicion.y, viewportHeight - currentWindowHeight)
        );

        onMove({ x: clampedX, y: clampedY }); // Actualiza la posición de la ventana.
      };

      // Maneja el evento de soltar el botón del ratón.
      const manejarMouseUp = () => {
        estaArrastrando.current = false;
      };

      // Añade los event listeners si la ventana se puede arrastrar.
      if (sePuedeArrastrar) {
        document.addEventListener("mousemove", manejarMouseMove);
        document.addEventListener("mouseup", manejarMouseUp);
      }

      // Limpia los event listeners al desmontar el componente.
      return () => {
        document.removeEventListener("mousemove", manejarMouseMove);
        document.removeEventListener("mouseup", manejarMouseUp);
      };
    }, [onMove, sePuedeArrastrar]); // Dependencias del efecto.

    // Si la ventana está minimizada, no renderiza nada.
    if (ventana.isMinimized) {
      return null;
    }

    // Estilos CSS dinámicos para la ventana.
    const estiloVentana: React.CSSProperties = {
      left: ventana.isMaximized ? 0 : ventana.position.x, // Posición X.
      top: ventana.isMaximized ? 0 : ventana.position.y, // Posición Y.
      width: ventana.isMaximized ? "100%" : ventana.size.width, // Ancho.
      height: ventana.isMaximized ? "100%" : ventana.size.height, // Alto.
      zIndex: ventana.zIndex, // Z-index para el orden de apilamiento.
    };

    // Clases CSS adicionales para la ventana.
    const nombreClaseVentana = `window ${
      ventana.component === "dashboard" ? "is-dashboard" : ""
    }`;

    // Renderiza la ventana individual.
    return (
      <div
        ref={referenciaVentana} // Asigna la referencia al div de la ventana.
        className={nombreClaseVentana}
        style={estiloVentana}
        onClick={onFocus} // Trae la ventana al frente al hacer clic.
      >
        <div
          className="window-header"
          onMouseDown={sePuedeArrastrar ? manejarMouseDown : undefined} // Habilita arrastre si se puede.
          style={!sePuedeArrastrar ? { cursor: "default" } : undefined} // Cambia el cursor si no se puede arrastrar.
        >
          <h6 className="window-title">{ventana.title}</h6>
          <div className="window-controls">
            <button
              className="window-control minimize"
              onClick={onMinimize} // Maneja la minimización.
              title="Minimizar"
            >
              <Minimize2 size={12} />
            </button>
            {/* Botón de maximizar solo si la ventana no es el dashboard */}
            {sePuedeMaximizar && (
              <button
                className="window-control maximize"
                onClick={onMaximize} // Maneja la maximización/restauración.
                title={ventana.isMaximized ? "Restaurar" : "Maximizar"}
              >
                <Maximize2 size={12} />
              </button>
            )}
            <button
              className="window-control close"
              onClick={onClose} // Maneja el cierre de la ventana.
              title="Cerrar"
            >
              <X size={12} />
            </button>
          </div>
        </div>
        <div className="window-content">
          {children} {/* Contenido interno de la ventana */}
        </div>
      </div>
    );
  }
); // Envuelve el componente en memo

// Renombra el componente memoizado para exportarlo
const MemorizedComponenteVentana = ComponenteVentana;

export default GestorVentanas;
