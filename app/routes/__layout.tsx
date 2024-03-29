import { Outlet, useLocation } from "@remix-run/react";
import { LogoutButton } from "./__layout/logout";

export default function Index() {
	const { pathname } = useLocation();
	return (
		<div className="max-w-2xl mx-auto py-4 flex flex-col px-4">
			<div className="flex justify-between items-center mb-4">
				<h1 className="text-3xl font-black flex items-center">👥 crowdd</h1>
				{pathname !== "/login" && <LogoutButton />}
			</div>
			<div>
				<Outlet />
			</div>
		</div>
	);
}
