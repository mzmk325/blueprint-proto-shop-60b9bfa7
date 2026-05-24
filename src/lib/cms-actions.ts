// Thin wrappers around cmsDb (server-fn writes) with graceful local fallback
// for legacy non-UUID seed ids. All admin UI mutations should call these.

import { toast } from "sonner";
import {
  cms,
  cmsDb,
  type CMSProduct,
  type CMSCategory,
  type CMSProductStatus,
  type CMSAssetKind,
} from "./cms-store";
import { uploadProductImage } from "./storage";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (s: string) => UUID.test(s);

const errMsg = (e: unknown) =>
  (e as { message?: string })?.message ?? String(e);

export async function saveProduct(p: CMSProduct): Promise<string | null> {
  try {
    const id = await cmsDb.upsertProduct(p);
    return id;
  } catch (e) {
    console.error("[cms-actions] saveProduct", e);
    toast.error(`保存失败：${errMsg(e)}`);
    // Local fallback so admins are not blocked while offline.
    cms.upsertProduct(p);
    return null;
  }
}

export async function setProductStatus(id: string, status: CMSProductStatus) {
  if (isUuid(id)) {
    try {
      await cmsDb.setProductStatus(id, status);
      return;
    } catch (e) {
      console.error(e);
      toast.error(`状态更新失败：${errMsg(e)}`);
      return;
    }
  }
  cms.setProductStatus(id, status);
}

export async function deleteProduct(id: string) {
  if (isUuid(id)) {
    try {
      await cmsDb.deleteProduct(id);
      return;
    } catch (e) {
      console.error(e);
      toast.error(`删除失败：${errMsg(e)}`);
      return;
    }
  }
  cms.removeProduct(id);
}

export async function saveCategory(c: CMSCategory) {
  try {
    await cmsDb.upsertCategory(c);
  } catch (e) {
    console.error(e);
    toast.error(`保存失败：${errMsg(e)}`);
    cms.upsertCategory(c);
  }
}

export async function deleteCategory(id: string) {
  if (isUuid(id)) {
    try {
      await cmsDb.deleteCategory(id);
      return;
    } catch (e) {
      console.error(e);
      toast.error(`删除失败：${errMsg(e)}`);
      return;
    }
  }
  cms.removeCategory(id);
}

// Map UI CMSAssetKind → DB asset type enum.
function dbAssetType(kind: CMSAssetKind): "product" | "category" | "hero" | "home_card" | "other" {
  switch (kind) {
    case "product":
    case "pdp":
      return "product";
    case "category":
      return "category";
    case "hero-desktop":
    case "hero-mobile":
      return "hero";
    case "shape":
      return "home_card";
    case "review":
    default:
      return "other";
  }
}

export async function addAssetByUrl(kind: CMSAssetKind, url: string, name?: string) {
  try {
    await cmsDb.createAsset({
      url,
      name: name ?? url.split("/").pop() ?? "asset",
      type: dbAssetType(kind),
    });
  } catch (e) {
    console.error(e);
    toast.error(`保存失败：${errMsg(e)}`);
    cms.addAsset(kind, url);
  }
}

export async function uploadAndAddAsset(kind: CMSAssetKind, file: File) {
  try {
    const up = await uploadProductImage(file);
    await cmsDb.createAsset({
      url: up.url,
      storage_path: up.storage_path,
      name: file.name,
      type: dbAssetType(kind),
      width: up.width,
      height: up.height,
      size_bytes: up.size_bytes,
      mime_type: up.mime_type,
    });
  } catch (e) {
    console.error(e);
    toast.error(`上传失败：${errMsg(e)}`);
    throw e;
  }
}

export async function deleteAsset(id: string) {
  try {
    await cmsDb.deleteAsset(id);
  } catch (e) {
    console.error(e);
    toast.error(`删除失败：${errMsg(e)}`);
  }
}
