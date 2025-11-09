import type { IServices } from "./services";

export type HonoEnv = {
  Variables: {
    services: IServices;
  };
};

export type TypedEntries<T> = { [K in keyof T]: [K, T[K]] }[keyof T][];
