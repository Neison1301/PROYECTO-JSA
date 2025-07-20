import React from 'react';
import { ShoppingCart, Plus, Trash2 } from 'lucide-react';
import { Cliente } from '../../domain/Cliente';
import { Producto } from '../../domain/Producto'; 
import { ItemVenta } from '../../domain/Venta'; 
import { formatearMoneda } from '../../utils'; 

// Definición de las props para el componente SaleForm
interface SaleFormProps {
  formData: {
    clientId: string;
    products: ItemVenta[];
    notes: string;
  };
  newItem: {
    productId: string;
    quantity: string;
  };
  clients: Cliente[];
  products: Producto[];
  setFormData: React.Dispatch<React.SetStateAction<{
    clientId: string;
    products: ItemVenta[];
    notes: string;
  }>>;
  setNewItem: React.Dispatch<React.SetStateAction<{
    productId: string;
    quantity: string;
  }>>;
  addProductToSale: () => void;
  removeProductFromSale: (productId: string) => void;
  calculateTotals: () => { subtotal: number; tax: number; total: number; };
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  onCancel: () => void;
}

const SaleForm: React.FC<SaleFormProps> = ({
  formData,
  newItem,
  clients,
  products,
  setFormData,
  setNewItem,
  addProductToSale,
  removeProductFromSale,
  calculateTotals,
  handleSubmit,
  onCancel,
}) => {
  const { subtotal, tax, total } = calculateTotals();

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>
          <ShoppingCart className="me-2" />
          Nueva Venta
        </h4>
        <button
          className="btn btn-secondary"
          onClick={onCancel}
        >
          Cancelar
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="form-floating">
              <select
                className="form-select"
                id="clientId"
                value={formData.clientId}
                onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                required
              >
                <option value="">Seleccionar cliente</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} - {client.email}
                  </option>
                ))}
              </select>
              <label htmlFor="clientId">Cliente</label>
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-header">
            <h6 className="mb-0">Productos</h6>
          </div>
          <div className="card-body">
            <div className="row mb-3">
              <div className="col-md-6">
                <select
                  className="form-select"
                  value={newItem.productId}
                  onChange={(e) => setNewItem(prev => ({ ...prev, productId: e.target.value }))}
                >
                  <option value="">Seleccionar producto</option>
                  {products.filter(p => p.stock > 0).map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {formatearMoneda(product.price)} (Stock: {product.stock})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Cantidad"
                  min="1"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem(prev => ({ ...prev, quantity: e.target.value }))}
                />
              </div>
              <div className="col-md-3">
                <button
                  type="button"
                  className="btn btn-primary w-100"
                  onClick={addProductToSale}
                  disabled={!newItem.productId || !newItem.quantity || Number(newItem.quantity) <= 0 || Number(newItem.quantity) > (products.find(p => p.id === newItem.productId)?.stock || 0)}
                >
                  <Plus size={18} className="me-1" />
                  Agregar
                </button>
              </div>
            </div>

            {formData.products.length > 0 && (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Precio</th>
                      <th>Total</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.products.map((item) => (
                      <tr key={item.productId}>
                        <td>{item.productName}</td>
                        <td>{item.quantity}</td>
                        <td>{formatearMoneda(item.price)}</td>
                        <td>{formatearMoneda(item.total)}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => removeProductFromSale(item.productId)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {formData.products.length > 0 && (
          <div className="card mb-4">
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="form-floating">
                    <textarea
                      className="form-control"
                      id="notes"
                      placeholder="Notas adicionales"
                      style={{ height: '100px' }}
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    />
                    <label htmlFor="notes">Notas adicionales</label>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card">
                    <div className="card-body">
                      <div className="d-flex justify-content-between mb-2">
                        <span>Subtotal:</span>
                        <span>{formatearMoneda(subtotal)}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>IVA (18%):</span>
                        <span>{formatearMoneda(tax)}</span>
                      </div>
                      <hr />
                      <div className="d-flex justify-content-between">
                        <strong>Total:</strong>
                        <strong className="text-primary">{formatearMoneda(total)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="d-flex gap-2">
          <button 
            type="submit" 
            className="btn btn-gradient"
            disabled={!formData.clientId || formData.products.length === 0}
          >
            Completar Venta
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

export default SaleForm;
