import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnPractice = nextUrl.pathname.startsWith("/practice");
      const isOnSyllabus = nextUrl.pathname.startsWith("/syllabus");
      const isOnQuestions = nextUrl.pathname.startsWith("/questions");

      const isProtected =
        isOnDashboard || isOnPractice || isOnSyllabus || isOnQuestions;

      if (isProtected) {
        if (isLoggedIn) return true;
        return false; // Redirect to login
      }

      if (isLoggedIn) {
        // Redirect logged-in users away from auth pages
        if (
          nextUrl.pathname.startsWith("/login") ||
          nextUrl.pathname.startsWith("/register")
        ) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.level = (user as { level?: string }).level;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { level?: string }).level = token.level as string;
      }
      return session;
    },
  },
  providers: [], // populated in auth.ts
};
