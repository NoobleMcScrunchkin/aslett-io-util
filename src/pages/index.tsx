import LoginBtn from "@/components/LoginBtn";
import { Prisma } from "@prisma/client";
import { getSession, signIn, signOut } from "next-auth/react";
import prisma from "@/lib/prismadb";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

type UserWithImages = Prisma.UserGetPayload<{
	include: {
		images: true;
	};
}>;

interface Image {
	uuid: string;
	filename: string;
}

export async function getServerSideProps(context: any) {
	const session = await getSession(context);

	if (!session) {
		return {
			props: {},
		};
	}

	let user = await prisma.user.findUnique({
		where: {
			email: session.user?.email as string,
		},
		include: {
			images: {
				orderBy: {
					createdAt: "desc",
				},
			},
		},
	});

	return {
		props: { user },
	};
}

export default function Page({ user }: { user: UserWithImages }) {
	let socket: any;
	let [images, setImages] = useState<Image[]>([]);

	useEffect(() => {
		if (!user) {
			signIn();
			return;
		}

		socketInitializer();
		formatImages();
	}, []);

	const formatImages = () => {
		if (!user) return;

		let images = user.images.map((image) => {
			return {
				uuid: image.uuid,
				filename: image.filename,
			};
		});

		setImages(images);
	};

	const socketInitializer = async () => {
		if (!user) return;

		console.log("Initializing socket");

		await fetch("/api/socket");

		socket = io();

		socket.auth = {
			userid: user.id,
		};

		socket.connect();

		socket.on("newImage", (image: Image) => {
			setImages((images) => [image, ...images]);
		});
	};

	if (!user) return;

	return (
		<>
			<div className="w-full h-screen flex flex-col">
				<div className="w-full text-center">
					Signed in as {user.name} <br />
					<button onClick={() => signOut()}>Sign out</button>
				</div>
				<div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2 m-2 grow overflow-y-auto no-scrollbar">
					{images.map((image) => (
						<a key={image.uuid} href={`/image/${image.uuid}/${image.filename}`}>
							<div className="w-full h-full bg-zinc-800 p-2 rounded">
								<div className="w-full h-full aspect-[16/9] hover:z-10 overflow-hidden relative rounded">
									<img className="w-full bg-[conic-gradient(#fff_90deg,#ccc_90deg_180deg,#fff_180deg_270deg,#ccc_270deg)] bg-[length:30px_30px] bg-repeat bg-center absolute top-1/2 -translate-y-1/2" src={`/image/${image.uuid}/${image.filename}`} alt={image.filename} />
								</div>
							</div>
						</a>
					))}
				</div>
			</div>
		</>
	);
}
