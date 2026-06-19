"use client";

import { Category } from "@/types/category";
import Image from "next/image";
import { useEffect, useState } from "react";

interface Props {
    categories: Category[];
}

export default function CategoryBar({ categories }: Props) {

    const [activeCategory, setActiveCategory] = useState("");

    const scrollToCategory = (categoryId: string) => {

        setActiveCategory(categoryId);

        const section = document.getElementById(
            `category-${categoryId}`
        );

        section?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    };



    useEffect(() => {

        const sections =
            document.querySelectorAll("section");



        const observer = new IntersectionObserver(

            (entries) => {

                entries.forEach((entry) => {

                    // اگر سکشن داخل صفحه دیده شد
                    if (entry.isIntersecting) {

                        // category-123
                        const sectionId = entry.target.id;

                        // 123
                        const categoryId =
                            sectionId.replace(
                                "category-",
                                ""
                            );

                        setActiveCategory(categoryId);
                    }
                });
            },

            {
                threshold: 0.3,
            }
        );



        sections.forEach((section) => {
            observer.observe(section);
        });



        return () => {
            sections.forEach((section) => {
                observer.unobserve(section);
            });
        };

    }, []);




    return (
        <div className="text-[#201F20] bg-[#F5F6FB] rounded-t-[40px] py-5 sticky top-0 z-50">

            <div className="px-10 py-5 space-y-2">
                <h1>کافه رستوران تهران</h1>
                <p>میدان ونک</p>
            </div>

            <div className="w-full flex justify-around overflow-x-auto overflow-y-hidden pb-2 gap-4">

                {
                    categories.map((item) => {

                        const active =
                            activeCategory === item._id;

                        return (

                            <button
                                key={item._id}
                                onClick={() => scrollToCategory(item._id)}
                                className={`
                                    flex flex-col gap-2 items-center  justify-center shrink-0
                                    transition-all duration-300
                                    
                                    ${active
                                        ? " scale-110 p-4 text-[#201F20] rounded-[27px] bg-white shadow-[0px_2px_6px_0px_#0000001A]"
                                        : "text-[#858689] opacity-70"
                                    }
                                `}
                            >

                                <Image
                                    src={item.image}
                                    alt=""
                                    width={24}
                                    height={24}
                                    className={`${active ? "brightness-100 invert-0" : ""}`}
                                />

                                <p>{item.title}</p>

                            </button>
                        )
                    })
                }
            </div>
        </div>
    );
}