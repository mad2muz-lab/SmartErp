"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

// Action for multi-page template with Arabic support
export const generateMultiPagePDF = action({
  args: {
    quotationData: v.object({
      _id: v.string(),
      quotation_number: v.string(),
      customer_id: v.string(),
      customer_name: v.string(),
      customer_name_arabic: v.optional(v.string()),
      date: v.string(),
      valid_until: v.string(),
      currency: v.string(),
      tax_rate: v.number(),
      terms_conditions: v.optional(v.string()),
      items: v.array(v.object({
        inventory_name: v.string(),
        inventory_name_arabic: v.optional(v.string()),
        description: v.string(),
        quantity: v.number(),
        unit_price: v.number(),
        rate: v.number(),
        total_price: v.number(),
        amount: v.number(),
        vat_percentage: v.number(),
        vat_amount: v.number(),
        discount_percentage: v.optional(v.number()),
        wbs_code: v.optional(v.string()),
        item_title: v.optional(v.string()),
        is_section_header: v.optional(v.boolean()),
        unit: v.optional(v.string()),
      }))
    }),
    orgData: v.object({
      name: v.string(),
      name_arabic: v.string(),
      address: v.string(),
      address_arabic: v.string(),
      vat_number: v.string(),
      vat_number_arabic: v.string(),
      cr_number: v.string(),
      email: v.string(),
      phone: v.string(),
      website: v.string(),
      logo_url: v.optional(v.string()),
      header_config: v.optional(v.any()),
      footer_config: v.optional(v.any()),
    }),
    action: v.union(v.literal("download"), v.literal("print"))
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    pdfData: v.optional(v.string()),
    htmlContent: v.optional(v.string()),
    shouldConvertToPDF: v.optional(v.boolean())
  }),
  handler: async (ctx, args) => {
    try {
      console.log('Generating multi-page PDF with Arabic support');
      
      // Return success to trigger client-side multi-page PDF generation
      return {
        success: true,
        message: 'Multi-page template should be used',
        shouldConvertToPDF: false,
        htmlContent: undefined,
        pdfData: undefined
      };
    } catch (error) {
      console.error('Error generating multi-page PDF:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});
