import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const inventoryReturn = v.object({
  _id: v.id("inventory"),
  _creationTime: v.number(),
  name: v.string(),
  name_arabic: v.optional(v.string()),
  sku: v.string(),
  description: v.optional(v.string()),
  description_arabic: v.optional(v.string()),
  category: v.string(),
  category_arabic: v.optional(v.string()),
  unit: v.string(),
  // UI expects these names
  cost_price: v.number(),
  selling_price: v.number(),
  quantity: v.number(),
  min_quantity: v.optional(v.number()),
  supplier_id: v.optional(v.id("suppliers")),
  supplier_name: v.optional(v.string()),
  location: v.optional(v.string()),
  notes: v.optional(v.string()),
  brand: v.optional(v.string()),
  brand_arabic: v.optional(v.string()),
  qr_code: v.optional(v.string()),
  qr_generated_at: v.optional(v.string()),
  organization_id: v.id("organizations"),
});

export const listInventory = query({
  args: { organization_id: v.union(v.id("organizations"), v.string()) },
  handler: async (ctx, args) => {
    try {
      if (!args.organization_id || (typeof args.organization_id === "string" && args.organization_id.startsWith("org_"))) {
        return [];
      }
      const docs = await ctx.db
        .query("inventory")
        .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id as any))
        .filter((q) => q.eq(q.field("is_active"), true))
        .order("asc")
        .collect();

      const results = [];
      for (const d of docs) {
        let supplier_name = undefined;
        if (d.supplier_id) {
          try {
            const supplier = await ctx.db.get(d.supplier_id);
            supplier_name = supplier?.name;
          } catch (e) {
            // ignore
          }
        }

        results.push({
          _id: d._id,
          _creationTime: d._creationTime,
          name: d.name,
          name_arabic: d.name_arabic,
          sku: d.sku,
          description: d.description,
          description_arabic: d.description_arabic,
          category: d.category,
          category_arabic: d.category_arabic,
          unit: d.unit,
          cost_price: d.cost_price,
          selling_price: d.current_price,
          quantity: d.quantity_in_stock,
          min_quantity: d.minimum_stock_level,
          supplier_id: d.supplier_id,
          supplier_name: supplier_name,
          location: d.dimensions, // repurpose if no explicit location in schema
          notes: d.tags ? d.tags.join(", ") : undefined,
          brand: d.brand,
          brand_arabic: d.brand_arabic,
          qr_code: d.qr_code,
          qr_generated_at: d.qr_generated_at,
          organization_id: d.organization_id,
        });
      }
      return results;
    } catch (e) {
      console.warn("listInventory query handled gracefully:", e);
      return [];
    }
  },
});

export const getInventory = query({
  args: { id: v.id("inventory") },
  returns: v.union(inventoryReturn, v.null()),
  handler: async (ctx, args) => {
    const d = await ctx.db.get(args.id);
    if (!d) return null;

    let supplier_name = undefined;
    if (d.supplier_id) {
      const supplier = await ctx.db.get(d.supplier_id);
      supplier_name = supplier?.name;
    }

    return {
      _id: d._id,
      _creationTime: d._creationTime,
      name: d.name,
      name_arabic: d.name_arabic,
      sku: d.sku,
      description: d.description,
      description_arabic: d.description_arabic,
      category: d.category,
      category_arabic: d.category_arabic,
      unit: d.unit,
      cost_price: d.cost_price,
      selling_price: d.current_price,
      quantity: d.quantity_in_stock,
      min_quantity: d.minimum_stock_level,
      supplier_id: d.supplier_id,
      supplier_name: supplier_name,
      location: d.dimensions,
      notes: d.tags ? d.tags.join(", ") : undefined,
      brand: d.brand,
      brand_arabic: d.brand_arabic,
      qr_code: d.qr_code,
      qr_generated_at: d.qr_generated_at,
      organization_id: d.organization_id,
    };
  },
});

export const createInventory = mutation({
  args: {
    name: v.string(),
    name_arabic: v.optional(v.string()),
    sku: v.optional(v.string()),
    description: v.optional(v.string()),
    description_arabic: v.optional(v.string()),
    category: v.optional(v.string()),
    category_arabic: v.optional(v.string()),
    unit: v.optional(v.string()),
    cost_price: v.number(),
    selling_price: v.number(),
    quantity: v.number(),
    min_quantity: v.optional(v.number()),
    supplier_id: v.optional(v.id("suppliers")),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
    brand: v.optional(v.string()),
    brand_arabic: v.optional(v.string()),
    organization_id: v.union(v.id("organizations"), v.string()),
    created_by: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    // Resolve organization to use its currency and valid table ID
    let effectiveOrgId: any = args.organization_id;
    let currency = "SAR";

    try {
      if (typeof args.organization_id === "string" && !args.organization_id.startsWith("org_")) {
        const organization = await ctx.db.get(args.organization_id as any);
        if (organization) {
          currency = organization.currency || "SAR";
          effectiveOrgId = organization._id;
        }
      }
    } catch (e) {
      // safe fallback
    }

    if (!effectiveOrgId || (typeof effectiveOrgId === "string" && effectiveOrgId.startsWith("org_"))) {
      const defaultOrg = await ctx.db
        .query("organizations")
        .filter((q) => q.eq(q.field("is_active"), true))
        .first();
      if (defaultOrg) {
        effectiveOrgId = defaultOrg._id;
        currency = defaultOrg.currency || "SAR";
      }
    }

    const inventoryId = await ctx.db.insert("inventory", {
      name: args.name,
      name_arabic: args.name_arabic,
      sku: args.sku ?? "",
      description: args.description,
      description_arabic: args.description_arabic,
      category: args.category ?? "general",
      category_arabic: args.category_arabic,
      brand: args.brand,
      brand_arabic: args.brand_arabic,
      unit: args.unit ?? "pcs",
      cost_price: args.cost_price,
      current_price: args.selling_price,
      currency: currency,
      quantity_in_stock: args.quantity,
      minimum_stock_level: args.min_quantity,
      maximum_stock_level: undefined,
      reorder_point: undefined,
      reorder_quantity: undefined,
      supplier_id: args.supplier_id,
      dimensions: args.location,
      weight: undefined,
      tags: args.notes ? args.notes.split(",").map((s) => s.trim()) : undefined,
      organization_id: effectiveOrgId,
      created_by: args.created_by,
      is_active: true,
      created_at: now,
      updated_at: now,
    });
    await ctx.db.patch(inventoryId, {
      qr_code: `smart-erp://inventory/${inventoryId}`,
      qr_generated_at: now,
    });
    return inventoryId;
  },
});

