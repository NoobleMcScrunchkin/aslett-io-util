import type { NextApiRequest, NextApiResponse } from "next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prismadb";
import crypto from "crypto";
import { v4 } from "uuid";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	const session = await getServerSession(req, res, authOptions);

	let user = await prisma.user.findFirst({
		where: {
			email: session?.user?.email as string,
		},
	});

	if (!user) {
		res.status(401).json({ message: "Not authorized" });
		return;
	}

	const apiKey = await prisma.apiKey.create({
		data: {
			key: crypto
				.createHash("sha256")
				.update(user.id + v4())
				.digest("hex"),
			user: {
				connect: {
					id: user.id,
				},
			},
		},
	});

	res.status(200).json({ apiKey: apiKey.key });
}
