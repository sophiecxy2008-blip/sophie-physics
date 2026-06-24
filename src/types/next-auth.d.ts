import "next-auth";

declare module "next-auth" {
  interface User {
    level?: string;
  }
  interface Session {
    user: User & {
      id?: string;
      level?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    level?: string;
  }
}
