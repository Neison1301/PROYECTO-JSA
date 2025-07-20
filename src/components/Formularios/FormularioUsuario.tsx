import React from 'react';
import { User } from '../../domain/Usuario';
import { UserCheck, Eye, EyeOff, Loader2, Shield } from 'lucide-react';

// Definimos la interfaz de props para UsuarioForm
interface UsuarioFormProps {
  formData: {
    username: string;
    email: string;
    password: string;
    role: 'admin' | 'empleado';
  };
  errors: { [key: string]: string };
  errorMessage: string | null;
  isLoading: boolean;
  editingEmployee: User | null;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  onCancel: () => void;
}

const UsuarioForm: React.FC<UsuarioFormProps> = ({
  formData,
  errors,
  errorMessage,
  isLoading,
  editingEmployee,
  showPassword,
  setShowPassword,
  handleInputChange,
  handleSubmit,
  onCancel,
}) => {
  /**
   * Devuelve la clase CSS del badge según el rol del empleado.
   * @param {string} role El rol del empleado.
   * @returns {string} La clase CSS correspondiente.
   */
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-danger';
      case 'empleado': return 'bg-primary';
      default: return 'bg-secondary';
    }
  };

  return (
    <div className="fade-in p-4">
      {errorMessage && (
        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>
      )}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>
          <UserCheck className="me-2" />
          {editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
        </h4>
        <button
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-6">
            <div className="form-floating mb-3">
              <input
                type="text"
                className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                id="username"
                name="username"
                placeholder="Nombre de usuario"
                value={formData.username}
                onChange={handleInputChange}
              />
              <label htmlFor="username">Nombre de usuario</label>
              {errors.username && <div className="invalid-feedback">{errors.username}</div>}
            </div>
          </div>

          <div className="col-md-6">
            <div className="form-floating mb-3">
              <input
                type="email"
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                id="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
              />
              <label htmlFor="email">Email</label>
              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <div className="form-floating mb-3">
              <div className="input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  id="password"
                  name="password"
                  placeholder={editingEmployee ? "Nueva contraseña (opcional)" : "Contraseña"}
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <label htmlFor="password">
                  {editingEmployee ? "Nueva contraseña (opcional)" : "Contraseña"}
                </label>
              </div>
              {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}
            </div>
          </div>

          <div className="col-md-6">
            <div className="form-floating mb-3">
              <select
                className="form-select"
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
              >
                <option value="empleado">Empleado</option>
                <option value="admin">Administrador</option>
              </select>
              <label htmlFor="role">Rol</label>
            </div>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-body">
            <h6 className="card-title">
              <Shield className="me-2" size={18} />
              Permisos según el rol
            </h6>
            <div className="row">
              <div className="col-md-4">
                <strong>Administrador:</strong>
                <ul className="small text-muted">
                  <li>Acceso completo</li>
                  <li>Gestión de empleados</li>
                  <li>Todos los reportes</li>
                </ul>
              </div>
              <div className="col-md-4">
                <strong>Empleado:</strong>
                <ul className="small text-muted">
                  <li>Ventas y clientes</li>
                  <li>Reportes limitados</li>
                  <li>Generar boletas</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-gradient" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin me-2" size={18} /> : null}
            {editingEmployee ? 'Actualizar' : 'Crear'} Empleado
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default UsuarioForm;
