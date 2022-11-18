import type { Destination, DestinationVisit } from "@prisma/client";
import { prisma } from "~/utils/prisma.server";

export const findDestination = async ({ googleId }: { googleId: string }) => {
	const existingDestination = await prisma.destination.findUnique({
		where: {
			googlePlaceId: googleId,
		},
		include: {
			destinationVisits: true,
		},
	});

	return existingDestination;
};

export const createDestination = async ({
	googleData,
}: {
	googleData: Omit<Destination, "id">;
}) => {
	const {
		locality,
		description,
		googlePlaceId,
		name,
		rating,
		priceLevel,
		photoReference,
	} = googleData;

	const destination = await prisma.destination.create({
		data: {
			locality,
			description,
			googlePlaceId,
			name,
			rating,
			priceLevel,
			photoReference,
		},
		include: {
			destinationVisits: true,
		},
	});
	return destination;
};

export const findOrCreateDestination = async ({
	googleId,
	googleData,
}: {
	googleId: string;
	googleData?: Omit<Destination, "id">;
}) => {
	const existingDestination = await prisma.destination.findUnique({
		where: { googlePlaceId: googleId },
		include: {
			destinationVisits: true,
		},
	});

	console.log("EXISTING", existingDestination);
	if (!existingDestination && googleData) {
		const {
			locality,
			description,
			googlePlaceId,
			name,
			rating,
			priceLevel,
			photoReference,
			photoUrl,
		} = googleData;

		console.log("CREATING IN FUNC", googleData);
		try {
			const destination = await prisma.destination.create({
				data: {
					locality,
					description,
					googlePlaceId,
					name,
					rating,
					priceLevel,
					photoReference,
					photoUrl,
				},
				include: {
					destinationVisits: true,
				},
			});

			console.log("CREATED IN FUNC", destination);
			return destination;
		} catch (err) {
			console.log("ERROR", err);
		}
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

export const checkOutVisit = async ({
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

		await prisma.destinationVisit.deleteMany({
			where: {
				AND: {
					destinationId: destination?.id,
					userId: userId,
				},
			},
		});
	} catch (err) {
		console.log("ERROR OCCURRED IN Deleting", err);
	}

	const totalVisits = await prisma.destinationVisit.count();

	return totalVisits;
};

export const getTopDestinationsIndia = async ({
	locality,
}: {
	locality: string | null;
}) => {
	let destinations: (Destination & {
		destinationVisits: DestinationVisit[];
	})[] = [];
	console.log("GETTING TOP", locality);
	if (!locality) {
		destinations = await prisma.destination.findMany({
			orderBy: {
				destinationVisits: {
					_count: "desc",
				},
			},
			take: 20,
			include: {
				destinationVisits: true,
			},
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
			include: {
				destinationVisits: true,
			},
		});
	}
	return destinations;
};
