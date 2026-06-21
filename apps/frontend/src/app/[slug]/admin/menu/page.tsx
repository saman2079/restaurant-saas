"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { menuApi } from "@/lib/api/menu.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/ui/image-upload";
import { AppErrorBoundary } from "@/components/ui/error-boundary";
import { MenuItem, Category } from "@/types";
import toast from "react-hot-toast";
import Image from "next/image";

function ItemModal({
  item,
  categories,
  slug,
  onClose,
}: {
  item?: MenuItem;
  categories: Category[];
  slug: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: item?.name ?? "",
    description: item?.description ?? "",
    price: item?.price ?? "",
    categoryId: item?.categoryId ?? "",
    status: item?.status ?? "available",
    isPopular: item?.isPopular ?? false,
    preparationTime: item?.preparationTime ?? 15,
    image: item?.image ?? "",
  });

  const mutation = useMutation({
    mutationFn: (data: any) =>
      item
        ? menuApi.updateItem(slug, item.id, data)
        : menuApi.createItem(slug, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["menu-items", slug] });
      toast.success(item ? "آیتم بروز شد" : "آیتم اضافه شد");
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "خطا"),
  });

  const handleSubmit = () => {
    mutation.mutate({
      name: form.name,
      description: form.description || undefined,
      price: Number(form.price),
      categoryId: form.categoryId || undefined,
      status: form.status,
      isPopular: form.isPopular,
      preparationTime: Number(form.preparationTime),
      image: form.image || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="mb-4 text-base font-medium text-gray-900">
          {item ? "ویرایش آیتم" : "آیتم جدید"}
        </h2>

        <div className="space-y-3">
          <ImageUpload
            label="عکس آیتم"
            value={form.image}
            onChange={(url) => setForm((p) => ({ ...p, image: url }))}
          />

          <Input
            label="نام"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
          />

          <Input
            label="توضیحات"
            value={form.description}
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
          />

          <Input
            label="قیمت (تومان)"
            type="number"
            value={form.price}
            onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              دسته‌بندی
            </label>
            <select
              value={form.categoryId}
              onChange={(e) =>
                setForm((p) => ({ ...p, categoryId: e.target.value }))
              }
              className="h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">بدون دسته‌بندی</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">وضعیت</label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((p) => ({ ...p, status: e.target.value as any }))
              }
              className="h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="available">موجود</option>
              <option value="unavailable">غیرموجود</option>
              <option value="out_of_stock">تموم شده</option>
            </select>
          </div>

          <Input
            label="زمان آماده‌سازی (دقیقه)"
            type="number"
            value={form.preparationTime}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                preparationTime: Number(e.target.value),
              }))
            }
          />

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isPopular}
              onChange={(e) =>
                setForm((p) => ({ ...p, isPopular: e.target.checked }))
              }
              className="rounded"
            />
            پرفروش
          </label>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSubmit}
              isLoading={mutation.isPending}
              className="flex-1"
            >
              {item ? "ذخیره" : "اضافه کردن"}
            </Button>
            <Button variant="secondary" onClick={onClose} className="flex-1">
              انصراف
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryModal({
  slug,
  onClose,
}: {
  slug: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", image: "" });

  const mutation = useMutation({
    mutationFn: () => menuApi.createCategory(slug, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories", slug] });
      toast.success("دسته‌بندی اضافه شد");
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "خطا"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <h2 className="mb-4 text-base font-medium text-gray-900">
          دسته‌بندی جدید
        </h2>
        <div className="space-y-3">
          <ImageUpload
            label="عکس دسته‌بندی"
            value={form.image}
            onChange={(url) => setForm((p) => ({ ...p, image: url }))}
          />
          <Input
            label="نام دسته‌بندی"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
          />
          <div className="flex gap-2">
            <Button
              onClick={() => mutation.mutate()}
              isLoading={mutation.isPending}
              className="flex-1"
            >
              اضافه کردن
            </Button>
            <Button variant="secondary" onClick={onClose} className="flex-1">
              انصراف
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MenuPage() {
  const { slug } = useParams<{ slug: string }>();
  const qc = useQueryClient();
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | undefined>();
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const { data: categories = [] } = useQuery({
    queryKey: ["categories", slug],
    queryFn: () => menuApi.getCategories(slug),
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["menu-items", slug],
    queryFn: () => menuApi.getItems(slug),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => menuApi.deleteItem(slug, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["menu-items", slug] });
      toast.success("آیتم حذف شد");
    },
    onError: () => toast.error("خطا در حذف"),
  });

  const filteredItems =
    activeCategory === "all"
      ? items
      : items.filter((i: MenuItem) => i.categoryId === activeCategory);

  // console.log(filteredItems[0].image)

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => menuApi.deleteCategory(slug, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories", slug] });
      // اگر دسته‌بندی حذف‌شده فعال بود، به "همه" برگردون
      if (activeCategory === id) setActiveCategory("all");
      toast.success("دسته‌بندی حذف شد");
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "خطا در حذف"),
  });

  return (
    <AppErrorBoundary>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-medium text-gray-900">مدیریت منو</h1>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowCatModal(true)}
            >
              + دسته‌بندی
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditItem(undefined);
                setShowItemModal(true);
              }}
            >
              + آیتم جدید
            </Button>
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2">
          {/* کارت "همه" */}
          <div
            onClick={() => setActiveCategory("all")}
            className={`flex-shrink-0 min-w-[80px] p-3 rounded-xl border-2 cursor-pointer transition-all ${
              activeCategory === "all"
                ? "border-orange-500 bg-orange-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="text-center">
              <span className="text-sm font-medium">همه</span>
              <span className="block text-xs text-gray-400">
                {items.length}
              </span>
            </div>
          </div>

          {/* کارت‌های دسته‌بندی */}
          {categories.map((cat: Category) => (
            <div
              key={cat.id}
              className={`relative flex-shrink-0 w-28 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                activeCategory === cat.id
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {/* عکس دسته‌بندی (در صورت وجود) */}
              {cat.image && (
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-10 h-10 rounded-full object-cover mx-auto mb-1"
                />
              )}
              <div className="text-center">
                <span className="text-sm font-medium block truncate">
                  {cat.name}
                </span>
                <span className="text-xs text-gray-400">
                  {items.filter((i) => i.categoryId === cat.id).length} آیتم
                </span>
              </div>

              {/* دکمه حذف - همیشه قابل مشاهده */}
              <button
                onClick={(e) => {
                  e.stopPropagation(); // جلوگیری از تغییر فیلتر
                  if (confirm(`دسته‌بندی "${cat.name}" حذف شود؟`)) {
                    deleteCategoryMutation.mutate(cat.id);
                  }
                }}
                className="absolute top-1 right-1 p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                title="حذف دسته‌بندی"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          </div>
        ) : (
          <div className="grid gap-2">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-4xl mb-2">🍽️</p>
                <p className="text-sm">آیتمی وجود ندارد</p>
              </div>
            ) : (
              filteredItems.map((item: MenuItem) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">🍽️</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.name}
                        </p>
                        {item.isPopular && (
                          <span className="text-xs text-orange-500">⭐</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {Number(item.price).toLocaleString("fa-IR")} تومان
                      </p>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full ${
                          item.status === "available"
                            ? "bg-green-100 text-green-700"
                            : item.status === "out_of_stock"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {item.status === "available"
                          ? "موجود"
                          : item.status === "out_of_stock"
                            ? "تموم شده"
                            : "غیرموجود"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => {
                        setEditItem(item);
                        setShowItemModal(true);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("حذف شود؟")) deleteMutation.mutate(item.id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showItemModal && (
        <ItemModal
          item={editItem}
          categories={categories}
          slug={slug}
          onClose={() => {
            setShowItemModal(false);
            setEditItem(undefined);
          }}
        />
      )}
      {showCatModal && (
        <CategoryModal slug={slug} onClose={() => setShowCatModal(false)} />
      )}
    </AppErrorBoundary>
  );
}
