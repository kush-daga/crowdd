import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { checkUserAuth } from "~/utils/auth.server";
import type { User } from "@prisma/client";

type LoaderData = Awaited<Promise<{ user: User }>>;

export let loader: LoaderFunction = async ({ request, params }) => {
	return json<LoaderData>(await checkUserAuth(request));
};

export default function Index() {
	const { user } = useLoaderData<LoaderData>();

	return (
		<>
			<div className="font-bold text-green-500">
				HElLo {user.name}, your email is {user.email}
			</div>
			<Form method="post" action="/logout">
				<button>Logout</button>
			</Form>
		</>
	);
}
