// src/components/ai/ChatMessage.tsx

import Image from "next/image";
import { memo } from "react";


interface MenuCard {
  id: string;
  name: string;
  price: number;
  description: string;
  images: string[];
}

interface Props {
  role: "user" | "assistant";
  content: string;
  menuCards: MenuCard[]
}

function ChatMessage({
  role,
  content,
  menuCards
}: Props) {

  return (
    <div>

      <div
        className={`flex ${role === "user"
          ? "justify-start"
          : "justify-end"
          }`}
      >

        <div
          className={`
          max-w-[80%]
          p-4
          rounded-[18px]
          shadow-sm
          
          ${role === "user"
              ? "bg-[#E8E8E8] text-[#201F20] rounded-br-[5px] shadow-[2px_3px_8px_0px_#0000001A]"
              : "bg-white text-[#201F20] rounded-bl-[5px] shadow-[2px_3px_8px_0px_#0000001A]"
            }
          `}
        >

          {content}

        </div>

      </div>

      <div className=" space-y-2.5 my-2">
        {menuCards?.map((item) => (
          <div
            className="flex gap-5 bg-white p-2 rounded-[20px] shadow-[0px_8px_12px_0px_#0000001A]"
          >
            <Image
              src={item.images[0]}
              alt=""
              width={108}
              height={127}
              className="rounded-[17px] min-h-[127px]"
            />

            <div className="flex flex-col justify-center w-full">
              <div className="line-clamp-2">
                <h2>{item.name}</h2>
                <p>{item.description}</p>
              </div>

              <div className="flex justify-between mt-4">
                <p>{item.price} تومان</p>

                {/* <AddToCartButton item={item} /> */}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(ChatMessage);