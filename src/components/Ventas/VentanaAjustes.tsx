import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { dataService } from '../../services/dataService';
import { storage } from '../../services/almacenamiento';
import { Settings, User, Database, Download, Upload, Trash2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const VentanaConfiguracion: React.FC = () => {
  const { user } = useAuth(); // Obtiene el usuario autenticado
  const [pestanaActiva, setPestanaActiva] = useState('perfil'); 
  const [datosPerfil, setDatosPerfil] = useState({ 
    nombreUsuario: user?.username || '',
    correoElectronico: user?.email || '',
    contrasenaActual: '',
    nuevaContrasena: '',
    confirmarContrasena: ''
  });
  const [mostrarZonaPeligro, setMostrarZonaPeligro] = useState(false); 
  const [mensajePerfil, setMensajePerfil] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null); // Mensajes de perfil
  const [mensajeContrasena, setMensajeContrasena] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null); 

  // Maneja la actualización de la información del perfil del usuario
  const manejarActualizacionPerfil = (e: React.FormEvent) => {
    e.preventDefault();
    setMensajePerfil(null); // Limpia mensajes anteriores

    if (!datosPerfil.nombreUsuario.trim()) { setMensajePerfil({ tipo: 'error', texto: 'El nombre de usuario es requerido' }); return; }
    if (!datosPerfil.correoElectronico.trim()) { setMensajePerfil({ tipo: 'error', texto: 'El email es requerido' }); return; }
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexCorreo.test(datosPerfil.correoElectronico)) { setMensajePerfil({ tipo: 'error', texto: 'El email no es válido' }); return; }
    if (!user) { setMensajePerfil({ tipo: 'error', texto: 'Usuario no encontrado' }); return; }
    // Intenta actualizar el perfil y muestra el resultado
    const exito = authService.updateProfile(user.id, { username: datosPerfil.nombreUsuario, email: datosPerfil.correoElectronico });
    if (exito) {
      setMensajePerfil({ tipo: 'success', texto: 'Perfil actualizado correctamente' });
      setTimeout(() => { window.location.reload(); }, 1500); // Recarga para aplicar cambios
    } else {
      setMensajePerfil({ tipo: 'error', texto: 'Error: El email o nombre de usuario ya existe' });
    }
  };

  // Maneja el cambio de contraseña del usuario
  const manejarCambioContrasena = (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeContrasena(null); // Limpia mensajes anteriores

    if (!datosPerfil.contrasenaActual) { setMensajeContrasena({ tipo: 'error', texto: 'La contraseña actual es requerida' }); return; }
    if (!datosPerfil.nuevaContrasena) { setMensajeContrasena({ tipo: 'error', texto: 'La nueva contraseña es requerida' }); return; }
    if (datosPerfil.nuevaContrasena !== datosPerfil.confirmarContrasena) { setMensajeContrasena({ tipo: 'error', texto: 'Las contraseñas no coinciden' }); return; }
    if (datosPerfil.nuevaContrasena.length < 6) { setMensajeContrasena({ tipo: 'error', texto: 'La contraseña debe tener al menos 6 caracteres' }); return; }
    if (!user) { setMensajeContrasena({ tipo: 'error', texto: 'Usuario no encontrado' }); return; }

    // Intenta cambiar la contraseña y muestra el resultado
    const exito = authService.changePassword(user.id, datosPerfil.contrasenaActual, datosPerfil.nuevaContrasena);
    if (exito) {
      setMensajeContrasena({ tipo: 'success', texto: 'Contraseña cambiada correctamente' });
      setDatosPerfil(prev => ({ ...prev, contrasenaActual: '', nuevaContrasena: '', confirmarContrasena: '' })); // Limpia campos
    } else {
      setMensajeContrasena({ tipo: 'error', texto: 'La contraseña actual es incorrecta' });
    }
  };

  // Exporta todos los datos del sistema a un archivo JSON
  const exportarDatos = () => {
    const datos = { // Recopila todos los datos relevantes
      productos: dataService.getProducts(),
      clientes: dataService.getClients(),
      ventas: dataService.getSales(),
      usuarios: dataService.getUsers(),
      fechaExportacion: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' }); // Crea un Blob
    const url = URL.createObjectURL(blob); // Crea una URL para el Blob
    const a = document.createElement('a'); // Crea un elemento para la descarga
    a.href = url;
    a.download = `bms-backup-${new Date().toISOString().split('T')[0]}.json`; // Define el nombre del archivo
    document.body.appendChild(a); a.click(); document.body.removeChild(a); // Simula clic y limpia
    URL.revokeObjectURL(url); // Libera la URL
  };

  // Elimina todos los datos del sistema y restaura datos por defecto
  const limpiarTodosLosDatos = () => {
    const confirmacion = window.prompt('Esta acción eliminará TODOS los datos del sistema.\n\nEscribe "ELIMINAR TODO" para confirmar:');
    if (confirmacion === 'ELIMINAR TODO') { // Confirma la acción
      storage.clear(); // Limpia el almacenamiento
      dataService.initializeDefaultData(); // Inicializa datos por defecto
      alert('Todos los datos han sido eliminados y se han restaurado los datos de ejemplo.');
      window.location.reload(); // Recarga la página
    }
  };

  // Restaura los datos de ejemplo del sistema
  const restaurarValoresPorDefecto = () => {
    if (window.confirm('¿Estás seguro de restaurar los datos de ejemplo? Esto no eliminará los datos existentes, pero agregará nuevos datos de muestra.')) {
      dataService.initializeDefaultData(); // Inicializa datos de ejemplo
      alert('Datos de ejemplo restaurados correctamente.');
    }
  };

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4><Settings className="me-2" /> Configuración del Sistema</h4>
      </div>

      <ul className="nav nav-tabs mb-4"> {/* Pestañas de navegación */}
        <li className="nav-item">
          <button className={`nav-link ${pestanaActiva === 'perfil' ? 'active' : ''}`} onClick={() => setPestanaActiva('perfil')}>
            <User size={18} className="me-2" /> Perfil
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${pestanaActiva === 'data' ? 'active' : ''}`} onClick={() => setPestanaActiva('data')}>
            <Database size={18} className="me-2" /> Datos
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${pestanaActiva === 'system' ? 'active' : ''}`} onClick={() => setPestanaActiva('system')}>
            <Settings size={18} className="me-2" /> Sistema
          </button>
        </li>
      </ul>

      {/* Contenido de la pestaña Perfil */}
      {pestanaActiva === 'perfil' && (
        <div className="row">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header"><h6 className="mb-0">Información del Perfil</h6></div>
              <div className="card-body">
                {mensajePerfil && (
                  <div className={`alert ${mensajePerfil.tipo === 'success' ? 'alert-success' : 'alert-danger'} d-flex align-items-center mb-3`}>
                    {mensajePerfil.tipo === 'success' ? (<CheckCircle size={18} className="me-2" />) : (<XCircle size={18} className="me-2" />)}
                    {mensajePerfil.texto}
                  </div>
                )}
                <form onSubmit={manejarActualizacionPerfil}>
                  <div className="form-floating mb-3">
                    <input type="text" className="form-control" id="nombreUsuario" placeholder="Nombre de usuario" value={datosPerfil.nombreUsuario} onChange={(e) => setDatosPerfil(prev => ({ ...prev, nombreUsuario: e.target.value }))} required />
                    <label htmlFor="nombreUsuario">Nombre de usuario</label>
                  </div>
                  <div className="form-floating mb-3">
                    <input type="email" className="form-control" id="correoElectronico" placeholder="Email" value={datosPerfil.correoElectronico} onChange={(e) => setDatosPerfil(prev => ({ ...prev, correoElectronico: e.target.value }))} required />
                    <label htmlFor="correoElectronico">Email</label>
                  </div>
                  <button type="submit" className="btn btn-primary"><User size={18} className="me-2" /> Actualizar Perfil</button>
                </form>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card">
              <div className="card-header"><h6 className="mb-0">Cambiar Contraseña</h6></div>
              <div className="card-body">
                {mensajeContrasena && (
                  <div className={`alert ${mensajeContrasena.tipo === 'success' ? 'alert-success' : 'alert-danger'} d-flex align-items-center mb-3`}>
                    {mensajeContrasena.tipo === 'success' ? (<CheckCircle size={18} className="me-2" />) : (<XCircle size={18} className="me-2" />)}
                    {mensajeContrasena.texto}
                  </div>
                )}
                <form onSubmit={manejarCambioContrasena}>
                  <div className="form-floating mb-3">
                    <input type="password" className="form-control" id="contrasenaActual" placeholder="Contraseña actual" value={datosPerfil.contrasenaActual} onChange={(e) => setDatosPerfil(prev => ({ ...prev, contrasenaActual: e.target.value }))} required />
                    <label htmlFor="contrasenaActual">Contraseña actual</label>
                  </div>
                  <div className="form-floating mb-3">
                    <input type="password" className="form-control" id="nuevaContrasena" placeholder="Nueva contraseña" value={datosPerfil.nuevaContrasena} onChange={(e) => setDatosPerfil(prev => ({ ...prev, nuevaContrasena: e.target.value }))} required />
                    <label htmlFor="nuevaContrasena">Nueva contraseña</label>
                  </div>
                  <div className="form-floating mb-3">
                    <input type="password" className="form-control" id="confirmarContrasena" placeholder="Confirmar contraseña" value={datosPerfil.confirmarContrasena} onChange={(e) => setDatosPerfil(prev => ({ ...prev, confirmarContrasena: e.target.value }))} required />
                    <label htmlFor="confirmarContrasena">Confirmar contraseña</label>
                  </div>
                  <button type="submit" className="btn btn-warning"><Settings size={18} className="me-2" /> Cambiar Contraseña</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenido de la pestaña Datos */}
      {pestanaActiva === 'data' && (
        <div className="row">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header"><h6 className="mb-0">Respaldo de Datos</h6></div>
              <div className="card-body">
                <p className="text-muted">Exporta todos los datos del sistema para crear un respaldo completo.</p>
                <button className="btn btn-success" onClick={exportarDatos}><Download size={18} className="me-2" /> Exportar Datos</button>
              </div>
            </div>
            <div className="card mt-3">
              <div className="card-header"><h6 className="mb-0">Restaurar Datos de Ejemplo</h6></div>
              <div className="card-body">
                <p className="text-muted">Restaura los datos de ejemplo del sistema para pruebas.</p>
                <button className="btn btn-info" onClick={restaurarValoresPorDefecto}><Upload size={18} className="me-2" /> Restaurar Ejemplos</button>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card border-danger">
              <div className="card-header bg-danger text-white">
                <h6 className="mb-0"><AlertTriangle size={18} className="me-2" /> Zona de Peligro</h6>
              </div>
              <div className="card-body">
                <p className="text-muted"><strong>¡Precaución!</strong> Las siguientes acciones son irreversibles.</p>
                <div className="form-check mb-3">
                  <input className="form-check-input" type="checkbox" id="mostrarZonaPeligro" checked={mostrarZonaPeligro} onChange={(e) => setMostrarZonaPeligro(e.target.checked)} />
                  <label className="form-check-label" htmlFor="mostrarZonaPeligro">Mostrar opciones peligrosas</label>
                </div>
                {mostrarZonaPeligro && (
                  <div>
                    <hr />
                    <button className="btn btn-danger w-100" onClick={limpiarTodosLosDatos}><Trash2 size={18} className="me-2" /> Eliminar Todos los Datos</button>
                    <small className="text-muted d-block mt-2">Esta acción eliminará permanentemente todos los productos, clientes, ventas y usuarios.</small>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenido de la pestaña Sistema */}
      {pestanaActiva === 'system' && (
        <div className="row">
          <div className="col-md-8">
            <div className="card">
              <div className="card-header"><h6 className="mb-0">Información del Sistema</h6></div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <dl className="row">
                      <dt className="col-sm-5">Versión:</dt><dd className="col-sm-7">1.0.0</dd>
                      <dt className="col-sm-5">Framework:</dt><dd className="col-sm-7">React + Vite</dd>
                      <dt className="col-sm-5">Almacenamiento:</dt><dd className="col-sm-7">LocalStorage</dd>
                    </dl>
                  </div>
                  <div className="col-md-6">
                    <dl className="row">
                      <dt className="col-sm-5">Usuario:</dt><dd className="col-sm-7">{user?.username}</dd>
                      <dt className="col-sm-5">Rol:</dt>
                      <dd className="col-sm-7">
                        <span className={`badge ${user?.role === 'admin' ? 'bg-danger' : 'bg-primary'}`}>{user?.role}</span>
                      </dd>
                      <dt className="col-sm-5">Sesión:</dt><dd className="col-sm-7">Activa</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="card mt-3">
              <div className="card-header"><h6 className="mb-0">Estadísticas de Uso</h6></div>
              <div className="card-body">
                <div className="row text-center">
                  <div className="col-3">
                    <div className="mb-2"><strong className="text-primary">{dataService.getProducts().length}</strong></div>
                    <small className="text-muted">Productos</small>
                  </div>
                  <div className="col-3">
                    <div className="mb-2"><strong className="text-success">{dataService.getClients().length}</strong></div>
                    <small className="text-muted">Clientes</small>
                  </div>
                  <div className="col-3">
                    <div className="mb-2"><strong className="text-warning">{dataService.getSales().length}</strong></div>
                    <small className="text-muted">Ventas</small>
                  </div>
                  <div className="col-3">
                    <div className="mb-2"><strong className="text-info">{dataService.getUsers().length}</strong></div>
                    <small className="text-muted">Usuarios</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card">
              <div className="card-header"><h6 className="mb-0">Acceso Rápido</h6></div>
              <div className="card-body">
                <div className="d-grid gap-2">
                  <button className="btn btn-outline-primary" onClick={() => window.open('https://github.com', '_blank')}>Documentación</button>
                  <button className="btn btn-outline-secondary" onClick={() => alert('Soporte técnico: support@bms.com')}>Soporte Técnico</button>
                  <button className="btn btn-outline-info" onClick={() => alert('Business Management System v1.0.0\nDesarrollado con React + Vite\n© 2024')}>Acerca de</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VentanaConfiguracion;