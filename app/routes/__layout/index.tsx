import type { LoaderFunction } from "@remix-run/node";
import type { User } from "@prisma/client";
import { json } from "@remix-run/node";
import { Form, Link, useNavigate } from "@remix-run/react";
import { checkUserAuth } from "~/utils/auth.server";
import { useCallback, useEffect, useRef, useState } from "react";
import useTopDestinations from "~/utils/hooks/useTopDestinations";
import type { PlaceData } from "@googlemaps/google-maps-services-js";

type LoaderData = Awaited<Promise<{ user: User }>>;

export let loader: LoaderFunction = async ({ request }) => {
	const { user } = await checkUserAuth(request);

	return json<LoaderData>({
		user,
	});
};

export default function Home() {
	const inputRef = useRef<HTMLInputElement>(null);
	const [locality, setLocality] = useState(
		typeof localStorage !== "undefined"
			? localStorage.getItem("locality") ?? "Bengaluru"
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
				className="w-full bg-gray-100 focus:outline-gray-200 py-2 px-4 my-2 rounded-sm"
				id="search-place-input"
				ref={inputRef}
			></input>
			<h1 className="font-bold text-lg mt-5">Popular Destinations</h1>
			<ul className="my-5 flex flex-col gap-4">
				{destinations.map((destination) => {
					return (
						<Link
							to={`/destinations/${destination.googlePlaceId}`}
							className="p-4 bg-gray-100 rounded-md hover:bg-gray-200"
							key={destination.id}
						>
							<div className="flex justify-between">
								<h3 className="font-bold text-gray-800 ">{destination.name}</h3>
								<h4 className="font-semibold text-yellow-900">
									⭐️ {destination.rating} / 5
								</h4>
							</div>
							<div className="flex justify-between">
								<p className="max-w-[70%] text-sm line-clamp-3 md:line-clamp-2">
									{destination.description}
								</p>
								<button className="font-semibold text-sm text-gray-700">
									Check In →
								</button>
							</div>
						</Link>
					);
				})}
			</ul>
			<Form method="post" action="/logout">
				<button>Logout</button>
			</Form>
		</>
	);
}
