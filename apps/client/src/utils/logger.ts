import { createLogger } from "vite";

// 1. Criamos uma instância do logger original do Vite
export const logger = createLogger();
const originalInfo = logger.info;
const originalWarn = logger.warn;
const originalError = logger.error;

// 2. Definimos as cores (ANSI)
const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const CLIENT_COLOR = "\x1b[36m"; // Ciano

// Função auxiliar de tempo
const getTime = () => new Date().toLocaleTimeString("pt-BR");

// 3. Configuração do Prefixo
// [CLIENT] ficará Ciano
const PREFIX = `${CLIENT_COLOR}[CLIENT]`;

logger.info = (msg, options) => {
  // O Vite às vezes limpa a tela mandando string vazia, ignoramos
  if (msg === "") return;

  // Remove o texto "[vite]" se ele vier na mensagem para não ficar duplicado
  const cleanMsg = msg.replace("[vite] ", "");

  // Injeta: [CLIENT](ciano) [HORA](verde) Mensagem
  // Passamos timestamp: false para o Vite não adicionar a hora dele também
  originalInfo(`${PREFIX}${GREEN}[${getTime()}]${RESET} ${cleanMsg}`, {
    ...options,
    timestamp: false,
  });
};

logger.warn = (msg, options) => {
  const cleanMsg = msg.replace("[vite] ", "");
  originalWarn(`${PREFIX}${YELLOW}[${getTime()}]${RESET} ${cleanMsg}`, {
    ...options,
    timestamp: false,
  });
};

logger.error = (msg, options) => {
  const cleanMsg = msg.replace("[vite] ", "");
  originalError(`${PREFIX}${RED}[${getTime()}]${RESET} ${cleanMsg}`, {
    ...options,
    timestamp: false,
  });
};
