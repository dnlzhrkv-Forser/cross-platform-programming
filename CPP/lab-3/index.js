import dns from 'node:dns';
import dotenv from 'dotenv';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';
import { getUserFromAuthHeader } from './auth.js';
import { connectDB } from './services/db.js';

dns.setServers(['8.8.8.8', '1.1.1.1']); // обхід проблем DNS (querySrv ECONNREFUSED), як у server.js
dotenv.config();

// Порт GraphQL окремий від PORT REST-сервера (3000), який теж лежить у .env
const PORT = Number(process.env.GRAPHQL_PORT) || 4001;

const server = new ApolloServer({ typeDefs, resolvers });

await startStandaloneServer(server, {
  listen: { port: PORT },
  // Для кожного запиту: заголовок Authorization -> користувач -> context.user
  context: async ({ req }) => ({
    user: getUserFromAuthHeader(req.headers.authorization),
  }),
});

console.log(`GraphQL API запущено за адресою: http://localhost:${PORT}/`);

// Сервер не падає, якщо БД недоступна: реєстрація, вхід і me працюють без неї
connectDB(process.env.MONGO_URI);
