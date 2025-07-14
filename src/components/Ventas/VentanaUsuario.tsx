// src/components/FormularioUsuario.tsx
import React, { useState, useEffect } from "react";
import { dataService } from "../../services/dataService";
import { generarId, validarRequerido, validarEmail } from "../../utils";
import { UserPlus, XCircle } from "lucide-react";
import { useWindows } from "../../contexts/WindowContext"; // Importa el contexto de ventanas
import { IUserData } from "../../domain/usuario";

interface FormularioUsuarioProps {
  onUserSaved: () => void;
  userToEdit?: IUserData | null; // Usuario a editar (opcional)
  windowId: string; // ID de la ventana para cerrarla
}

const FormularioUsuario: React.FC<FormularioUsuarioProps> = ({
  onUserSaved,
  userToEdit,
  windowId,
}) => {
  const { closeWindow } = useWindows(); // Obtiene la función para cerrar ventanas

  // Estado del formulario
  const [datosFormulario, setDatosFormulario] = useState({
    username: "",
    email: "",
    password: "",
    role: "empleado",
  });
  const [errores, setErrores] = useState<{ [key: string]: string }>({}); // Estado para errores de validación

  // Carga datos del usuario si se está editando
  useEffect(() => {
    if (userToEdit) {
      setDatosFormulario({
        username: userToEdit.username,
        email: userToEdit.email,
        password: "", // La contraseña no se carga para seguridad
        role: userToEdit.role,
      });
    } else {
      setDatosFormulario({
        username: "",
        email: "",
        password: "",
        role: "empleado",
      });
    }
  }, [userToEdit]);

  // Maneja cambios en los inputs del formulario
  const manejarCambioInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setDatosFormulario((prev) => ({ ...prev, [name]: value }));
    if (errores[name]) {
      setErrores((prev) => ({ ...prev, [name]: "" }));
    } // Limpia error al cambiar
  };

  // Valida los campos del formulario
  const validarFormulario = (): boolean => {
    const nuevosErrores: { [key: string]: string } = {};
    if (!validarRequerido(datosFormulario.username)) {
      nuevosErrores.username = "El nombre de usuario es requerido";
    }
    if (!validarRequerido(datosFormulario.email)) {
      nuevosErrores.email = "El correo es requerido";
    } else if (!validarEmail(datosFormulario.email)) {
      nuevosErrores.email = "El correo no es válido";
    }
    if (!userToEdit && !validarRequerido(datosFormulario.password)) {
      nuevosErrores.password = "La contraseña es requerida";
    }
    if (
      userToEdit &&
      datosFormulario.password &&
      !validarRequerido(datosFormulario.password)
    ) {
      nuevosErrores.password =
        "La contraseña no puede estar vacía si la estás cambiando";
    }

    // Validación de email existente
    const existingUsers = dataService.getUsers();
    const emailExistente = existingUsers.find(
      (u) =>
        u.email === datosFormulario.email &&
        (!userToEdit || u.id !== userToEdit.id)
    );
    if (emailExistente) {
      nuevosErrores.email = "Este correo ya está en uso";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0; // Retorna true si no hay errores
  };

  // Maneja el envío del formulario
  const manejarEnvio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) return; // Si la validación falla, no procede

    // Construye el objeto de usuario a guardar/actualizar
    const newUser: IUserData = {
      id: userToEdit?.id || generarId(), // Usa ID existente o genera uno nuevo
      username: datosFormulario.username,
      email: datosFormulario.email,
      password: datosFormulario.password || userToEdit?.password || "", // Mantiene contraseña si no se cambia
      role: datosFormulario.role as "admin" | "empleado",
      createdAt: userToEdit?.createdAt || new Date(),
      updatedAt: new Date(),
      isActive: true,
    };

    dataService.saveUser(newUser); // Guarda el usuario
    onUserSaved(); // Notifica que el usuario fue guardado
    closeWindow(windowId); // Cierra la ventana actual
  };

  return (
    <div className="modal-content fade-in">
      <div className="modal-header">
        <h5 className="modal-title">
          <UserPlus className="me-2" />
          {userToEdit ? "Editar Usuario" : "Nuevo empleado"}
        </h5>
      </div>
      <div className="modal-body">
        <form onSubmit={manejarEnvio}>
          <div className="mb-3">
            <br />
            <label htmlFor="username" className="form-label">
              Nombre de Usuario
            </label>
            <input
              type="text"
              className={`form-control ${errores.username ? "is-invalid" : ""}`}
              id="username"
              name="username"
              value={datosFormulario.username}
              onChange={manejarCambioInput}
              autoComplete="off"
            />
            {errores.username && (
              <div className="invalid-feedback">{errores.username}</div>
            )}
          </div>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Correo Electrónico
            </label>
            <input
              type="email"
              className={`form-control ${errores.email ? "is-invalid" : ""}`}
              id="email"
              name="email"
              value={datosFormulario.email}
              onChange={manejarCambioInput}
              autoComplete="off"
            />
            {errores.email && (
              <div className="invalid-feedback">{errores.email}</div>
            )}
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              Contraseña {userToEdit && "(dejar en blanco para no cambiar)"}
            </label>
            <input
              type="password"
              className={`form-control ${errores.password ? "is-invalid" : ""}`}
              id="password"
              name="password"
              value={datosFormulario.password}
              onChange={manejarCambioInput}
              autoComplete="off"
            />
            {errores.password && (
              <div className="invalid-feedback">{errores.password}</div>
            )}
          </div>
          <div className="mb-3">
            <label htmlFor="role" className="form-label">
              Rol
            </label>
            <select
              className="form-select"
              id="role"
              name="role"
              value={datosFormulario.role}
              onChange={manejarCambioInput}
            >
              <option value="empleado">Empleado</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => closeWindow(windowId)} // Cierra la ventana al cancelar
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-gradient">
              {userToEdit ? "Actualizar Usuario" : "Crear Usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormularioUsuario;
