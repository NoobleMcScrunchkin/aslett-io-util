/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: false,
	async rewrites() {
		return [
			{
				source: "/image/:uuid/:filename",
				destination: "/api/image/:uuid/:filename",
			},
			{
				source: "/i/:uuid/:filename",
				destination: "/api/image/:uuid/:filename",
			},
			{
				source: "/image/:uuid",
				destination: "/api/image/:uuid/",
			},
			{
				source: "/i/:uuid",
				destination: "/api/image/:uuid/",
			},
		];
	},
};

const { withSuperjson } = require("next-superjson");
module.exports = withSuperjson()(nextConfig);
