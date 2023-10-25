import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();

const envSchema = z.object({
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string(),
  SALT_ROUNDS: z.string().transform((val) => parseInt(val, 10)),
  PORT: z.string().transform((val) => parseInt(val, 10)),
  DATABASE_URL: z.string(),
});

export const config = envSchema.parse(process.env);
