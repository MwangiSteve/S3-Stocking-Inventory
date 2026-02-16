import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";
import { Session, User } from "next-auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";



export const authOptions: NextAuthOptions = {

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],

  session: {
  strategy: "jwt",
},

callbacks: {
  async jwt({
    token,
    user,
  }: {
    token: JWT;
    user?: User;
  }): Promise<JWT> {
    if (user) {
      token.id = user.id;
    }
    return token;
  },

  async session({
    session,
    token,
  }: {
    session: Session;
    token: JWT;
  }): Promise<Session> {
    if (session.user) {
      session.user.id = token.id as string;
    }
    return session;
  },
},



secret: process.env.NEXTAUTH_SECRET,


  // 🔴 VERY IMPORTANT FOR RENDER
 // trustHost: true,

  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
  },
};

export default NextAuth(authOptions);
