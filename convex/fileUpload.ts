import { action } from "./_generated/server";
import { v } from "convex/values";

// Upload file to Convex storage
export const uploadFile = action({
  args: {
    file: v.bytes(),
    fileName: v.string(),
    contentType: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    // Upload the file to Convex storage
    const fileId = await ctx.storage.store(new Blob([args.file]));
    
    return fileId;
  },
});

// Get file URL from storage
export const getFileUrl = action({
  args: {
    fileId: v.string(),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    // Get the signed URL for the file
    const url = await ctx.storage.getUrl(args.fileId);
    return url;
  },
});

// Generate upload URL for direct file upload
export const generateUploadUrl = action({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    // Generate a signed URL for file upload
    return await ctx.storage.generateUploadUrl();
  },
});
