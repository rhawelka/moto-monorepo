import { Injectable } from '@angular/core';

@Injectable()
export class LoggerService {
  log(message: string) {
    console.log(new Date() + ': ' + JSON.stringify(message));
  }

  info(message: string) {
    console.info(new Date() + ': ' + JSON.stringify(message));
  }

  debug(message: string) {
    console.debug(new Date() + ': ' + JSON.stringify(message));
  }

  warn(message: string) {
    console.warn(new Date() + ': ' + JSON.stringify(message));
  }

  error(message: string) {
    console.error(new Date() + ': ' + JSON.stringify(message));
  }
}
