import { LoggerService } from './logger';

describe('LoggerService', () => {
  let logger: LoggerService;

  beforeEach(() => {
    logger = new LoggerService();
  });

  it('should work', () => {
    expect(logger).toBeTruthy();
  });
});
