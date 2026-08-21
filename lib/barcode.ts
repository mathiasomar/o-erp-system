const getRandomInt = (min: number, max: number): number => {
  const range = max - min + 1;

  if (
    typeof globalThis.crypto !== "undefined" &&
    "getRandomValues" in globalThis.crypto
  ) {
    const values = new Uint32Array(1);
    globalThis.crypto.getRandomValues(values);
    return min + (values[0] % range);
  }

  return Math.floor(Math.random() * range) + min;
};

export const generateBarcode = (): string => {
  const timestamp = Date.now().toString().slice(-8);
  const random = getRandomInt(1000, 9999).toString();

  return `${timestamp}${random}`;
};

export const generateSKU = (): string => {
  const timestamp = Date.now().toString().slice(-6);
  const random = getRandomInt(1000, 9999).toString();

  return `${timestamp}${random}`;
};
