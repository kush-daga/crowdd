import type { LoaderFunction } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { authenticator } from "~/utils/auth.server";

export let loader: LoaderFunction = async ({ request, params }) => {
	const user = await authenticator.isAuthenticated(request, {
		failureRedirect: "/",
	});

	return { user };
};

export default function Index() {
	const { user } = useLoaderData();
	return (
		<>
			<div className="font-bold text-green-500">
				HElLo {JSON.stringify(user)}
			</div>
			<Form method="post" action="/logout">
				<button>Logout</button>
			</Form>
		</>
	);
}
