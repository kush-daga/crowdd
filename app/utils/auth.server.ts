import { Authenticator } from "remix-auth";
import { sessionStorage } from "./session.server";

// Create an instance of the authenticator, pass a generic with what
// strategies will return and will store in the session

import { GoogleStrategy, SocialsProvider } from "remix-auth-socials";

import { prisma } from "./prisma.server";
import type { User } from "@prisma/client";

let authenticator = new Authenticator<User>(sessionStorage, {
	throwOnError: true,
});

authenticator.use(
	new GoogleStrategy<User>(
		{
			clientID: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
			callbackURL: `http://localhost:3000/auth/${SocialsProvider.GOOGLE}/callback`,
		},
		async ({ profile }) => {
			// here you would find or create a user in your database
			return {
				email: profile.emails[0].value,
				id: profile.id as any,
				name: profile.displayName,
			};
		}
	)
);

export { authenticator };
