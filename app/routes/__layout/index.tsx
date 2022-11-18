import type { LoaderFunction } from "@remix-run/node";
import type { Destination, User } from "@prisma/client";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { checkUserAuth } from "~/utils/auth.server";
import { useCallback, useEffect, useRef, useState } from "react";
import useTopDestinations from "~/utils/hooks/useTopDestinations";
import type { PlaceData } from "@googlemaps/google-maps-services-js";
import { getMyDestinations } from "~/utils/db/models/destination.server";
import DestinationItem from "~/components/DestinationItem";

type LoaderData = Awaited<
	Promise<{
		user: User;
		myDestinations: (Destination & {
			_count: {
				destinationVisits: number;
			};
		})[];
	}>
>;

export let loader: LoaderFunction = async ({ request }) => {
	const { user } = await checkUserAuth(request);

	const myDestinations = await getMyDestinations({ userId: user.id });
	return json<LoaderData>({
		user,
		myDestinations,
	});
};

export default function Home() {
	const inputRef = useRef<HTMLInputElement>(null);
	const { myDestinations } = useLoaderData<LoaderData>();

	const [locality, setLocality] = useState(
		typeof localStorage !== "undefined"
			? localStorage.getItem("locality") ?? ""
			: null
	);
	const { destinations } = useTopDestinations({ locality });
	const navigate = useNavigate();

	const handleSelect = useCallback(
		async ({ place }: { place: PlaceData }) => {
			await fetch(`/destinations/validate/${place.place_id}`, {
				method: "POST",
				body: JSON.stringify({
					...place,
					photoUrl: (place as any).photos[0].getUrl(),
				}),
			});
			navigate(`/destinations/${place.place_id}`);
		},
		[navigate]
	);

	const initGeoLocator = useCallback(() => {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(handleCurrentPosition);
		} else {
			alert("GEOLOCATION NOT SUPPORTED");
		}
	}, []);

	const handleCurrentPosition = (position: GeolocationPosition) => {
		const location = {
			lat: position.coords.latitude,
			lng: position.coords.longitude,
		};
		if (localStorage.getItem("locality")) {
			console.log("USING LOCAL");
			return;
		}
		const geocoder = new (window as any).google.maps.Geocoder();
		geocoder
			.geocode({ location })
			.then((response: any) => {
				if (response.results[0]) {
					const localities = response.results[0].address_components.filter(
						(c: any) => c.types.includes("locality")
					);
					const _locality = localities[0].long_name;
					console.log("LoCALITy", _locality);
					setLocality(_locality);
					localStorage.setItem("locality", _locality);
				} else {
					window.alert("No results found");
				}
			})
			.catch((e: any) => window.alert("Geocoder failed due to: " + e));
	};

	const initAutocomplete = useCallback(() => {
		if (!inputRef.current) {
			return;
		}
		const autocomplete = new (window as any).google.maps.places.Autocomplete(
			inputRef.current,
			{
				componentRestrictions: { country: ["in"] },
			}
		);
		inputRef.current.focus();

		// When the user selects an address from the drop-down, populate the
		// address fields in the form.
		const listener = autocomplete.addListener("place_changed", () => {
			const localities = autocomplete
				.getPlace()
				.address_components.filter((c: any) => c.types.includes("locality"));
			console.log(localities[0].long_name);
			const place: PlaceData = autocomplete.getPlace();
			console.log(place);
			handleSelect({
				place,
			});
		});

		return listener;
	}, [handleSelect]);

	useEffect(() => {
		initGeoLocator();
	}, [initGeoLocator]);

	useEffect(() => {
		const listener = initAutocomplete();
		return () => {
			listener.remove();
		};
	}, [initAutocomplete]);

	return (
		<>
			<div className="font-bold text-lg">
				Welcome to Crowdd, Get started by searching or exploring around!
			</div>
			<input
				name="search-place-input"
				className="w-full bg-gray-50 focus:outline-gray-300 py-2 px-4 my-2 rounded-sm"
				id="search-place-input"
				autoFocus={false}
				ref={inputRef}
			></input>
			{myDestinations.length > 0 && (
				<h1 className="font-bold text-lg mt-5">
					Your Checked-in Destinations!
				</h1>
			)}
			<ul className="my-5 flex flex-col gap-4">
				{myDestinations.map((destination) => {
					return (
						<DestinationItem
							key={destination.id}
							destination={destination}
							peopleCount={destination._count.destinationVisits}
							selfCheckedIn={
								myDestinations.filter((d) => d.id === destination.id).length > 0
							}
						/>
					);
				})}
			</ul>
			<h1 className="font-bold text-lg mt-5">
				Popular Destinations around {locality || "India!"}
				{!locality && (
					<div className="font-medium text-gray-400 underline">
						pls give location permissions for better results!!
					</div>
				)}
			</h1>
			<ul className="my-5 flex flex-col gap-4">
				{destinations.map((destination) => {
					return (
						<DestinationItem
							key={destination.id}
							destination={destination}
							peopleCount={destination.destinationVisits?.length}
							selfCheckedIn={
								myDestinations.filter((d) => d.id === destination.id).length > 0
							}
						/>
					);
				})}
			</ul>
		</>
	);
}
