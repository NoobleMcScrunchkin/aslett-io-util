import formidable from "formidable";
import type { NextApiRequest, NextApiResponse } from "next";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import path from "path";
import fs from "fs";
import jimp from "jimp";
import prisma from "@/lib/prismadb";
import type { Server as HTTPServer } from "http";
import type { Socket as NetSocket } from "net";
import type { Server as IOServer, Socket } from "socket.io";

interface SocketServer extends HTTPServer {
	io?: IOServer | undefined;
}

interface SocketWithIO extends NetSocket {
	server: SocketServer;
}

interface NextApiResponseWithSocket extends NextApiResponse {
	socket: SocketWithIO;
}

export default async function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
	const img_uuid = v4();
	const apiKey = req.query.apiKey as string;

	if (!apiKey) {
		res.status(401).json({ message: "No API Key provided" });
		return;
	}

	const apiKeyObj = await prisma.apiKey.findUnique({
		where: {
			key: apiKey,
		},
	});

	if (!apiKeyObj) {
		res.status(401).json({ message: "Invalid API Key" });
		return;
	}

	try {
		const data: { fields: any; files: any } = await new Promise((resolve, reject) => {
			const form = new formidable.IncomingForm({ uploadDir: process.env.STORAGE_DIR as string, keepExtensions: true });

			form.parse(req, (err: any, fields: any, files: any) => {
				if (err) reject({ err });
				resolve({ fields, files });
			});

			form.on("file", (field, file) => {
				fs.mkdirSync(path.resolve(process.env.STORAGE_DIR as string, img_uuid));
				jimp.read(file.filepath, (err, image) => {
					if (err) throw err;
					image.write(path.resolve(process.env.STORAGE_DIR as string, img_uuid) + "/" + file.originalFilename?.slice(0, file.originalFilename.lastIndexOf(".")) + ".png");
					fs.unlinkSync(file.filepath);
				});
			});
		});

		const filename = data.files.image.originalFilename;

		const image: Prisma.ImageCreateInput = {
			uuid: img_uuid,
			filename,
			user: {
				connect: {
					id: apiKeyObj.userid,
				},
			},
		};

		await prisma.image.create({ data: image });

		if (res.socket.server.io) {
			const io = res.socket.server.io;

			io.sockets.sockets.forEach((socket: any) => {
				if (socket.userid == apiKeyObj.userid) {
					socket.emit("newImage", { uuid: img_uuid, filename });
				}
			});
		}

		res.status(200).json({ url: `http://localhost:3000/image/${img_uuid}` });
	} catch (error: any) {
		res.status(500).json(error.message);
	}
}

export const config = {
	api: {
		bodyParser: false,
	},
};
