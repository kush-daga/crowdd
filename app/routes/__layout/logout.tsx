import type { ActionFunction } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { authenticator } from "~/utils/auth.server";

export let action: ActionFunction = async ({ request, params }) => {
	await authenticator.logout(request, { redirectTo: "/login" });
};

export const LogoutButton = () => {
	return (
		<Form action="/logout" method="post">
			<button
				type="submit"
				className="px-3 py-1 text-xs font-bold text-gray-700 border border-gray-500 rounded-md hover:bg-gray-200"
			>
				Logout
			</button>
		</Form>
	);
};
