import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

/**
 * Create a process reference record to track document relationships
 */
export const createProcessReference = mutation({
  args: {
    source_type: v.union(
      v.literal("lead"),
      v.literal("quotation"),
      v.literal("purchase_order"),
      v.literal("delivery_note"),
      v.literal("invoice")
    ),
    source_id: v.string(),
    source_number: v.string(),
    target_type: v.union(
      v.literal("quotation"),
      v.literal("invoice"),
      v.literal("delivery_note"),
      v.literal("purchase_order")
    ),
    target_id: v.string(),
    target_number: v.string(),
    organization_id: v.id("organizations"),
    process_flow_id: v.optional(v.id("process_flows")),
    inquiry_process_id: v.optional(v.id("inquiry_processes")),
    reference_chain: v.array(v.object({
      step: v.number(),
      document_type: v.string(),
      document_id: v.string(),
      document_number: v.string(),
      action: v.string(),
      timestamp: v.string(),
      user_id: v.string(),
      user_name: v.string(),
      metadata: v.optional(v.any())
    })),
    source_amount: v.optional(v.number()),
    target_amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    conversion_rate: v.optional(v.number()),
    is_primary_reference: v.boolean(),
    created_by: v.string(),
    notes: v.optional(v.string())
  },
  returns: v.id("process_references"),
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    return await ctx.db.insert("process_references", {
      ...args,
      status: "active",
      validation_status: "pending",
      created_at: now,
      updated_at: now
    });
  }
});

/**
 * Get process references for a specific document
 */
export const getProcessReferences = query({
  args: {
    document_type: v.union(
      v.literal("quotation"),
      v.literal("invoice"),
      v.literal("delivery_note"),
      v.literal("purchase_order")
    ),
    document_id: v.string(),
    organization_id: v.id("organizations")
  },
  returns: v.array(v.object({
    _id: v.id("process_references"),
    _creationTime: v.number(),
    source_type: v.string(),
    source_id: v.string(),
    source_number: v.string(),
    target_type: v.string(),
    target_id: v.string(),
    target_number: v.string(),
    organization_id: v.id("organizations"),
    process_flow_id: v.optional(v.id("process_flows")),
    inquiry_process_id: v.optional(v.id("inquiry_processes")),
    reference_chain: v.array(v.object({
      step: v.number(),
      document_type: v.string(),
      document_id: v.string(),
      document_number: v.string(),
      action: v.string(),
      timestamp: v.string(),
      user_id: v.string(),
      user_name: v.string(),
      metadata: v.optional(v.any())
    })),
    source_amount: v.optional(v.number()),
    target_amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    conversion_rate: v.optional(v.number()),
    status: v.string(),
    is_primary_reference: v.boolean(),
    validation_status: v.optional(v.string()),
    created_by: v.string(),
    created_at: v.string(),
    updated_at: v.string(),
    notes: v.optional(v.string())
  })),
  handler: async (ctx, args) => {
    // Get references where this document is either source or target
    const asSource = await ctx.db
      .query("process_references")
      .withIndex("by_source", (q) => 
        q.eq("source_type", args.document_type).eq("source_id", args.document_id)
      )
      .filter((q) => q.eq(q.field("organization_id"), args.organization_id))
      .collect();

    const asTarget = await ctx.db
      .query("process_references")
      .withIndex("by_target", (q) => 
        q.eq("target_type", args.document_type).eq("target_id", args.document_id)
      )
      .filter((q) => q.eq(q.field("organization_id"), args.organization_id))
      .collect();

    return [...asSource, ...asTarget];
  }
});

/**
 * Build comprehensive reference chain for a document
 */
