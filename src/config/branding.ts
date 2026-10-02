/**
 * Creator & Application Branding Configuration
 * 
 * To connect your LinkedIn profile, simply update `linkedInUrl` below
 * or set NEXT_PUBLIC_LINKEDIN_URL in your environment.
 */

export const BRANDING_CONFIG = {
  creator: {
    name: "Subhan Javed",
    role: "Lead Creator & Engineer",
    avatar: "/subhan-javed.png",
    /**
     * Backend placeholder ready for your LinkedIn URL.
     * When you share your LinkedIn URL, update it here.
     */
    linkedInUrl: process.env.NEXT_PUBLIC_LINKEDIN_URL || "https://www.linkedin.com/in/subhan-javed-2180a9440?utm_source=share_via&utm_content=profile&utm_medium=member_android",
  },
  app: {
    name: "VeltisPDF",
    altName: "AetherPDF",
    tagline: "Precision Client-First PDF Editor",
  }
};
