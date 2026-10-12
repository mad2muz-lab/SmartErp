import { query, mutation, internalMutation, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// Helper type for reminder object
const reminderReturnValidator = v.object({
  _id: v.id("leads"),
  lead_number: v.string(),
  name: v.string(),
  priority: v.string(),
  reminder_date: v.string(),
  status: v.string(),
  assigned_to: v.optional(v.string()),
});

export const getUpcomingReminders = query({
  args: { organization_id: v.id("organizations") },
  returns: v.array(reminderReturnValidator),
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const leads = await ctx.db
      .query("leads")
      .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id))
      .filter((q) => 
        q.and(
          q.eq(q.field("is_active"), true),
          q.eq(q.field("reminder_scheduled"), true),
          q.gte(q.field("reminder_date"), now),
          q.neq(q.field("status"), "closed")
        )
      )
      .order("asc")
      .collect();

    return leads.map(lead => ({
      _id: lead._id,
      lead_number: lead.lead_number,
      name: lead.name,
      priority: lead.priority,
      reminder_date: lead.reminder_date!,
      status: lead.status,
      assigned_to: lead.assigned_to,
    }));
  },
});

export const scheduleReminder = mutation({
  args: { 
    lead_id: v.id("leads"),
    priority: v.string()
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.lead_id);
    if (!lead) {
      throw new Error("Lead not found");
    }

    // Calculate reminder date based on priority
    const now = new Date();
    let reminderDate: Date;

    switch (args.priority.toLowerCase()) {
      case 'high':
        reminderDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
        break;
      case 'medium':
        reminderDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days
        break;
      case 'low':
        reminderDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week
        break;
      default:
        reminderDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // Default to 2 days
    }

    await ctx.db.patch(args.lead_id, {
      reminder_scheduled: true,
      reminder_date: reminderDate.toISOString(),
    });

    // Schedule the actual reminder action
    await ctx.scheduler.runAfter(
      reminderDate.getTime() - now.getTime(),
      internal.reminders.sendReminder,
      { lead_id: args.lead_id }
    );

    return null;
  },
});

export const cancelReminder = mutation({
  args: { lead_id: v.id("leads") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.lead_id, {
      reminder_scheduled: false,
      reminder_date: undefined,
    });
    return null;
  },
});

// Internal action to send reminder
export const sendReminder = internalAction({
  args: { lead_id: v.id("leads") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const lead = await ctx.runQuery(internal.leads.getLead, { id: args.lead_id });
    
    if (lead && lead.status !== "closed") {
      // Here you would integrate with your notification system
      // For now, we'll just log the reminder
      console.log(`REMINDER: Follow up with lead ${lead.name} (${lead.lead_number})`);
      
      // You could send email, push notification, etc.
      // await sendEmailNotification(lead);
      // await sendPushNotification(lead);
    }
    
    return null;
  },
});

// Generate lead number
export const generateLeadNumber = mutation({
  args: { organization_id: v.id("organizations") },
  returns: v.string(),
  handler: async (ctx, args) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    // Get the latest lead number for this organization and year/month
    const prefix = `LEAD-${year}${month}`;
    
    const latestLead = await ctx.db
      .query("leads")
      .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id))
      .filter((q) => q.gte(q.field("lead_number"), prefix))
      .order("desc")
      .first();

    let sequence = 1;
    if (latestLead && latestLead.lead_number.startsWith(prefix)) {
      const lastSequence = parseInt(latestLead.lead_number.split('-')[2] || '0');
      sequence = lastSequence + 1;
    }

    return `${prefix}-${String(sequence).padStart(4, '0')}`;
  },
});
