import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { getServerSession } from "next-auth";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "demo-github-client-id",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "demo-github-client-secret",
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "shiplog-dev-fallback-secret-change-me",
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return true;
      try {
        const githubProfile = profile as { id?: number; login?: string } | undefined;
        await prisma.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name ?? undefined,
            avatarUrl: user.image ?? undefined,
            githubId: githubProfile?.id ? String(githubProfile.id) : account?.providerAccountId,
            githubLogin: githubProfile?.login ?? undefined,
          },
          create: {
            email: user.email,
            name: user.name ?? "ShipLog Developer",
            avatarUrl: user.image ?? undefined,
            githubId: githubProfile?.id ? String(githubProfile.id) : account?.providerAccountId,
            githubLogin: githubProfile?.login ?? undefined,
          },
        });
      } catch {
        // Allow sign-in even if PostgreSQL is not yet provisioned in local dev
      }
      return true;
    },
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      if (profile) {
        const gh = profile as { login?: string };
        token.githubLogin = gh.login;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { githubLogin?: string }).githubLogin = token.githubLogin as
          | string
          | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/dashboard",
  },
};

export async function getSessionUser() {
  try {
    const session = await getServerSession(authOptions);
    return session?.user ?? null;
  } catch {
    return null;
  }
}