export const buildReferenceChain = query({
  args: {
    document_type: v.union(
      v.literal("lead"),
      v.literal("quotation"),
      v.literal("invoice"),
      v.literal("delivery_note"),
      v.literal("purchase_order")
    ),
    document_id: v.string(),
    organization_id: v.id("organizations")
  },
  returns: v.object({
    document_id: v.string(),
    document_type: v.string(),
    document_number: v.string(),
    complete_chain: v.array(v.object({
      step: v.number(),
      document_type: v.string(),
      document_id: v.string(),
      document_number: v.string(),
      action: v.string(),
      timestamp: v.string(),
      user_id: v.string(),
      user_name: v.string(),
      metadata: v.optional(v.any()),
      financial_data: v.optional(v.object({
        amount: v.number(),
        currency: v.string(),
        conversion_rate: v.optional(v.number())
      }))
    })),
    source_documents: v.array(v.object({
      document_type: v.string(),
      document_id: v.string(),
      document_number: v.string(),
      amount: v.optional(v.number()),
      currency: v.optional(v.string())
    })),
    derived_documents: v.array(v.object({
      document_type: v.string(),
      document_id: v.string(),
      document_number: v.string(),
      amount: v.optional(v.number()),
      currency: v.optional(v.string())
    }))
  }),
  handler: async (ctx, args) => {
    // Get all process references for this document
    const references = await ctx.runQuery(api.processReferences.getProcessReferences, {
      document_type: args.document_type,
      document_id: args.document_id,
      organization_id: args.organization_id
    });

    // Build complete chain by traversing references
    const completeChain: any[] = [];
    const sourceDocuments: any[] = [];
    const derivedDocuments: any[] = [];

    // Helper function to get document details
    const getDocumentDetails = async (docType: string, docId: string) => {
      switch (docType) {
        case "lead":
          const lead = await ctx.db.get(docId as Id<"leads">);
          return lead ? { number: lead.lead_number, amount: lead.total_amount, currency: lead.currency } : null;
        case "quotation":
          const quotation = await ctx.db.get(docId as Id<"quotations">);
          return quotation ? { number: quotation.quotation_number, amount: quotation.total_amount, currency: quotation.currency } : null;
        case "invoice":
          const invoice = await ctx.db.get(docId as Id<"invoices">);
          return invoice ? { number: invoice.invoice_number, amount: invoice.grand_total, currency: invoice.currency } : null;
        default:
          return null;
      }
    };

    // Process each reference to build the chain
    for (const ref of references) {
      // Add to complete chain
      for (const chainItem of ref.reference_chain) {
        const docDetails = await getDocumentDetails(chainItem.document_type, chainItem.document_id);
        completeChain.push({
          ...chainItem,
          financial_data: docDetails ? {
            amount: docDetails.amount || 0,
            currency: docDetails.currency || "SAR",
            conversion_rate: ref.conversion_rate
          } : undefined
        });
      }

      // Categorize documents
      if (ref.source_type === args.document_type && ref.source_id === args.document_id) {
        // This document is the source
        const docDetails = await getDocumentDetails(ref.target_type, ref.target_id);
        if (docDetails) {
          derivedDocuments.push({
            document_type: ref.target_type,
            document_id: ref.target_id,
            document_number: docDetails.number,
            amount: docDetails.amount,
            currency: docDetails.currency
          });
        }
      } else {
        // This document is derived from the source
        const docDetails = await getDocumentDetails(ref.source_type, ref.source_id);
        if (docDetails) {
          sourceDocuments.push({
            document_type: ref.source_type,
            document_id: ref.source_id,
            document_number: docDetails.number,
            amount: docDetails.amount,
            currency: docDetails.currency
          });
        }
      }
    }

    // Sort chain by step
    completeChain.sort((a, b) => a.step - b.step);

    // Get current document details
    const currentDocDetails = await getDocumentDetails(args.document_type, args.document_id);

    return {
      document_id: args.document_id,
      document_type: args.document_type,
      document_number: currentDocDetails?.number || "Unknown",
      complete_chain: completeChain,
      source_documents: sourceDocuments,
      derived_documents: derivedDocuments
    };
  }
});

/**
 * Create reference chain when converting documents (e.g., lead to quotation, quotation to invoice)
 */
