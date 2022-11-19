import { PlaceType2 } from "@googlemaps/google-maps-services-js";
import type { ActionFunction } from "@remix-run/node";
import { findOrCreateDestination } from "~/utils/db/models/destination.server";

export const action: ActionFunction = async ({ params, request }) => {
	try {
		const payload = await request.json();
		const destination = await findOrCreateDestination({
			googleId: payload.place_id,
			googleData: {
				description: payload.formatted_address,
				googlePlaceId: payload.place_id,
				name: payload.name,
				photoReference: payload.photos[0]?.photo_reference,
				photoUrl: payload?.photoUrl,
				locality: payload?.address_components?.filter((c: any) =>
					c.types.includes(PlaceType2.locality)
				)[0]?.long_name,
				priceLevel: payload.price_level,
				rating: payload.rating ? payload.rating?.toString() : "0",
			},
		});
		console.log("CREATED", destination);
		return {
			res: destination,
			isError: false,
			err: null,
		};
	} catch (err) {
		return { res: null, isError: true, err: err };
	}
};
