"use client";

import { MenuItem } from "@/types/product";
import { useCartStore } from "@/store/cart-store";

interface Props {
    item: MenuItem;
}

export default function AddToCartButton({
    item,
}: Props) {

    const {
        items,
        addToCart,
        increase,
        decrease,
    } = useCartStore();

    const cartItem = items.find(
        (i) => i._id === item._id
    );



    // اگر هنوز داخل سبد نبود
    if (!cartItem) {

        return (
            <button
                onClick={(e) => {

                    e.preventDefault();

                    addToCart({
                        _id: item._id,
                        name: item.name,
                        price: item.price,
                        image: item.images[0],
                    });
                }}
                className="
                    w-8 h-8 rounded-[6px]
                    bg-[#201F20] text-white
                    flex items-center justify-center
                    text-xl
                    cursor-pointer
                "
            >
                +
            </button>
        );
    }



    // اگر داخل سبد بود
    return (
        <div className="flex items-center gap-3">

            <button
                onClick={(e) => {

                    e.preventDefault();

                    decrease(item._id);
                }}
                className="
                    w-7 h-7 rounded-full
                    bg-[#201F20] text-white
                "
            >
                -
            </button>

            <span className="font-bold">
                {cartItem.quantity}
            </span>

            <button
                onClick={(e) => {

                    e.preventDefault();

                    increase(item._id);
                }}
                className="
                    w-7 h-7 rounded-full
                    bg-[#201F20] text-white
                "
            >
                +
            </button>

        </div>
    );
}