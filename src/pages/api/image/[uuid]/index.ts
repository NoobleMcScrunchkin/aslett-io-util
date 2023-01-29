import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import prisma from "@/lib/prismadb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	const { uuid } = req.query;

	const image = await prisma.image.findFirst({
		where: {
			uuid: uuid as string,
		},
	});

	if (!image) {
		res.status(404).send("Not found");
		return;
	}

	const filePath = path.resolve(process.env.STORAGE_DIR as string, uuid as string, image.filename);

	if (!fs.existsSync(filePath)) {
		res.status(404).send("Not found");
		return;
	}

	const imageBuffer = fs.readFileSync(filePath);
	res.setHeader("Content-Type", "image/png");
	res.status(200).send(imageBuffer);
}
