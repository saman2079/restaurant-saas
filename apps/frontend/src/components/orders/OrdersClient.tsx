"use client";

import { useState } from "react";
import Invoice from "./Invoice";
import OrdersList from "./OrdersList";

export default function OrdersClient() {
  const [submittedOrder, setSubmittedOrder] = useState<any>(null);

  return submittedOrder ? (
    <Invoice order={submittedOrder} onClose={() => setSubmittedOrder(null)} />
  ) : (
    <OrdersList onSubmitted={setSubmittedOrder} />
  );
}
