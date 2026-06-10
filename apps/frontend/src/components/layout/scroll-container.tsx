"use client";

import { useUIStore } from "@/src/app/hooks/ui";
import { useEffect, useRef } from "react";

export default function ScrollContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const setScrollContainer = useUIStore((s) => s.setScrollContainer);

  useEffect(() => {
    setScrollContainer(ref.current);
  }, [setScrollContainer]);

  return (
    <div
      ref={ref}
      className="h-[100dvh] overflow-y-auto overflow-x-hidden"
    >
      {children}
    </div>
  );
}
