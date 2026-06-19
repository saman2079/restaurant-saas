"use client";
import CategoryBar from "@/components/menu/CategoryBar";
import Header from "@/components/menu/Header";
import MenuList from "@/components/menu/MenuList";
import { menuApi } from "@/lib/api/menu.api";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useParams } from "next/navigation";
import React from "react";

function Menu() {
  const { slug } = useParams<{ slug: string }>();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["menu-items", slug],
    queryFn: () => menuApi.getItems(slug),
  });

  console.log(items)

  return (
    <div className="min-h-[100dvh]">
      <Header />

      <div className="-mt-10 space-y-5">
        {/* <CategoryBar  />
        <MenuList  /> */}
      </div>
    </div>
  );
}

export default Menu;
