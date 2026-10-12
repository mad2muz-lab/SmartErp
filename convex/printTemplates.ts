import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Force deployment update - v4 - CRITICAL FIX

// Default template configuration
const DEFAULT_HEADER_CONFIG = {
  logo: true,
  name: true,
  name_arabic: false,
  email: true,
  phone: true,
  address: true,
  address_arabic: false,
  website: false,
  vat_number: true,
  vat_number_arabic: false,
  cr_number: false,
  cr_number_arabic: false,
  industry: false,
  // Custom header/footer image fields
  company_header_image: false,
  company_footer_image: false,
};

const DEFAULT_FOOTER_CONFIG = {
  logo: false,
  name: true,
  name_arabic: false,
  email: true,
  phone: true,
  address: true,
  address_arabic: false,
  website: false,
  vat_number: true,
  vat_number_arabic: false,
  cr_number: false,
  cr_number_arabic: false,
  industry: false,
  // Custom header/footer image fields
  company_header_image: false,
  company_footer_image: false,
};

// Strict return shape for print templates (kept for reference / documentation)
const legacyTemplateListReturn = v.array(v.object({
    _id: v.id("print_templates"),
    _creationTime: v.number(),
    name: v.string(),
    description: v.optional(v.string()),
    template_type: v.string(),
    organization_id: v.id("organizations"),
    is_default: v.boolean(),
    is_active: v.boolean(),
    header_config: v.optional(v.object({
      logo: v.boolean(),
      name: v.boolean(),
      name_arabic: v.boolean(),
      email: v.boolean(),
      phone: v.boolean(),
      address: v.boolean(),
      address_arabic: v.boolean(),
      website: v.boolean(),
      vat_number: v.boolean(),
      vat_number_arabic: v.boolean(),
      cr_number: v.boolean(),
      cr_number_arabic: v.boolean(),
      industry: v.boolean(),
      // Custom header/footer image fields
      company_header_image: v.optional(v.boolean()),
      company_footer_image: v.optional(v.boolean()),
    })),
    footer_config: v.optional(v.object({
      logo: v.boolean(),
      name: v.boolean(),
      name_arabic: v.boolean(),
      email: v.boolean(),
      phone: v.boolean(),
      address: v.boolean(),
      address_arabic: v.boolean(),
      website: v.boolean(),
      vat_number: v.boolean(),
      vat_number_arabic: v.boolean(),
      cr_number: v.boolean(),
      cr_number_arabic: v.boolean(),
      industry: v.boolean(),
      // Custom header/footer image fields
      company_header_image: v.optional(v.boolean()),
      company_footer_image: v.optional(v.boolean()),
    })),
    custom_styles: v.optional(v.object({
      font_family: v.optional(v.string()),
      font_size: v.optional(v.string()),
      primary_color: v.optional(v.string()),
      secondary_color: v.optional(v.string()),
      border_style: v.optional(v.string()),
      border_width: v.optional(v.string()),
      header_height: v.optional(v.string()),
      footer_height: v.optional(v.string()),
    })),
    custom_content: v.optional(v.object({
      header_text: v.optional(v.string()),
      header_text_arabic: v.optional(v.string()),
      footer_text: v.optional(v.string()),
      footer_text_arabic: v.optional(v.string()),
      watermark_text: v.optional(v.string()),
      watermark_text_arabic: v.optional(v.string()),
    })),
    created_by: v.optional(v.string()),
    created_at: v.string(),
    updated_at: v.string(),
}));
void legacyTemplateListReturn;

