import { ITimeService, timeService } from "./time/time";

export type IServices = {
  time: ITimeService;
};

export const createServices = async (): Promise<IServices> => {
  return {
    time: timeService,
  };
};
