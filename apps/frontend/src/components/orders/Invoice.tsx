"use client";

import Image from "next/image";

interface Props {
  order?: any;
  onClose?: () => void;
}

export default function Invoice({ order, onClose }: Props) {
  if (!order) return null;

  return (
    <div className="w-full flex flex-col items-center pt-2">
      <div className="relative w-full flex items-center justify-center mb-8">
        <h1 className="text-[22px] font-bold text-[#1E1E1E]">
          سفارش شما ثبت شد!
        </h1>

      </div>

      <div className="w-[220px] h-[220px] rounded-full border-2 border-[#A3A3A3] flex items-center justify-center">
        <div className="w-[180px] h-[180px] rounded-full border border-[#BDBDBD] flex items-center justify-center">
          <Image
            src="/imge/order.png"
            width={70}
            height={70}
            alt="coffee cup"
            className="opacity-70"
          />
        </div>
      </div>

      <p className="mt-8 text-[#3C3C3C] text-[16px]">
        سفارش به زودی آماده می‌شود.
      </p>

      <div className="mt-12 w-full max-w-[320px] bg-[#FDFBF7] border border-[#D5D1C8] rounded-[16px] shadow-sm px-6 py-5 text-center">
        <p className="text-[14px] text-[#3C3C3C] mb-2">زمان تقریبی آماده سازی</p>
        <p className="text-[28px] font-bold text-[#8B6B4A]">15-20 دقیقه</p>
      </div>
    </div>
  );
}
