import NextAuth, { AuthOptions } from "next-auth"
import GithubProvider from "next-auth/providers/github"

export const authOptions: AuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      session.user.id = token.sub!
      return session
    },
  },
}

export default NextAuth(authOptions)