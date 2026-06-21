import axios, { AxiosError, AxiosInstance } from "axios";

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    // client-side: از hostname مرورگر استفاده کن
    // گوشی: 172.20.10.13:4000 ✅
    // کامپیوتر با localhost: localhost:4000 ✅
    // کامپیوتر با IP: 172.20.10.13:4000 ✅
    return `http://${window.location.hostname}:4000/api`;
  }
  // server-side (SSR): از متغیر محیطی یا Docker service name
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
};

function createClient(): AxiosInstance {
  const client = axios.create({
    baseURL: getBaseUrl(),
    timeout: 15000,
    headers: { "Content-Type": "application/json" },
  });

  client.interceptors.request.use((config) => {
    config.baseURL = getBaseUrl();
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
      }
      return Promise.reject(error);
    },
  );

  return client;
}

// client.ts
export default async function createserver(endpoint: string) {
  const res = await fetch(`${getBaseUrl()}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json(); // یا هر چیزی که مد نظرته
}

export const apiClient = createClient();
