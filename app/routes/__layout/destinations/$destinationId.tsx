import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { checkUserAuth } from "~/utils/auth.server";
import { useLoaderData } from "@remix-run/react";
import type { PlaceData } from "@googlemaps/google-maps-services-js";
import { Client as GoogleClient } from "@googlemaps/google-maps-services-js";
import { findOrCreateDestination } from "~/utils/db/models/destination.server";
import type { Destination, User } from "@prisma/client";

type LoaderData = Awaited<
	Promise<{
		user: User;
		destination: Destination;
		googleData: Partial<PlaceData>;
	}>
>;

export const loader: LoaderFunction = async ({ params, request }) => {
	const { user } = await checkUserAuth(request);
	const client = new GoogleClient({});

	try {
		const res = await client.placeDetails({
			params: {
				key: process.env.GOOGLE_MAPS_SERVER_KEY!,
				place_id: params.destinationId!,
			},
		});

		const place = res.data?.result;
		const localities = place.address_components?.filter((c: any) =>
			c.types.includes("locality")
		);

		const destination = await findOrCreateDestination({
			googleId: place.place_id!,
			googleData: {
				googlePlaceId: place.place_id!,
				name: place.name!,
				locality: localities![0].long_name!,
				rating: (place.rating as number).toString(),
				description: place.formatted_address!,
			},
		});

		return json({
			user,
			destination: destination,
			googleData: place,
		});
	} catch (e: any) {
		throw new Error(e.response.data.error_message);
	}
};

export default function DestinationRoute() {
	const data = useLoaderData<LoaderData>();
	return <div>Destination {data.destination.name}</div>;
}
