import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, User, Lock, AlertCircle } from 'lucide-react';

// Componente para la pantalla de inicio de sesión.
const InicioSesion: React.FC = () => {
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [estaCargando, setEstaCargando] = useState(false);
  const { login } = useAuth();
  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEstaCargando(true);

    try {
      const exito = await login(nombreUsuario, contrasena);
      if (!exito) {
        setError('Usuario o contraseña incorrectos');
      }
    } catch (err) {
      setError('Error al iniciar sesión');
    } finally {
      setEstaCargando(false);
    }
  };
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
              id="nombreUsuario" 
              value={nombreUsuario}
              placeholder="Usuario"
              onChange={(e) => setNombreUsuario(e.target.value)}
              required
            />
            <label htmlFor="nombreUsuario"> 
              <User size={18} className="me-2" />
            </label>             

          </div>

          <div className="form-floating mb-4">
            <input
              type="password"
              className="form-control"
              id="contrasena"
              placeholder="Contraseña"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
            />
            <label htmlFor="contrasena">
              <Lock size={18} className="me-2" />
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-gradient w-100 py-2"
            disabled={estaCargando} 
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