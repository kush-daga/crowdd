import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import type { Destination, DestinationVisit, User } from "@prisma/client";
import { json } from "@remix-run/node";
import { checkUserAuth } from "~/utils/auth.server";
import { Form, useLoaderData } from "@remix-run/react";
import { Client as GoogleClient } from "@googlemaps/google-maps-services-js";
import {
	checkOutVisit,
	createDestination,
	findDestination,
	markVisit,
} from "~/utils/db/models/destination.server";

type LoaderData = Awaited<
	Promise<{
		user: User;
		destination: Destination & { destinationVisits: DestinationVisit[] };
		placeImage: any;
	}>
>;

export const loader: LoaderFunction = async ({ params, request }) => {
	const { user } = await checkUserAuth(request);
	const client = new GoogleClient({});

	if (!params.destinationId) return {};

	const existingDestination = await findDestination({
		googleId: params.destinationId,
	});

	if (existingDestination) {
		if (existingDestination.photoUrl) {
			return {
				user,
				destination: existingDestination,
				placeImage: existingDestination.photoUrl,
			};
		} else if (existingDestination.photoReference) {
			console.warn("CALLING GOOGLE PHOTOS");
			const placePhoto = await client.placePhoto({
				params: {
					photoreference: existingDestination.photoReference,
					key: process.env.GOOGLE_MAPS_SERVER_KEY!,
					client_id: process.env.GOOGLE_MAPS_CLIENT_ID!,
					client_secret: process.env.GOOGLE_MAPS_CLIENT_SECRET!,
					maxwidth: 1920,
				},
				responseType: "arraybuffer",
			});

			let base64String = `data:image/png;base64,${placePhoto.data.toString(
				"base64"
			)}`;

			return {
				user,
				destination: existingDestination,
				placeImage: base64String ?? "",
			};
		}
	} else {
		console.warn("DESTINATION DOESN'T EXIST");
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

			const destinationPromise = createDestination({
				googleData: {
					googlePlaceId: place.place_id!,
					name: place.name!,
					locality: localities![0].long_name!,
					rating: (place.rating as number).toString(),
					description: place.formatted_address!,
					photoReference: place.photos![0].photo_reference ?? null,
					priceLevel: place.price_level ?? null,
					photoUrl: null,
				},
			});

			if (place.photos) {
				const reference = place.photos![0].photo_reference;
				const placePhotoPromise = client.placePhoto({
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

				let base64String = `data:image/png;base64,${placePhoto.data.toString(
					"base64"
				)}`;

				return json({
					user,
					destination: destination,
					placeImage: base64String,
				});
			} else {
				const [destination] = await Promise.all([destinationPromise]);
				return json({
					user,
					destination: destination,
					placeImage: "",
				});
			}
		} catch (err: any) {
			throw new Error(err);
		}
	}

	return {};
};

export const action: ActionFunction = async ({ params, request }) => {
	const formData = await request.formData();
	const { user } = await checkUserAuth(request);
	console.log("IM HERE", user);
	const intent = await formData.get("intent");
	const destinationId = params.destinationId!;
	if (intent === "check-in") {
		await markVisit({ destinationGoogleId: destinationId, userId: user.id });
		return redirect("/");
	}
	if (intent === "check-out") {
		try {
			await checkOutVisit({
				destinationGoogleId: destinationId,
				userId: user.id,
			});

			return redirect("/");
		} catch (err) {
			console.log(err);
			return {};
		}
	}

	return {};
};

export default function DestinationRoute() {
	const data = useLoaderData<LoaderData>();

	// const isOpenPillStyle = isOpen
	// 	? "bg-green-100 border-green-500 text-green-700"
	// 	: "bg-red-100 border-red-500 text-red-700";

	const name = data.destination.name;
	const visits = data.destination.destinationVisits;
	const isUserHere =
		visits.filter(
			(v) =>
				v.destinationId === data.destination.id && v.userId === data.user.id
		).length > 0;

	return (
		<div>
			<img
				className="h-[300px] w-full object-cover my-6 rounded-md shadow-md"
				alt="destination"
				src={`${data?.placeImage}`}
			/>
			<div className="flex items-center justify-between gap-4">
				<div className="flex items-baseline gap-4">
					<h1 className="font-bold text-2xl md:text-4xl hidden md:flex">
						{name.length > 20 ? name.substring(0, 20) + "..." : name}
					</h1>
					<h1 className="font-bold md:hidden text-2xl md:text-4xl">
						{name.length > 12 ? name.substring(0, 12) + "..." : name}
					</h1>
					{data.destination.priceLevel && (
						<div>
							{new Array(data.destination.priceLevel)
								.fill(0)
								.map((l: number, idx) => {
									const colorMap = {
										1: "text-red-500",
										2: "text-red-600",
										3: "text-red-700",
										4: "text-red-800",
									};

									// STUFF TO HANDLE DEFAULT CASE -- OVER-ENGINEERING :P
									let handler = {
										get: function (target: any, name: string) {
											return target.hasOwnProperty(name)
												? target[name]
												: "text-black";
										},
									};

									let p = new Proxy(colorMap, handler);

									const colorValue = p[idx + 1];

									return (
										<span
											className={`${colorValue} font-bold text-lg md:text-2xl`}
											key={idx}
										>
											$
										</span>
									);
								})}
						</div>
					)}
				</div>
			</div>

			<div>
				<p className="text-gray-600 text-lg md:text-xl mt-3">
					{data.destination.description}
				</p>
			</div>
			<p className="text-xl md:text-2xl flex items-baseline gap-2 text-gray-600 font-semibold mt-4">
				<span className="text-2xl md:text-3xl">👥</span>
				<span>{data.destination.destinationVisits.length} folks are here!</span>
			</p>
			<Form method="post">
				{isUserHere ? (
					<button
						className="bg-gray-100 px-6 py-4 rounded-md font-semibold text-gray-600 hover:bg-gray-200 mt-5 w-full text-xl"
						name="intent"
						value="check-out"
					>
						I am checking out of here!
					</button>
				) : (
					<button
						className="bg-gray-100 px-6 py-4 rounded-md font-semibold text-gray-600 hover:bg-gray-200 mt-5 w-full text-xl"
						name="intent"
						value="check-in"
					>
						I am going here!
					</button>
				)}
			</Form>
		</div>
	);
}
