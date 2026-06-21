import Image from "next/image";
import Link from "next/link";
import React from "react";
import AddToCartButton from "./AddToCartButton";
import { MenuItem } from "@/types";

// نوع کتگوری رو تعریف کن (مطابق با ساختار دیتا)
interface Category {
  id: string;
  name: string;
  items: MenuItem[];
  // سایر فیلدها
}

interface Props {
  category: Category; // حالا کل کتگوری رو دریافت می‌کنیم
}

export default function MenuList({ category }: Props) {
  const { id, name, items } = category;

  return (
    <div className="space-y-20 pb-30 px-5">
      {/* سکشن مربوط به این کتگوری با id یکتا */}
      <section
        id={`category-${id}`}
        className="space-y-4 scroll-mt-[15rem]"
      >
        <h2 className="text-2xl font-bold">{name}</h2>

        <div className="space-y-2">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.id}
              className="flex gap-5 bg-white p-2 rounded-[20px] shadow-[0px_8px_12px_0px_#0000001A]"
            >
              <Image
                src={item.image}
                unoptimized
                alt=""
                width={108}
                height={127}
                className="rounded-[17px] min-h-[127px] min-w-[107px] max-w-[107px] max-h-[127px]"
              />

              <div className="flex flex-col justify-center w-full">
                <div className="line-clamp-2">
                  <h2>{item.name}</h2>
                  <p>{item.description}</p>
                </div>

                <div className="flex justify-between mt-4">
                  <p>{item.price} تومان</p>
                  <AddToCartButton item={item} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}