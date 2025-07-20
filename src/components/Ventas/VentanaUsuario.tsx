import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../../domain/Usuario';
import { generarId, formatearFecha, validarRequerido, validarEmail } from '../../utils';
import { UserCheck, Plus, Edit, Trash2, Search, Mail, Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { userService } from '../../services/servicioUsuario';
import { useWindows } from '../../contexts/WindowContext';
import UsuarioForm from '../Formularios/FormularioUsuario';

// Interfaz de props para VentanaUsuario
interface VentanaUsuarioProps {
  onUserSaved: () => void;
  windowId: string;
}

// Componente de Modal de Confirmación simple
const ConfirmationModal: React.FC<{
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="modal-backdrop">
      <div className="modal-content-custom">
        <p>{message}</p>
        <div className="modal-actions">
          <button className="btn btn-danger" onClick={onConfirm}>Confirmar</button>
          <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

const VentanaUsuario: React.FC<VentanaUsuarioProps> = ({ onUserSaved, windowId }) => {
  const { closeWindow } = useWindows();

  // Estados del componente
  const [employees, setEmployees] = useState<User[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'empleado' as 'admin' | 'empleado'
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<User | null>(null);

  // Efecto para cargar empleados al montar
  useEffect(() => {
    loadEmployees();
  }, []);

  // Efecto para filtrar empleados al cambiar la lista o el término de búsqueda
  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm]);

  // Carga la lista de empleados
  const loadEmployees = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const allUsers = await userService.getUsers();
      const employeeUsers = allUsers.filter(user => user.role !== 'admin');
      setEmployees(employeeUsers);
    } catch (error) {
      console.error("Error al cargar empleados:", error);
      setErrorMessage("Error al cargar los empleados. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  // Filtra la lista de empleados
  const filterEmployees = () => {
    if (!searchTerm) {
      setFilteredEmployees(employees);
      return;
    }

    const filtered = employees.filter(employee =>
      employee.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEmployees(filtered);
  };

  // Resetea el formulario
  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'empleado'
    });
    setErrors({});
    setEditingEmployee(null);
    setShowPassword(false);
  };

  // Valida los campos del formulario
  const validateForm = async (): Promise<boolean> => {
    const newErrors: {[key: string]: string} = {};

    if (!validarRequerido(formData.username)) {
      newErrors.username = 'El nombre de usuario es requerido';
    }

    if (!validarRequerido(formData.email)) {
      newErrors.email = 'El email es requerido';
    } else if (!validarEmail(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!editingEmployee && !validarRequerido(formData.password)) {
      newErrors.password = 'La contraseña es requerida';
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    const allUsers = await userService.getUsers();
    const existingEmail = allUsers.find(u =>
      u.email === formData.email && (!editingEmployee || u.id !== editingEmployee.id)
    );
    if (existingEmail) {
      newErrors.email = 'Este email ya está registrado';
    }

    const existingUsername = allUsers.find(u =>
      u.username === formData.username && (!editingEmployee || u.id !== editingEmployee.id)
    );
    if (existingUsername) {
      newErrors.username = 'Este nombre de usuario ya existe';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Maneja el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!(await validateForm())) return;

    setIsLoading(true);
    const roleToSave = formData.role as 'admin' | 'empleado';

    let employeeData: User;

    if (editingEmployee) {
      employeeData = {
        ...editingEmployee,
        username: formData.username,
        email: formData.email,
        password: formData.password || editingEmployee.password || '',
        role: roleToSave,
      };
    } else {
      employeeData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: roleToSave,
        createdAt: new Date(),
        isActive: true
      } as User;
    }

    try {
      await userService.guardarUsuario(employeeData);
      console.log("Usuario guardado/actualizado con éxito. Recargando...");
      await loadEmployees();
      setShowForm(false);
      resetForm();
      onUserSaved();
    } catch (error) {
      console.error("Error al guardar/actualizar usuario:", error);
      setErrorMessage("Error al guardar el usuario. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  // Prepara el formulario para editar
  const handleEdit = (employee: User) => {
    setEditingEmployee(employee);
    setFormData({
      username: employee.username,
      email: employee.email,
      password: '',
      role: employee.role
    });
    setShowForm(true);
  };

  // Abre el modal de confirmación para eliminar
  const confirmDelete = (employee: User) => {
    setEmployeeToDelete(employee);
    setShowConfirmModal(true);
  };

  // Maneja la eliminación confirmada
  const handleDeleteConfirmed = async () => {
    if (!employeeToDelete) return;

    setIsLoading(true);
    setErrorMessage(null);
    setShowConfirmModal(false);

    try {
      await userService.eliminarUsuario(employeeToDelete.id);
      console.log("Usuario eliminado con éxito. Recargando...");
      await loadEmployees();
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      setErrorMessage("Error al eliminar el usuario. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
      setEmployeeToDelete(null);
    }
  };

  // Cancela la eliminación
  const handleDeleteCancelled = () => {
    setShowConfirmModal(false);
    setEmployeeToDelete(null);
  };

  // Maneja cambios en los inputs del formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value as any }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Devuelve la clase CSS del badge según el rol
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-danger';
      case 'empleado': return 'bg-primary';
      default: return 'bg-secondary';
    }
  };

  // Devuelve el texto legible del rol
  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'empleado': return 'Empleado';
      default: return role;
    }
  };

  // Cancela el formulario
  const handleCancelForm = () => {
    setShowForm(false);
    resetForm();
  };

  // Renderiza el formulario o la tabla
  if (showForm) {
    return (
      <UsuarioForm
        formData={formData}
        errors={errors}
        errorMessage={errorMessage}
        isLoading={isLoading}
        editingEmployee={editingEmployee}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        onCancel={handleCancelForm}
      />
    );
  }

  // Renderiza la tabla de empleados
  return (
    <div className="fade-in p-4">
      {showConfirmModal && employeeToDelete && (
        <ConfirmationModal
          message={`¿Estás seguro de eliminar al empleado "${employeeToDelete.username}"?`}
          onConfirm={handleDeleteConfirmed}
          onCancel={handleDeleteCancelled}
        />
      )}
      {errorMessage && (
        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>
      )}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>
          <UserCheck className="me-2" />
          Gestión de Empleados
        </h4>
        <button
          className="btn btn-gradient"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          disabled={isLoading}
        >
          <Plus size={18} className="me-2" />
          Nuevo Empleado
        </button>
      </div>

      <div className="row mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text">
              <Search size={18} />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar empleados..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>
        <div className="col-md-6">
          <div className="text-end">
            <span className="text-muted">
              {filteredEmployees.length} de {employees.length} empleados
            </span>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="d-flex justify-content-center align-items-center py-5">
          <Loader2 className="animate-spin me-2" size={32} />
          <span>Cargando empleados...</span>
        </div>
      )}

      {!isLoading && filteredEmployees.length === 0 && (
        <div className="text-center py-4">
          <div className="text-muted">
            <UserCheck size={48} className="mb-2 opacity-50" />
            <p>No se encontraron empleados</p>
          </div>
        </div>
      )}

      {!isLoading && filteredEmployees.length > 0 && (
        <div className="table-responsive">
          <table className="table table-modern">
            <thead>
              <tr><th>Usuario</th><th>Contacto</th><th>Rol</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => (
                <tr key={employee.id}><td>
                    <strong>{employee.username}</strong>
                  </td><td>
                    <div>
                      <div className="d-flex align-items-center mb-1">
                        <Mail size={14} className="me-1 text-muted" />
                        <small>{employee.email}</small>
                      </div>
                    </div>
                  </td><td>
                    <span className={`badge ${getRoleBadgeClass(employee.role)}`}>
                      {getRoleText(employee.role)}
                    </span>
                  </td><td>
                    <span className={`status-badge ${employee.isActive ? 'status-active' : 'status-inactive'}`}>
                      {employee.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td><td>
                    <small>{formatearFecha(employee.createdAt)}</small>
                  </td><td>
                    <div className="btn-group">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleEdit(employee)}
                        title="Editar"
                        disabled={isLoading}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => confirmDelete(employee)}
                        title="Eliminar"
                        disabled={isLoading}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VentanaUsuario;
