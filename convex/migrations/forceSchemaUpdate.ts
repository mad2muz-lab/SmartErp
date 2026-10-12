import { internalMutation } from "../_generated/server";

export const forceSchemaUpdate = internalMutation({
  args: {},
  handler: async (ctx) => {
    // This migration forces a schema update by attempting to create a test record
    // with all the new Arabic fields to ensure they exist in the schema
    
    console.log("🔄 Forcing schema update for customers table...");
    
    try {
      // Try to create a test customer with all Arabic fields
      const testCustomerId = await ctx.db.insert("customers", {
        customer_company_name: "Schema Test Customer",
        customer_company_name_arabic: "عميل اختبار المخطط",
        customer_type: "business",
        contact_person: "Test Person",
        contact_person_arabic: "شخص اختبار",
        email: "test@example.com",
        email_arabic: "test@example.com",
        phone: "123456789",
        phone_arabic: "123456789",
        address: "Test Address",
        address_arabic: "عنوان اختبار",
        building_number: "123",
        building_number_arabic: "123",
        street: "Test Street",
        street_arabic: "شارع اختبار",
        additional_number: "456",
        additional_number_arabic: "456",
        district: "Test District",
        district_arabic: "حي اختبار",
        city: "Test City",
        city_arabic: "مدينة اختبار",
        state_province: "Test State",
        state_province_arabic: "ولاية اختبار",
        zip_postal_code: "12345",
        zip_postal_code_arabic: "12345",
        country: "Test Country",
        country_arabic: "دولة اختبار",
        website: "https://test.com",
        website_arabic: "https://test.com",
        vat_number: "123456789",
        vat_number_arabic: "123456789",
        cr_number: "CR123456",
        cr_number_arabic: "CR123456",
        payment_terms: "Net 30",
        payment_terms_arabic: "صافي 30",
        custom_payment_terms: "Custom Terms",
        custom_payment_terms_arabic: "شروط مخصصة",
        notes: "Test Notes",
        notes_arabic: "ملاحظات اختبار",
        bank_name: "Test Bank",
        bank_name_arabic: "بنك اختبار",
        account_number: "123456789",
        account_number_arabic: "123456789",
        iban: "SA123456789",
        iban_arabic: "SA123456789",
        swift_code: "TESTCODE",
        swift_code_arabic: "TESTCODE",
        bank_address: "Bank Address",
        bank_address_arabic: "عنوان البنك",
        account_holder_name: "Account Holder",
        account_holder_name_arabic: "حامل الحساب",
        organization_id: "k177v5nvxqq0xhx5wm5f7tqwpx7nwdek" as any,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      
      console.log("✅ Schema test successful! Test customer created with ID:", testCustomerId);
      
      // Clean up the test customer
      await ctx.db.delete(testCustomerId);
      console.log("🧹 Test customer cleaned up");
      
      return { success: true, message: "Schema update test successful" };
      
    } catch (error) {
      console.error("❌ Schema test failed:", error);
      return { success: false, error: error.message };
    }
  },
});