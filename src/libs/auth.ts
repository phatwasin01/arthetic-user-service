import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../config";

const saltRounds = config.saltRounds;
const jwtSecret = config.jwtSecret;
const jwtExpiresIn = config.jwtExpiresIn;
export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, saltRounds);
};

export const verifyPassword = async (
  password: string,
  hashedPassword: string
) => {
  return await bcrypt.compare(password, hashedPassword);
};

export const signJwtToken = async (userId: string) => {
  return jwt.sign({ id: userId }, jwtSecret, {
    expiresIn: jwtExpiresIn,
  });
};

export interface AuthContext {
  userId?: string;
}
