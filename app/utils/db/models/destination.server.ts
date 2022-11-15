import type { Destination } from "@prisma/client";
import { prisma } from "~/utils/prisma.server";

export const findOrCreateDestination = async ({
	googleId,
	googleData,
}: {
	googleId: string;
	googleData?: Omit<Destination, "id">;
}) => {
	const existingDestination = await prisma.destination.findUnique({
		where: { googlePlaceId: googleId },
	});

	if (!existingDestination && googleData) {
		const { locality, description, googlePlaceId, name, rating } = googleData;

		const destination = await prisma.destination.create({
			data: {
				locality,
				description,
				googlePlaceId,
				name,
				rating,
			},
		});
		return destination;
	}

	if (!existingDestination && !googleData) {
		throw new Error("incomplete data");
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
						id: destination!.id,
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
		console.log("ERROR OCCURRED IN CREATING", err);
	}

	const totalVisits = await prisma.destinationVisit.count();

	return totalVisits;
};

export const getTopDestinationsIndia = async ({
	locality,
}: {
	locality: string | null;
}) => {
	let destinations = [];
	if (!locality) {
		destinations = await prisma.destination.findMany({
			orderBy: {
				destinationVisits: {
					_count: "desc",
				},
			},
			take: 20,
		});
	} else {
		destinations = await prisma.destination.findMany({
			orderBy: {
				destinationVisits: {
					_count: "desc",
				},
			},
			take: 20,
			where: {
				locality,
			},
		});
	}
	return destinations;
};
