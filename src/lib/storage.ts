// Browser-side helper to upload binary files to the `product-images` Supabase
// storage bucket. Used by the admin Image Library. Requires authenticated
// admin session (RLS on storage.objects gates uploads to admins).

import { supabase } from "@/integrations/supabase/client";

export type UploadedImage = {
  url: string;
  storage_path: string;
  width: number | null;
  height: number | null;
  mime_type: string;
  size_bytes: number;
};

function readImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) {
      resolve(null);
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
}

/**
 * Upload a single file to the product-images bucket. Returns the public URL
 * plus the bits the `createAsset` server fn needs.
 */
export async function uploadProductImage(file: File): Promise<UploadedImage> {
  const dims = await readImageDimensions(file);
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const path = `${ts}-${rand}-${sanitizeName(file.name)}`;

  const { error: upErr } = await supabase.storage
    .from("product-images")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });
  if (upErr) throw new Error(upErr.message);

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);

  return {
    url: data.publicUrl,
    storage_path: path,
    width: dims?.width ?? null,
    height: dims?.height ?? null,
    mime_type: file.type || "application/octet-stream",
    size_bytes: file.size,
  };
}
