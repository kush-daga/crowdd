import { Outlet } from "@remix-run/react";

export default function Index() {
	return (
		<div className="max-w-2xl mx-auto py-4 flex flex-col px-4">
			<h1 className="text-3xl font-black mb-4">👥 crowdd</h1>
			<div>
				<Outlet />
			</div>
		</div>
	);
}
