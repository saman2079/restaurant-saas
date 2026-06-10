import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  DATABASE_URL: process.env.DATABASE_URL!,
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // OpenAI (GapGPT)
  OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL!,

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME!,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY!,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET!,

  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL!,
  SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD!,
};

// چک متغیرهای مهم
const required = [
  'DATABASE_URL',
  'JWT_SECRET',
  'OPENAI_API_KEY',
  'OPENAI_BASE_URL',
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`❌ متغیر محیطی ${key} تنظیم نشده!`);
  }
}