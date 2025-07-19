import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import { User } from '../../domain/Usuario';
import { generarId, formatearFecha, validarRequerido, validarEmail } from '../../utils';
import { UserCheck, Plus, Edit, Trash2, Search, Mail, Shield, Eye, EyeOff } from 'lucide-react';

const VentanaUsuario: React.FC = () => {
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
    // fullName y position no son parte de la clase User, por lo que no se incluyen aquí para la persistencia.
    // Si necesitas estos campos en el formulario, se manejarán localmente y no se guardarán con el objeto User.
    role: 'empleado' as 'admin' | 'empleado' // El tipo de rol de la clase User
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Efecto para cargar empleados al montar el componente
  useEffect(() => {
    loadEmployees();
  }, []);

  // Efecto para filtrar empleados cuando la lista de empleados o el término de búsqueda cambian
  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm]);

  /**
   * Carga la lista de empleados desde el servicio de datos.
   * Filtra los usuarios para incluir solo aquellos que no son 'admin'.
   */
  const loadEmployees = async () => {
    try {
      const allUsers = await dataService.getUsers();
      // Filtra solo empleados y auxiliares (si 'auxiliar' fuera un rol en User, se incluiría aquí).
      // Dada la definición de User, solo 'admin' y 'empleado' son roles válidos.
      // Si 'auxiliar' se usa en el formulario, se mapea a 'empleado' al guardar.
      const employeeUsers = allUsers.filter(user => user.role !== 'admin');
      setEmployees(employeeUsers);
    } catch (error) {
      console.error("Error al cargar empleados:", error);
      // Aquí podrías establecer un estado de error para mostrar un mensaje al usuario
    }
  };

  /**
   * Filtra la lista de empleados basándose en el término de búsqueda.
   */
  const filterEmployees = () => {
    if (!searchTerm) {
      setFilteredEmployees(employees);
      return;
    }

    const filtered = employees.filter(employee =>
      employee.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.role.toLowerCase().includes(searchTerm.toLowerCase())
      // No se busca por fullName o position ya que no son propiedades del objeto User
    );
    setFilteredEmployees(filtered);
  };

  /**
   * Resetea el formulario a sus valores iniciales y limpia errores.
   */
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

  /**
   * Valida los campos del formulario antes de enviar.
   * Verifica campos requeridos, formato de email y si el usuario/email ya existen.
   * @returns {Promise<boolean>} True si el formulario es válido, false en caso contrario.
   */
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

    // La contraseña es requerida solo para nuevos empleados
    if (!editingEmployee && !validarRequerido(formData.password)) {
      newErrors.password = 'La contraseña es requerida';
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    // Se asume que fullName y position ya no son parte de la validación si no están en User.
    // Si los campos de fullName y position están en el formulario, pero no en el modelo User,
    // y aún así quieres validarlos, deberías agregarlos al estado formData y aquí a la validación.
    // Por el código actual, esos campos no están en el formulario de edición.

    // Verificar si el email ya existe
    const allUsers = await dataService.getUsers(); // Asegúrate de esperar la obtención de usuarios
    const existingEmail = allUsers.find(u => 
      u.email === formData.email && (!editingEmployee || u.id !== editingEmployee.id)
    );
    if (existingEmail) {
      newErrors.email = 'Este email ya está registrado';
    }

    // Verificar si el nombre de usuario ya existe
    const existingUsername = allUsers.find(u => 
      u.username === formData.username && (!editingEmployee || u.id !== editingEmployee.id)
    );
    if (existingUsername) {
      newErrors.username = 'Este nombre de usuario ya existe';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Maneja el envío del formulario para crear o actualizar un empleado.
   * @param {React.FormEvent} e El evento del formulario.
   */
  const handleSubmit = async (e: React.FormEvent) => { // Marcado como async
    e.preventDefault();
    
    // Espera a que la validación termine
    if (!(await validateForm())) return;

    // Mapea el rol del formulario al tipo de rol de la clase User.
    const roleToSave = formData.role as 'admin' | 'empleado';

    let employeeData: User;

    if (editingEmployee) {
      // Lógica para ACTUALIZAR un empleado existente
      employeeData = {
        ...editingEmployee, // Copia las propiedades existentes del empleado
        username: formData.username,
        email: formData.email,
        password: formData.password || editingEmployee.password || '', // Mantiene la contraseña si no se cambia
        role: roleToSave,
        // createdAt y isActive permanecen del editingEmployee
      };
    } else {
      // Lógica para CREAR un nuevo empleado
      // IMPORTANTE: NO se incluye el 'id' aquí. json-server lo generará automáticamente.
      // Si quieres usar generarId() para un ID generado en el cliente y persistirlo,
      // necesitarías que json-server no genere IDs automáticamente (lo cual no es su comportamiento por defecto)
      // o guardar tu ID generado en otra propiedad (ej. 'clientId').
      employeeData = {
        username: formData.username,
        email: formData.email,
        password: formData.password, // La contraseña es requerida para un nuevo usuario
        role: roleToSave,
        createdAt: new Date(),
        isActive: true
      } as User; // Se castea a User para satisfacer el tipo, aunque 'id' no esté explícitamente aquí.
    }

    try {
      // Espera a que la operación de guardar termine
      await dataService.saveUser(employeeData);
      console.log("Usuario guardado/actualizado con éxito. Recargando...");
      // Espera a que la recarga de empleados termine para asegurar la actualización de la UI
      await loadEmployees(); 
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error("Error al guardar/actualizar usuario:", error);
      // Podrías mostrar un mensaje de error al usuario aquí
    }
  };

  /**
   * Prepara el formulario para editar un empleado existente.
   * @param {User} employee El objeto empleado a editar.
   */
  const handleEdit = (employee: User) => {
    setEditingEmployee(employee);
    setFormData({
      username: employee.username,
      email: employee.email,
      password: '', // Siempre se deja vacío por seguridad
      role: employee.role // Asigna el rol existente
    });
    setShowForm(true);
  };

  /**
   * Maneja la eliminación de un empleado.
   * @param {User} employee El objeto empleado a eliminar.
   */
  const handleDelete = async (employee: User) => { // Marcado como async
    // Corregido: Uso de backticks para la template literal en window.confirm
    if (window.confirm(`¿Estás seguro de eliminar al empleado "${employee.username}"?`)) {
      try {
        // Espera a que la operación de eliminación termine
        await dataService.deleteUser(employee.id);
        console.log("Usuario eliminado con éxito. Recargando...");
        // Espera a que la recarga de empleados termine para asegurar la actualización de la UI
        await loadEmployees();
      } catch (error) {
        console.error("Error al eliminar usuario:", error);
        // Podrías mostrar un mensaje de error al usuario aquí
      }
    }
  };

  /**
   * Maneja los cambios en los campos del formulario y actualiza el estado.
   * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement>} e El evento de cambio.
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value as any })); // 'as any' para permitir 'auxiliar' si el select lo tiene
    
    // Limpia el error cuando el usuario comienza a escribir en el campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  /**
   * Devuelve la clase CSS del badge según el rol del empleado.
   * @param {string} role El rol del empleado.
   * @returns {string} La clase CSS correspondiente.
   */
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-danger';
      case 'empleado': return 'bg-primary';
      // Si 'auxiliar' se usa en el formulario, pero no es un tipo en User,
      // puedes mapearlo a un color aquí si es necesario para la visualización.
      // case 'auxiliar': return 'bg-warning';
      default: return 'bg-secondary';
    }
  };

  /**
   * Devuelve el texto legible del rol.
   * @param {string} role El rol del empleado.
   * @returns {string} El texto del rol.
   */
  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'empleado': return 'Empleado';
      // Si 'auxiliar' se usa en el formulario, puedes definir su texto aquí.
      // case 'auxiliar': return 'Auxiliar';
      default: return role;
    }
  };

  // Renderiza el formulario de creación/edición de empleado
  if (showForm) {
    return (
      <div className="fade-in">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4>
            <UserCheck className="me-2" />
            {editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
          </h4>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setShowForm(false);
              resetForm();
            }}
          >
            Cancelar
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Los campos fullName y position se han eliminado del formulario
              ya que no son parte de la clase User en tu dominio.
              Si necesitas capturarlos, deberías agregarlos al estado formData
              y a la clase User para persistencia. */}

          <div className="row">
            <div className="col-md-6">
              <div className="form-floating mb-3">
                {/* Corregido: backticks para className */}
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
                {/* Corregido: backticks para className */}
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
                  {/* Corregido: backticks para className */}
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
                  {/* Si 'auxiliar' no es un rol en User, esta opción no se guardará como tal */}
                  {/* <option value="auxiliar">Auxiliar</option> */}
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
                {/* Si 'auxiliar' es un rol que quieres describir, podrías añadirlo aquí */}
                {/* <div className="col-md-4">
                  <strong>Auxiliar:</strong>
                  <ul className="small text-muted">
                    <li>Ventas y clientes</li>
                    <li>Reportes básicos</li>
                    <li>Consulta únicamente</li>
                  </ul>
                </div> */}
              </div>
            </div>
          </div>

          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-gradient">
              {editingEmployee ? 'Actualizar' : 'Crear'} Empleado
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Renderiza la tabla de empleados
  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>
          <UserCheck className="me-2" />
          Gestión de Empleados
        </h4>
        <button
          className="btn btn-gradient"
          onClick={() => {
            resetForm(); // Asegura que el formulario esté limpio al abrir para nuevo empleado
            setShowForm(true);
          }}
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

      <div className="table-responsive">
        <table className="table table-modern">
          <thead>
            {/* Corregido: Eliminado el espacio en blanco entre <tr> y <th> */}
            <tr><th>Usuario</th><th>Contacto</th><th>Rol</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {filteredEmployees.length === 0 ? (
              // Corregido: Eliminado el espacio en blanco entre <tr> y <td>
              <tr><td colSpan={6} className="text-center py-4"> {/* colSpan ajustado a 6 */}
                  <div className="text-muted">
                    <UserCheck size={48} className="mb-2 opacity-50" />
                    <p>No se encontraron empleados</p>
                  </div>
                </td></tr>
            ) : (
              filteredEmployees.map((employee) => (
                // Corregido: Eliminado el espacio en blanco entre <tr> y <td>
                <tr key={employee.id}><td>
                    {/* Se muestra employee.username ya que fullName no está en la clase User */}
                    <strong>{employee.username}</strong> 
                  </td><td>
                    <div>
                      <div className="d-flex align-items-center mb-1">
                        <Mail size={14} className="me-1 text-muted" />
                        <small>{employee.email}</small>
                      </div>
                    </div>
                  </td><td>
                    {/* Corregido: backticks para className */}
                    <span className={`badge ${getRoleBadgeClass(employee.role)}`}>
                      {getRoleText(employee.role)}
                    </span>
                  </td><td>
                    {/* Corregido: backticks para className */}
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
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(employee)}
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td></tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VentanaUsuario;
