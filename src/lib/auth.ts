import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Auth: Missing credentials");
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        try {
          console.log("Auth: Attempting login for email:", email);
          
          // Lazy import prisma to avoid Edge Runtime issues
          const { default: prisma } = await import("@/lib/prisma");

          const profile = await prisma.profile.findUnique({
            where: { email },
          });

          if (!profile) {
            console.log("Auth: User not found in database:", email);
            return null;
          }

          console.log("Auth: User found, role:", profile.role);

          const passwordHash = (profile as any).password;

          if (!passwordHash) {
            console.log("Auth: No password hash found for user");
            return null;
          }

          const isValid = await bcrypt.compare(password, passwordHash);

          if (!isValid) {
            console.log("Auth: Invalid password for user:", email);
            return null;
          }

          console.log("Auth: Login successful for:", email);
          return {
            id: profile.id,
            email: profile.email,
            name: profile.full_name,
            role: profile.role,
          };
        } catch (error) {
          console.error("Auth: Internal Error during authorize:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET || "wahfalab_secret_fallback_key_123",
  trustHost: true,
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }

      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }

      return token;
    },
    async session({ session, token }) {
      if (token.id && session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;

      const isProtectedRoute =
        path.startsWith("/admin") ||
        path.startsWith("/content-manager") ||
        path.startsWith("/operator") ||
        path.startsWith("/field") ||
        path.startsWith("/dashboard") ||
        path.startsWith("/analyst") ||
        path.startsWith("/reporting") ||
        path.startsWith("/finance");

      if (!isLoggedIn && isProtectedRoute) {
        return false;
      }

      return true;
    },
  },
} satisfies NextAuthConfig;

// Initialize NextAuth WITHOUT PrismaAdapter for Edge Runtime compatibility
// Session strategy "jwt" means we don't need database in middleware
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
