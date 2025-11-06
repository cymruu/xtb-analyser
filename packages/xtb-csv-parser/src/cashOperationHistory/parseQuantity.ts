export const parseQuantity = (v: string): number => {
  const parts = v.split(" ");
  const value = parts[2]?.split("/")[0];

  return Number(value);
};
