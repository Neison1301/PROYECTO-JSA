import React from 'react';
import { Cliente } from '../../domain/Cliente'; 
import { Users, XCircle } from 'lucide-react';

// Definición de las props para el componente ClienteForm
interface ClienteFormProps {
  datosFormulario: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    taxId: string;
  };
  errores: { [key: string]: string };
  errorGeneral: string | null;
  clienteEditando: Cliente | null;
  manejarCambioInput: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  manejarEnvio: (e: React.FormEvent) => Promise<void>;
  onCancel: () => void;
}

const ClienteForm: React.FC<ClienteFormProps> = ({
  datosFormulario,
  errores,
  errorGeneral,
  clienteEditando,
  manejarCambioInput,
  manejarEnvio,
  onCancel,
}) => {
  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>
          <Users className="me-2" />
          {clienteEditando ? 'Editar Cliente' : 'Nuevo Cliente'}
        </h4>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
        >
          <XCircle size={18} className="me-1" />
          Cancelar
        </button>
      </div>

      <form onSubmit={manejarEnvio}>
        <div className="row">
          <div className="col-md-6">
            <div className="form-floating mb-3">
              <input
                type="text"
                className={`form-control ${errores.name ? 'is-invalid' : ''}`}
                id="name"
                name="name"
                placeholder="Nombre completo"
                value={datosFormulario.name}
                onChange={manejarCambioInput}
              />
              <label htmlFor="name">Nombre completo</label>
              {errores.name && <div className="invalid-feedback">{errores.name}</div>}
            </div>
          </div>

          <div className="col-md-6">
            <div className="form-floating mb-3">
              <input
                type="email"
                className={`form-control ${errores.email ? 'is-invalid' : ''}`}
                id="email"
                name="email"
                placeholder="Correo"
                value={datosFormulario.email}
                onChange={manejarCambioInput}
              />
              <label htmlFor="email">Correo</label>
              {errores.email && <div className="invalid-feedback">{errores.email}</div>}
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <div className="form-floating mb-3">
              <input
                type="tel"
                className={`form-control ${errores.phone ? 'is-invalid' : ''}`}
                id="phone"
                name="phone"
                placeholder="Teléfono"
                value={datosFormulario.phone}
                onChange={manejarCambioInput}
              />
              <label htmlFor="phone">Teléfono</label>
              {errores.phone && <div className="invalid-feedback">{errores.phone}</div>}
            </div>
          </div>

          <div className="col-md-6">
            <div className="form-floating mb-3">
              <input
                type="text"
                className={`form-control ${errores.taxId ? 'is-invalid' : ''}`}
                id="taxId"
                name="taxId"
                placeholder="RFC/ID Fiscal"
                value={datosFormulario.taxId}
                onChange={manejarCambioInput}
              />
              <label htmlFor="taxId">RFC/ID Fiscal</label>
              {errores.taxId && <div className="invalid-feedback">{errores.taxId}</div>}
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-8">
            <div className="form-floating mb-3">
              <input
                type="text"
                className={`form-control ${errores.address ? 'is-invalid' : ''}`}
                id="address"
                name="address"
                placeholder="Dirección"
                value={datosFormulario.address}
                onChange={manejarCambioInput}
              />
              <label htmlFor="address">Dirección</label>
              {errores.address && <div className="invalid-feedback">{errores.address}</div>}
            </div>
          </div>

          <div className="col-md-4">
            <div className="form-floating mb-3">
              <input
                type="text"
                className={`form-control ${errores.city ? 'is-invalid' : ''}`}
                id="city"
                name="city"
                placeholder="Ciudad"
                value={datosFormulario.city}
                onChange={manejarCambioInput}
              />
              <label htmlFor="city">Ciudad</label>
              {errores.city && <div className="invalid-feedback">{errores.city}</div>}
            </div>
          </div>
        </div>

        {errorGeneral && (
          <div className="alert alert-danger mb-3" role="alert">
            {errorGeneral}
          </div>
        )}

        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-gradient">
            {clienteEditando ? 'Actualizar' : 'Guardar'} Cliente
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
          >
            <XCircle size={18} className="me-1" />
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClienteForm;
