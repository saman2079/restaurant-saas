import OrdersClient from "@/components/orders/OrdersClient";

export default function Page() {
  return (
    <div className="w-full min-h-[100dvh] flex flex-col items-center bg-[#5B5B5B]">
      <div className="w-full max-w-[450px] min-h-[100dvh] bg-[#F5F5F5] rounded-t-[30px] px-4 pt-6 pb-24">
        <OrdersClient />
      </div>
    </div>
  );
}
