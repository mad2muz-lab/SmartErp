import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ============================================================================
// CORPORATE GOVERNANCE & MULTI-COMPANY CONTRACTING MODULE
// ============================================================================

// ----------------------------------------------------------------------------
// 1. PROJECTS MODULE
// ----------------------------------------------------------------------------

export const createProject = mutation({
  args: {
    organization_id: v.id("organizations"),
    project_code: v.string(),
    name: v.string(),
    name_arabic: v.optional(v.string()),
    client_name: v.string(),
    contract_value: v.number(),
    currency: v.optional(v.string()),
    start_date: v.string(),
    planned_end_date: v.string(),
    location: v.optional(v.string()),
    status: v.optional(v.union(v.literal("tender"), v.literal("active"), v.literal("suspended"), v.literal("completed"), v.literal("closed"))),
    description: v.optional(v.string()),
    created_by: v.id("user_profiles"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("projects")
      .withIndex("by_project_code", (q) => q.eq("project_code", args.project_code))
      .first();

    if (existing) {
      throw new Error(`Project code ${args.project_code} already exists`);
    }

    const now = new Date().toISOString();
    return await ctx.db.insert("projects", {
      organization_id: args.organization_id,
      project_code: args.project_code,
      name: args.name,
      name_arabic: args.name_arabic,
      client_name: args.client_name,
      contract_value: args.contract_value,
      currency: args.currency || "SAR",
      start_date: args.start_date,
      planned_end_date: args.planned_end_date,
      actual_end_date: undefined,
      location: args.location,
      status: args.status || "active",
      description: args.description,
      created_by: args.created_by,
      created_at: now,
      updated_at: now,
    });
  },
});

export const getProjects = query({
  args: {
    organization_id: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    try {
      return await ctx.db
        .query("projects")
        .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id))
        .order("desc")
        .collect();
    } catch (e) {
      return [];
    }
  },
});

export const getProjectById = query({
  args: {
    project_id: v.id("projects"),
  },
  handler: async (ctx, args) => {
    try {
      return await ctx.db.get(args.project_id);
    } catch (e) {
      return null;
    }
  },
});

// ----------------------------------------------------------------------------
// 2. COLLABORATION AGREEMENTS MODULE
// ----------------------------------------------------------------------------

