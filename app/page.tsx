"use client";

import { useEffect, useState } from "react";
import Pokemons from "./components/Pokemons";
import Search from "./components/Search";
import AssistantChat from "./components/AssistantChat";
import { Pokemon, ChatMessage } from "@/types/types";
import { FaRobot } from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";

const HomePage: React.FC = () => {
  const [pokemomsToDisplay, setPokemomsToDisplay] = useState<Pokemon[]>([]);
  const [isSearchOn, setisSearchOn] = useState<boolean>(false);
  const [isUserChating, setIsUserChatting] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "How can I help you?" },
  ]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full">
      <Search
        value={pokemomsToDisplay}
        onChange={setPokemomsToDisplay}
        isSearchOn={isSearchOn}
        setisSearchOn={setisSearchOn}
        isUserChating={isUserChating}
        setIsUserChatting={setIsUserChatting}
      />
      <Pokemons
        value={pokemomsToDisplay}
        onChange={setPokemomsToDisplay}
        isSearchOn={isSearchOn}
        setisSearchOn={setisSearchOn}
        isUserChating={isUserChating}
        setIsUserChatting={setIsUserChatting}
      />
      <AnimatePresence>
        {isUserChating && (
          <motion.div
            key="assistant-chat"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-14 right-0 left-0 z-50 flex justify-center px-4 sm:justify-end sm:px-0 sm:right-6 sm:left-auto w-full sm:w-1/4"
          >
            <AssistantChat
              isUserChating={isUserChating}
              setIsUserChatting={setIsUserChatting}
              messages={chatMessages}
              setMessages={setChatMessages}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {!isUserChating && (
        <button
          onClick={() => setIsUserChatting(true)}
          className="fixed bottom-6 right-6 z-40 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg"
        >
          <FaRobot className="h-8 w-8" />
        </button>
      )}
    </div>
  );
};

export default HomePage;
