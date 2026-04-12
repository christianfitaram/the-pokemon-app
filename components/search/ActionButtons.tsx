
import {FaHome} from "react-icons/fa";
import Link from "next/link";
import {ActionButtonsProps} from "@/types/interfaces";



export const ActionButtons: React.FC<ActionButtonsProps> = ({
                                                                goToHome,
                                                                toListRecentlyViewed,
                                                                showAssistantChat,
                                                            }) => {
    return (
        <div className="grid grid-cols-2 sm:flex sm:flex-row justify-center gap-4">
            <button
                type="button"
                onClick={goToHome}
                className="border flex flex-row items-center justify-center gap-2 p-2 text-white rounded-lg hover:bg-gray-700 transition-transform duration-300 ease-in-out hover:scale-105"
            >
                <FaHome className="h-5 w-5"/> Go Home
            </button>
            <Link
                href="/random-pokemon"
                className="border p-2 rounded-lg text-white hover:bg-gray-700 transition-transform duration-300 ease-in-out hover:scale-105"
            >
                Random Pokémon
            </Link>
            <button
                type="button"
                className="border p-2 rounded-lg text-white hover:bg-gray-700 transition-transform duration-300 ease-in-out hover:scale-105"
                onClick={toListRecentlyViewed}
            >
                Recently Viewed
            </button>
            <button
                type="button"
                onClick={showAssistantChat}
                className="border p-2 text-white rounded-lg hover:bg-gray-700 transition-transform duration-300 ease-in-out hover:scale-105"
            >
                Get AI Help
            </button>
        </div>
    );
};