export const createCollaborationAgreement = mutation({
  args: {
    project_id: v.id("projects"),
    primary_organization_id: v.id("organizations"), // Umbrella (Company A)
    partner_organization_id: v.id("organizations"), // Partner (Company B)
    collaboration_type: v.string(), // "CR_BRAND_SPONSORSHIP", "EQUIPMENT_LEASE", etc.
    effective_from: v.string(),
    effective_to: v.string(),
    management_fee_type: v.union(v.literal("zero_fee"), v.literal("percentage"), v.literal("fixed_monthly"), v.literal("profit_split")),
    management_fee_value: v.number(), // 0 for zero_fee
    liability_cap: v.optional(v.number()),
    dispute_jurisdiction: v.optional(v.string()),
    terms_summary: v.optional(v.string()),
    created_by: v.id("user_profiles"),
  },
  handler: async (ctx, args) => {
    const agreementCode = `AGR-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    return await ctx.db.insert("collaboration_agreements", {
      agreement_code: agreementCode,
      project_id: args.project_id,
      primary_organization_id: args.primary_organization_id,
      partner_organization_id: args.partner_organization_id,
      collaboration_type: args.collaboration_type,
      status: "active",
      effective_from: args.effective_from,
      effective_to: args.effective_to,
      management_fee_type: args.management_fee_type,
      management_fee_value: args.management_fee_value,
      liability_cap: args.liability_cap,
      dispute_jurisdiction: args.dispute_jurisdiction || "Riyadh Commercial Court",
      terms_summary: args.terms_summary,
      created_by: args.created_by,
      created_at: now,
      updated_at: now,
    });
  },
});

export const getCollaborationAgreements = query({
  args: {
    organization_id: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    try {
      const asPrimary = await ctx.db
        .query("collaboration_agreements")
        .withIndex("by_primary_org", (q) => q.eq("primary_organization_id", args.organization_id))
        .collect();

      const asPartner = await ctx.db
        .query("collaboration_agreements")
        .withIndex("by_partner_org", (q) => q.eq("partner_organization_id", args.organization_id))
        .collect();

      return [...asPrimary, ...asPartner];
    } catch (e) {
      return [];
    }
  },
});

// ----------------------------------------------------------------------------
// 3. PROMISSORY NOTES (SANAD AMR) REGISTRY & RISK VAULT
// ----------------------------------------------------------------------------

export const createPromissoryNote = mutation({
  args: {
    project_id: v.id("projects"),
    collaboration_agreement_id: v.optional(v.id("collaboration_agreements")),
    issuing_organization_id: v.id("organizations"), // Company A
    beneficiary_organization_id: v.id("organizations"), // Company B
    creditor_name: v.string(),
    creditor_cr: v.optional(v.string()),
    amount: v.number(),
    currency: v.optional(v.string()),
    issue_date: v.string(),
    due_date: v.string(),
    nafith_reference: v.optional(v.string()),
    purpose: v.string(),
    counter_secured: v.boolean(),
    counter_security_details: v.optional(v.string()),
    counter_security_doc_url: v.optional(v.string()),
    created_by: v.id("user_profiles"),
  },
  handler: async (ctx, args) => {
    const noteNumber = `SANAD-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const noteId = await ctx.db.insert("promissory_notes", {
      note_number: noteNumber,
      project_id: args.project_id,
      collaboration_agreement_id: args.collaboration_agreement_id,
      issuing_organization_id: args.issuing_organization_id,
      beneficiary_organization_id: args.beneficiary_organization_id,
      creditor_name: args.creditor_name,
      creditor_cr: args.creditor_cr,
      amount: args.amount,
      currency: args.currency || "SAR",
      issue_date: args.issue_date,
      due_date: args.due_date,
      nafith_reference: args.nafith_reference,
      purpose: args.purpose,
      counter_secured: args.counter_secured,
      counter_security_details: args.counter_security_details,
      counter_security_doc_url: args.counter_security_doc_url,
      status: "active",
      created_by: args.created_by,
      created_at: now,
      updated_at: now,
    });

    try {
      await ctx.db.insert("governance_audit_logs", {
        entity_type: "promissory_note",
        entity_id: noteId,
        action: "CREATE",
        actor_user_id: args.created_by,
        actor_organization_id: args.issuing_organization_id,
        timestamp: now,
        new_state: {
          note_number: noteNumber,
          amount: args.amount,
          creditor_name: args.creditor_name,
          due_date: args.due_date,
          counter_secured: args.counter_secured,
        },
        reason: `Issued Sanad Amr on behalf of beneficiary organization`,
      });
    } catch (e) {
      // Non-critical audit table catch
    }

    return { note_id: noteId, note_number: noteNumber };
  },
});

export const getPromissoryNotes = query({
  args: {
    organization_id: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    try {
      const asIssuer = await ctx.db
        .query("promissory_notes")
        .withIndex("by_issuing_org", (q) => q.eq("issuing_organization_id", args.organization_id))
        .collect();

      const asBeneficiary = await ctx.db
        .query("promissory_notes")
        .withIndex("by_beneficiary_org", (q) => q.eq("beneficiary_organization_id", args.organization_id))
        .collect();

      const allNotes = [...asIssuer, ...asBeneficiary];
      const uniqueNotes = Array.from(new Map(allNotes.map((n) => [n._id, n])).values());
      const nowMs = Date.now();

      return uniqueNotes.map((note) => {
        const dueMs = new Date(note.due_date).getTime();
        const daysRemaining = Math.ceil((dueMs - nowMs) / (1000 * 60 * 60 * 24));
        return {
          ...note,
          days_remaining: daysRemaining,
          is_overdue: daysRemaining < 0 && note.status === "active",
          is_critical: daysRemaining <= 14 && daysRemaining >= 0 && note.status === "active",
        };
      });
    } catch (e) {
      return [];
    }
  },
});

export const dischargePromissoryNote = mutation({
  args: {
    note_id: v.id("promissory_notes"),
    user_id: v.id("user_profiles"),
    organization_id: v.id("organizations"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.note_id);
    if (!note) throw new Error("Promissory note not found");

    const now = new Date().toISOString();
    await ctx.db.patch(args.note_id, {
      status: "discharged",
      discharged_at: now,
      discharged_by: args.user_id,
      updated_at: now,
    });

    try {
      await ctx.db.insert("governance_audit_logs", {
        entity_type: "promissory_note",
        entity_id: args.note_id,
        action: "DISCHARGE",
        actor_user_id: args.user_id,
        actor_organization_id: args.organization_id,
        timestamp: now,
        previous_state: { status: note.status },
        new_state: { status: "discharged" },
        reason: args.reason || "Underlying vendor obligation settled in full",
      });
    } catch (e) {
      // Non-critical audit
    }

    return { success: true, message: "Promissory note successfully discharged and archived." };
  },
});

