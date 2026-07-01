import axios, { AxiosError, AxiosInstance } from "axios";

const getBaseUrl = () => {
  // Browser
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
  }

  // Server (SSR)
  return process.env.INTERNAL_API_URL || "http://localhost:4000/api";
};

function createClient(): AxiosInstance {
  const client = axios.create({
    baseURL: getBaseUrl(),
    timeout: 15000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  client.interceptors.request.use((config) => {
    config.baseURL = getBaseUrl();

    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401 && typeof window !== "undefined") {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }

      return Promise.reject(error);
    }
  );

  return client;
}

export async function createServer(endpoint: string) {
  const res = await fetch(`${getBaseUrl()}${endpoint}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Request Failed");
  }

  return res.json();
}

export const apiClient = createClient();