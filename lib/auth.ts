import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/auth-schemas";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Required behind a reverse proxy (Nginx) — without this Auth.js can't
  // verify the incoming Host header is legitimate and refuses every
  // request with an UntrustedHost error. NEXTAUTH_URL is already set to
  // the real origin, so this isn't opening up host-header spoofing.
  trustHost: true,
  // A Credentials provider requires the "jwt" session strategy — Auth.js
  // does not support database sessions alongside it.
  // NOTE: "remember me" on the login form is currently cosmetic — every
  // session gets this 30-day duration regardless of the checkbox, since
  // Auth.js v5's cookie config is fixed per-app, not per-login-request.
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = loginSchema
          .pick({ email: true, password: true })
          .safeParse(rawCredentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });
        if (!user || !user.password || user.disabled) return null;

        const valid = await verifyPassword(parsed.data.password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
    // Scaffolded and ready to go — sign-in via this provider will fail
    // with a clear "not configured" error until real credentials are set.
    // See the deployment summary for where to create the app.
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "not-configured",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "not-configured",
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "USER" | "ADMIN";
      }
      return session;
    },
    async signIn({ user, account }) {
      // OAuth sign-ins go through the adapter directly; block disabled
      // accounts there too.
      if (account?.provider !== "credentials") {
        if (!user.email) return false;
        const existing = await prisma.user.findUnique({ where: { email: user.email } });
        if (existing?.disabled) return false;
      }
      return true;
    },
  },
});