// ----------------------------------------------------------------------------
// 4. BORROWING FACILITIES & CREDIT DRAWDOWNS MODULE
// ----------------------------------------------------------------------------

export const createBorrowingFacility = mutation({
  args: {
    legal_debtor_organization_id: v.id("organizations"), // Company A
    beneficiary_organization_id: v.id("organizations"), // Company B
    project_id: v.optional(v.id("projects")),
    lender_name: v.string(),
    facility_type: v.union(v.literal("bank_loan"), v.literal("overdraft"), v.literal("invoice_factoring"), v.literal("supplier_credit_line"), v.literal("kafala")),
    approved_limit: v.number(),
    finance_cost_rate: v.number(),
    currency: v.optional(v.string()),
    start_date: v.string(),
    expiry_date: v.string(),
    counter_indemnity_verified: v.boolean(),
    created_by: v.id("user_profiles"),
  },
  handler: async (ctx, args) => {
    const code = `FAC-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    return await ctx.db.insert("borrowing_facilities", {
      facility_code: code,
      legal_debtor_organization_id: args.legal_debtor_organization_id,
      beneficiary_organization_id: args.beneficiary_organization_id,
      project_id: args.project_id,
      lender_name: args.lender_name,
      facility_type: args.facility_type,
      approved_limit: args.approved_limit,
      drawn_amount: 0,
      outstanding_balance: 0,
      finance_cost_rate: args.finance_cost_rate,
      currency: args.currency || "SAR",
      start_date: args.start_date,
      expiry_date: args.expiry_date,
      counter_indemnity_verified: args.counter_indemnity_verified,
      repayment_waterfall_priority: 1,
      status: "active",
      created_by: args.created_by,
      created_at: now,
      updated_at: now,
    });
  },
});

export const getBorrowingFacilities = query({
  args: {
    organization_id: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    try {
      const asDebtor = await ctx.db
        .query("borrowing_facilities")
        .withIndex("by_debtor_org", (q) => q.eq("legal_debtor_organization_id", args.organization_id))
        .collect();

      const asBeneficiary = await ctx.db
        .query("borrowing_facilities")
        .withIndex("by_beneficiary_org", (q) => q.eq("beneficiary_organization_id", args.organization_id))
        .collect();

      return [...asDebtor, ...asBeneficiary];
    } catch (e) {
      return [];
    }
  },
});

export const requestCreditDrawdown = mutation({
  args: {
    facility_id: v.id("borrowing_facilities"),
    project_id: v.id("projects"),
    requested_by_org_id: v.id("organizations"), // Company B
    drawdown_amount: v.number(),
    repayment_due_date: v.string(),
    purpose_details: v.string(),
    user_id: v.id("user_profiles"),
  },
  handler: async (ctx, args) => {
    const facility = await ctx.db.get(args.facility_id);
    if (!facility) throw new Error("Facility not found");

    if (facility.drawn_amount + args.drawdown_amount > facility.approved_limit) {
      throw new Error(`Drawdown exceeds approved limit. Available: ${facility.approved_limit - facility.drawn_amount} SAR`);
    }

    const ref = `DRAW-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();
    const accruedFees = args.drawdown_amount * (facility.finance_cost_rate / 100);

    return await ctx.db.insert("credit_drawdowns", {
      drawdown_reference: ref,
      facility_id: args.facility_id,
      project_id: args.project_id,
      requested_by_org_id: args.requested_by_org_id,
      approved_by_org_id: facility.legal_debtor_organization_id,
      drawdown_amount: args.drawdown_amount,
      accrued_fees: accruedFees,
      drawdown_date: now.split("T")[0],
      repayment_due_date: args.repayment_due_date,
      purpose_details: args.purpose_details,
      repaid_amount: 0,
      status: "requested",
      approved_by: undefined,
      approved_at: undefined,
      created_at: now,
      updated_at: now,
    });
  },
});

