import type { LoaderFunction } from "@remix-run/node";
import { authenticator } from "~/utils/auth.server";

export let loader: LoaderFunction = ({ request, params }) => {
	return authenticator.authenticate(params.provider as string, request, {
		successRedirect: "/",
		failureRedirect: "/login",
	});
};
