import { Prisma } from "@prisma/client";
import { getSession, signIn, signOut } from "next-auth/react";
import prisma from "@/lib/prismadb";
import { MouseEventHandler, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { CSSTransition } from "react-transition-group";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";

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
	const [showFullImage, setShowFullImage] = useState(false);
	const [fullImage, setFullImage] = useState<Image | null>(null);
	const nodeRef = useRef(null);

	useEffect(() => {
		if (!user) {
			signIn();
			return;
		}

		socketInitializer();
		formatImages();
	}, []);

	const hideImage = (e: React.MouseEvent<HTMLElement>) => {
		setShowFullImage(false);
		setTimeout(() => {
			setFullImage(null);
		}, 150);
	};

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
			<div className="w-full h-screen flex flex-col relative">
				<div className="w-full h-20 flex flex-row p-4">
					<div className="flex-grow h-full text-4xl flex flex-col justify-center items-start">
						<div>Screenshots</div>
					</div>
					<div className="h-full flex flex-row justify-end items-center">
						<div
							className="h-full aspect-square rounded-full border-2 border-zinc-800 cursor-pointer relative after:bg-zinc-700 after:opacity-0 hover:after:opacity-100 after:transition-opacity after:absolute after:top-full after:content-['Sign_Out'] after:text-sm after:z-10 after:p-1 after:rounded after:text-center after:w-20 after:left-1/2 after:-translate-x-1/2"
							onClick={() => {
								signOut();
							}}>
							<img className="w-full rounded-full" src={user.image as string} alt={user.name as string} />
						</div>
					</div>
				</div>
				<div className="w-full grow overflow-y-auto no-scrollbar">
					<div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2 m-2">
						{images.map((image) => (
							<div
								key={image.uuid}
								className="w-full h-full aspect-[16/9] bg-zinc-800 p-2 rounded cursor-pointer"
								onClick={() => {
									setFullImage(image);
									setShowFullImage(true);
								}}>
								<div className="w-full h-full overflow-hidden relative rounded">
									<img className="w-full bg-[conic-gradient(#fff_90deg,#ccc_90deg_180deg,#fff_180deg_270deg,#ccc_270deg)] bg-[length:30px_30px] bg-repeat bg-center absolute top-1/2 -translate-y-1/2" src={`/image/${image.uuid}/${image.filename}`} alt={image.filename} />
								</div>
							</div>
						))}
					</div>
				</div>
				<CSSTransition nodeRef={nodeRef} in={showFullImage} timeout={150} classNames="opacity-transition">
					<div
						ref={nodeRef}
						className="absolute w-full h-full bg-[rgba(0,0,0,0.5)] opacity-0 flex flex-col justify-center items-center z-[-1]"
						onClick={(e) => {
							if (e.target !== e.currentTarget) return;
							hideImage(e);
						}}>
						<div className="bg-zinc-800 rounded flex flex-col justify-center items-center max-w-[calc(100%-2rem)] max-h-[calc(100%-2rem)] relative">
							<div className="absolute bg-zinc-700 rounded-full -top-2 -right-2 w-6 h-6 flex justify-center items-center cursor-pointer" onClick={hideImage}>
								<FontAwesomeIcon icon={faClose} />
							</div>
							{fullImage && (
								<>
									<div className="w-full h-full p-2">
										<img className="w-full h-full bg-[conic-gradient(#fff_90deg,#ccc_90deg_180deg,#fff_180deg_270deg,#ccc_270deg)] bg-[length:30px_30px] bg-repeat bg-center" src={`/image/${fullImage.uuid}/${fullImage.filename}`} alt={fullImage.filename} />
									</div>
								</>
							)}
						</div>
					</div>
				</CSSTransition>
			</div>
		</>
	);
}
