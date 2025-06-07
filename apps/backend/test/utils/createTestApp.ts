import { createApp } from "../../src/app";
import { timeServiceMock } from "../../src/services/time/time";

export const createTestApp = async () => {
  return createApp({
    time: timeServiceMock,
  });
};