export const createConversionReference = mutation({
  args: {
    source_type: v.union(
      v.literal("lead"),
      v.literal("quotation"),
      v.literal("purchase_order"),
      v.literal("delivery_note")
    ),
    source_id: v.string(),
    source_number: v.string(),
    target_type: v.union(
      v.literal("quotation"),
      v.literal("invoice"),
      v.literal("delivery_note"),
      v.literal("purchase_order")
    ),
    target_id: v.string(),
    target_number: v.string(),
    organization_id: v.id("organizations"),
    process_flow_id: v.optional(v.id("process_flows")),
    inquiry_process_id: v.optional(v.id("inquiry_processes")),
    source_amount: v.optional(v.number()),
    target_amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    created_by: v.string(),
    user_name: v.string(),
    notes: v.optional(v.string())
  },
  returns: v.id("process_references"),
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    // Get existing reference chain for the source document
    const existingReferences = await ctx.runQuery(api.processReferences.getProcessReferences, {
      document_type: args.source_type,
      document_id: args.source_id,
      organization_id: args.organization_id
    });

    // Build new reference chain
    let referenceChain: any[] = [];
    let stepCounter = 1;

    // Add existing chain if available
    if (existingReferences.length > 0) {
      const primaryRef = existingReferences.find((ref: any) => ref.is_primary_reference);
      if (primaryRef) {
        referenceChain = [...primaryRef.reference_chain];
        stepCounter = Math.max(...referenceChain.map(item => item.step)) + 1;
      }
    }

    // Add the conversion step
    referenceChain.push({
      step: stepCounter,
      document_type: args.target_type,
      document_id: args.target_id,
      document_number: args.target_number,
      action: "converted",
      timestamp: now,
      user_id: args.created_by,
      user_name: args.user_name,
      metadata: {
        conversion_type: `${args.source_type}_to_${args.target_type}`,
        source_amount: args.source_amount,
        target_amount: args.target_amount,
        currency: args.currency
      }
    });

    // Create the process reference
    return await ctx.db.insert("process_references", {
      source_type: args.source_type,
      source_id: args.source_id,
      source_number: args.source_number,
      target_type: args.target_type,
      target_id: args.target_id,
      target_number: args.target_number,
      organization_id: args.organization_id,
      process_flow_id: args.process_flow_id,
      inquiry_process_id: args.inquiry_process_id,
      reference_chain: referenceChain,
      source_amount: args.source_amount,
      target_amount: args.target_amount,
      currency: args.currency,
      conversion_rate: args.source_amount && args.target_amount ? 
        args.target_amount / args.source_amount : undefined,
      status: "active",
      is_primary_reference: true,
      validation_status: "pending",
      created_by: args.created_by,
      created_at: now,
      updated_at: now,
      notes: args.notes
    });
  }
});

/**
 * Update process reference status
 */
export const updateProcessReferenceStatus = mutation({
  args: {
    reference_id: v.id("process_references"),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("archived")
    ),
    validation_status: v.optional(v.union(
      v.literal("valid"),
      v.literal("invalid"),
      v.literal("pending")
    )),
    notes: v.optional(v.string())
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reference_id, {
      status: args.status,
      validation_status: args.validation_status,
      notes: args.notes,
      updated_at: new Date().toISOString()
    });
    return null;
  }
});

/**
 * Get all process references for an organization
 */
export const listProcessReferences = query({
  args: {
    organization_id: v.id("organizations"),
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("archived")
    )),
    document_type: v.optional(v.union(
      v.literal("lead"),
      v.literal("quotation"),
      v.literal("invoice"),
      v.literal("delivery_note"),
      v.literal("purchase_order")
    ))
  },
  returns: v.array(v.object({
    _id: v.id("process_references"),
    _creationTime: v.number(),
    source_type: v.string(),
    source_id: v.string(),
    source_number: v.string(),
    target_type: v.string(),
    target_id: v.string(),
    target_number: v.string(),
    organization_id: v.id("organizations"),
    process_flow_id: v.optional(v.id("process_flows")),
    inquiry_process_id: v.optional(v.id("inquiry_processes")),
    source_amount: v.optional(v.number()),
    target_amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    conversion_rate: v.optional(v.number()),
    status: v.string(),
    is_primary_reference: v.boolean(),
    validation_status: v.optional(v.string()),
    created_by: v.string(),
    created_at: v.string(),
    updated_at: v.string(),
    notes: v.optional(v.string())
  })),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("process_references")
      .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    if (args.document_type) {
      query = query.filter((q) => 
        q.or(
          q.eq(q.field("source_type"), args.document_type),
          q.eq(q.field("target_type"), args.document_type)
        )
      );
    }

    return await query.order("desc").collect();
  }
});
