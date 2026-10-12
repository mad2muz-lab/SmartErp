import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Helper type for UI-friendly lead item object - Updated to match server expectations exactly
const leadItemReturnValidatorUpdated = v.object({
  _creationTime: v.number(),
  _id: v.id("lead_items"),
  currency: v.string(),
  created_at: v.string(),
  description: v.optional(v.string()),
  item_name: v.string(),
  lead_id: v.id("leads"),
  organization_id: v.id("organizations"),
  quality: v.string(),
  quantity: v.number(), // Using v.number() instead of v.float64() to match schema
  total_price: v.number(), // Using v.number() instead of v.float64() to match schema
  unit_price: v.number(), // Using v.number() instead of v.float64() to match schema
  // Note: created_at is now included to match schema
});

export const listLeadItems = query({
  args: { lead_id: v.id("leads") },
  returns: v.array(v.object({
    _creationTime: v.float64(),
    _id: v.id("lead_items"),
    currency: v.string(),
    created_at: v.string(),
    description: v.optional(v.string()),
    item_name: v.string(),
    lead_id: v.id("leads"),
    organization_id: v.id("organizations"),
    quality: v.string(),
    quantity: v.float64(),
    total_price: v.float64(),
    unit_price: v.float64(),
  })),
  handler: async (ctx, args) => {
    const rawItems = await ctx.db
      .query("lead_items")
      .withIndex("by_lead", (q) => q.eq("lead_id", args.lead_id))
      .order("asc")
      .collect();

    // Create completely new objects with only the required fields
    const result = [];
    for (const item of rawItems) {
      const cleanItem = {
        _creationTime: item._creationTime,
        _id: item._id,
        currency: item.currency,
        created_at: item.created_at,
        description: item.description,
        item_name: item.item_name,
        lead_id: item.lead_id,
        organization_id: item.organization_id,
        quality: item.quality,
        quantity: item.quantity,
        total_price: item.total_price,
        unit_price: item.unit_price,
      };
      result.push(cleanItem);
    }

    return result;
  },
});

// Alternative function to handle the validation issue
export const listLeadItemsFixed = query({
  args: { lead_id: v.id("leads") },
  returns: v.array(leadItemReturnValidatorUpdated),
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("lead_items")
      .withIndex("by_lead", (q) => q.eq("lead_id", args.lead_id))
      .order("asc")
      .collect();

    // Create new objects with all required fields including created_at
    const cleanItems = [];
    for (const item of items) {
      cleanItems.push({
        _creationTime: item._creationTime,
        _id: item._id,
        currency: item.currency,
        created_at: item.created_at,
        description: item.description,
        item_name: item.item_name,
        lead_id: item.lead_id,
        organization_id: item.organization_id,
        quality: item.quality,
        quantity: item.quantity,
        total_price: item.total_price,
        unit_price: item.unit_price,
      });
    }

    return cleanItems;
  },
});

export const createLeadItem = mutation({
  args: {
    lead_id: v.id("leads"),
    item_name: v.string(),
    description: v.optional(v.string()),
    quality: v.string(),
    quantity: v.number(),
    unit_price: v.number(),
    organization_id: v.id("organizations"),
  },
  returns: v.id("lead_items"),
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const total_price = args.quantity * args.unit_price;

                // Get organization to use its currency
            const organization = await ctx.db.get(args.organization_id);
            if (!organization) {
              throw new Error("Organization not found");
            }

            const inserted = await ctx.db.insert("lead_items", {
              lead_id: args.lead_id,
              item_name: args.item_name,
              description: args.description,
              quality: args.quality,
              quantity: args.quantity,
              unit_price: args.unit_price,
              total_price: total_price,
              currency: organization.currency,
              organization_id: args.organization_id,
              created_at: now,
            });

    // Update lead's estimated value based on items
    await updateLeadValueFromItems(ctx, args.lead_id);

    return inserted;
  },
});

export const updateLeadItem = mutation({
  args: {
    id: v.id("lead_items"),
    item_name: v.optional(v.string()),
    description: v.optional(v.string()),
    quality: v.optional(v.string()),
    quantity: v.optional(v.number()),
    unit_price: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    // If quantity or unit_price is being updated, recalculate total_price
    if (updates.quantity !== undefined || updates.unit_price !== undefined) {
      const currentItem = await ctx.db.get(id);
      if (currentItem) {
        const newQuantity = updates.quantity ?? currentItem.quantity;
        const newUnitPrice = updates.unit_price ?? currentItem.unit_price;
        (updates as any).total_price = newQuantity * newUnitPrice;
      }
    }

    await ctx.db.patch(id, updates);

    // Update lead's estimated value based on items
    const currentItem = await ctx.db.get(id);
    if (currentItem) {
      await updateLeadValueFromItems(ctx, currentItem.lead_id);
    }

    return null;
  },
});

export const deleteLeadItem = mutation({
  args: { id: v.id("lead_items") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (item) {
      await ctx.db.delete(args.id);
      // Update lead's estimated value based on remaining items
      await updateLeadValueFromItems(ctx, item.lead_id);
    }
    return null;
  },
});

// Helper function to update lead's estimated value based on its items
async function updateLeadValueFromItems(ctx: any, leadId: Id<"leads">) {
  const items = await ctx.db
    .query("lead_items")
    .withIndex("by_lead", (q: any) => q.eq("lead_id", leadId))
    .collect();

  const totalValue = items.reduce((sum: number, item: any) => sum + item.total_price, 0);
  
  await ctx.db.patch(leadId, { value: totalValue });
}
