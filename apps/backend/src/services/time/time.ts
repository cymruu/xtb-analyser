import { Context, Effect, Layer } from "effect";

export interface ITimeService {
  now(): Date;
}

export const timeService = {
  now() {
    return new Date();
  },
};

export const timeServiceMock = {
  now() {
    return new Date(0);
  },
};

export class TimeService extends Context.Tag("TimeService")<
  TimeService,
  {
    now: () => Date;
  }
>() {}

export const TimeServiceLive = Layer.succeed(TimeService, timeService);
export const TimeServiceMock = Layer.succeed(TimeService, timeServiceMock);
