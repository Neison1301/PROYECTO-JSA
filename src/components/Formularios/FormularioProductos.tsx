import React from 'react';
import { Package } from 'lucide-react';
import { Producto } from '../../domain/Producto'; 

// Definición de las props para el componente ProductoForm
interface ProductoFormProps {
  datosFormulario: {
    nombre: string;
    descripcion: string;
    precio: string;
    stock: string;
    categoria: string;
    sku: string;
  };
  errores: { [key: string]: string };
  productoEditando: Producto | null;
  manejarCambioInput: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  onCancel: () => void;
}

const ProductoForm: React.FC<ProductoFormProps> = ({
  datosFormulario,
  errores,
  productoEditando,
  manejarCambioInput,
  handleSubmit,
  onCancel,
}) => {
  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>
          <Package className="me-2" />
          {productoEditando ? 'Editar Producto' : 'Nuevo Producto'}
        </h4>
        <button
          className="btn btn-secondary"
          onClick={onCancel}
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
                className={`form-control ${errores.nombre ? 'is-invalid' : ''}`}
                id="nombre"
                name="nombre"
                placeholder="Nombre del producto"
                value={datosFormulario.nombre}
                onChange={manejarCambioInput}
              />
              <label htmlFor="nombre">Nombre del producto</label>
              {errores.nombre && <div className="invalid-feedback">{errores.nombre}</div>}
            </div>
          </div>

          <div className="col-md-6">
            <div className="form-floating mb-3">
              <input
                type="text"
                className={`form-control ${errores.sku ? 'is-invalid' : ''}`}
                id="sku"
                name="sku"
                placeholder="SKU"
                value={datosFormulario.sku}
                onChange={manejarCambioInput}
              />
              <label htmlFor="sku">SKU</label>
              {errores.sku && <div className="invalid-feedback">{errores.sku}</div>}
            </div>
          </div>
        </div>

        <div className="form-floating mb-3">
          <textarea
            className={`form-control ${errores.descripcion ? 'is-invalid' : ''}`}
            id="descripcion"
            name="descripcion"
            placeholder="Descripción"
            style={{ height: '100px' }}
            value={datosFormulario.descripcion}
            onChange={manejarCambioInput}
          />
          <label htmlFor="descripcion">Descripción</label>
          {errores.descripcion && <div className="invalid-feedback">{errores.descripcion}</div>}
        </div>

        <div className="row">
          <div className="col-md-4">
            <div className="form-floating mb-3">
              <input
                type="number"
                step="0.01"
                className={`form-control ${errores.precio ? 'is-invalid' : ''}`}
                id="precio"
                name="precio"
                placeholder="Precio"
                value={datosFormulario.precio}
                onChange={manejarCambioInput}
              />
              <label htmlFor="precio">Precio</label>
              {errores.precio && <div className="invalid-feedback">{errores.precio}</div>}
            </div>
          </div>

          <div className="col-md-4">
            <div className="form-floating mb-3">
              <input
                type="number"
                className={`form-control ${errores.stock ? 'is-invalid' : ''}`}
                id="stock"
                name="stock"
                placeholder="Stock"
                value={datosFormulario.stock}
                onChange={manejarCambioInput}
              />
              <label htmlFor="stock">Stock</label>
              {errores.stock && <div className="invalid-feedback">{errores.stock}</div>}
            </div>
          </div>

          <div className="col-md-4">
            <div className="form-floating mb-3">
              <input
                type="text"
                className={`form-control ${errores.categoria ? 'is-invalid' : ''}`}
                id="categoria"
                name="categoria"
                placeholder="Categoría"
                value={datosFormulario.categoria}
                onChange={manejarCambioInput}
              />
              <label htmlFor="categoria">Categoría</label>
              {errores.categoria && <div className="invalid-feedback">{errores.categoria}</div>}
            </div>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-gradient">
            {productoEditando ? 'Actualizar' : 'Guardar'} Producto
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductoForm;