export const approveCreditDrawdown = mutation({
  args: {
    drawdown_id: v.id("credit_drawdowns"),
    user_id: v.id("user_profiles"),
    organization_id: v.id("organizations"), // Company A
  },
  handler: async (ctx, args) => {
    const drawdown = await ctx.db.get(args.drawdown_id);
    if (!drawdown) throw new Error("Drawdown not found");

    const facility = await ctx.db.get(drawdown.facility_id);
    if (!facility) throw new Error("Facility not found");

    if (facility.legal_debtor_organization_id !== args.organization_id) {
      throw new Error("Only the legal debtor organization can authorize drawdowns");
    }

    const now = new Date().toISOString();
    await ctx.db.patch(args.drawdown_id, {
      status: "approved",
      approved_by: args.user_id,
      approved_at: now,
      updated_at: now,
    });

    await ctx.db.patch(drawdown.facility_id, {
      drawn_amount: facility.drawn_amount + drawdown.drawdown_amount,
      outstanding_balance: facility.outstanding_balance + drawdown.drawdown_amount + drawdown.accrued_fees,
      updated_at: now,
    });

    return { success: true, message: "Drawdown approved. Funds ready for allocation." };
  },
});

// ----------------------------------------------------------------------------
// 5. BRAND & CREDENTIAL AUTHORIZATIONS (PASSPORTS)
// ----------------------------------------------------------------------------

export const grantCredentialAuthorization = mutation({
  args: {
    authorizing_organization_id: v.id("organizations"), // Company A
    authorized_organization_id: v.id("organizations"), // Company B
    project_id: v.optional(v.id("projects")),
    credential_type: v.string(), // "CR", "Class 1 License", "Aramco Code"
    certificate_reference: v.string(),
    allowed_tender_scope: v.string(),
    max_authorized_value: v.optional(v.number()),
    valid_from: v.string(),
    valid_to: v.string(),
    allows_borrowing: v.boolean(),
    approved_by: v.id("user_profiles"),
  },
  handler: async (ctx, args) => {
    const passportCode = `AUTH-${Date.now().toString().slice(-6)}`;
    const token = `tok_${Math.random().toString(36).substring(2)}${Date.now()}`;
    const now = new Date().toISOString();

    return await ctx.db.insert("credential_authorizations", {
      passport_code: passportCode,
      authorizing_organization_id: args.authorizing_organization_id,
      authorized_organization_id: args.authorized_organization_id,
      project_id: args.project_id,
      credential_type: args.credential_type,
      certificate_reference: args.certificate_reference,
      allowed_tender_scope: args.allowed_tender_scope,
      max_authorized_value: args.max_authorized_value,
      valid_from: args.valid_from,
      valid_to: args.valid_to,
      verification_token: token,
      allows_borrowing: args.allows_borrowing,
      status: "active",
      approved_by: args.approved_by,
      created_at: now,
      updated_at: now,
    });
  },
});

export const getCredentialAuthorizations = query({
  args: {
    organization_id: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    try {
      const asAuthorizer = await ctx.db
        .query("credential_authorizations")
        .withIndex("by_authorizing_org", (q) => q.eq("authorizing_organization_id", args.organization_id))
        .collect();

      const asAuthorized = await ctx.db
        .query("credential_authorizations")
        .withIndex("by_authorized_org", (q) => q.eq("authorized_organization_id", args.organization_id))
        .collect();

      return [...asAuthorizer, ...asAuthorized];
    } catch (e) {
      return [];
    }
  },
});

export const verifyCredentialToken = query({
  args: {
    verification_token: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const auth = await ctx.db
        .query("credential_authorizations")
        .withIndex("by_token", (q) => q.eq("verification_token", args.verification_token))
        .first();

      if (!auth) return { is_valid: false, message: "Invalid or unrecognized authorization certificate" };

      const now = new Date().toISOString().split("T")[0];
      const isExpired = auth.valid_to < now;

      return {
        is_valid: auth.status === "active" && !isExpired,
        status: isExpired ? "expired" : auth.status,
        passport_code: auth.passport_code,
        credential_type: auth.credential_type,
        allowed_scope: auth.allowed_tender_scope,
        max_value: auth.max_authorized_value,
        valid_from: auth.valid_from,
        valid_to: auth.valid_to,
        allows_borrowing: auth.allows_borrowing,
      };
    } catch (e) {
      return { is_valid: false, message: "Verification service temporarily unavailable" };
    }
  },
});

