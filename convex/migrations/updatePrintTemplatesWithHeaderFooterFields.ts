import { mutation } from "../_generated/server";
import { v } from "convex/values";

// Migration to add header/footer image fields to existing print templates
export const updatePrintTemplatesWithHeaderFooterFields = mutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    templatesUpdated: v.number(),
    message: v.string(),
  }),
  handler: async (ctx) => {
    try {
      // Get all existing print templates
      const allTemplates = await ctx.db
        .query("print_templates")
        .collect();

      let updatedCount = 0;

      for (const template of allTemplates) {
        let needsUpdate = false;
        const updates: any = {};

        // Check if header_config needs updating
        if (template.header_config && 
            (template.header_config as any).company_header_image === undefined) {
          updates.header_config = {
            ...template.header_config,
            company_header_image: false,
            company_footer_image: false,
          };
          needsUpdate = true;
        }

        // Check if footer_config needs updating
        if (template.footer_config && 
            (template.footer_config as any).company_header_image === undefined) {
          updates.footer_config = {
            ...template.footer_config,
            company_header_image: false,
            company_footer_image: false,
          };
          needsUpdate = true;
        }

        // Update template if needed
        if (needsUpdate) {
          updates.updated_at = new Date().toISOString();
          await ctx.db.patch(template._id, updates);
          updatedCount++;
        }
      }

      return {
        success: true,
        templatesUpdated: updatedCount,
        message: `Successfully updated ${updatedCount} print templates with header/footer image fields`,
      };
    } catch (error) {
      console.error("Migration error:", error);
      return {
        success: false,
        templatesUpdated: 0,
        message: `Migration failed: ${error}`,
      };
    }
  },
});