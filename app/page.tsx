"use client";

import {useState, useRef} from "react";
import Pokemons from "@/components/Pokemons";
import Search from "@/components/search/Search";
import AssistantChat from "@/components/chat/AssistantChat";
import {Pokemon, ChatMessage} from "@/types/interfaces";
import {FaRobot} from "react-icons/fa";
import {AnimatePresence, motion} from "framer-motion";


const HomePage: React.FC = () => {
    const [pokemonsToDisplay, setPokemonsToDisplay] = useState<Pokemon[]>([]);
    const [isSearchOn, setIsSearchOn] = useState<boolean>(false);
    const [isUserChatting, setIsUserChatting] = useState<boolean>(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        {role: "assistant", content: "How can I help you?"},
    ]);
    const [typeLoading, setTypeLoading] = useState(false);
    const fetchPokemonRef = useRef<((url?: string, isInitial?: boolean) => void) | null>(null);
    return (
        <div className="flex flex-col items-center justify-start min-h-screen w-full">
            <Search
                value={pokemonsToDisplay}
                onChange={setPokemonsToDisplay}
                isSearchOn={isSearchOn}
                setIsSearchOn={setIsSearchOn}
                isUserChatting={isUserChatting}
                setIsUserChatting={setIsUserChatting}
                setTypeLoading={setTypeLoading}
                fetchPokemonRef={fetchPokemonRef}
            />

            <Pokemons
                value={pokemonsToDisplay}
                onChange={setPokemonsToDisplay}
                isSearchOn={isSearchOn}
                setIsSearchOn={setIsSearchOn}
                isUserChatting={isUserChatting}
                setIsUserChatting={setIsUserChatting}
                typeLoading={typeLoading}
                onFetchPokemon={(fetchPokemon) => {
                    fetchPokemonRef.current = fetchPokemon;
                }}
            />
            <AnimatePresence>
                {isUserChatting && (
                    <motion.div
                        key="assistant-chat"
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: 20}}
                        transition={{duration: 0.3, ease: "easeOut"}}
                        className="fixed bottom-14 z-50 flex justify-center px-4 sm:px-6 w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl mx-auto sm:mx-0 sm:right-6 sm:left-auto"
                    >
                        <AssistantChat
                            isUserChatting={isUserChatting}
                            setIsUserChatting={setIsUserChatting}
                            messages={chatMessages}
                            setMessages={setChatMessages}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
            {!isUserChatting && (
                <button
                    onClick={() => setIsUserChatting(true)}
                    aria-label="Open assistant chat"
                    title="Open assistant chat"
                    className="fixed bottom-6 right-6 z-40 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                    <FaRobot className="h-8 w-8"/>
                </button>
            )}

        </div>
    );
};

export default HomePage;
