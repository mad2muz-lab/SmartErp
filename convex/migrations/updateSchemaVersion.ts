import { internalMutation } from "../_generated/server";

export const updateSchemaVersion = internalMutation({
  args: {},
  handler: async (ctx) => {
    // This migration adds the schema_version field to existing customer records
    // and tests that all Arabic fields are properly recognized
    
    console.log("🔄 Updating schema version for customer records...");
    
    try {
      const customers = await ctx.db.query("customers").collect();
      
      for (const customer of customers) {
        // Add schema version field
        await ctx.db.patch(customer._id, {
          schema_version: "2025-01-25-v2"
        });
      }
      
      console.log(`✅ Updated schema version for ${customers.length} customers`);
      
      // Test creating a customer with all Arabic fields to verify schema
      const testCustomerId = await ctx.db.insert("customers", {
        customer_company_name: "Schema Validator Test",
        customer_company_name_arabic: "اختبار صحة المخطط",
        schema_version: "2025-01-25-v2",
        customer_type: "business",
        contact_person: "Test Person",
        contact_person_arabic: "شخص اختبار",
        email: "test@example.com",
        email_arabic: "test@example.com",
        phone: "123456789",
        phone_arabic: "123456789",
        address: "123 Test St",
        address_arabic: "123 شارع الاختبار",
        building_number: "1",
        building_number_arabic: "1",
        street: "Test Street",
        street_arabic: "شارع الاختبار",
        additional_number: "1234",
        additional_number_arabic: "1234",
        district: "Test District",
        district_arabic: "منطقة الاختبار",
        city: "Test City",
        city_arabic: "مدينة الاختبار",
        state_province: "Test State",
        state_province_arabic: "ولاية الاختبار",
        zip_postal_code: "12345",
        zip_postal_code_arabic: "12345",
        country: "Test Country",
        country_arabic: "بلد الاختبار",
        website: "www.test.com",
        website_arabic: "www.test.com",
        vat_number: "VAT123",
        vat_number_arabic: "ضريبة القيمة المضافة 123",
        cr_number: "CR123",
        cr_number_arabic: "سجل تجاري 123",
        payment_terms: "Net 30",
        payment_terms_arabic: "صافي 30",
        custom_payment_terms: "Custom 60",
        custom_payment_terms_arabic: "مخصص 60",
        credit_days: 30,
        credit_limit: 10000,
        reliability_rating: 5,
        notes: "Schema validator test customer",
        notes_arabic: "عميل اختبار صحة المخطط",
        bank_name: "Test Bank",
        bank_name_arabic: "بنك الاختبار",
        account_number: "1234567890",
        account_number_arabic: "1234567890",
        iban: "IBANTEST",
        iban_arabic: "ايبان اختبار",
        swift_code: "SWIFTTEST",
        swift_code_arabic: "سويفت اختبار",
        bank_address: "Bank Address",
        bank_address_arabic: "عنوان البنك",
        account_holder_name: "Test Account Holder",
        account_holder_name_arabic: "صاحب الحساب التجريبي",
        organization_id: "k177v5nvxqq0xhx5wm5f7tqwpx7nwdek",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      console.log("✅ Schema validator test successful! Test customer created with ID:", testCustomerId);

      // Clean up the test record
      await ctx.db.delete(testCustomerId);
      console.log("🧹 Test record cleaned up");

      return { 
        success: true, 
        message: `Schema validator updated successfully. Updated ${customers.length} customers and verified all Arabic fields are recognized.` 
      };
      
    } catch (error) {
      console.error("❌ Schema validator update failed:", error);
      return { success: false, error: error.message };
    }
  },
});
