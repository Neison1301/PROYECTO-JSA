import React, { useState, useEffect, useCallback } from 'react';
// import { dataService } from '../../services/dataService'; // No es necesario si solo usas clientService
import { Cliente } from '../../domain/Cliente'; // Asegúrate de que la ruta sea correcta
// Importaciones de utilidades y iconos
import { formatearFecha, validarRequerido, validarEmail } from '../../utils'; // Asegúrate de que la ruta sea correcta
import { Users, Plus, Edit, Trash2, Search, Mail, Phone, MapPin } from 'lucide-react';
import { clientService } from '../../services/servicioCliente'; // Asegúrate de que la ruta sea correcta
import ClienteForm from '../Formularios/FormularioClientes'; // Importa el nuevo componente del formulario

const VentanaClientes: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clientesFiltrados, setClientesFiltrados] = useState<Cliente[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [datosFormulario, setDatosFormulario] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    taxId: ''
  });
  const [errores, setErrores] = useState<{[key: string]: string}>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [cargando, setCargando] = useState<boolean>(true); // Nuevo estado de carga

  const cargarClientes = useCallback(async () => {
    setCargando(true); // Iniciar carga
    try {
      const clientesCargados = await clientService.getClients();
      // ¡Asegurarse de que el resultado sea un array antes de establecerlo!
      if (Array.isArray(clientesCargados)) {
        setClientes(clientesCargados);
        setErrorGeneral(null); // Limpiar errores si la carga fue exitosa
      } else {
        // Esto debería prevenir el TypeError si la API devuelve algo inesperado
        console.warn("clientService.getClients no devolvió un array:", clientesCargados);
        setClientes([]); // Asegura que `clientes` siempre sea un array
        setErrorGeneral("Los datos de clientes recibidos no tienen el formato esperado.");
      }
    } catch (error) {
      console.error("Error al cargar clientes:", error);
      setClientes([]); // Asegura que `clientes` sea un array vacío en caso de error
      setErrorGeneral("Error al cargar los clientes. Por favor, inténtalo de nuevo.");
    } finally {
      setCargando(false); // Finalizar carga
    }
  }, []);

  useEffect(() => {
    cargarClientes();
  }, [cargarClientes]);

  useEffect(() => {
    if (!terminoBusqueda) {
      setClientesFiltrados(clientes);
      return;
    }

    const filtrados = clientes.filter(cliente =>
      cliente.name.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      cliente.email.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      cliente.phone.includes(terminoBusqueda) ||
      cliente.taxId.toLowerCase().includes(terminoBusqueda.toLowerCase())
    );
    setClientesFiltrados(filtrados);
  }, [clientes, terminoBusqueda]);

  const resetearFormulario = () => {
    setDatosFormulario({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      taxId: ''
    });
    setErrores({});
    setErrorGeneral(null);
    setClienteEditando(null);
  };

  const validarFormulario = async (): Promise<boolean> => {
    const nuevosErrores: {[key: string]: string} = {};

    if (!validarRequerido(datosFormulario.name)) {
      nuevosErrores.name = 'El nombre es requerido';
    }
    if (!validarRequerido(datosFormulario.email)) {
      nuevosErrores.email = 'El correo es requerido';
    } else if (!validarEmail(datosFormulario.email)) {
      nuevosErrores.email = 'El correo no es válido';
    }
    if (!validarRequerido(datosFormulario.phone)) {
      nuevosErrores.phone = 'El teléfono es requerido';
    }
    if (!validarRequerido(datosFormulario.address)) {
      nuevosErrores.address = 'La dirección es requerida';
    }
    if (!validarRequerido(datosFormulario.city)) {
      nuevosErrores.city = 'La ciudad es requerida';
    }
    if (!validarRequerido(datosFormulario.taxId)) {
      nuevosErrores.taxId = 'El DNI es requerido';
    }

    try {
      // Usar `clientes` del estado para la validación si está ya cargado,
      // o cargar de nuevo si no se tiene certeza.
      // Para consistencia con tu código anterior, mantenemos la carga aquí.
      const allClients = await clientService.getClients(); 
      if (!Array.isArray(allClients)) {
          throw new Error("La API no devolvió un array de clientes para la validación.");
      }

      const correoExistente = allClients.find(c => 
        c.email === datosFormulario.email && (!clienteEditando || c.id !== clienteEditando.id)
      );
      if (correoExistente) {
        nuevosErrores.email = 'Este correo ya está registrado por otro cliente.';
      }
      const idFiscalExistente = allClients.find(c => 
        c.taxId === datosFormulario.taxId && (!clienteEditando || c.id !== clienteEditando.id)
      );
      if (idFiscalExistente) {
        nuevosErrores.taxId = 'Este DNI/ID fiscal ya está registrado por otro cliente.';
      }
    } catch (error) {
      console.error("Error al validar clientes existentes:", error);
      nuevosErrores.general = "Error al verificar datos existentes. Inténtalo de nuevo.";
    }

    setErrores(nuevosErrores);
    setErrorGeneral(nuevosErrores.general || null);
    return Object.keys(nuevosErrores).length === 0;
  };

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorGeneral(null);
    
    const esValido = await validarFormulario();
    if (!esValido) {
      console.log("Errores de validación:", errores);
      return;
    }

    const clienteASalvar: Cliente = {
      id: clienteEditando?.id || '', // Si es edición, usa el ID existente; de lo contrario, se asignará en el backend
      name: datosFormulario.name,
      email: datosFormulario.email,
      phone: datosFormulario.phone,
      address: datosFormulario.address,
      city: datosFormulario.city,
      taxId: datosFormulario.taxId,
      createdAt: clienteEditando?.createdAt || new Date(),
      updatedAt: new Date(), 
      isActive: clienteEditando?.isActive !== undefined ? clienteEditando.isActive : true
    };

    try {
      await clientService.guardarCliente(clienteASalvar);
      await cargarClientes(); // Recargar clientes después de guardar
      setMostrarFormulario(false);
      resetearFormulario();
      console.log('Cliente guardado correctamente.'); // Log para depuración
    } catch (error) {
      console.error("Error al guardar el cliente:", error);
      setErrorGeneral("Error al guardar el cliente. Por favor, inténtalo de nuevo.");
    }
  };

  const manejarEdicion = (cliente: Cliente) => {
    setClienteEditando(cliente);
    setDatosFormulario({
      name: cliente.name,
      email: cliente.email,
      phone: cliente.phone,
      address: cliente.address,
      city: cliente.city,
      taxId: cliente.taxId
    });
    setMostrarFormulario(true);
    setErrores({});
    setErrorGeneral(null);
  };

  const manejarEliminacion = async (cliente: Cliente) => {
    // Reemplazar window.confirm con un modal personalizado o log
    const confirmDelete = window.confirm(`¿Estás seguro de eliminar el cliente "${cliente.name}"? Esta acción es irreversible.`);
    if (confirmDelete) {
      try {
        await clientService.eliminarcliente(cliente.id);
        await cargarClientes(); // Recargar clientes después de eliminar
        console.log('Cliente eliminado correctamente.'); // Log para depuración
      } catch (error) {
        console.error("Error al eliminar el cliente:", error);
        setErrorGeneral("Error al eliminar el cliente. Por favor, inténtalo de nuevo.");
      }
    }
  };

  const manejarCambioInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDatosFormulario(prev => ({ ...prev, [name]: value }));
  
    if (errores[name]) {
      setErrores(prev => ({ ...prev, [name]: '' }));
    }
    setErrorGeneral(null);
  };

  // Función para manejar la cancelación del formulario
  const handleCancelForm = () => {
    setMostrarFormulario(false);
    resetearFormulario();
  };

  // Renderizado condicional: si se muestra el formulario
  if (mostrarFormulario) {
    return (
      <ClienteForm
        datosFormulario={datosFormulario}
        errores={errores}
        errorGeneral={errorGeneral}
        clienteEditando={clienteEditando}
        manejarCambioInput={manejarCambioInput}
        manejarEnvio={manejarEnvio}
        onCancel={handleCancelForm}
      />
    );
  }

  // Si está cargando, mostrar un mensaje de carga
  if (cargando) {
    return (
      <div className="fade-in text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando clientes...</span>
        </div>
        <p className="mt-3">Cargando clientes...</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>
          <Users className="me-2" />
          Gestión de Clientes
        </h4>
        <button
          className="btn btn-gradient"
          onClick={() => {
            setMostrarFormulario(true);
            resetearFormulario();
          }}
        >
          <Plus size={18} className="me-2" />
          Nuevo Cliente
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
              placeholder="Buscar clientes..."
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-6">
          <div className="text-end">
            <span className="text-muted">
              {clientesFiltrados.length} de {clientes.length} clientes
            </span>
          </div>
        </div>
      </div>

      {errorGeneral && (
        <div className="alert alert-danger mb-3" role="alert">
          {errorGeneral}
        </div>
      )}

      <div className="table-responsive">
        <table className="table table-modern">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Contacto</th>
              <th>Ubicación</th>
              <th>RFC/ID</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientesFiltrados.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-4">
                  <div className="text-muted">
                    <Users size={48} className="mb-2 opacity-50" />
                    <p>No se encontraron clientes</p>
                  </div>
                </td>
              </tr>
            ) : (
              clientesFiltrados.map((cliente) => (
                <tr key={cliente.id}>
                  <td>
                    <div>
                      <strong>{cliente.name}</strong>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div className="d-flex align-items-center mb-1">
                        <Mail size={14} className="me-1 text-muted" />
                        <small>{cliente.email}</small>
                      </div>
                      <div className="d-flex align-items-center">
                        <Phone size={14} className="me-1 text-muted" />
                        <small>{cliente.phone}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="d-flex align-items-center">
                      <MapPin size={14} className="me-1 text-muted" />
                      <div>
                        <small>{cliente.address}</small>
                        <br />
                        <small className="text-muted">{cliente.city}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <code className="small">{cliente.taxId}</code>
                  </td>
                  <td>
                    <span className={`status-badge ${cliente.isActive ? 'status-active' : 'status-inactive'}`}>
                      {cliente.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <small>{formatearFecha(cliente.createdAt)}</small>
                  </td>
                  <td>
                    <div className="btn-group">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => manejarEdicion(cliente)}
                        title="Editar"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => manejarEliminacion(cliente)}
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VentanaClientes;
