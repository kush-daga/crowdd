import type { LoaderFunction } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { SocialsProvider } from "remix-auth-socials";
import { authenticator } from "~/utils/auth.server";

export let loader: LoaderFunction = async ({ request, params }) => {
	const user = await authenticator.isAuthenticated(request, {
		successRedirect: "/",
	});
	return { user };
};

export default function Login() {
	return (
		<Form action={`/auth/${SocialsProvider.GOOGLE}`} method="post">
			<button>Login with Google</button>
		</Form>
	);
}
