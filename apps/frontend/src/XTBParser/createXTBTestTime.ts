// XTB uses the time format "d/M/yyyy HH:mm:ss",
// which only supports whole seconds without fractions.
// To ensure uniqueness when generating an XTB time from an index,
// we increment the time in whole seconds.
export const createXTBTimeString = (i: number) => {
  return new Date(i * 1000);
};
