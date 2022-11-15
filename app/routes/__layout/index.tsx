import type { LoaderFunction } from "@remix-run/node";
import type { Destination, User } from "@prisma/client";
import { json } from "@remix-run/node";
import { Form, useLoaderData, useNavigate } from "@remix-run/react";
import { checkUserAuth } from "~/utils/auth.server";
import { useCallback, useEffect, useRef, useState } from "react";
import useTopDestinations from "~/utils/hooks/useTopDestinations";

type LoaderData = Awaited<Promise<{ user: User }>>;

export let loader: LoaderFunction = async ({ request }) => {
	const { user } = await checkUserAuth(request);

	return json<LoaderData>({
		user,
	});
};

export default function Home() {
	const { user } = useLoaderData<LoaderData>();
	const inputRef = useRef<HTMLInputElement>(null);
	const [locality, setLocality] = useState("Bengaluru");
	const { destinations } = useTopDestinations({ locality });
	const navigate = useNavigate();

	const handleSelect = ({ googlePlaceId }: { googlePlaceId: string }) => {
		navigate(`/destinations/${googlePlaceId}`);
	};

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
			const place = autocomplete.getPlace();
			console.log(place);
			handleSelect({
				googlePlaceId: place.place_id,
			});
		});

		return listener;
	}, []);

	useEffect(() => {
		initGeoLocator();
		const listener = initAutocomplete();
		return () => {
			listener.remove();
		};
	}, [initAutocomplete, initGeoLocator]);

	return (
		<>
			<div className="font-bold text-lg">
				Welcome to Crowdd, Get started by searching or exploring around!
			</div>
			<input
				name="search-place-input"
				className="w-full bg-gray-100 focus:outline-gray-200 py-2 px-4 my-2 rounded-sm"
				id="search-place-input"
				ref={inputRef}
			></input>
			<h1 className="font-bold text-lg mt-5">Popular Destinations</h1>
			<ul>
				{destinations.map((destination) => {
					return <li key={destination.id}>{destination.name}</li>;
				})}
			</ul>
			<Form method="post" action="/logout">
				<button>Logout</button>
			</Form>
		</>
	);
}
