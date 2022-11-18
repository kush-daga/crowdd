import type { Destination } from "@prisma/client";
import { Link, Form } from "@remix-run/react";
import React from "react";

interface destinationItemProps {
	destination: Destination;
	peopleCount: number;
	selfCheckedIn: boolean;
}

const DestinationItem: React.FC<destinationItemProps> = ({
	destination,
	peopleCount,
	selfCheckedIn,
}) => {
	return (
		<Link
			to={`/destinations/${destination.googlePlaceId}`}
			className="p-4 bg-gray-50 rounded-md hover:bg-gray-200 border border-gray-300"
			key={destination.id}
		>
			<div className="flex justify-between">
				<h3 className="font-bold text-gray-800 flex gap-4 items-baseline">
					{destination.name.length > 20
						? destination.name.substring(0, 20) + "..."
						: destination.name}
					{"   "}
					<span className="text-gray-700">
						<span className="text-xl">👥</span> {"  "}
						{peopleCount}
					</span>
				</h3>
				<h4 className="font-semibold text-yellow-900">
					⭐️ {destination.rating} / 5
				</h4>
			</div>
			<div className="flex justify-between">
				<p className="max-w-[70%] text-sm line-clamp-3 md:line-clamp-2">
					{destination.description}
				</p>
				<Form
					method="post"
					action={`/destinations/${destination.googlePlaceId}`}
					reloadDocument
				>
					{selfCheckedIn ? (
						<button
							onClick={(e) => {
								e.stopPropagation();
							}}
							className="font-semibold text-sm px-2 mt-2 rounded-md py-1 border border-black bg-gray-200 text-gray-900 hover:bg-gray-500 hover:text-white"
							name="intent"
							value={"check-out"}
						>
							Check Out
						</button>
					) : (
						<button
							className="font-semibold text-sm px-2 mt-2 rounded-md py-1 border border-black bg-gray-200 text-gray-900 hover:bg-gray-500 hover:text-white"
							name="intent"
							onClick={(e) => {
								e.stopPropagation();
							}}
							value={"check-in"}
						>
							Check In
						</button>
					)}
				</Form>
			</div>
		</Link>
	);
};

export default DestinationItem;
