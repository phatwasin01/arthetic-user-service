/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { checkAuthContextThrowError } from "../utils/context";
const resolvers: GraphQLResolverMap<AuthContext> = {
  Query: {
    helloworld: () => {
      return "hello world";
    },
    users: async () => {
      return await prisma.user.findMany();
    },
    user: async (_: unknown, args: { username: string }) => {
      const { username } = args;
      return await prisma.user.findUnique({
        where: {
          username,
        },
      });
    },
    publicUserProfile: async (_: unknown, args: { username: string }) => {
      const { username } = args;
      return await prisma.user.findUnique({
        where: {
          username,
        },
      });
    },
    userProfile: async (parent: unknown, args: unknown, context) => {
      const userId = checkAuthContextThrowError(context);
      return await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });
    },
  },
  Posts: {
    author: async (parent: { userId: string }) => {
      const { userId } = parent;
      return await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });
    },
    repostUser: async (parent: { repostUserId: string }) => {
      const { repostUserId } = parent;
      if (!repostUserId) return null;
      return await prisma.user.findUnique({
        where: {
          id: repostUserId,
        },
      });
    },
  },
  Comments: {
    author: async (parent: { userId: string }) => {
      const { userId } = parent;
      return await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });
    },
  },
  Likes: {
    user: async (parent: { userId: string }) => {
      const { userId } = parent;
      return await prisma.user.findUnique({
        where: {
          id: userId,
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
      const followingIds = following.map((follow) => follow.followerId);
      return followingIds;
    },
  },
  Follows: {
    follower: async (parent: { followerId: string }) => {
      const { followerId } = parent;
      return await prisma.user.findUnique({
        where: {
          id: followerId,
        },
      });
    },
    following: async (parent: { followingId: string }) => {
      const { followingId } = parent;
      return await prisma.user.findUnique({
        where: {
          id: followingId,
        },
      });
    },
  },
  Mutation: {
    createUser: async (
      parent: unknown,
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
      parent: unknown,
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
    followUser: async (
      parent: unknown,
      args: { followingId: string },
      context
    ) => {
      const userId = checkAuthContextThrowError(context);
      if (userId === args.followingId) {
        throw new GraphQLError("You cannot follow yourself", {
          extensions: {
            code: "CANNOT_FOLLOW_YOURSELF",
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
    unfollowUser: async (
      parent: any,
      args: { followingId: string },
      context
    ) => {
      const userId = checkAuthContextThrowError(context);
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
