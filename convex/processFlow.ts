import { query, mutation, internalMutation, internalAction, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Get process flows by organization
export const listProcessFlows = query({
  args: { organizationId: v.id("organizations") },
  returns: v.array(v.object({
    _id: v.id("process_flows"),
    _creationTime: v.number(),
    name: v.string(),
    description: v.optional(v.string()),
    organization_id: v.id("organizations"),
    is_active: v.boolean(),
    created_at: v.string(),
    updated_at: v.string(),
  })),
  handler: async (ctx, args) => {
    const processFlows = await ctx.db
      .query("process_flows")
      .withIndex("by_organization", (q) => q.eq("organization_id", args.organizationId))
      .filter((q) => q.eq(q.field("is_active"), true))
      .order("asc")
      .collect();
    
    return processFlows;
  },
});

// Get inquiry processes by organization
export const listInquiryProcesses = query({
  args: { organizationId: v.id("organizations") },
  returns: v.array(v.object({
    _id: v.id("inquiry_processes"),
    _creationTime: v.number(),
    inquiry_id: v.string(),
    process_flow_id: v.id("process_flows"),
    current_stage_id: v.id("process_stages"),
    customer_id: v.optional(v.id("customers")),
    lead_id: v.optional(v.id("leads")),
    organization_id: v.id("organizations"),
    status: v.string(),
    priority: v.string(),
    estimated_value: v.optional(v.number()),
    currency: v.string(),
    assigned_to: v.optional(v.string()),
    created_by: v.string(),
    started_at: v.string(),
    completed_at: v.optional(v.string()),
    created_at: v.string(),
    updated_at: v.string(),
  })),
  handler: async (ctx, args) => {
    const inquiryProcesses = await ctx.db
      .query("inquiry_processes")
      .withIndex("by_organization", (q) => q.eq("organization_id", args.organizationId))
      .order("desc")
      .collect();
    
    return inquiryProcesses;
  },
});

// Get inquiry process details with stages and actions
export const getInquiryProcessDetails = query({
  args: { inquiryProcessId: v.id("inquiry_processes") },
  returns: v.object({
    inquiry_process: v.object({
      _id: v.id("inquiry_processes"),
      _creationTime: v.number(),
      inquiry_id: v.string(),
      process_flow_id: v.id("process_flows"),
      current_stage_id: v.id("process_stages"),
      customer_id: v.optional(v.id("customers")),
      lead_id: v.optional(v.id("leads")),
      organization_id: v.id("organizations"),
      status: v.string(),
      priority: v.string(),
      estimated_value: v.optional(v.number()),
      currency: v.string(),
      assigned_to: v.optional(v.string()),
      created_by: v.string(),
      started_at: v.string(),
      completed_at: v.optional(v.string()),
      created_at: v.string(),
      updated_at: v.string(),
    }),
    process_flow: v.object({
      _id: v.id("process_flows"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.optional(v.string()),
      organization_id: v.id("organizations"),
      is_active: v.boolean(),
      created_at: v.string(),
      updated_at: v.string(),
    }),
    stages: v.array(v.object({
      _id: v.id("process_stages"),
      _creationTime: v.number(),
      process_flow_id: v.id("process_flows"),
      name: v.string(),
      description: v.optional(v.string()),
      order_index: v.number(),
      is_automated: v.boolean(),
      required_fields: v.optional(v.array(v.string())),
      auto_advance_conditions: v.optional(v.array(v.string())),
      created_at: v.string(),
    })),
    actions: v.array(v.object({
      _id: v.id("process_actions"),
      _creationTime: v.number(),
      inquiry_process_id: v.id("inquiry_processes"),
      stage_id: v.id("process_stages"),
      action_type: v.string(),
      action_name: v.string(),
      description: v.string(),
      data: v.optional(v.any()),
      status: v.string(),
      processing_time: v.optional(v.number()),
      error_message: v.optional(v.string()),
      triggered_by: v.string(),
      dependencies: v.optional(v.array(v.string())),
      next_actions: v.optional(v.array(v.string())),
      created_at: v.string(),
      completed_at: v.optional(v.string()),
    })),
    ai_recommendations: v.array(v.object({
      _id: v.id("ai_recommendations"),
      _creationTime: v.number(),
      inquiry_process_id: v.id("inquiry_processes"),
      recommendation_type: v.string(),
      title: v.string(),
      description: v.string(),
      priority: v.string(),
      action_items: v.array(v.string()),
      confidence_score: v.number(),
      is_implemented: v.boolean(),
      created_at: v.string(),
      implemented_at: v.optional(v.string()),
    })),
  }),
  handler: async (ctx, args) => {
    const inquiryProcess = await ctx.db.get(args.inquiryProcessId);
    if (!inquiryProcess) {
      throw new Error("Inquiry process not found");
    }

    const processFlow = await ctx.db.get(inquiryProcess.process_flow_id);
    if (!processFlow) {
      throw new Error("Process flow not found");
    }

    const stages = await ctx.db
      .query("process_stages")
      .withIndex("by_process_flow", (q) => q.eq("process_flow_id", inquiryProcess.process_flow_id))
      .order("asc")
      .collect();

    const actions = await ctx.db
      .query("process_actions")
      .withIndex("by_inquiry_process", (q) => q.eq("inquiry_process_id", args.inquiryProcessId))
      .order("desc")
      .collect();

    const aiRecommendations = await ctx.db
      .query("ai_recommendations")
      .withIndex("by_inquiry_process", (q) => q.eq("inquiry_process_id", args.inquiryProcessId))
      .order("desc")
      .collect();

    return {
      inquiry_process: inquiryProcess,
      process_flow: processFlow,
      stages,
      actions,
      ai_recommendations: aiRecommendations,
    };
  },
});

// Create new inquiry process
export const createInquiryProcess = mutation({
  args: {
    inquiry_id: v.string(),
    process_flow_id: v.id("process_flows"),
    customer_id: v.optional(v.id("customers")),
    lead_id: v.optional(v.id("leads")),
    organization_id: v.id("organizations"),
    priority: v.string(),
    estimated_value: v.optional(v.number()),
    currency: v.string(),
    assigned_to: v.optional(v.string()),
    created_by: v.string(),
  },
  returns: v.id("inquiry_processes"),
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    // Get the first stage of the process flow
    const firstStage = await ctx.db
      .query("process_stages")
      .withIndex("by_order", (q) => q.eq("process_flow_id", args.process_flow_id).eq("order_index", 0))
      .unique();
    
    if (!firstStage) {
      throw new Error("No stages found for this process flow");
    }

    const inquiryProcessId = await ctx.db.insert("inquiry_processes", {
      ...args,
      current_stage_id: firstStage._id,
      status: "active",
      started_at: now,
      created_at: now,
      updated_at: now,
    });

    // Create initial system action
    await ctx.db.insert("process_actions", {
      inquiry_process_id: inquiryProcessId,
      stage_id: firstStage._id,
      action_type: "SYSTEM",
      action_name: "Process Started",
      description: "Inquiry process has been initiated",
      status: "completed",
      triggered_by: "SYSTEM",
      created_at: now,
      completed_at: now,
    });

    // Schedule AI analysis
    await ctx.scheduler.runAfter(0, internal.processFlow.analyzeInquiry, {
      inquiryProcessId,
    });

    return inquiryProcessId;
  },
});

// Execute action for inquiry process
export const executeAction = mutation({
  args: {
    inquiry_process_id: v.id("inquiry_processes"),
    stage_id: v.id("process_stages"),
    action_name: v.string(),
    description: v.string(),
    action_type: v.string(), // SYSTEM, USER, AI
    data: v.optional(v.any()),
    triggered_by: v.string(),
  },
  returns: v.id("process_actions"),
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    const actionId = await ctx.db.insert("process_actions", {
      ...args,
      status: "pending",
      created_at: now,
    });

    // Schedule action execution
    await ctx.scheduler.runAfter(0, internal.processFlow.executeAction, {
      actionId,
    });

    return actionId;
  },
});

