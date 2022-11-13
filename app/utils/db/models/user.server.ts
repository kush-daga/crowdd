import type { GoogleProfile } from "remix-auth-socials";
import { prisma } from "~/utils/prisma.server";

export const userVerify = async ({ profile }: { profile: GoogleProfile }) => {
	const userEmail = profile.emails[0]?.value;

	const existingUser = await prisma.user.findUnique({
		where: { email: userEmail },
	});

	if (!existingUser) {
		const user = await prisma.user.create({
			data: {
				email: userEmail,
				name: profile.displayName,
				photo: profile.photos[0]?.value || null,
			},
		});
		return user;
	}

	return existingUser;
};
