import localFont from "next/font/local";

export const vazir = localFont({
  src: [
    {
      path: "./vazir/Vazirmatn-Regular.woff2",
      weight: "600",
      style: "SemiBold",
    },
    {
        path : "./vazir/Vazirmatn-Bold.ttf",
        weight : "600",
        style : "SemiBold"
    }
  ],
  variable: "--font-vazir",
  display: "swap",
});