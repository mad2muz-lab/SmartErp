import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

/**
 * WhatsApp Inbound Webhook Endpoint
 * 
 * Handles incoming callbacks from:
 * 1. Meta WhatsApp Cloud API
 * 2. Twilio WhatsApp Webhooks
 * 3. Custom/Direct simulation endpoints
 */

// Handle Webhook Verification Challenge (Meta Cloud API /hub.challenge)
http.route({
  path: "/api/whatsapp-webhook",
  method: "GET",
  handler: httpAction(async (_ctx, request) => {
    const url = new URL(request.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token) {
      return new Response(challenge || "OK", { status: 200 });
    }

    return new Response("WhatsApp Webhook Active", { status: 200 });
  }),
});

// Handle Interactive Button Clicks and Replies from Stakeholders
http.route({
  path: "/api/whatsapp-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const bodyText = await request.text();
      let payload: any = {};
      try {
        payload = JSON.parse(bodyText);
      } catch {
        // Fallback for form-encoded payloads (e.g. Twilio)
        const params = new URLSearchParams(bodyText);
        payload = Object.fromEntries(params.entries());
      }

      // Extract verification token and decision
      // Supports both interactive button IDs e.g. "approve_token123" and text replies "1" or "APPROVE"
      let token = payload.verification_token || payload.token || "";
      let decision: "approved" | "rejected" | undefined;
      let rejectionReason = "";
      let senderPhone = payload.From || payload.from || "";
      let textBody = String(payload.Body || payload.body || "").trim().toLowerCase();

      // Meta Cloud API button payload extraction
      if (payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
        const msg = payload.entry[0].changes[0].value.messages[0];
        senderPhone = msg.from || senderPhone;
        const buttonPayload = msg.interactive?.button_reply?.id || msg.button?.payload || "";
        textBody = (msg.text?.body || textBody).trim().toLowerCase();

        if (buttonPayload.startsWith("approve_")) {
          token = buttonPayload.replace("approve_", "");
          decision = "approved";
        } else if (buttonPayload.startsWith("reject_")) {
          token = buttonPayload.replace("reject_", "");
          decision = "rejected";
        }
      }
      const tokenMatch = textBody.match(/verification\s*token\s*:\s*([a-z0-9_-]+)/i);
      if (!token && tokenMatch) token = tokenMatch[1];
      const replyMatch = textBody.match(/^(?:reply:\s*)?(approve|approved|1|reject|rejected|2|نعم|موافق|لا|رفض)(?:\s|$)/i);
      const reply = replyMatch?.[1].toLowerCase();
      if (!decision && (reply === "reject" || reply === "rejected" || reply === "2" || reply === "لا" || reply === "رفض")) {
        decision = "rejected";
      } else if (!decision && (reply === "approve" || reply === "approved" || reply === "1" || reply === "نعم" || reply === "موافق")) {
        decision = "approved";
      }

      // If token is found, execute decision in Convex mutation
      if (token) {
        if (!decision) {
          return new Response(JSON.stringify({ error: "Reply with Approve/1 or Reject/2 and include the verification token." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        const normalizedSenderPhone = String(senderPhone).replace(/^whatsapp:/i, "");
        await ctx.runMutation(api.whatsappApprovals.processApprovalDecision, {
          verification_token: token,
          decision,
          rejection_reason: rejectionReason || undefined,
          raw_payload: bodyText,
          sender_phone: normalizedSenderPhone || undefined,
        });

        return new Response(
          JSON.stringify({
            success: true,
            status: decision,
            message: `Decision '${decision}' recorded successfully`,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      console.error("Error processing WhatsApp webhook:", err);
      return new Response(
        JSON.stringify({ error: err.message || "Internal server error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

export default http;
