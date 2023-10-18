import { AuthContext } from "../libs/auth";
import { GraphQLError } from "graphql";

export const checkAuthContextThrowError = (context: AuthContext) => {
  const { userId } = context;
  if (!userId) {
    throw new GraphQLError("Unauthorized", {
      extensions: {
        code: "UNAUTHORIZED",
      },
    });
  }
  return userId;
};
