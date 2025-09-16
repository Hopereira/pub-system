// Caminho: frontend/src/lib/socket.ts

import { io } from 'socket.io-client';

// Usamos a variável de ambiente que já configuramos no docker-compose
const URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Criamos a instância do socket. 
// O autoConnect: false garante que a conexão só será feita quando mandarmos.
export const socket = io(URL, {
  autoConnect: false,
});