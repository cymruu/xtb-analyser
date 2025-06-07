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
