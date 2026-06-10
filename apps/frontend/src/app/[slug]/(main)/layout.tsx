
// import SessionInitializer from "@/components/menu/SessionInitializer";
import ButtonNav from "@/components/layout/ButtonNav";
import { Suspense } from "react";

export default async function MainLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>

}) {

const {slug} = await params
  return (
    <div dir="rtl" className="w-full min-h-[100dvh]">
      {/* <ScrollContainer> */}
      <div className="min-h-[100dvh] mx-auto w-full max-w-[420px]  ">
        <div className=" w-full min-h-[100dvh] relative ">
          <Suspense fallback={null}>
            {/* <SessionInitializer /> */}
          </Suspense>
          {children}
          <ButtonNav slug={slug} />
        </div>
      </div>
      {/* </ScrollContainer> */}
    </div>
  );
}
