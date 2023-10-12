import { GraphQLResolverMap } from "@apollo/subgraph/dist/schema-helper";
import prisma from "../db";
import { Prisma } from "@prisma/client";
import { GraphQLError } from "graphql";
import {
  hashPassword,
  verifyPassword,
  signJwtToken,
  AuthContext,
} from "../libs/auth";
const resolvers: GraphQLResolverMap<AuthContext> = {
  Query: {
    users: async (parent: any, args: any, context) => {
      console.log("users", context);
      return await prisma.user.findMany();
    },
    user: async (_: any, args: any) => {
      const { id } = args;
      return await prisma.user.findUnique({
        where: {
          id,
        },
      });
    },
    publicUserProfile: async (_: any, args: { username: string }) => {
      const { username } = args;
      return await prisma.user.findUnique({
        where: {
          username,
        },
      });
    },
    userProfile: async (parent: unknown, args: unknown, context) => {
      const { userId } = context;
      if (!userId) {
        throw new GraphQLError("Unauthorized", {
          extensions: {
            code: "UNAUTHORIZED",
          },
        });
      }
      return await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });
    },
  },
  Posts: {
    author: async (parent: any, args: any) => {
      console.log("Posts Parent: ", parent);
      const { userId } = parent;
      return await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });
    },
  },
  Comments: {
    author: async (parent: any, args: any) => {
      console.log("Comments Parent: ", parent);
      const { userId } = parent;
      return await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });
    },
  },
  Likes: {
    user: async (like: any) => {
      console.log("Likes Info: ", like);
      return await prisma.user.findUnique({
        where: {
          id: like.userId,
        },
      });
    },
  },
  User: {
    follows: async (parent: { id: string }) => {
      const following = await prisma.follow.findMany({
        where: {
          followerId: parent.id,
        },
      });
      console.log("following", following);
      return following;
    },
    followers: async (parent: { id: string }) => {
      return await prisma.follow.findMany({
        where: {
          followingId: parent.id,
        },
      });
    },
    followsIds: async (parent: { id: string }) => {
      const following = await prisma.follow.findMany({
        where: {
          followerId: parent.id,
        },
      });
      return following.map((follow) => follow.followingId);
    },
  },
  Follows: {
    follower: async (follow: any) => {
      return await prisma.user.findUnique({
        where: {
          id: follow.followerId,
        },
      });
    },
    following: async (follow: any) => {
      return await prisma.user.findUnique({
        where: {
          id: follow.followingId,
        },
      });
    },
  },
  Mutation: {
    createUser: async (
      parent: any,
      args: { username: string; password: string; fname: string; lname: string }
    ) => {
      try {
        const hashedPassword = await hashPassword(args.password);
        const user = await prisma.user.create({
          data: {
            username: args.username,
            password: hashedPassword,
            fname: args.fname,
            lname: args.lname,
          },
        });
        return user;
      } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2002") {
            throw new GraphQLError("Username already exists", {
              extensions: {
                code: "USERNAME_ALREADY_EXISTS",
              },
            });
          }
        }
        throw new GraphQLError("Something went wrong", {
          extensions: {
            code: "INTERNAL_SERVER_ERROR",
          },
        });
      }
    },
    login: async (
      parent: any,
      args: { username: string; password: string }
    ) => {
      try {
        const user = await prisma.user.findUnique({
          where: {
            username: args.username,
          },
        });
        if (!user) {
          throw new GraphQLError("User not found", {
            extensions: {
              code: "USER_NOT_FOUND",
            },
          });
        }
        const validPassword = await verifyPassword(
          args.password,
          user.password
        );
        if (!validPassword) {
          throw new GraphQLError("Invalid password", {
            extensions: {
              code: "INVALID_PASSWORD",
            },
          });
        }
        const jwtToken = await signJwtToken(user.id);
        return {
          token: jwtToken,
        };
      } catch (error: any) {
        if (error instanceof GraphQLError) {
          throw error;
        }
        throw new GraphQLError("Something went wrong", {
          extensions: {
            code: "INTERNAL_SERVER_ERROR",
          },
        });
      }
    },
    followUser: async (parent: any, args: any, context) => {
      const { userId } = context;
      if (!userId) {
        throw new GraphQLError("Unauthorized", {
          extensions: {
            code: "UNAUTHORIZED",
          },
        });
      }
      const follow = await prisma.follow.create({
        data: {
          followerId: userId,
          followingId: args.followingId,
        },
      });
      return follow;
    },
    unfollowUser: async (parent: any, args: any, context) => {
      const { userId } = context;
      if (!userId) {
        throw new GraphQLError("Unauthorized", {
          extensions: {
            code: "UNAUTHORIZED",
          },
        });
      }
      const follow = await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: args.followingId,
          },
        },
      });
      return follow;
    },
  },
};

export default resolvers;
