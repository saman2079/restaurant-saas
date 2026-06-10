"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useCartStore } from "@/src/store/cart-store";

export default function ButtonNav({slug} : {slug : string}) {
  const pathname = usePathname();
  const totalItems = useCartStore((state) => state.totalItems());


  const links = [
    { id: 1, title: "سفارش من", icons: "/icons/shop.svg", href: `/${slug}/orders` },
    { id: 2, title: "دستیار هوشمند", icons: "/icons/ai.svg", href: `/${slug}/ai` },
    { id: 3, title: "منو کافه", icons: "/icons/home.svg", href: "/${slug}/menu" },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full rounded-b-[5px] max-w-[420px] bg-white shadow-[0px_-2px_4.7px_0px_#00000021] z-50">
      <div className="flex justify-around items-center py-3">
        {links.map((item) => {
          const isActive = pathname === item.href;
          const showBadge = item.href === "/orders" && totalItems > 0;

          return (
            <Link
              key={item.id}
              href={item.href}
              className="relative flex flex-col items-center justify-center px-3.5 py-2.5 gap-1"
            >
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-[#201F20] scale-110 rounded-[27px]"
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 35,
                  }}
                />
              )}

              <div className="relative z-10 flex flex-col items-center gap-1">
                <div className="relative">
                  <Image
                    src={item.icons}
                    alt={item.title}
                    width={22}
                    height={22}
                    className={`transition-all duration-200 ${
                      isActive ? "brightness-0 invert" : "opacity-50"
                    }`}
                  />

                  {showBadge && (
                    <div className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF7272] flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold leading-none">
                        {totalItems}
                      </span>
                    </div>
                  )}
                </div>

                <p
                  className={`text-[10px] transition-all duration-200 ${
                    isActive ? "text-white" : "text-[#858689]"
                  }`}
                >
                  {item.title}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
