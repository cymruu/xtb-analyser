// TODO: also parse time
export const parseDate = (v: string) => {
  const parts = v.split(" ");
  const date = parts[0];
  const dateElements = date.split("/");

  return new Date(dateElements.reverse().join("-"));
};
