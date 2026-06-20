"use client";

import Image from "next/image";

interface Props {
  item: {
    _id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  };
  onIncrease: () => void;
  onDecrease: () => void;
}

export default function OrderedCard({ item, onIncrease, onDecrease }: Props) {
  return (
    <div className="w-full bg-[#F9F9F9] rounded-[18px] p-3 flex items-center justify-between shadow-sm border border-[#ECECEC]">
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={onIncrease}
            className="w-6 h-6 rounded-full bg-[#1E1E1E] text-white text-sm flex items-center justify-center"
          >
            +
          </button>

          <span className="text-[14px] font-bold text-[#1E1E1E]">
            {item.quantity}
          </span>

          <button
            onClick={onDecrease}
            className="w-6 h-6 rounded-full bg-[#EDEDED] text-[#1E1E1E] text-sm flex items-center justify-center"
          >
            -
          </button>
        </div>

        <div>
          <p className="text-[16px] font-bold text-[#1E1E1E]">{item.name}</p>
          <p className="text-[13px] text-[#777]">
            {item.price.toLocaleString()} تومان
          </p>
        </div>
      </div>

      <div className="relative w-[82px] h-[82px] rounded-[14px] overflow-hidden bg-[#DDD]">
        <Image
          src={item.image || "/images/placeholder.jpg"}
          alt={item.name}
          fill
          unoptimized
          className="object-cover"
        />
      </div>
    </div>
  );
}
