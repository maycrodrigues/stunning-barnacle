export const maskPhone = (value: string) => {
  if (!value) return "";
  
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, "");
  
  // Limit to 11 digits
  const limitedDigits = digits.slice(0, 11);
  
  // Apply mask (99) 99999-9999
  if (limitedDigits.length <= 2) {
    return limitedDigits;
  } else if (limitedDigits.length <= 7) {
    return `(${limitedDigits.slice(0, 2)}) ${limitedDigits.slice(2)}`;
  } else {
    return `(${limitedDigits.slice(0, 2)}) ${limitedDigits.slice(2, 7)}-${limitedDigits.slice(7)}`;
  }
};

export const unmaskPhone = (value: string) => {
  return value.replace(/\D/g, "");
};
