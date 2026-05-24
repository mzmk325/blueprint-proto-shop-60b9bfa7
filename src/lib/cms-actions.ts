// Admin write wrappers. P0 entities (products, categories, assets, variants,
// images, product_categories) are DB-REQUIRED: any DB failure throws.
// localStorage is NEVER used as a fallback source of truth — it would let
// operators think a change was saved when it only exists in their browser.

import { toast } from "sonner";
import {
  cmsDb,
  type CMSProduct,
  type CMSCategory,
  type CMSProductStatus,
  type CMSAssetKind,
} from "./cms-store";
import { uploadProductImage } from "./storage";

const errMsg = (e: unknown) =>
  (e as { message?: string })?.message ?? String(e);

function fail(prefix: string, e: unknown): never {
  console.error(`[cms-actions] ${prefix}`, e);
  toast.error(`${prefix}：${errMsg(e)}`);
  throw e instanceof Error ? e : new Error(String(e));
}

export async function saveProduct(p: CMSProduct): Promise<string> {
  try {
    return await cmsDb.upsertProduct(p);
  } catch (e) {
    fail("保存商品失败", e);
  }
}

export async function setProductStatus(id: string, status: CMSProductStatus) {
  try {
    await cmsDb.setProductStatus(id, status);
  } catch (e) {
    fail("状态更新失败", e);
  }
}

export async function deleteProduct(id: string) {
  try {
    await cmsDb.deleteProduct(id);
  } catch (e) {
    fail("删除商品失败", e);
  }
}

export async function saveCategory(c: CMSCategory) {
  try {
    await cmsDb.upsertCategory(c);
  } catch (e) {
    fail("保存分类失败", e);
  }
}

export async function deleteCategory(id: string) {
  try {
    await cmsDb.deleteCategory(id);
  } catch (e) {
    fail("删除分类失败", e);
  }
}

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
    fail("保存素材失败", e);
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
    fail("上传素材失败", e);
  }
}

export async function deleteAsset(id: string) {
  try {
    await cmsDb.deleteAsset(id);
  } catch (e) {
    fail("删除素材失败", e);
  }
}
