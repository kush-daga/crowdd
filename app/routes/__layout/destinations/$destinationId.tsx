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
		placeImage: any;
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

		const destinationPromise = findOrCreateDestination({
			googleId: place.place_id!,
			googleData: {
				googlePlaceId: place.place_id!,
				name: place.name!,
				locality: localities![0].long_name!,
				rating: (place.rating as number).toString(),
				description: place.formatted_address!,
			},
		});

		if (place.photos) {
			const reference = place.photos![0].photo_reference;
			const placePhotoPromise = await client.placePhoto({
				params: {
					photoreference: reference,
					key: process.env.GOOGLE_MAPS_SERVER_KEY!,
					client_id: process.env.GOOGLE_MAPS_CLIENT_ID!,
					client_secret: process.env.GOOGLE_MAPS_CLIENT_SECRET!,
					maxwidth: 1920,
				},
				responseType: "arraybuffer",
			});
			const [destination, placePhoto] = await Promise.all([
				destinationPromise,
				placePhotoPromise,
			]);

			var base64String = placePhoto.data.toString("base64");

			return json({
				user,
				destination: destination,
				googleData: place,
				placeImage: base64String,
			});
		} else {
			const [destination] = await Promise.all([destinationPromise]);
			return json({
				user,
				destination: destination,
				googleData: place,
				placeImage: "",
			});
		}
	} catch (err: any) {
		throw new Error(err);
	}
};

export default function DestinationRoute() {
	const data = useLoaderData<LoaderData>();
	return (
		<div>
			<img
				className="h-[300px] w-full object-cover"
				alt="destination"
				src={`data:image/png;base64,${data?.placeImage}`}
			/>
			<h1 className="font-bold text-3xl mt-4">{data.destination.name}</h1>
		</div>
	);
}
