import { Authenticator } from "remix-auth";
import { sessionStorage } from "./session.server";
import { GoogleStrategy, SocialsProvider } from "remix-auth-socials";
import type { User } from "@prisma/client";
import { userVerify } from "./db/models/user.server";

let authenticator = new Authenticator<User>(sessionStorage, {
	throwOnError: true,
});

authenticator.use(
	new GoogleStrategy<User>(
		{
			clientID: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
			callbackURL:
				process.env.NODE_ENV === "development"
					? `http://localhost:3000/auth/${SocialsProvider.GOOGLE}/callback`
					: `https://crowdd.vercel.app/auth/${SocialsProvider.GOOGLE}/callback`,
		},
		userVerify
	)
);

const checkUserAuth = async (request: Request) => {
	const user = await authenticator.isAuthenticated(request, {
		failureRedirect: "/login",
	});

	return { user };
};

export { authenticator, checkUserAuth };
