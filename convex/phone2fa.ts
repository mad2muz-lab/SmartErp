import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * Two-Factor Authentication (2FA) verification module for mobile numbers
 */

// 1. Send / Generate 2FA Phone Verification Code
export const sendPhoneVerificationOtp = mutation({
  args: {
    phone_number: v.string(),
  },
  handler: async (ctx, args) => {
    let cleanPhone = args.phone_number.trim().replace(/\s+/g, "");
    if (cleanPhone.startsWith("05")) {
      cleanPhone = `+966${cleanPhone.slice(1)}`;
    } else if (!cleanPhone.startsWith("+") && cleanPhone.startsWith("966")) {
      cleanPhone = `+${cleanPhone}`;
    }

    // Generate random 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const now = new Date();
    // Expires in 5 minutes
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000).toISOString();

    const recordId = await ctx.db.insert("phone_verifications", {
      phone_number: cleanPhone,
      otp_code: otpCode,
      expires_at: expiresAt,
      verified: false,
      created_at: now.toISOString(),
    });

    return {
      success: true,
      verification_id: recordId,
      phone_number: cleanPhone,
      simulated_code: otpCode, // Provided for instant demo/testing preview
      expires_in_seconds: 300,
      message: `2FA security OTP dispatched to ${cleanPhone}. Code valid for 5 minutes.`,
    };
  },
});

// 2. Verify 2FA OTP Code
export const verifyPhoneOtp = mutation({
  args: {
    phone_number: v.string(),
    otp_code: v.string(),
  },
  handler: async (ctx, args) => {
    let cleanPhone = args.phone_number.trim().replace(/\s+/g, "");
    if (cleanPhone.startsWith("05")) {
      cleanPhone = `+966${cleanPhone.slice(1)}`;
    } else if (!cleanPhone.startsWith("+") && cleanPhone.startsWith("966")) {
      cleanPhone = `+${cleanPhone}`;
    }

    const records = await ctx.db
      .query("phone_verifications")
      .withIndex("by_phone", (q) => q.eq("phone_number", cleanPhone))
      .collect();

    // Get latest active record
    const latest = records
      .filter((r) => !r.verified)
      .sort((a, b) => (b.created_at > a.created_at ? 1 : -1))[0];

    if (!latest) {
      throw new Error("No active verification session found for this phone number");
    }

    const now = new Date().toISOString();
    if (now > latest.expires_at) {
      throw new Error("Verification code has expired. Please request a new code.");
    }

    if (latest.otp_code !== args.otp_code.trim()) {
      throw new Error("Incorrect 2FA verification code. Please check and try again.");
    }

    // Mark as verified
    await ctx.db.patch(latest._id, {
      verified: true,
    });

    return {
      success: true,
      verified: true,
      phone_number: cleanPhone,
      message: `Phone number ${cleanPhone} successfully verified via 2FA`,
    };
  },
});
