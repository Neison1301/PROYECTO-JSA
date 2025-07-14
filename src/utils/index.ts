// Genera un ID único.
export const generarId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Formatea un número como moneda
export const formatearMoneda = (cantidad: number): string => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',  // Estilo de formato de moneda.
    currency: 'PEN'     // Código de moneda para pesos mexicanos.
  }).format(cantidad);
};

// Formatea una fecha 
export const formatearFecha = (fecha: Date | string): string => {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',  
    month: 'short',   
    day: 'numeric',  
    hour: '2-digit',  
  }).format(d);
};

// Valida si un string es un formato de email válido.
export const validarEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email); 
};

export const validarRequerido = (valor: string): boolean => {
  return valor.trim().length > 0; // Retorna verdadero si la longitud es mayor que 0.
};

export const validarNumero = (valor: string): boolean => {
  return !isNaN(Number(valor)) && Number(valor) >= 0;
};