// ----------------------------------------------------------------------------
// 6. RACI RESPONSIBILITY MATRIX
// ----------------------------------------------------------------------------

export const setRaciAssignment = mutation({
  args: {
    project_id: v.id("projects"),
    activity_name: v.string(),
    wbs_code: v.optional(v.string()),
    discipline: v.string(),
    organization_id: v.id("organizations"),
    raci_role: v.union(v.literal("R"), v.literal("A"), v.literal("C"), v.literal("I"), v.literal("INDEMNIFIER")),
    liability_notes: v.optional(v.string()),
    created_by: v.id("user_profiles"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("responsibility_matrices")
      .withIndex("by_project", (q) => q.eq("project_id", args.project_id))
      .filter((q) =>
        q.and(
          q.eq(q.field("activity_name"), args.activity_name),
          q.eq(q.field("organization_id"), args.organization_id)
        )
      )
      .first();

    const now = new Date().toISOString();

    if (existing) {
      await ctx.db.patch(existing._id, {
        raci_role: args.raci_role,
        liability_notes: args.liability_notes,
        updated_at: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("responsibility_matrices", {
      project_id: args.project_id,
      activity_name: args.activity_name,
      wbs_code: args.wbs_code,
      discipline: args.discipline,
      organization_id: args.organization_id,
      raci_role: args.raci_role,
      liability_notes: args.liability_notes,
      created_by: args.created_by,
      created_at: now,
      updated_at: now,
    });
  },
});

export const getProjectRaciMatrix = query({
  args: {
    project_id: v.id("projects"),
  },
  handler: async (ctx, args) => {
    try {
      return await ctx.db
        .query("responsibility_matrices")
        .withIndex("by_project", (q) => q.eq("project_id", args.project_id))
        .collect();
    } catch (e) {
      return [];
    }
  },
});

// ----------------------------------------------------------------------------
// 7. GENERIC RESOURCE ENGINE & REQUISITIONS WITH COUNTER-OFFER
// ----------------------------------------------------------------------------

export const createResource = mutation({
  args: {
    owner_organization_id: v.id("organizations"),
    category: v.union(v.literal("manpower"), v.literal("heavy_equipment"), v.literal("light_vehicle"), v.literal("material"), v.literal("specialist"), v.literal("facility"), v.literal("financial_credit"), v.literal("license")),
    sub_category: v.string(),
    identifier: v.string(),
    name: v.string(),
    name_arabic: v.optional(v.string()),
    standard_unit: v.string(),
    base_rate: v.number(),
    currency: v.optional(v.string()),
    current_location: v.optional(v.string()),
    specifications: v.optional(v.any()),
    expiry_date: v.optional(v.string()),
    is_sharable_externally: v.boolean(),
    created_by: v.id("user_profiles"),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("resources", {
      owner_organization_id: args.owner_organization_id,
      category: args.category,
      sub_category: args.sub_category,
      identifier: args.identifier,
      name: args.name,
      name_arabic: args.name_arabic,
      standard_unit: args.standard_unit,
      base_rate: args.base_rate,
      currency: args.currency || "SAR",
      current_status: "available",
      current_location: args.current_location,
      specifications: args.specifications,
      expiry_date: args.expiry_date,
      is_sharable_externally: args.is_sharable_externally,
      created_by: args.created_by,
      created_at: now,
      updated_at: now,
    });
  },
});

export const getResources = query({
  args: {
    organization_id: v.id("organizations"),
    include_shared: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    try {
      const owned = await ctx.db
        .query("resources")
        .withIndex("by_owner", (q) => q.eq("owner_organization_id", args.organization_id))
        .collect();

      if (!args.include_shared) return owned;

      const shared = await ctx.db
        .query("resources")
        .filter((q) =>
          q.and(
            q.neq(q.field("owner_organization_id"), args.organization_id),
            q.eq(q.field("is_sharable_externally"), true),
            q.eq(q.field("current_status"), "available")
          )
        )
        .collect();

      return [...owned, ...shared];
    } catch (e) {
      return [];
    }
  },
});

export const submitResourceRequest = mutation({
  args: {
    project_id: v.id("projects"),
    collaboration_agreement_id: v.optional(v.id("collaboration_agreements")),
    requesting_organization_id: v.id("organizations"),
    supplying_organization_id: v.id("organizations"),
    resource_id: v.optional(v.id("resources")),
    category: v.string(),
    quantity: v.number(),
    unit: v.string(),
    requested_rate: v.number(),
    start_date: v.string(),
    end_date: v.string(),
    mobilization_location: v.string(),
    terms_conditions: v.optional(v.string()),
    created_by: v.id("user_profiles"),
  },
  handler: async (ctx, args) => {
    const reqNum = `REQ-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    return await ctx.db.insert("resource_requests", {
      request_number: reqNum,
      project_id: args.project_id,
      collaboration_agreement_id: args.collaboration_agreement_id,
      requesting_organization_id: args.requesting_organization_id,
      supplying_organization_id: args.supplying_organization_id,
      resource_id: args.resource_id,
      category: args.category,
      quantity: args.quantity,
      unit: args.unit,
      requested_rate: args.requested_rate,
      start_date: args.start_date,
      end_date: args.end_date,
      mobilization_location: args.mobilization_location,
      terms_conditions: args.terms_conditions,
      counter_offer_data: undefined,
      status: "submitted",
      created_by: args.created_by,
      created_at: now,
      updated_at: now,
    });
  },
});

export const submitCounterOffer = mutation({
  args: {
    request_id: v.id("resource_requests"),
    counter_rate: v.number(),
    counter_start_date: v.string(),
    counter_end_date: v.string(),
    counter_quantity: v.number(),
    counter_conditions: v.string(),
    user_id: v.id("user_profiles"),
    organization_id: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.request_id);
    if (!request) throw new Error("Request not found");

    if (request.supplying_organization_id !== args.organization_id) {
      throw new Error("Only the supplying organization can submit counter-offers");
    }

    const now = new Date().toISOString();
    await ctx.db.patch(args.request_id, {
      status: "counter_offered",
      counter_offer_data: {
        counter_rate: args.counter_rate,
        counter_start_date: args.counter_start_date,
        counter_end_date: args.counter_end_date,
        counter_quantity: args.counter_quantity,
        counter_conditions: args.counter_conditions,
        submitted_at: now,
        submitted_by: args.user_id,
      },
      updated_at: now,
    });

    return { success: true, message: "Counter-offer transmitted to requesting organization." };
  },
});

export const acceptResourceRequestOrOffer = mutation({
  args: {
    request_id: v.id("resource_requests"),
    user_id: v.id("user_profiles"),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.request_id);
    if (!request) throw new Error("Request not found");

    const now = new Date().toISOString();
    await ctx.db.patch(args.request_id, {
      status: "approved",
      updated_at: now,
    });

    return { success: true, message: "Terms accepted. Proceed to physical site handover." };
  },
});

// ----------------------------------------------------------------------------
// 8. INTER-COMPANY TRANSACTIONS & BILATERAL SETTLEMENT TERMINAL
// ----------------------------------------------------------------------------

export const recordInterCompanyTransaction = mutation({
  args: {
    project_id: v.id("projects"),
    collaboration_agreement_id: v.optional(v.id("collaboration_agreements")),
    debtor_organization_id: v.id("organizations"),
    creditor_organization_id: v.id("organizations"),
    transaction_type: v.union(
      v.literal("client_progress_share"),
      v.literal("material_recharge"),
      v.literal("equipment_hire"),
      v.literal("manpower_subcontract"),
      v.literal("site_fuel_dispensed"),
      v.literal("camp_accommodation"),
      v.literal("management_fee"),
      v.literal("safety_fine_deduction"),
      v.literal("debt_repayment")
    ),
    amount_excl_vat: v.number(),
    vat_rate: v.optional(v.number()),
    currency: v.optional(v.string()),
    transaction_date: v.string(),
    description: v.string(),
    supporting_doc_url: v.optional(v.string()),
    reference_po_or_invoice: v.optional(v.string()),
    created_by: v.id("user_profiles"),
  },
  handler: async (ctx, args) => {
    const code = `TX-${Date.now().toString().slice(-6)}`;
    const vatRate = args.vat_rate ?? 15;
    const vatAmount = (args.amount_excl_vat * vatRate) / 100;
    const totalAmount = args.amount_excl_vat + vatAmount;
    const now = new Date().toISOString();

    return await ctx.db.insert("inter_company_transactions", {
      transaction_code: code,
      project_id: args.project_id,
      collaboration_agreement_id: args.collaboration_agreement_id,
      debtor_organization_id: args.debtor_organization_id,
      creditor_organization_id: args.creditor_organization_id,
      transaction_type: args.transaction_type,
      amount_excl_vat: args.amount_excl_vat,
      vat_rate: vatRate,
      vat_amount: vatAmount,
      total_amount: totalAmount,
      currency: args.currency || "SAR",
      transaction_date: args.transaction_date,
      description: args.description,
      supporting_doc_url: args.supporting_doc_url,
      reference_po_or_invoice: args.reference_po_or_invoice,
      is_settled: false,
      settlement_id: undefined,
      status: "verified",
      created_by: args.created_by,
      created_at: now,
      updated_at: now,
    });
  },
});

export const getBilateralLedger = query({
  args: {
    organization_a_id: v.id("organizations"),
    organization_b_id: v.id("organizations"),
    project_id: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    try {
      const aOwesB = await ctx.db
        .query("inter_company_transactions")
        .withIndex("by_debtor_org", (q) => q.eq("debtor_organization_id", args.organization_a_id))
        .filter((q) =>
          q.and(
            q.eq(q.field("creditor_organization_id"), args.organization_b_id),
            q.eq(q.field("is_settled"), false)
          )
        )
        .collect();

      const bOwesA = await ctx.db
        .query("inter_company_transactions")
        .withIndex("by_debtor_org", (q) => q.eq("debtor_organization_id", args.organization_b_id))
        .filter((q) =>
          q.and(
            q.eq(q.field("creditor_organization_id"), args.organization_a_id),
            q.eq(q.field("is_settled"), false)
          )
        )
        .collect();

      const grossAtoB = aOwesB.reduce((sum, tx) => sum + (tx.total_amount || 0), 0);
      const grossBtoA = bOwesA.reduce((sum, tx) => sum + (tx.total_amount || 0), 0);

      const netPayable = Math.abs(grossAtoB - grossBtoA);
      const netPayerOrgId = grossAtoB >= grossBtoA ? args.organization_a_id : args.organization_b_id;
      const netPayeeOrgId = grossAtoB >= grossBtoA ? args.organization_b_id : args.organization_a_id;

      return {
        transactions_a_to_b: aOwesB,
        transactions_b_to_a: bOwesA,
        gross_a_to_b: grossAtoB,
        gross_b_to_a: grossBtoA,
        net_payable_amount: netPayable,
        net_payer_org_id: netPayerOrgId,
        net_payee_org_id: netPayeeOrgId,
      };
    } catch (e) {
      return {
        transactions_a_to_b: [],
        transactions_b_to_a: [],
        gross_a_to_b: 0,
        gross_b_to_a: 0,
        net_payable_amount: 0,
        net_payer_org_id: args.organization_a_id,
        net_payee_org_id: args.organization_b_id,
      };
    }
  },
});

export const executeBilateralSettlement = mutation({
  args: {
    organization_a_id: v.id("organizations"),
    organization_b_id: v.id("organizations"),
    statement_period_start: v.string(),
    statement_period_end: v.string(),
    payment_reference: v.optional(v.string()),
    user_id: v.id("user_profiles"),
  },
  handler: async (ctx, args) => {
    const aOwesB = await ctx.db
      .query("inter_company_transactions")
      .withIndex("by_debtor_org", (q) => q.eq("debtor_organization_id", args.organization_a_id))
      .filter((q) =>
        q.and(
          q.eq(q.field("creditor_organization_id"), args.organization_b_id),
          q.eq(q.field("is_settled"), false)
        )
      )
      .collect();

    const bOwesA = await ctx.db
      .query("inter_company_transactions")
      .withIndex("by_debtor_org", (q) => q.eq("debtor_organization_id", args.organization_b_id))
      .filter((q) =>
        q.and(
          q.eq(q.field("creditor_organization_id"), args.organization_a_id),
          q.eq(q.field("is_settled"), false)
        )
      )
      .collect();

    if (aOwesB.length === 0 && bOwesA.length === 0) {
      throw new Error("No unsettled transactions exist between these two organizations");
    }

    const grossAtoB = aOwesB.reduce((sum, tx) => sum + (tx.total_amount || 0), 0);
    const grossBtoA = bOwesA.reduce((sum, tx) => sum + (tx.total_amount || 0), 0);
    const netPayable = Math.abs(grossAtoB - grossBtoA);
    const netPayerOrgId = grossAtoB >= grossBtoA ? args.organization_a_id : args.organization_b_id;
    const netPayeeOrgId = grossAtoB >= grossBtoA ? args.organization_b_id : args.organization_a_id;

    const ref = `SETTLE-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const settlementId = await ctx.db.insert("bilateral_settlements", {
      settlement_reference: ref,
      organization_a_id: args.organization_a_id,
      organization_b_id: args.organization_b_id,
      statement_period_start: args.statement_period_start,
      statement_period_end: args.statement_period_end,
      gross_a_to_b: grossAtoB,
      gross_b_to_a: grossBtoA,
      net_vat_offset: 0,
      net_payable_amount: netPayable,
      net_payer_organization_id: netPayerOrgId,
      net_payee_organization_id: netPayeeOrgId,
      currency: "SAR",
      status: "discharged",
      signed_by_a: args.user_id,
      signed_by_b: undefined,
      payment_reference: args.payment_reference,
      discharged_at: now,
      created_by: args.user_id,
      created_at: now,
      updated_at: now,
    });

    for (const tx of [...aOwesB, ...bOwesA]) {
      await ctx.db.patch(tx._id, {
        is_settled: true,
        settlement_id: settlementId,
        status: "settled",
        updated_at: now,
      });
    }

    return {
      settlement_id: settlementId,
      settlement_reference: ref,
      net_payable: netPayable,
      cleared_transactions_count: aOwesB.length + bOwesA.length,
      message: "Bilateral settlement discharged. All underlying transactions netted and closed.",
    };
  },
});

// ----------------------------------------------------------------------------
// 9. EXECUTIVE GOVERNANCE & RISK DASHBOARD
// ----------------------------------------------------------------------------

export const getGovernanceDashboardKPIs = query({
  args: {
    organization_id: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    let promissoryNotes: any[] = [];
    try {
      promissoryNotes = await ctx.db
        .query("promissory_notes")
        .withIndex("by_issuing_org", (q) => q.eq("issuing_organization_id", args.organization_id))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();
    } catch (e) {
      promissoryNotes = [];
    }

    const totalSanadExposure = promissoryNotes.reduce((sum, n) => sum + (n.amount || 0), 0);
    const counterSecuredNotes = promissoryNotes.filter((n) => n.counter_secured);
    const counterSecuredPercentage =
      promissoryNotes.length > 0 ? (counterSecuredNotes.length / promissoryNotes.length) * 100 : 100;

    let activeProjects: any[] = [];
    try {
      activeProjects = await ctx.db
        .query("projects")
        .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();
    } catch (e) {
      activeProjects = [];
    }

    let activeAgreements: any[] = [];
    try {
      activeAgreements = await ctx.db
        .query("collaboration_agreements")
        .withIndex("by_primary_org", (q) => q.eq("primary_organization_id", args.organization_id))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();
    } catch (e) {
      activeAgreements = [];
    }

    let activePassports: any[] = [];
    try {
      activePassports = await ctx.db
        .query("credential_authorizations")
        .withIndex("by_authorizing_org", (q) => q.eq("authorizing_organization_id", args.organization_id))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();
    } catch (e) {
      activePassports = [];
    }

    let facilities: any[] = [];
    try {
      facilities = await ctx.db
        .query("borrowing_facilities")
        .withIndex("by_debtor_org", (q) => q.eq("legal_debtor_organization_id", args.organization_id))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();
    } catch (e) {
      facilities = [];
    }

    const totalBorrowingLimit = facilities.reduce((sum, f) => sum + (f.approved_limit || 0), 0);
    const totalDrawnBorrowing = facilities.reduce((sum, f) => sum + (f.drawn_amount || 0), 0);

    return {
      sanad_exposure: {
        total_active_sar: totalSanadExposure,
        active_notes_count: promissoryNotes.length,
        counter_secured_pct: Math.round(counterSecuredPercentage),
      },
      projects_and_consortiums: {
        active_projects_count: activeProjects.length,
        active_collaborations_count: activeAgreements.length,
      },
      brand_passports: {
        active_passports_count: activePassports.length,
      },
      borrowing_shield: {
        approved_limit_sar: totalBorrowingLimit,
        drawn_balance_sar: totalDrawnBorrowing,
        headroom_available_sar: Math.max(0, totalBorrowingLimit - totalDrawnBorrowing),
      },
    };
  },
});
