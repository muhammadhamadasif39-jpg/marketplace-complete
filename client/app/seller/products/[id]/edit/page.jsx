"use client";

import { useParams } from "next/navigation";
import SellerGuard from "@/components/seller/SellerGuard";
import SellerSidebar from "@/components/seller/SellerSidebar";
import ProductForm from "@/components/seller/ProductForm";

export default function EditProductPage() {
  const { id } = useParams();

  return (
    <SellerGuard>
      <div className="flex flex-col md:flex-row">
        <SellerSidebar />
        <div className="flex-1 px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">Edit Product</h1>
          <ProductForm productId={id} />
        </div>
      </div>
    </SellerGuard>
  );
}
