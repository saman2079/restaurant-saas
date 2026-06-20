"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppErrorBoundary } from "@/components/ui/error-boundary";

interface Table {
  number: number;
  name?: string;
}

export default function TablesPage() {
  const { slug } = useParams<{ slug: string }>();
  const [tables, setTables] = useState<Table[]>([]);
  const [tableCount, setTableCount] = useState(10);
  const [baseUrl, setBaseUrl] = useState(
    typeof window !== "undefined" ? window.location.origin : "",
  );
  const [printTable, setPrintTable] = useState<Table | null>(null);

  const generateTables = () => {
    const newTables = Array.from({ length: tableCount }, (_, i) => ({
      number: i + 1,
      name: `میز ${i + 1}`,
    }));
    setTables(newTables);
  };

  const getTableUrl = (tableNumber: number) =>
    `${baseUrl}/${slug}?table=${tableNumber}`;

  const handlePrint = (table: Table) => {
    setPrintTable(table);
    setTimeout(() => {
      window.print();
      setPrintTable(null);
    }, 500);
  };

  const handlePrintAll = () => {
    window.print();
  };

  return (
    <AppErrorBoundary>
      <div className="p-6 space-y-6" dir="rtl">
        <h1 className="text-lg font-medium text-gray-900">
          مدیریت QR Code میزها
        </h1>

        {/* تنظیمات */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
          <div className="flex gap-3 items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                تعداد میزها
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={tableCount}
                onChange={(e) => setTableCount(Number(e.target.value))}
                className="h-10 w-32 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                آدرس سایت
              </label>
              <input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="https://yourdomain.com"
              />
            </div>
            <Button onClick={generateTables}>ساخت QR Codeها</Button>
          </div>
          <p className="text-xs text-gray-400">
            مثال لینک: {baseUrl}/{slug}?table=1
          </p>
        </div>

        {tables.length > 0 && (
          <>
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">
                {tables.length} میز ساخته شد
              </p>
              <Button variant="secondary" size="sm" onClick={handlePrintAll}>
                🖨️ پرینت همه
              </Button>
            </div>

            {/* گرید QR Codeها */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 print:grid-cols-3">
              {tables.map((table) => (
                <div
                  key={table.number}
                  className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col items-center gap-3 print:break-inside-avoid"
                >
                  <p className="text-sm font-medium text-gray-900">
                    {table.name}
                  </p>
                  <QRCodeCanvas
                    value={getTableUrl(table.number)}
                    size={120}
                    level="H"
                    includeMargin
                  />
                  <p className="text-xs text-gray-400 text-center break-all">
                    {getTableUrl(table.number)}
                  </p>
                  <button
                    onClick={() => handlePrint(table)}
                    className="text-xs text-orange-500 hover:text-orange-600 print:hidden"
                  >
                    🖨️ پرینت این میز
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* استایل پرینت */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:grid-cols-3,
          .print\\:grid-cols-3 * {
            visibility: visible;
          }
          .print\\:break-inside-avoid {
            break-inside: avoid;
          }
          .print\\:hidden {
            display: none;
          }
        }
      `}</style>
    </AppErrorBoundary>
  );
}
