/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { LoggerService } from "@nestjs/common";

export class SimpleTimestampLogger implements LoggerService {
  // Códigos ANSI para cores no terminal
  private readonly RESET = "\x1b[0m";
  private readonly GREEN = "\x1b[32m";
  private readonly YELLOW = "\x1b[33m";
  private readonly RED = "\x1b[31m";

  private getTime() {
    return new Date().toLocaleTimeString("pt-BR");
  }

  log(message: any, ...optionalParams: any[]) {
    // Verde 🟢
    console.log(`${this.GREEN}[${this.getTime()}] ${message}${this.RESET}`, ...optionalParams);
  }

  error(message: any, ...optionalParams: any[]) {
    // Vermelho 🔴
    console.error(`${this.RED}[${this.getTime()}] ${message}${this.RESET}`, ...optionalParams);
  }

  warn(message: any, ...optionalParams: any[]) {
    // Amarelo 🟡
    console.warn(`${this.YELLOW}[${this.getTime()}] ${message}${this.RESET}`, ...optionalParams);
  }

  debug(message: any, ...optionalParams: any[]) {
    // Opcional: Pode usar Azul ou Ciano para debug
    console.debug(`[${this.getTime()}] ${message}`, ...optionalParams);
  }
}
