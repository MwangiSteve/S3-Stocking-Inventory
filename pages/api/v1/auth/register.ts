import { NextApiRequest, NextApiResponse } from "next";
import { addVersionHeader } from "@/middleware/api-version";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";
import { prisma } from "@/prisma/client";

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  addVersionHeader(res);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { name, email, password } = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const mongoClient = new MongoClient(process.env.DATABASE_URL!);
    await mongoClient.connect();

    const db = mongoClient.db();
    const userCollection = db.collection("User");

    const baseUsername = email.split("@")[0];
    let username = baseUsername;
    let counter = 1;

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

    const createdUser = await prisma.user.findUnique({ where: { email } });

    if (!createdUser) {
      return res.status(500).json({ error: "Failed to create user" });
    }

    return res.status(201).json({
      id: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: "An unknown error occurred" });
  }
}