// Internal function to execute action
export const executeActionInternal = internalAction({
  args: {
    actionId: v.id("process_actions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const action = await ctx.runQuery(internal.processFlow.getAction, { actionId: args.actionId });
    if (!action) {
      throw new Error("Action not found");
    }

    const startTime = Date.now();
    let status = "completed";
    let errorMessage: string | undefined;
    let processingTime: number | undefined;

    try {
      // Execute the action based on type
      switch (action.action_type) {
        case "SYSTEM":
          await ctx.runMutation(internal.processFlow.executeSystemAction, { actionId: args.actionId });
          break;
        case "AI":
          await ctx.runMutation(internal.processFlow.executeAIAction, { actionId: args.actionId });
          break;
        case "USER":
          // User actions are typically manual, just mark as completed
          break;
        default:
          throw new Error(`Unknown action type: ${action.action_type}`);
      }

      processingTime = Date.now() - startTime;
    } catch (error) {
      status = "failed";
      errorMessage = error instanceof Error ? error.message : "Unknown error";
      processingTime = Date.now() - startTime;
    }

    // Update action status
    await ctx.runMutation(internal.processFlow.updateActionStatus, {
      actionId: args.actionId,
      status,
      processingTime,
      errorMessage,
      completedAt: status === "completed" ? new Date().toISOString() : undefined,
    });

    return null;
  },
});

// Internal function to get action
export const getAction = internalQuery({
  args: { actionId: v.id("process_actions") },
  returns: v.union(
    v.object({
      _id: v.id("process_actions"),
      _creationTime: v.number(),
      inquiry_process_id: v.id("inquiry_processes"),
      stage_id: v.id("process_stages"),
      action_type: v.string(),
      action_name: v.string(),
      description: v.string(),
      data: v.optional(v.any()),
      status: v.string(),
      processing_time: v.optional(v.number()),
      error_message: v.optional(v.string()),
      triggered_by: v.string(),
      dependencies: v.optional(v.array(v.string())),
      next_actions: v.optional(v.array(v.string())),
      created_at: v.string(),
      completed_at: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.actionId);
  },
});

// Internal function to update action status
export const updateActionStatus = internalMutation({
  args: {
    actionId: v.id("process_actions"),
    status: v.string(),
    processingTime: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    completedAt: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.actionId, {
      status: args.status,
      processing_time: args.processingTime,
      error_message: args.errorMessage,
      completed_at: args.completedAt,
    });
    return null;
  },
});

// Internal function to analyze inquiry with AI
export const analyzeInquiry = internalAction({
  args: {
    inquiryProcessId: v.id("inquiry_processes"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const inquiryProcess = await ctx.runQuery(internal.processFlow.getInquiryProcess, {
      inquiryProcessId: args.inquiryProcessId,
    });

    if (!inquiryProcess) {
      throw new Error("Inquiry process not found");
    }

    // Create AI recommendation
    await ctx.runMutation(internal.processFlow.createAIRecommendation, {
      inquiry_process_id: args.inquiryProcessId,
      recommendation_type: "initial_analysis",
      title: "Initial Inquiry Analysis",
      description: "AI has analyzed the inquiry and provided initial recommendations",
      priority: "medium",
      action_items: [
        "Review customer requirements",
        "Identify potential suppliers",
        "Calculate estimated costs",
        "Set up follow-up schedule",
      ],
      confidence_score: 0.85,
    });

    return null;
  },
});

// Internal function to get inquiry process
export const getInquiryProcess = internalQuery({
  args: { inquiryProcessId: v.id("inquiry_processes") },
  returns: v.union(
    v.object({
      _id: v.id("inquiry_processes"),
      _creationTime: v.number(),
      inquiry_id: v.string(),
      process_flow_id: v.id("process_flows"),
      current_stage_id: v.id("process_stages"),
      customer_id: v.optional(v.id("customers")),
      lead_id: v.optional(v.id("leads")),
      organization_id: v.id("organizations"),
      status: v.string(),
      priority: v.string(),
      estimated_value: v.optional(v.number()),
      currency: v.string(),
      assigned_to: v.optional(v.string()),
      created_by: v.string(),
      started_at: v.string(),
      completed_at: v.optional(v.string()),
      created_at: v.string(),
      updated_at: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.inquiryProcessId);
  },
});

// Internal function to create AI recommendation
export const createAIRecommendation = internalMutation({
  args: {
    inquiry_process_id: v.id("inquiry_processes"),
    recommendation_type: v.string(),
    title: v.string(),
    description: v.string(),
    priority: v.string(),
    action_items: v.array(v.string()),
    confidence_score: v.number(),
  },
  returns: v.id("ai_recommendations"),
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    return await ctx.db.insert("ai_recommendations", {
      ...args,
      is_implemented: false,
      created_at: now,
    });
  },
});

// Internal function to execute system action
export const executeSystemAction = internalMutation({
  args: { actionId: v.id("process_actions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const action = await ctx.db.get(args.actionId);
    if (!action) {
      throw new Error("Action not found");
    }

    // Execute system action based on action name
    switch (action.action_name) {
      case "Process Started":
        // Initialize the process
        break;
      case "Stage Completed":
        // Move to next stage
        break;
      case "Generate Quote":
        // Generate quotation
        break;
      default:
        // Handle other system actions
        break;
    }

    return null;
  },
});

// Internal function to execute AI action
export const executeAIAction = internalMutation({
  args: { actionId: v.id("process_actions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const action = await ctx.db.get(args.actionId);
    if (!action) {
      throw new Error("Action not found");
    }

    // Execute AI action based on action name
    switch (action.action_name) {
      case "Analyze Requirements":
        // AI analysis of customer requirements
        break;
      case "Generate Recommendations":
        // AI generates recommendations
        break;
      case "Optimize Pricing":
        // AI optimizes pricing
        break;
      default:
        // Handle other AI actions
        break;
    }

    return null;
  },
});

/**
 * Create process action for invoice generation
 */
export const createInvoiceAction = mutation({
  args: {
    inquiry_process_id: v.id("inquiry_processes"),
    invoice_id: v.id("invoices"),
    invoice_number: v.string(),
    action_type: v.union(
      v.literal("SYSTEM"),
      v.literal("USER"),
      v.literal("AI")
    ),
    triggered_by: v.string(),
    user_name: v.string(),
    metadata: v.optional(v.any())
  },
  returns: v.id("process_actions"),
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    // Get the current stage of the inquiry process
    const inquiryProcess = await ctx.db.get(args.inquiry_process_id);
    if (!inquiryProcess) {
      throw new Error("Inquiry process not found");
    }

    // Create the action
    const actionId = await ctx.db.insert("process_actions", {
      inquiry_process_id: args.inquiry_process_id,
      stage_id: inquiryProcess.current_stage_id,
      action_type: args.action_type,
      action_name: "Invoice Generated",
      description: `Invoice ${args.invoice_number} has been generated from the process`,
      data: {
        invoice_id: args.invoice_id,
        invoice_number: args.invoice_number,
        ...args.metadata
      },
      status: "completed",
      triggered_by: args.triggered_by,
      created_at: now,
      completed_at: now
    });

    return actionId;
  }
});

/**
 * Create process action for quotation to invoice conversion
 */
export const createQuotationToInvoiceAction = mutation({
  args: {
    inquiry_process_id: v.id("inquiry_processes"),
    quotation_id: v.id("quotations"),
    quotation_number: v.string(),
    invoice_id: v.id("invoices"),
    invoice_number: v.string(),
    triggered_by: v.string(),
    user_name: v.string(),
    financial_data: v.optional(v.object({
      quotation_amount: v.number(),
      invoice_amount: v.number(),
      currency: v.string()
    }))
  },
  returns: v.id("process_actions"),
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    // Get the current stage of the inquiry process
    const inquiryProcess = await ctx.db.get(args.inquiry_process_id);
    if (!inquiryProcess) {
      throw new Error("Inquiry process not found");
    }

    // Create the action
    const actionId = await ctx.db.insert("process_actions", {
      inquiry_process_id: args.inquiry_process_id,
      stage_id: inquiryProcess.current_stage_id,
      action_type: "SYSTEM",
      action_name: "Quotation Converted to Invoice",
      description: `Quotation ${args.quotation_number} has been converted to Invoice ${args.invoice_number}`,
      data: {
        quotation_id: args.quotation_id,
        quotation_number: args.quotation_number,
        invoice_id: args.invoice_id,
        invoice_number: args.invoice_number,
        financial_data: args.financial_data,
        conversion_type: "quotation_to_invoice"
      },
      status: "completed",
      triggered_by: args.triggered_by,
      created_at: now,
      completed_at: now
    });

    return actionId;
  }
});
