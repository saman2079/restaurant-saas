import Image from "next/image";
import Link from "next/link";
import React from "react";
import type { MenuItem } from "@/types/product";
import AddToCartButton from "./AddToCartButton";

interface Props {
  items: MenuItem[];
}

export default function MenuList({ items }: Props) {

  // گروه بندی آیتم ها بر اساس کتگوری
  const groupedItems = items.reduce((acc: any, item) => {
    const categoryId = item.category._id;

    if (!acc[categoryId]) {
      acc[categoryId] = {
        categoryName: item.category.name,
        items: [],
      };
    }

    acc[categoryId].items.push(item);

    return acc;
  }, {});

  console.log(items)

  return (
    <div className="space-y-10 pb-30 px-5">

      {Object.entries(groupedItems).map(([categoryId, categoryData]: any) => (
        
        // سکشن هر کتگوری
        <section
          key={categoryId}
          id={`category-${categoryId}`}
          className="space-y-4 scroll-mt-40"
        >
          <h2 className="text-2xl font-bold">
            {categoryData.categoryName}
          </h2>

          <div className="space-y-2">
            {categoryData.items.map((item: MenuItem) => (
              <Link
                key={item._id}
                href={item._id}
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

                    <AddToCartButton item={item} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}