// src/components/ai/ChatInput.tsx

"use client";

import Image from "next/image";

interface Props {
  message: string;

  setMessage: React.Dispatch<
    React.SetStateAction<string>
  >;

  sendMessage: () => void;

  loading: boolean;
}

function ChatInput({
  message,
  setMessage,
  sendMessage,
  loading,
}: Props) {

  return (
    <div className="fixed bottom-[95px] left-1/2 -translate-x-1/2 w-full max-w-[420px] px-3 z-50">

      <div className="flex gap-2 items-center">

        <button
          type='submit'
          onClick={sendMessage}
          disabled={loading}
          className="bg-[#201F20] w-[54px] h-[54px] rounded-full flex items-center justify-center shrink-0"
        >

          <Image
            src={"/icons/send.svg"}
            alt=""
            width={24}
            height={24}
          />

        </button>

        <div className="bg-white rounded-[18px] flex-1 shadow-md">

          <input
            value={message}
            onChange={(e) =>
              setMessage(
                e.target.value
              )
            }
            onKeyDown={(e) => {

              if (
                e.key === "Enter"
              ) {
                sendMessage();
              }

            }}
            className="w-full bg-transparent p-4 outline-none"
            type="text"
            placeholder="پیام خود را بنویسید..."
          />

        </div>

      </div>

    </div>
  );
}

export default ChatInput;