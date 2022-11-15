import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
} from "@remix-run/react";

//@ts-ignore
import styles from "./tailwind.css?url";

export function links() {
	return [{ rel: "stylesheet", href: styles }];
}

export const meta: MetaFunction = () => ({
	charset: "utf-8",
	title: "New Remix App",
	viewport: "width=device-width,initial-scale=1",
});
export const loader: LoaderFunction = async () => {
	return json({
		ENV: {
			GOOGLE_MAPS_API: process.env.GOOGLE_MAPS_API_KEY,
		},
	});
};

export default function App() {
	const data = useLoaderData();
	return (
		<html lang="en">
			<head>
				<Meta />
				<Links />
				<script
					src={`https://maps.googleapis.com/maps/api/js?key=${data.ENV.GOOGLE_MAPS_API}&libraries=places`}
				/>
			</head>
			<body style={{ height: "100%" }}>
				<Outlet />
				<ScrollRestoration />
				<Scripts />
				<script
					dangerouslySetInnerHTML={{
						__html: `window.ENV = ${JSON.stringify(data.ENV)}`,
					}}
				/>

				<LiveReload />
			</body>
		</html>
	);
}
