import type { Destination, DestinationVisit } from "@prisma/client";
import { useState, useEffect } from "react";

const useTopDestinations = ({
	locality,
}: {
	locality: string | null;
}): {
	destinations: (Destination & { destinationVisits: DestinationVisit[] })[];
	loading: boolean;
	error: boolean;
} => {
	const [destinations, setDestinations] = useState<
		(Destination & { destinationVisits: DestinationVisit[] })[]
	>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	useEffect(() => {
		setLoading(true);
		if (!locality) return;
		fetch(`/api/destinations/top?locality=${locality}`)
			.then((res) => res.json())
			.then((data) => {
				setLoading(false);
				setDestinations(data.destinations);
			})
			.catch((err) => {
				setLoading(false);
				setError(true);
			});
	}, [locality]);

	return { destinations, loading, error };
};

export default useTopDestinations;