// List all print templates for an organization
export const listTemplates = query({
  args: {
    organization_id: v.union(v.id("organizations"), v.string()),
    template_type: v.optional(v.string()), // Filter by template type
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const orgId = args.organization_id as string;
    if (!orgId || /^(org_|temp_|demo_|local_|vnd_|vendor_)/.test(orgId)) {
      return [];
    }
    try {
      // Use the appropriate index based on whether template_type is provided
      let templates;
      if (args.template_type) {
        templates = await ctx.db
          .query("print_templates")
          .withIndex("by_organization_type", (q) =>
            q.eq("organization_id", args.organization_id as any)
             .eq("template_type", args.template_type!)
          )
          .collect();
      } else {
        templates = await ctx.db
          .query("print_templates")
          .withIndex("by_organization", (q) => 
            q.eq("organization_id", args.organization_id as any)
          )
          .collect();
      }
      
      // Sort by is_default first, then by name
      return templates.sort((a, b) => {
        if (a.is_default && !b.is_default) return -1;
        if (!a.is_default && b.is_default) return 1;
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      console.error('Error in listTemplates:', error);
      return [];
    }
  },
});

// Get a specific template by ID
export const getTemplate = query({
  args: {
    template_id: v.id("print_templates"),
  },
  returns: v.union(
    v.object({
      _id: v.id("print_templates"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.optional(v.string()),
      template_type: v.string(),
      organization_id: v.id("organizations"),
      is_default: v.boolean(),
      is_active: v.boolean(),
      header_config: v.optional(v.object({
        logo: v.boolean(),
        name: v.boolean(),
        name_arabic: v.boolean(),
        email: v.boolean(),
        phone: v.boolean(),
        address: v.boolean(),
        address_arabic: v.boolean(),
        website: v.boolean(),
        vat_number: v.boolean(),
        vat_number_arabic: v.boolean(),
        cr_number: v.boolean(),
        cr_number_arabic: v.boolean(),
        industry: v.boolean(),
        // Custom header/footer image fields
        company_header_image: v.optional(v.boolean()),
        company_footer_image: v.optional(v.boolean()),
      })),
      footer_config: v.optional(v.object({
        logo: v.boolean(),
        name: v.boolean(),
        name_arabic: v.boolean(),
        email: v.boolean(),
        phone: v.boolean(),
        address: v.boolean(),
        address_arabic: v.boolean(),
        website: v.boolean(),
        vat_number: v.boolean(),
        vat_number_arabic: v.boolean(),
        cr_number: v.boolean(),
        cr_number_arabic: v.boolean(),
        industry: v.boolean(),
        // Custom header/footer image fields
        company_header_image: v.optional(v.boolean()),
        company_footer_image: v.optional(v.boolean()),
      })),
      custom_styles: v.optional(v.object({
        primary_color: v.optional(v.string()),
        secondary_color: v.optional(v.string()),
        font_family: v.optional(v.string()),
        font_size: v.optional(v.string()),
        border_style: v.optional(v.string()),
        border_width: v.optional(v.string()),
        header_height: v.optional(v.string()),
        footer_height: v.optional(v.string()),
      })),
      custom_content: v.optional(v.object({
        header_text: v.optional(v.string()),
        header_text_arabic: v.optional(v.string()),
        footer_text: v.optional(v.string()),
        footer_text_arabic: v.optional(v.string()),
        watermark_text: v.optional(v.string()),
        watermark_text_arabic: v.optional(v.string()),
      })),
      created_by: v.optional(v.string()),
      created_at: v.string(),
      updated_at: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    try {
      const template = await ctx.db.get(args.template_id);
      console.log('Retrieved template:', template);
      return template;
    } catch (error) {
      console.error('Error in getTemplate:', error);
      return null;
    }
  },
});

// Get the default template for a specific type and organization
export const getDefaultTemplate = query({
  args: {
    organization_id: v.id("organizations"),
    template_type: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("print_templates"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.optional(v.string()),
      template_type: v.string(),
      organization_id: v.id("organizations"),
      is_default: v.boolean(),
      is_active: v.boolean(),
      header_config: v.optional(v.object({
        logo: v.boolean(),
        name: v.boolean(),
        name_arabic: v.boolean(),
        email: v.boolean(),
        phone: v.boolean(),
        address: v.boolean(),
        address_arabic: v.boolean(),
        website: v.boolean(),
        vat_number: v.boolean(),
        vat_number_arabic: v.boolean(),
        cr_number: v.boolean(),
        cr_number_arabic: v.boolean(),
        industry: v.boolean(),
        // Custom header/footer image fields
        company_header_image: v.optional(v.boolean()),
        company_footer_image: v.optional(v.boolean()),
      })),
      footer_config: v.optional(v.object({
        logo: v.boolean(),
        name: v.boolean(),
        name_arabic: v.boolean(),
        email: v.boolean(),
        phone: v.boolean(),
        address: v.boolean(),
        address_arabic: v.boolean(),
        website: v.boolean(),
        vat_number: v.boolean(),
        vat_number_arabic: v.boolean(),
        cr_number: v.boolean(),
        cr_number_arabic: v.boolean(),
        industry: v.boolean(),
        // Custom header/footer image fields
        company_header_image: v.optional(v.boolean()),
        company_footer_image: v.optional(v.boolean()),
      })),
      custom_styles: v.optional(v.object({
        primary_color: v.optional(v.string()),
        secondary_color: v.optional(v.string()),
        font_family: v.optional(v.string()),
        font_size: v.optional(v.string()),
        border_style: v.optional(v.string()),
        border_width: v.optional(v.string()),
        header_height: v.optional(v.string()),
        footer_height: v.optional(v.string()),
      })),
      custom_content: v.optional(v.object({
        header_text: v.optional(v.string()),
        header_text_arabic: v.optional(v.string()),
        footer_text: v.optional(v.string()),
        footer_text_arabic: v.optional(v.string()),
        watermark_text: v.optional(v.string()),
        watermark_text_arabic: v.optional(v.string()),
      })),
      created_by: v.optional(v.string()),
      created_at: v.string(),
      updated_at: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    try {
      const template = await ctx.db
        .query("print_templates")
        .withIndex("by_default", (q) =>
          q.eq("organization_id", args.organization_id)
           .eq("template_type", args.template_type)
           .eq("is_default", true)
        )
        .first();

      console.log('Retrieved default template:', template);
      return template;
    } catch (error) {
      console.error('Error in getDefaultTemplate:', error);
      return null;
    }
  },
});

// Create a new print template
export const createTemplate = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    template_type: v.string(),
    organization_id: v.id("organizations"),
    is_default: v.optional(v.boolean()),
    is_active: v.optional(v.boolean()),
    header_config: v.optional(v.any()),
    footer_config: v.optional(v.any()),
    custom_styles: v.optional(v.any()),
    custom_content: v.optional(v.any()),
  },
  returns: v.id("print_templates"),
  handler: async (ctx, args) => {

    const now = new Date().toISOString();

    // If this is being set as default, unset other defaults for this type
    if (args.is_default) {
      const existingDefaults = await ctx.db
        .query("print_templates")
        .withIndex("by_default", (q) => 
          q.eq("organization_id", args.organization_id)
           .eq("template_type", args.template_type)
           .eq("is_default", true)
        )
        .collect();

      for (const template of existingDefaults) {
        await ctx.db.patch(template._id, {
          is_default: false,
          updated_at: now,
        });
      }
    }

    const templateId = await ctx.db.insert("print_templates", {
      name: args.name,
      description: args.description,
      template_type: args.template_type,
      organization_id: args.organization_id,
      is_default: args.is_default || false,
      is_active: args.is_active !== undefined ? args.is_active : true,
      header_config: args.header_config || DEFAULT_HEADER_CONFIG,
      footer_config: args.footer_config || DEFAULT_FOOTER_CONFIG,
      custom_styles: args.custom_styles || {
        primary_color: '#333333',
        secondary_color: '#666666',
        font_family: 'Arial, sans-serif',
        font_size: '14px',
        border_style: 'solid',
        border_width: '1px',
        header_height: '100px',
        footer_height: '80px',
      },
      custom_content: args.custom_content || {
        header_text: '',
        header_text_arabic: '',
        footer_text: '',
        footer_text_arabic: '',
        watermark_text: '',
        watermark_text_arabic: '',
      },
      created_by: "system",
      created_at: now,
      updated_at: now,
    });

    return templateId;
  },
});

// Update an existing print template
export const updateTemplate = mutation({
  args: {
    template_id: v.id("print_templates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    is_default: v.optional(v.boolean()),
    is_active: v.optional(v.boolean()),
    header_config: v.optional(v.any()),
    footer_config: v.optional(v.any()),
    custom_styles: v.optional(v.any()),
    custom_content: v.optional(v.any()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {

    const template = await ctx.db.get(args.template_id);
    if (!template) {
      throw new Error("Template not found");
    }

    const now = new Date().toISOString();

    // If this is being set as default, unset other defaults for this type
    if (args.is_default) {
      const existingDefaults = await ctx.db
        .query("print_templates")
        .withIndex("by_default", (q) => 
          q.eq("organization_id", template.organization_id)
           .eq("template_type", template.template_type)
           .eq("is_default", true)
        )
        .collect();

      for (const existingTemplate of existingDefaults) {
        if (existingTemplate._id !== args.template_id) {
          await ctx.db.patch(existingTemplate._id, {
            is_default: false,
            updated_at: now,
          });
        }
      }
    }

    const updateData: any = {
      updated_at: now,
    };

    if (args.name !== undefined) updateData.name = args.name;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.is_default !== undefined) updateData.is_default = args.is_default;
    if (args.is_active !== undefined) updateData.is_active = args.is_active;
    if (args.header_config !== undefined) updateData.header_config = args.header_config;
    if (args.footer_config !== undefined) updateData.footer_config = args.footer_config;
    if (args.custom_styles !== undefined) updateData.custom_styles = args.custom_styles;
    if (args.custom_content !== undefined) updateData.custom_content = args.custom_content;

    await ctx.db.patch(args.template_id, updateData);
    return true;
  },
});

// Delete a print template
export const deleteTemplate = mutation({
  args: {
    template_id: v.id("print_templates"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {

    const template = await ctx.db.get(args.template_id);
    if (!template) {
      throw new Error("Template not found");
    }

    // Check if any delivery notes are using this template
    const deliveryNotesUsingTemplate = await ctx.db
      .query("delivery_notes")
      .withIndex("by_template", (q) => q.eq("template_id", args.template_id))
      .first();

    if (deliveryNotesUsingTemplate) {
      throw new Error("Cannot delete template that is being used by delivery notes");
    }

    await ctx.db.delete(args.template_id);
    return true;
  },
});

// Duplicate a template
export const duplicateTemplate = mutation({
  args: {
    template_id: v.id("print_templates"),
    new_name: v.string(),
  },
  returns: v.id("print_templates"),
  handler: async (ctx, args) => {

    const originalTemplate = await ctx.db.get(args.template_id);
    if (!originalTemplate) {
      throw new Error("Template not found");
    }

    const now = new Date().toISOString();

    const templateId = await ctx.db.insert("print_templates", {
      name: args.new_name,
      description: originalTemplate.description,
      template_type: originalTemplate.template_type,
      organization_id: originalTemplate.organization_id,
      is_default: false, // Duplicated templates are never default
      is_active: originalTemplate.is_active,
      header_config: originalTemplate.header_config,
      footer_config: originalTemplate.footer_config,
      custom_styles: originalTemplate.custom_styles,
      custom_content: originalTemplate.custom_content,
      created_by: "system",
      created_at: now,
      updated_at: now,
    });

    return templateId;
  },
});

// Set a template as default for its type
export const setDefaultTemplate = mutation({
  args: {
    template_id: v.id("print_templates"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {

    const template = await ctx.db.get(args.template_id);
    if (!template) {
      throw new Error("Template not found");
    }

    const now = new Date().toISOString();

    // Unset other defaults for this type
    const existingDefaults = await ctx.db
      .query("print_templates")
      .withIndex("by_default", (q) => 
        q.eq("organization_id", template.organization_id)
         .eq("template_type", template.template_type)
         .eq("is_default", true)
      )
      .collect();

    for (const existingTemplate of existingDefaults) {
      await ctx.db.patch(existingTemplate._id, {
        is_default: false,
        updated_at: now,
      });
    }

    // Set this template as default
    await ctx.db.patch(args.template_id, {
      is_default: true,
      updated_at: now,
    });

    return true;
  },
});

// Create default templates for an organization
export const createDefaultTemplates = mutation({
  args: {
    organization_id: v.id("organizations"),
  },
  returns: v.array(v.id("print_templates")),
  handler: async (ctx, args) => {

    const now = new Date().toISOString();
    const templateIds: Id<"print_templates">[] = [];

    // Check if default templates already exist
    const existingTemplates = await ctx.db
      .query("print_templates")
      .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id))
      .collect();

    if (existingTemplates.length > 0) {
      throw new Error("Default templates already exist for this organization");
    }

    // Create standard delivery note template
    const standardTemplateId = await ctx.db.insert("print_templates", {
      name: "Standard Delivery Note",
      description: "Default delivery note template with standard layout",
      template_type: "delivery_note",
      organization_id: args.organization_id,
      is_default: true,
      is_active: true,
      header_config: DEFAULT_HEADER_CONFIG,
      footer_config: DEFAULT_FOOTER_CONFIG,
      custom_styles: {
        primary_color: "#333333",
        secondary_color: "#666666",
        font_family: "Arial, sans-serif",
        font_size: "10px",
        border_style: "solid",
        border_width: "1px",
      },
      custom_content: {},
      created_by: "system",
      created_at: now,
      updated_at: now,
    });
    templateIds.push(standardTemplateId);

    // Create Arabic delivery note template
    const arabicTemplateId = await ctx.db.insert("print_templates", {
      name: "Arabic Delivery Note",
      description: "Delivery note template optimized for Arabic content",
      template_type: "delivery_note",
      organization_id: args.organization_id,
      is_default: false,
      is_active: true,
      header_config: {
        ...DEFAULT_HEADER_CONFIG,
        name_arabic: true,
        address_arabic: true,
        vat_number_arabic: true,
      },
      footer_config: {
        ...DEFAULT_FOOTER_CONFIG,
        name_arabic: true,
        address_arabic: true,
        vat_number_arabic: true,
      },
      custom_styles: {
        primary_color: "#333333",
        secondary_color: "#666666",
        font_family: "Arial, 'Noto Sans Arabic', sans-serif",
        font_size: "10px",
        border_style: "solid",
        border_width: "1px",
      },
      custom_content: {},
      created_by: "system",
      created_at: now,
      updated_at: now,
    });
    templateIds.push(arabicTemplateId);

    return templateIds;
  },
});
