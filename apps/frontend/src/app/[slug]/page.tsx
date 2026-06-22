import Link from "next/link";
import { TableSaver } from "@/components/TableSaver";

async function RestaurantMenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const { table } = await searchParams;
  const tableNum = Array.isArray(table) ? table[0] : table;

  return (
    <div className="bg-[url('/imge/home-bg.png')] max-w-[375px] mx-auto text-center text-white bg-center bg-no-repeat flex flex-col justify-between py-8 px-5 min-h-[100dvh]">
      {/* ذخیره شماره میز در localStorage */}
      {tableNum && <TableSaver slug={slug} table={tableNum} />}

      <div className="space-y-10">
        <div>
          <p>میز {tableNum || '-'}</p>
        </div>
        <div className="flex flex-col gap-5 px-14">
          <p>سلام</p>
          <p className="leading-8">
            من دستیار هوشمند {slug} هستم، چطور می‌تونم کمکت کنم؟
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-5 p-5 items-center">
        <Link
          className="w-full rounded-[15px] p-4 bg-white text-[#201F20]"
          href={`/${slug}/ai${tableNum ? `?table=${tableNum}` : ''}`}
        >
          شروع گفتگو
        </Link>
        <Link
          className="w-full rounded-[15px] p-4 text-white border border-white"
          href={`/${slug}/menu${tableNum ? `?table=${tableNum}` : ''}`}
        >
          مشاهده منو
        </Link>
      </div>
    </div>
  );
}

export default RestaurantMenuPage;