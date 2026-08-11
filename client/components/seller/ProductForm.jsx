"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

const emptyForm = {
  title: "",
  description: "",
  category: "",
  brand: "",
  price: "",
  discountPrice: "",
  stock: "",
  images: [],
  productType: "physical",
  isPublished: true,
};

export default function ProductForm({ productId }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(!!productId);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (!productId) return;
    api
      .getProductById(productId, token)
      .then((p) => {
        setForm({
          title: p.title,
          description: p.description,
          category: p.category?._id || "",
          brand: p.brand || "",
          price: p.price,
          discountPrice: p.discountPrice || "",
          stock: p.stock,
          images: p.images || [],
          productType: p.productType,
          isPublished: p.isPublished,
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [productId, token]);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (form.images.length + files.length > 6) {
      showToast("Maximum 6 images per product", "error");
      return;
    }

    setUploading(true);
    try {
      const { urls } = await api.uploadImages(files, token);
      setForm((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
      showToast(`${urls.length} image(s) uploaded ✅`, "success");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setUploading(false);
      e.target.value = ""; // allow re-selecting the same file if needed
    }
  };

  const removeImage = (index) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.images.length === 0) {
      setError("Please upload at least one product image");
      return;
    }

    setSaving(true);

    const payload = {
      title: form.title,
      description: form.description,
      category: form.category,
      brand: form.brand,
      price: Number(form.price),
      discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined,
      stock: Number(form.stock),
      images: form.images,
      productType: form.productType,
      isPublished: form.isPublished,
    };

    try {
      if (productId) {
        await api.updateProduct(productId, payload, token);
        showToast("Product updated ✅", "success");
      } else {
        await api.createProduct(payload, token);
        showToast("Product added ✅ (pending admin approval)", "success");
      }
      router.push("/seller/products");
    } catch (err) {
      setError(err.message);
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <input
        placeholder="Product Title"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        required
        className="w-full border rounded px-3 py-2"
      />
      <textarea
        placeholder="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        required
        rows={4}
        className="w-full border rounded px-3 py-2"
      />

      <div className="grid grid-cols-2 gap-3">
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          required
          className="border rounded px-3 py-2"
        >
          <option value="">Select Category</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          placeholder="Brand (optional)"
          value={form.brand}
          onChange={(e) => setForm({ ...form, brand: e.target.value })}
          className="border rounded px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <input
          type="number"
          placeholder="Price"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
          min="0"
          className="border rounded px-3 py-2"
        />
        <input
          type="number"
          placeholder="Sale Price (optional)"
          value={form.discountPrice}
          onChange={(e) => setForm({ ...form, discountPrice: e.target.value })}
          min="0"
          className="border rounded px-3 py-2"
        />
        <input
          type="number"
          placeholder="Stock"
          value={form.stock}
          onChange={(e) => setForm({ ...form, stock: e.target.value })}
          required
          min="0"
          className="border rounded px-3 py-2"
        />
      </div>

      {/* Image upload */}
      <div>
        <label className="block text-sm font-medium mb-2">Product Images (up to 6)</label>
        <div className="flex flex-wrap gap-3 mb-3">
          {form.images.map((url, i) => (
            <div key={url + i} className="relative w-20 h-20 rounded-lg overflow-hidden border">
              <Image src={url} alt="" fill className="object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 text-white rounded-full text-xs flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          ))}
          {form.images.length < 6 && (
            <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer text-gray-400 hover:border-brand-accent hover:text-brand-accent transition text-xs text-center">
              {uploading ? "..." : "+ Add"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                onChange={handleFileSelect}
                disabled={uploading}
                className="hidden"
              />
            </label>
          )}
        </div>
        <p className="text-xs text-gray-400">JPG, PNG, WEBP or GIF. Max 5MB each.</p>
      </div>

      <div className="flex items-center gap-4">
        <select
          value={form.productType}
          onChange={(e) => setForm({ ...form, productType: e.target.value })}
          className="border rounded px-3 py-2"
        >
          <option value="physical">Physical Product</option>
          <option value="digital">Digital Product</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
          />
          Published (visible to buyers once approved)
        </label>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={saving || uploading}
        className="bg-brand text-white px-6 py-2 rounded font-medium hover:opacity-90 transition disabled:opacity-50"
      >
        {saving ? "Saving..." : productId ? "Save Changes" : "Add Product"}
      </button>
    </form>
  );
}
