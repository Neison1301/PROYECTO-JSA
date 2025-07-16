// src/components/FormularioUsuario.tsx
import React, { useState, useEffect } from "react";
import { dataService } from "../../services/dataService";
import { generarId, validarRequerido, validarEmail } from "../../utils"; // `generarId` ya no se usará para nuevos usuarios aquí
import { UserPlus, XCircle } from "lucide-react";
import { useWindows } from "../../contexts/WindowContext";
import { User  } from "../../domain/Usuario";

interface FormularioUsuarioProps {
  onUserSaved: () => void;
  userToEdit?: User  | null;
  windowId: string;
}

const FormularioUsuario: React.FC<FormularioUsuarioProps> = ({
  onUserSaved,
  userToEdit,
  windowId,
}) => {
  const { closeWindow } = useWindows();

  const [datosFormulario, setDatosFormulario] = useState({
    username: "",
    email: "",
    password: "",
    role: "empleado",
  });
  const [errores, setErrores] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (userToEdit) {
      setDatosFormulario({
        username: userToEdit.username,
        email: userToEdit.email,
        password: "",
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
    setErrores({});
  }, [userToEdit]);

  const manejarCambioInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setDatosFormulario((prev) => ({ ...prev, [name]: value }));
    if (errores[name]) {
      setErrores((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validarFormulario = async (): Promise<boolean> => {
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
    if (userToEdit && datosFormulario.password && !validarRequerido(datosFormulario.password)) {
      nuevosErrores.password = "La contraseña no puede estar vacía si la estás cambiando";
    }

    try {
      const existingUsers = await dataService.getUsers();
      const emailExistente = existingUsers.find(
        (u) =>
          u.email === datosFormulario.email &&
          (!userToEdit || u.id !== userToEdit.id)
      );
      if (emailExistente) {
        nuevosErrores.email = "Este correo ya está en uso por otro usuario.";
      }
    } catch (error) {
      console.error("Error al verificar usuarios existentes:", error);
      nuevosErrores.general = "Error al verificar la base de datos.";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    const esValido = await validarFormulario();
    if (!esValido) {
      console.log("Errores de validación:", errores);
      return;
    }

    // --- CAMBIOS AQUÍ ---
    // Objeto base con los datos del formulario
    const baseUserData = {
      username: datosFormulario.username,
      email: datosFormulario.email,
      password: datosFormulario.password || userToEdit?.password || "",
      role: datosFormulario.role as "admin" | "empleado",
      isActive: userToEdit?.isActive !== undefined ? userToEdit.isActive : true,
    };

    let userToSave: User ;

    if (userToEdit) {
      // Si estamos EDITANDO un usuario existente
      userToSave = {
        ...baseUserData,
        id: userToEdit.id, // Mantenemos el ID existente
        // `createdAt` se mantendrá desde `userToEdit` y `updatedAt` lo manejará `saveData`
        createdAt: userToEdit.createdAt, // Asegúrate de mantener la fecha de creación original
      };
    } else {
      // Si estamos CREANDO un nuevo usuario
      userToSave = {
        ...baseUserData,
        // ¡IMPORTANTE! No se incluye el 'id' aquí. JSON Server lo generará.
        // `createdAt` y `updatedAt` serán establecidos en `saveData` para la creación
      } as User ; // Casteamos para asegurar que coincida con IUserData aunque le falte el ID por un momento
    }
    // --- FIN CAMBIOS ---

    try {
      await dataService.saveUser(userToSave);
      onUserSaved();
      closeWindow(windowId);
    } catch (error) {
      console.error("Error al guardar el usuario:", error);
      setErrores((prev) => ({ ...prev, general: "Error al guardar el usuario. Inténtalo de nuevo." }));
    }
  };

  return (
    <div className="modal-content fade-in">
      <div className="modal-header">
        <h5 className="modal-title">
          <UserPlus className="me-2" />
          {userToEdit ? "Editar Usuario" : "Nuevo empleado"}
        </h5>
        <button
          type="button"
          className="btn-close"
          aria-label="Cerrar"
          onClick={() => closeWindow(windowId)}
        ></button>
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
              autoComplete="new-password"
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
          {errores.general && (
            <div className="alert alert-danger" role="alert">
              {errores.general}
            </div>
          )}
          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => closeWindow(windowId)}
            >
              <XCircle size={18} className="me-1" />
              Cancelar
            </button>
            <button type="submit" className="btn btn-gradient">
              <UserPlus size={18} className="me-1" />
              {userToEdit ? "Actualizar Usuario" : "Crear Usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormularioUsuario;