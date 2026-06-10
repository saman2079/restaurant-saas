// src/components/ai/ChatMessages.tsx

"use client";

import {
  memo,
  useEffect,
  useRef,
} from "react";

import Image from "next/image";
import ChatMessage from "./ChatMessage";

interface Message {
  role: "user" | "assistant";
  content: string;
  menuCards?: any[];
}

interface Props {
  messages: Message[];
  loading: boolean;
}

function ChatMessages({
  messages,
  loading,
}: Props) {

  const messagesEndRef =
    useRef<HTMLDivElement>(null);

  // auto scroll
  useEffect(() => {

    messagesEndRef.current
      ?.scrollIntoView({
        behavior: "smooth",
      });

  }, [messages, loading]);



  return (
    <div className='p-10 min-h-[60dvh] overflow-y-auto max-h-[70dvh]'>

      {messages.length === 0 ? (

        <div className='bg-white w-full flex gap-2 items-center shadow-[2px_3px_8px_0px_#0000001A] p-5 py-7 rounded-[15px]'>

          <Image
            src={"/imge/ai.png"}
            alt=''
            width={46}
            height={68}
          />

          <p>
            سلام، به کافه تهران
            خوش اومدی امروز چی
            میل داری؟
          </p>

        </div>

      ) : (

        <div className='flex flex-col gap-4'>

          {messages.map(
            (msg, index) => (

              <ChatMessage
                key={index}
                role={msg.role}
                content={
                  msg.content
                }
                menuCards={msg.menuCards ?? []}
              />

            )
          )}

          {loading && (

            <div className='flex justify-end'>

              <div className='bg-white p-4 rounded-[18px]'>

                در حال نوشتن...

              </div>

            </div>

          )}

          <div
            ref={messagesEndRef}
          />

        </div>

      )}

    </div>
  );
}

export default memo(ChatMessages);