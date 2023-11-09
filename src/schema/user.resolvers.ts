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
    following: async (parent: { id: string }) => {
      const following = await prisma.follow.findMany({
        where: {
          followerId: parent.id,
        },
        select: {
          following: true,
        },
      });
      const followingUsers = following.map((follow) => follow.following);
      return followingUsers;
    },
    followers: async (parent: { id: string }) => {
      const followers = await prisma.follow.findMany({
        where: {
          followingId: parent.id,
        },
        select: {
          follower: true,
        },
      });
      const followersUsers = followers.map((follow) => follow.follower);
      return followersUsers;
    },
    followingIds: async (parent: { id: string }) => {
      const following = await prisma.follow.findMany({
        where: {
          followerId: parent.id,
        },
      });
      const followingIds = following.map((follow) => follow.followingId);
      return followingIds;
    },
    isFollowing: async (parent: { id: string }, _: unknown, context) => {
      if (!context.userId) return false;
      const userId = checkAuthContextThrowError(context);
      const following = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: parent.id,
          },
        },
      });
      return following !== null;
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
    updateUser: async (
      parent: unknown,
      args: { fname: string; lname: string; imageUrl: string },
      context
    ) => {
      const userId = checkAuthContextThrowError(context);
      const user = await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          fname: args.fname,
          lname: args.lname,
        },
      });
      return user;
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
    follow: async (parent: unknown, args: { username: string }, context) => {
      const userId = checkAuthContextThrowError(context);
      if (userId === args.username) {
        throw new GraphQLError("You cannot follow yourself", {
          extensions: {
            code: "CANNOT_FOLLOW_YOURSELF",
          },
        });
      }
      const followingUser = await prisma.user.findUnique({
        where: {
          username: args.username,
        },
        select: {
          id: true,
        },
      });
      if (!followingUser) {
        throw new GraphQLError("User not found", {
          extensions: {
            code: "USER_NOT_FOUND",
          },
        });
      }
      const follow = await prisma.follow.create({
        data: {
          followerId: userId,
          followingId: followingUser.id,
        },
        select: {
          following: true,
        },
      });
      const resultFollowing = {
        success: true,
        user: follow.following,
      };
      return resultFollowing;
    },
    unfollow: async (parent: any, args: { username: string }, context) => {
      const userId = checkAuthContextThrowError(context);
      if (userId === args.username) {
        throw new GraphQLError("You cannot follow yourself", {
          extensions: {
            code: "CANNOT_FOLLOW_YOURSELF",
          },
        });
      }
      const followingUser = await prisma.user.findUnique({
        where: {
          username: args.username,
        },
        select: {
          id: true,
        },
      });
      if (!followingUser) {
        throw new GraphQLError("User not found", {
          extensions: {
            code: "USER_NOT_FOUND",
          },
        });
      }
      const follow = await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: followingUser.id,
          },
        },
        select: {
          following: true,
        },
      });
      const resultUnFollowing = {
        success: true,
        user: follow.following,
      };
      return resultUnFollowing;
    },
  },
  Product: {
    owner: async (parent: { userId: string }) => {
      const { userId } = parent;
      return await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });
    },
  },
  Message: {
    sender: async (parent: { senderId: string }) => {
      const { senderId } = parent;
      return await prisma.user.findUnique({
        where: {
          id: senderId,
        },
      });
    },
    receiver: async (parent: { receiverId: string }) => {
      const { receiverId } = parent;
      return await prisma.user.findUnique({
        where: {
          id: receiverId,
        },
      });
    },
  },
};

export default resolvers;
