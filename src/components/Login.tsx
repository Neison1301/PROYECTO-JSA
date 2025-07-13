import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, User, Lock, AlertCircle } from 'lucide-react';

// Componente para la pantalla de inicio de sesión.
const InicioSesion: React.FC = () => {
  // Estado para el nombre de usuario.
  const [nombreUsuario, setNombreUsuario] = useState('');
  // Estado para la contraseña.
  const [contrasena, setContrasena] = useState('');
  // Estado para mensajes de error.
  const [error, setError] = useState('');
  // Estado para indicar si la operación está en curso.
  const [estaCargando, setEstaCargando] = useState(false);
  // Función de inicio de sesión del contexto de autenticación.
  const { login } = useAuth();

  // Maneja el envío del formulario de inicio de sesión.
  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEstaCargando(true);

    try {
      // Intenta iniciar sesión con el nombre de usuario y contraseña.
      const exito = await login(nombreUsuario, contrasena);
      // Si el inicio de sesión no es exitoso, muestra un error.
      if (!exito) {
        setError('Usuario o contraseña incorrectos');
      }
    } catch (err) {
      // Captura y muestra errores generales de inicio de sesión.
      setError('Error al iniciar sesión');
    } finally {
      // Finaliza el estado de carga.
      setEstaCargando(false);
    }
  };

  // Renderiza el formulario de inicio de sesión.
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center bg-primary rounded-circle p-3 mb-3">
            <LogIn size={32} className="text-white" />
          </div>
          <h2 className="h3 mb-2">Sistema de Ventas</h2>
          <p className="text-muted">Ingresa tus credenciales para continuar</p>
        </div>

        <form onSubmit={manejarEnvio}>
          {error && (
            <div className="alert alert-danger d-flex align-items-center mb-3">
              <AlertCircle size={18} className="me-2" />
              {error}
            </div>
          )}

          <div className="form-floating mb-3">
            <input
              type="text"
              className="form-control"
              id="nombreUsuario" // ID para el campo de nombre de usuario.
              value={nombreUsuario}
              placeholder="Usuario"
              onChange={(e) => setNombreUsuario(e.target.value)}
              required
            />
            <label htmlFor="nombreUsuario"> {/* Etiqueta asociada al ID del nombre de usuario. */}
              <User size={18} className="me-2" />
            </label>             

          </div>

          <div className="form-floating mb-4">
            <input
              type="password"
              className="form-control"
              id="contrasena" // ID para el campo de contraseña.
              placeholder="Contraseña"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
            />
            <label htmlFor="contrasena"> {/* Etiqueta asociada al ID de la contraseña. */}
              <Lock size={18} className="me-2" />
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-gradient w-100 py-2"
            disabled={estaCargando} // Deshabilita el botón si está cargando.
          >
            {estaCargando ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Iniciando sesión...
              </>
            ) : (
              <>
                <LogIn size={18} className="me-2" />
                Iniciar Sesión
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InicioSesion;