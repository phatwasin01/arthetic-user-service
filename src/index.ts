import { config } from "./config";

import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { buildSubgraphSchema } from "@apollo/subgraph";
import typeDefs from "./schema/user.typeDefs";
import resolvers from "./schema/user.resolvers";
import { AuthContext } from "./libs/auth";

const server = new ApolloServer<AuthContext>({
  schema: buildSubgraphSchema([{ typeDefs, resolvers }]),
});

(async () => {
  const { url } = await startStandaloneServer(server, {
    listen: { port: config.PORT },
    context: async ({ req }): Promise<AuthContext> => {
      const userId = req.headers["user-id"] as string | undefined;
      return { userId };
    },
  });

  console.log(`🚀  Server ready at: ${url}`);
})();
