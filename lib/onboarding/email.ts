export type WorkEmailValidation = {
  valid: boolean;
  normalized: string;
};

const workEmailPattern = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59})$/i;

export function normalizeWorkEmail(value: string) {
  return value.trim().toLocaleLowerCase("en-US");
}

export function validateWorkEmail(value: string): WorkEmailValidation {
  const normalized = normalizeWorkEmail(value);
  return {
    normalized,
    valid: normalized.length <= 254 && workEmailPattern.test(normalized),
  };
}
