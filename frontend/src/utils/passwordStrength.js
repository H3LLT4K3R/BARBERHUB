const SYMBOL_REGEX = /[^A-Za-z0-9]/;

export function evaluarPassword(password) {
  const valor = String(password ?? "");
  const checks = {
    length: valor.length >= 8,
    lower: /[a-z]/.test(valor),
    upper: /[A-Z]/.test(valor),
    number: /\d/.test(valor),
    symbol: SYMBOL_REGEX.test(valor),
  };

  let nivel = "debil";
  if (checks.length && checks.lower && checks.number && checks.symbol) {
    nivel = checks.upper ? "fuerte" : "media";
  }

  const valida =
    checks.length && checks.lower && checks.number && checks.symbol;

  return { nivel, checks, valida };
}

export const REGLAS_PASSWORD = [
  { key: "length", label: "Mínimo 8 caracteres" },
  { key: "lower", label: "Una letra minúscula" },
  { key: "upper", label: "Una letra mayúscula (para contraseña fuerte)" },
  { key: "number", label: "Un número" },
  { key: "symbol", label: "Un símbolo (!@#$%…)" },
];
