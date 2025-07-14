import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import { Client } from '../../types';
import { generarId, formatearFecha, validarRequerido, validarEmail } from '../../utils';
import { Users, Plus, Edit, Trash2, Search, Mail, Phone, MapPin } from 'lucide-react';

const VentanaClientes: React.FC = () => {
  // Estado para la lista de clientes
  const [clientes, setClientes] = useState<Client[]>([]);
  const [clientesFiltrados, setClientesFiltrados] = useState<Client[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Client | null>(null);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [datosFormulario, setDatosFormulario] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    idFiscal: ''
  });
  const [errores, setErrores] = useState<{[key: string]: string}>({});

  // Cargar clientes al iniciar el componente
  useEffect(() => {
    cargarClientes();
  }, []);

  // Filtrar clientes cuando la lista o el término de búsqueda cambian
  useEffect(() => {
    filtrarClientes();
  }, [clientes, terminoBusqueda]);
  const cargarClientes = () => {
    const clientesCargados = dataService.getClients();
    setClientes(clientesCargados);
  };
  const filtrarClientes = () => {
    if (!terminoBusqueda) {
      setClientesFiltrados(clientes);
      return;
    }

    // Filtrar clientes por nombre, correo, teléfono o ID fiscal
    const filtrados = clientes.filter(cliente =>
      cliente.name.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      cliente.email.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      cliente.phone.includes(terminoBusqueda) ||
      cliente.taxId.toLowerCase().includes(terminoBusqueda.toLowerCase())
    );
    setClientesFiltrados(filtrados);
  };

  // Función para restablecer el formulario
  const resetearFormulario = () => {
    setDatosFormulario({
      nombre: '',
      correo: '',
      telefono: '',
      direccion: '',
      ciudad: '',
      idFiscal: ''
    });
    setErrores({});
    setClienteEditando(null);
  };

  // Función para validar el formulario
  const validarFormulario = (): boolean => {
    const nuevosErrores: {[key: string]: string} = {};

    if (!validarRequerido(datosFormulario.nombre)) {
      nuevosErrores.nombre = 'El nombre es requerido';
    }

    if (!validarRequerido(datosFormulario.correo)) {
      nuevosErrores.correo = 'El correo es requerido';
    } else if (!validarEmail(datosFormulario.correo)) {
      nuevosErrores.correo = 'El correo no es válido';
    }
    if (!validarRequerido(datosFormulario.telefono)) {
      nuevosErrores.telefono = 'El teléfono es requerido';
    }
    if (!validarRequerido(datosFormulario.direccion)) {
      nuevosErrores.direccion = 'La dirección es requerida';
    }

    if (!validarRequerido(datosFormulario.ciudad)) {
      nuevosErrores.ciudad = 'La ciudad es requerida';
    }
    if (!validarRequerido(datosFormulario.idFiscal)) {
      nuevosErrores.idFiscal = 'El DNI es requerido';
    }
    const correoExistente = clientes.find(c => 
      c.email === datosFormulario.correo && (!clienteEditando || c.id !== clienteEditando.id)
    );
    if (correoExistente) {
      nuevosErrores.correo = 'Este correo ya está registrado';
    }
    const idFiscalExistente = clientes.find(c => 
      c.taxId === datosFormulario.idFiscal && (!clienteEditando || c.id !== clienteEditando.id)
    );
    if (idFiscalExistente) {
      nuevosErrores.idFiscal = 'Este DNI fiscal ya está registrado';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Función para manejar el envío del formulario
  const manejarEnvio = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar el formulario antes de enviar
    if (!validarFormulario()) return;

    // Crear objeto cliente con los datos del formulario
    const datosCliente: Client = {
      id: clienteEditando?.id || generarId(), // Usar ID existente o generar uno nuevo
      name: datosFormulario.nombre,
      email: datosFormulario.correo,
      phone: datosFormulario.telefono,
      address: datosFormulario.direccion,
      city: datosFormulario.ciudad,
      taxId: datosFormulario.idFiscal,
      createdAt: clienteEditando?.createdAt || new Date(), // Mantener fecha de creación o usar nueva
      updatedAt: new Date(), 
      isActive: true // El cliente siempre está activo por defecto
    };

    // Guardar cliente y recargar la lista
    dataService.saveClient(datosCliente);
    cargarClientes();
    setMostrarFormulario(false);
    resetearFormulario();
  };

  // Función para manejar la edición de un cliente
  const manejarEdicion = (cliente: Client) => {
    setClienteEditando(cliente);
    setDatosFormulario({
      nombre: cliente.name,
      correo: cliente.email,
      telefono: cliente.phone,
      direccion: cliente.address,
      ciudad: cliente.city,
      idFiscal: cliente.taxId
    });
    setMostrarFormulario(true);
  };

  // Función para manejar la eliminación de un cliente
  const manejarEliminacion = (cliente: Client) => {
    // Confirmar la eliminación con el usuario
    if (window.confirm(`¿Estás seguro de eliminar el cliente "${cliente.name}"?`)) {
      dataService.deleteClient(cliente.id);
      cargarClientes();
    }
  };

  const manejarCambioInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDatosFormulario(prev => ({ ...prev, [name]: value }));
  
    // Limpiar error cuando el usuario comienza a escribir
    if (errores[name]) {
      setErrores(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Renderizado condicional: si se muestra el formulario
  if (mostrarFormulario) {
    return (
      <div className="fade-in">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4>
            <Users className="me-2" />
            {clienteEditando ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h4>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setMostrarFormulario(false);
              resetearFormulario();
            }}
          >
            Cancelar
          </button>
        </div>

        <form onSubmit={manejarEnvio}>
          <div className="row">
            <div className="col-md-6">
              <div className="form-floating mb-3">
                <input
                  type="text"
                  className={`form-control ${errores.nombre ? 'is-invalid' : ''}`}
                  id="nombre"
                  name="nombre"
                  placeholder="Nombre completo"
                  value={datosFormulario.nombre}
                  onChange={manejarCambioInput}
                />
                <label htmlFor="nombre">Nombre completo</label>
                {errores.nombre && <div className="invalid-feedback">{errores.nombre}</div>}
              </div>
            </div>

            <div className="col-md-6">
              <div className="form-floating mb-3">
                <input
                  type="email"
                  className={`form-control ${errores.correo ? 'is-invalid' : ''}`}
                  id="correo"
                  name="correo"
                  placeholder="Correo"
                  value={datosFormulario.correo}
                  onChange={manejarCambioInput}
                />
                <label htmlFor="correo">Correo</label>
                {errores.correo && <div className="invalid-feedback">{errores.correo}</div>}
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <div className="form-floating mb-3">
                <input
                  type="tel"
                  className={`form-control ${errores.telefono ? 'is-invalid' : ''}`}
                  id="telefono"
                  name="telefono"
                  placeholder="Teléfono"
                  value={datosFormulario.telefono}
                  onChange={manejarCambioInput}
                />
                <label htmlFor="telefono">Teléfono</label>
                {errores.telefono && <div className="invalid-feedback">{errores.telefono}</div>}
              </div>
            </div>

            <div className="col-md-6">
              <div className="form-floating mb-3">
                <input
                  type="text"
                  className={`form-control ${errores.idFiscal ? 'is-invalid' : ''}`}
                  id="idFiscal"
                  name="idFiscal"
                  placeholder="RFC/ID Fiscal"
                  value={datosFormulario.idFiscal}
                  onChange={manejarCambioInput}
                />
                <label htmlFor="idFiscal">RFC/ID Fiscal</label>
                {errores.idFiscal && <div className="invalid-feedback">{errores.idFiscal}</div>}
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-8">
              <div className="form-floating mb-3">
                <input
                  type="text"
                  className={`form-control ${errores.direccion ? 'is-invalid' : ''}`}
                  id="direccion"
                  name="direccion"
                  placeholder="Dirección"
                  value={datosFormulario.direccion}
                  onChange={manejarCambioInput}
                />
                <label htmlFor="direccion">Dirección</label>
                {errores.direccion && <div className="invalid-feedback">{errores.direccion}</div>}
              </div>
            </div>

            <div className="col-md-4">
              <div className="form-floating mb-3">
                <input
                  type="text"
                  className={`form-control ${errores.ciudad ? 'is-invalid' : ''}`}
                  id="ciudad"
                  name="ciudad"
                  placeholder="Ciudad"
                  value={datosFormulario.ciudad}
                  onChange={manejarCambioInput}
                />
                <label htmlFor="ciudad">Ciudad</label>
                {errores.ciudad && <div className="invalid-feedback">{errores.ciudad}</div>}
              </div>
            </div>
          </div>

          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-gradient">
              {clienteEditando ? 'Actualizar' : 'Guardar'} Cliente
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setMostrarFormulario(false);
                resetearFormulario();
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
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
          onClick={() => setMostrarFormulario(true)}
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