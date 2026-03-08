import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";
import { authRateLimit } from "@/middleware/rateLimiter";
import { handleApiError } from "@/middleware/errorHandler";
import { registerSchema } from "@/lib/validationSchemas";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Apply strict rate limiting to registration endpoint.
  if (authRateLimit(req, res)) return;

  try {
    const { name, email, password } = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Use MongoDB client directly to bypass Prisma constraints
    const mongoClient = new MongoClient(process.env.DATABASE_URL!);
    await mongoClient.connect();
    
    const db = mongoClient.db();
    const userCollection = db.collection('User');
    
    // Generate a unique username
    const baseUsername = email.split('@')[0];
    let username = baseUsername;
    let counter = 1;
    
    // Check if username exists and generate a unique one
    while (await userCollection.findOne({ username })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }
    
    await userCollection.insertOne({
      name,
      email,
      password: hashedPassword,
      username,
      createdAt: new Date(),
    });
    
    await mongoClient.close();
    
    // Get the created user from Prisma
    const createdUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!createdUser) {
      return res.status(500).json({ error: "Failed to create user" });
    }

    res.status(201).json({ id: createdUser.id, name: createdUser.name, email: createdUser.email });
  } catch (error) {
    handleApiError(error, res);
  }
}
