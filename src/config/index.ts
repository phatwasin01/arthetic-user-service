import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();

const envSchema = z.object({
  JWT_SECRET: z.string().optional(),
  JWT_EXPIRES_IN: z.string().optional(),
  SALT_ROUNDS: z
    .string()
    .transform((val) => parseInt(val, 10))
    .optional(),
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .optional(),
  DATABASE_URL: z.string().optional(),
  NODE_ENV: z.string().optional(),
});

export const config = envSchema.parse(process.env);
