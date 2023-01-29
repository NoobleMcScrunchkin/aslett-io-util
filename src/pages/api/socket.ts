import { NextApiRequest, NextApiResponse } from "next";
import { Server } from "socket.io";
import type { Server as HTTPServer } from "http";
import type { Socket as NetSocket } from "net";
import type { Server as IOServer } from "socket.io";
import { ExtendedError } from "socket.io/dist/namespace";

interface SocketServer extends HTTPServer {
	io?: IOServer | undefined;
}

interface SocketWithIO extends NetSocket {
	server: SocketServer;
}

interface NextApiResponseWithSocket extends NextApiResponse {
	socket: SocketWithIO;
}

export default function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
	// It means that socket server was already initialised
	if (res.socket.server.io) {
		res.end();
		return;
	}

	const io = new Server(res.socket.server);
	res.socket.server.io = io;

	io.use((socket: any, next: (err?: ExtendedError | undefined) => void) => {
		const userid = socket.handshake.auth.userid;
		if (!userid) {
			return next(new Error("invalid user"));
		}
		socket.userid = userid;
		next();
	});

	res.end();
}
