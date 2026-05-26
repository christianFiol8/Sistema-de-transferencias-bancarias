/**
 * Genera el número de cuenta de 10 dígitos según las reglas del proyecto:
 *
 * Estructura:
 *   - Dígitos 1-3 : Prefijo fijo "180"
 *   - Dígitos 4-9 : ID secuencial del usuario rellenado con ceros a la izquierda (6 dígitos)
 *   - Dígito 10   : Dígito verificador calculado con Módulo 10
 *
 * Ejemplo:
 *   Usuario ID 34  →  base = "180000034"  →  suma = 1+8+0+0+0+0+0+3+4 = 16  →  16 mod 10 = 6
 *   Resultado final: "1800000346"
 *
 * @param {number} idSecuencial - ID numérico del usuario en la base de datos
 * @returns {string} Número de cuenta de 10 dígitos
 */
function generarNumeroCuenta(idSecuencial) {
  const PREFIJO = "180";

  // Formatear ID a 6 dígitos con ceros a la izquierda
  const idFormateado = String(idSecuencial).padStart(6, "0");

  // Concatenar base de 9 dígitos
  const base = `${PREFIJO}${idFormateado}`;

  // Sumar todos los dígitos individuales
  const sumaDigitos = base
    .split("")
    .reduce((acc, digito) => acc + Number(digito), 0);

  // Cálculo Módulo 10
  const digitoVerificador = sumaDigitos % 10;

  // Concatenar dígito verificador al final
  return `${base}${digitoVerificador}`;
}

/**
 * Valida que un número de cuenta tenga exactamente 10 dígitos numéricos
 * usando la expresión regular requerida por el proyecto.
 *
 * @param {string} numeroCuenta
 * @returns {boolean}
 */
function validarFormatoCuenta(numeroCuenta) {
  return /^\d{10}$/.test(String(numeroCuenta || ""));
}

module.exports = { generarNumeroCuenta, validarFormatoCuenta };
