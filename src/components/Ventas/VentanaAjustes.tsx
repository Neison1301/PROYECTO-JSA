import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { dataService } from '../../services/dataService';
import { storage } from '../../services/almacenamiento';
import { Settings, User, Database, Download, Upload, Trash2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const VentanaConfiguracion: React.FC = () => {
  const { user } = useAuth();
  const [pestanaActiva, setPestanaActiva] = useState('perfil');
  const [datosPerfil, setDatosPerfil] = useState({
    nombreUsuario: user?.username || '',
    correoElectronico: user?.email || '',
    contrasenaActual: '',
    nuevaContrasena: '',
    confirmarContrasena: ''
  });
  const [mostrarZonaPeligro, setMostrarZonaPeligro] = useState(false);
  const [mensajePerfil, setMensajePerfil] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null);
  const [mensajeContrasena, setMensajeContrasena] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null);

  // Estados para las estadísticas de uso (como en la corrección anterior, ya que el error se mostró ahí)
  const [productCount, setProductCount] = useState(0);
  const [clientCount, setClientCount] = useState(0);
  const [saleCount, setSaleCount] = useState(0);
  const [userCount, setUserCount] = useState(0);

  // Efecto para cargar los contadores de datos
  useEffect(() => {
    // Solo carga los contadores si la pestaña activa es 'system'
    if (pestanaActiva === 'system') {
      const fetchCounts = async () => {
        try {
          const [products, clients, sales, users] = await Promise.all([
            dataService.getProducts(),
            dataService.getClients(),
            dataService.getSales(),
            dataService.getUsers()
          ]);
          setProductCount(products.length);
          setClientCount(clients.length);
          setSaleCount(sales.length);
          setUserCount(users.length);
        } catch (error) {
          console.error('Error al cargar contadores de datos:', error);
          setProductCount(0);
          setClientCount(0);
          setSaleCount(0);
          setUserCount(0);
        }
      };
      fetchCounts();
    }
    // Si la pestaña no es 'system', puedes opcionalmente resetear los contadores
    // Esto es útil si quieres que los números se actualicen cada vez que entras a la pestaña
    else {
      setProductCount(0);
      setClientCount(0);
      setSaleCount(0);
      setUserCount(0);
    }
  }, [pestanaActiva]);

  // Maneja la actualización de la información del perfil del usuario
  const manejarActualizacionPerfil = async (e: React.FormEvent) => { // ¡Añadido async aquí!
    e.preventDefault();
    setMensajePerfil(null);

    if (!datosPerfil.nombreUsuario.trim()) { setMensajePerfil({ tipo: 'error', texto: 'El nombre de usuario es requerido' }); return; }
    if (!datosPerfil.correoElectronico.trim()) { setMensajePerfil({ tipo: 'error', texto: 'El email es requerido' }); return; }
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexCorreo.test(datosPerfil.correoElectronico)) { setMensajePerfil({ tipo: 'error', texto: 'El email no es válido' }); return; }
    if (!user) { setMensajePerfil({ tipo: 'error', texto: 'Usuario no encontrado' }); return; }

    // ¡Usado await aquí!
    const exito = await authService.updateProfile(user.id, { username: datosPerfil.nombreUsuario, email: datosPerfil.correoElectronico });
    if (exito) {
      setMensajePerfil({ tipo: 'success', texto: 'Perfil actualizado correctamente' });
      setTimeout(() => { window.location.reload(); }, 1500);
    } else {
      setMensajePerfil({ tipo: 'error', texto: 'Error: El email o nombre de usuario ya existe' });
    }
  };

  // Maneja el cambio de contraseña del usuario
  const manejarCambioContrasena = async (e: React.FormEvent) => { // ¡Añadido async aquí!
    e.preventDefault();
    setMensajeContrasena(null);

    if (!datosPerfil.contrasenaActual) { setMensajeContrasena({ tipo: 'error', texto: 'La contraseña actual es requerida' }); return; }
    if (!datosPerfil.nuevaContrasena) { setMensajeContrasena({ tipo: 'error', texto: 'La nueva contraseña es requerida' }); return; }
    if (datosPerfil.nuevaContrasena !== datosPerfil.confirmarContrasena) { setMensajeContrasena({ tipo: 'error', texto: 'Las contraseñas no coinciden' }); return; }
    if (datosPerfil.nuevaContrasena.length < 6) { setMensajeContrasena({ tipo: 'error', texto: 'La contraseña debe tener al menos 6 caracteres' }); return; }
    if (!user) { setMensajeContrasena({ tipo: 'error', texto: 'Usuario no encontrado' }); return; }

    // ¡Usado await aquí!
    const exito = await authService.changePassword(user.id, datosPerfil.contrasenaActual, datosPerfil.nuevaContrasena);
    if (exito) {
      setMensajeContrasena({ tipo: 'success', texto: 'Contraseña cambiada correctamente' });
      setDatosPerfil(prev => ({ ...prev, contrasenaActual: '', nuevaContrasena: '', confirmarContrasena: '' }));
    } else {
      setMensajeContrasena({ tipo: 'error', texto: 'La contraseña actual es incorrecta' });
    }
  };

  // Exporta todos los datos del sistema a un archivo JSON
  const exportarDatos = async () => {
    try {
      const [productos, clientes, ventas, usuarios] = await Promise.all([
        dataService.getProducts(),
        dataService.getClients(),
        dataService.getSales(),
        dataService.getUsers()
      ]);

      const datos = {
        productos,
        clientes,
        ventas,
        usuarios,
        fechaExportacion: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bms-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert('Datos exportados correctamente.');
    } catch (error) {
      console.error('Error al exportar datos:', error);
      alert('Error al exportar datos. Revisa la consola.');
    }
  };

  // Elimina *localmente* todos los datos del sistema (solo localStorage)
  const limpiarTodosLosDatos = () => {
    const confirmacion = window.prompt('Esta acción eliminará TODOS los datos almacenados LOCALMENTE en su navegador.\n\nEscribe "ELIMINAR LOCAL" para confirmar:');
    if (confirmacion === 'ELIMINAR LOCAL') {
      storage.clear(); // Limpia el almacenamiento LOCAL (localStorage)
      alert('Todos los datos locales han sido eliminados. Si usas un backend, los datos persisten allí.');
      window.location.reload();
    } else {
      alert('Eliminación cancelada.');
    }
  };

  // NOTA: Se mantiene la eliminación de la funcionalidad de "restaurar valores por defecto"
  // y la llamada a initializeDefaultData(), ya que tu DataService no las implementa para la API.

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4><Settings className="me-2" /> Configuración del Sistema</h4>
      </div>

      <ul className="nav nav-tabs mb-4">
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
          </div>
          <div className="col-md-6">
            <div className="card border-danger">
              <div className="card-header bg-danger text-white">
                <h6 className="mb-0"><AlertTriangle size={18} className="me-2" /> Zona de Peligro</h6>
              </div>
              <div className="card-body">
                <p className="text-muted"><strong>¡Precaución!</strong> Las siguientes acciones son irreversibles y afectan SOLO a los datos almacenados localmente.</p>
                <div className="form-check mb-3">
                  <input className="form-check-input" type="checkbox" id="mostrarZonaPeligro" checked={mostrarZonaPeligro} onChange={(e) => setMostrarZonaPeligro(e.target.checked)} />
                  <label className="form-check-label" htmlFor="mostrarZonaPeligro">Mostrar opciones peligrosas</label>
                </div>
                {mostrarZonaPeligro && (
                  <div>
                    <hr />
                    <button className="btn btn-danger w-100" onClick={limpiarTodosLosDatos}><Trash2 size={18} className="me-2" /> Eliminar Todos los Datos Locales</button>
                    <small className="text-muted d-block mt-2">Esta acción eliminará permanentemente todos los datos de su navegador (productos, clientes, ventas y usuarios) que se hayan guardado LOCALMENTE. No afecta a los datos en el servidor.</small>
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
                    <div className="mb-2"><strong className="text-primary">{productCount}</strong></div>
                    <small className="text-muted">Productos</small>
                  </div>
                  <div className="col-3">
                    <div className="mb-2"><strong className="text-success">{clientCount}</strong></div>
                    <small className="text-muted">Clientes</small>
                  </div>
                  <div className="col-3">
                    <div className="mb-2"><strong className="text-warning">{saleCount}</strong></div>
                    <small className="text-muted">Ventas</small>
                  </div>
                  <div className="col-3">
                    <div className="mb-2"><strong className="text-info">{userCount}</strong></div>
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