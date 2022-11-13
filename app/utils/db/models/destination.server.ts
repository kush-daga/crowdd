import { prisma } from "~/utils/prisma.server";

export const findOrCreateDestination = async ({
	googleId,
}: {
	googleId: string;
}) => {
	const existingDestination = await prisma.destination.findUnique({
		where: { googlePlaceId: googleId },
	});

	if (!existingDestination) {
		const destination = await prisma.destination.create({
			data: {
				googlePlaceId: googleId,
			},
		});
		return destination;
	}

	return existingDestination;
};

export const markVisit = async ({
	destinationGoogleId,
	userId,
}: {
	destinationGoogleId: string;
	userId: string;
}) => {
	try {
		const destination = await findOrCreateDestination({
			googleId: destinationGoogleId,
		});

		await prisma.destinationVisit.create({
			data: {
				destination: {
					connect: {
						id: destination.id,
					},
				},
				user: {
					connect: {
						id: userId,
					},
				},
			},
		});
	} catch (err) {
		console.log("ERROR OCCURRED IN CREATNG", err);
	}

	const totalVisits = await prisma.destinationVisit.count();

	return totalVisits;
};
