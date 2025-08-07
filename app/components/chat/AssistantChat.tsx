"use client";
import { AssistantChatProps } from "@/types/interfaces";
import UnifiedChat from "./UnifiedChat";

const AssistantChat: React.FC<AssistantChatProps> = ({
  setIsUserChatting,
  messages,
  setMessages,
}) => {
  return (
    <UnifiedChat
      chatType="assistant"
      onClose={() => setIsUserChatting(false)}
      messages={messages}
      setMessages={setMessages}
    />
  );
};

export default AssistantChat;