export const ensureInventoryQr = mutation({
  args: {
    id: v.id("inventory"),
    organization_id: v.id("organizations"),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item || !item.is_active || item.organization_id !== args.organization_id) {
      throw new Error("Active inventory item not found in this organization");
    }

    if (item.qr_code) return item.qr_code;

    const now = new Date().toISOString();
    const qrCode = `smart-erp://inventory/${item._id}`;
    await ctx.db.patch(item._id, { qr_code: qrCode, qr_generated_at: now });
    return qrCode;
  },
});

export const ensureInventoryQrs = mutation({
  args: {
    ids: v.array(v.id("inventory")),
    organization_id: v.id("organizations"),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    let generatedCount = 0;

    for (const id of args.ids) {
      const item = await ctx.db.get(id);
      if (!item || !item.is_active || item.organization_id !== args.organization_id) {
        throw new Error("Active inventory item not found in this organization");
      }

      if (!item.qr_code) {
        await ctx.db.patch(item._id, {
          qr_code: `smart-erp://inventory/${item._id}`,
          qr_generated_at: now,
        });
        generatedCount += 1;
      }
    }

    return generatedCount;
  },
});

export const adjustInventoryStock = mutation({
  args: {
    id: v.id("inventory"),
    organization_id: v.id("organizations"),
    movement_type: v.union(v.literal("in"), v.literal("out")),
    quantity: v.number(),
    qr_code: v.string(),
    reference: v.optional(v.string()),
    notes: v.optional(v.string()),
    created_by: v.optional(v.string()),
  },
  returns: v.object({
    previous_quantity: v.number(),
    new_quantity: v.number(),
  }),
  handler: async (ctx, args) => {
    if (!Number.isFinite(args.quantity) || args.quantity <= 0) {
      throw new Error("Movement quantity must be greater than zero");
    }

    const item = await ctx.db.get(args.id);
    if (!item || !item.is_active || item.organization_id !== args.organization_id) {
      throw new Error("Active inventory item not found in this organization");
    }

    if (!item.qr_code) {
      throw new Error("Generate and save a QR code for this item before recording stock movement");
    }
    if (args.qr_code.trim() !== item.qr_code) {
      throw new Error("The scanned QR code does not match the selected inventory item");
    }
    const qrCode = item.qr_code;

    const previousQuantity = item.quantity_in_stock;
    const newQuantity = args.movement_type === "in"
      ? previousQuantity + args.quantity
      : previousQuantity - args.quantity;
    if (newQuantity < 0) throw new Error("Stock out quantity cannot exceed available stock");

    const now = new Date().toISOString();
    await ctx.db.patch(item._id, {
      quantity_in_stock: newQuantity,
      qr_code: qrCode,
      qr_generated_at: item.qr_generated_at || now,
      updated_at: now,
    });
    await ctx.db.insert("inventory_movements", {
      inventory_id: item._id,
      organization_id: item.organization_id,
      movement_type: args.movement_type,
      quantity: args.quantity,
      previous_quantity: previousQuantity,
      new_quantity: newQuantity,
      reference: args.reference,
      notes: args.notes,
      created_by: args.created_by,
      created_at: now,
    });

    return { previous_quantity: previousQuantity, new_quantity: newQuantity };
  },
});

export const updateInventory = mutation({
  args: {
    id: v.id("inventory"),
    name: v.optional(v.string()),
    name_arabic: v.optional(v.string()),
    sku: v.optional(v.string()),
    description: v.optional(v.string()),
    description_arabic: v.optional(v.string()),
    category: v.optional(v.string()),
    category_arabic: v.optional(v.string()),
    unit: v.optional(v.string()),
    cost_price: v.optional(v.number()),
    selling_price: v.optional(v.number()),
    quantity: v.optional(v.number()),
    min_quantity: v.optional(v.number()),
    supplier_id: v.optional(v.id("suppliers")),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
    brand: v.optional(v.string()),
    brand_arabic: v.optional(v.string()),
    is_active: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, selling_price, quantity, min_quantity, supplier_id, location, notes, brand, brand_arabic, ...rest } = args;
    const now = new Date().toISOString();

    await ctx.db.patch(id, {
      ...rest,
      current_price: selling_price,
      quantity_in_stock: quantity,
      minimum_stock_level: min_quantity,
      supplier_id: supplier_id,
      dimensions: location,
      tags: notes ? notes.split(",").map((s) => s.trim()) : undefined,
      brand: brand,
      brand_arabic: brand_arabic,
      updated_at: now,
    });

    return null;
  },
});

export const deleteInventory = mutation({
  args: { id: v.id("inventory") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    await ctx.db.patch(args.id, { is_active: false, updated_at: now });
    return null;
  },
});
