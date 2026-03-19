import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { sendTelegram, jstNow } from "./telegram";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
  },
  events: {
    async createUser() {
      await sendTelegram(`👤 新規ユーザー登録\n時刻: ${jstNow()}`);
    },
  },
};
