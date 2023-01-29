import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import prisma from "@/lib/prismadb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	const { uuid, filename } = req.query;

	const image = await prisma.image.findFirst({
		where: {
			uuid: uuid as string,
			filename: filename as string,
		},
	});

	const filePath = path.resolve(process.env.STORAGE_DIR as string, uuid as string, filename as string);

	if (!image || !fs.existsSync(filePath)) {
		res.status(404).send("Not found");
		return;
	}

	const imageBuffer = fs.readFileSync(filePath);
	res.setHeader("Content-Type", "image/png");
	res.status(200).send(imageBuffer);
}
