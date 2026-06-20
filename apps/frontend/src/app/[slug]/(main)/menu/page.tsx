import CategoryBar from "@/components/menu/CategoryBar";
import Header from "@/components/menu/Header";
import MenuList from "@/components/menu/MenuList";
import { menuApi } from "@/lib/api/menu.api";
import React from "react";

async function Menu({ params }: { params: Promise<{ slug: string }> }) {
  const slug = await (await params).slug;
  const res = await menuApi.getFullMenuPublic(slug);
  
  return (
    <div className="min-h-[100dvh]">
      <Header />

      <div className="-mt-10 space-y-5">
        <CategoryBar categories={res} />
        {res.map((category) => (
          <MenuList key={category.id} category={category} />
        ))}
      </div>
    </div>
  );
}

export default Menu;
