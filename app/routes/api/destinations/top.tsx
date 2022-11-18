import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getTopDestinationsIndia } from "~/utils/db/models/destination.server";

export const loader: LoaderFunction = async ({ context, request }) => {
	const url = new URL(request.url);
	const locality = url.searchParams.get("locality");
	const destinations = await getTopDestinationsIndia({ locality });
	return json({ destinations });
};
