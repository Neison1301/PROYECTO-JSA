// Genera un ID único.
export const generarId = (): string => {
  // Combina la marca de tiempo actual con un número aleatorio para mayor unicidad.
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Formatea un número como moneda mexicana.
export const formatearMoneda = (cantidad: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',  // Estilo de formato de moneda.
    currency: 'MXN'     // Código de moneda para pesos mexicanos.
  }).format(cantidad);
};

// Formatea una fecha a un string con formato corto y hora.
export const formatearFecha = (fecha: Date | string): string => {
  // Convierte la entrada a un objeto Date si es un string.
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',  
    month: 'short',   
    day: 'numeric',  
    hour: '2-digit',  
    minute: '2-digit'  // Minutos en formato de dos dígitos.
  }).format(d);
};

// Valida si un string es un formato de email válido.
export const validarEmail = (email: string): boolean => {
  // Expresión regular para validar el formato de email.
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email); // Retorna verdadero si el email coincide con la regex.
};

// Valida si un string no está vacío después de eliminar espacios en blanco.
export const validarRequerido = (valor: string): boolean => {
  return valor.trim().length > 0; // Retorna verdadero si la longitud es mayor que 0.
};

// Valida si un string es un número válido y no negativo.
export const validarNumero = (valor: string): boolean => {
  // Comprueba si no es NaN y si el número es mayor o igual a cero.
  return !isNaN(Number(valor)) && Number(valor) >= 0;
};