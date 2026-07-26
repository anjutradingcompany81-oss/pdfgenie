export type RGB = { r: number; g: number; b: number };

export type SignaturePlacement = {
  /** Ratio (0-1) of page width/height, top-left origin. */
  xRatio: number;
  yRatio: number;
  wRatio: number;
  hRatio: number;
};

export type SignatureAppearance = {
  visible: boolean;
  borderEnabled: boolean;
  borderColor: RGB;
  borderWidth: number;
  borderRadius: number;
  backgroundEnabled: boolean;
  backgroundColor: RGB;
  opacity: number;
  textColor: RGB;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  showName: boolean;
  showOrganization: boolean;
  showDate: boolean;
  showTime: boolean;
  showReason: boolean;
  showLocation: boolean;
  showContactInfo: boolean;
  showCertInfo: boolean;
  logoDataUrl: string | null;
  logoMime: "image/png" | "image/jpeg" | null;
};

export const DEFAULT_APPEARANCE: SignatureAppearance = {
  visible: true,
  borderEnabled: true,
  borderColor: { r: 0.145, g: 0.388, b: 0.922 },
  borderWidth: 1.5,
  borderRadius: 6,
  backgroundEnabled: true,
  backgroundColor: { r: 0.973, g: 0.98, b: 0.988 },
  opacity: 1,
  textColor: { r: 0.118, g: 0.161, b: 0.231 },
  fontSize: 8,
  bold: false,
  italic: false,
  showName: true,
  showOrganization: true,
  showDate: true,
  showTime: true,
  showReason: true,
  showLocation: false,
  showContactInfo: false,
  showCertInfo: true,
  logoDataUrl: null,
  logoMime: null,
};

export const SIGNING_REASONS = ["Approved", "Verified", "Authorized", "Reviewed", "Digitally Signed", "Custom"] as const;

export type SigningDetails = {
  reason: string;
  location: string;
  department: string;
  contactInfo: string;
  signingTime: Date;
  timezone: string;
};

// The underlying @pdfsmaller/pdf-encrypt library only supports AES-256 (or
// legacy RC4, deliberately not offered here) — no AES-128 mode exists to
// wire up, so encryption strength isn't a user-facing choice.
export type SecurityOptions = {
  passwordProtect: boolean;
  password: string;
  preventEditing: boolean;
  preventPrinting: boolean;
  preventCopying: boolean;
  preventAnnotation: boolean;
};

export const DEFAULT_SECURITY: SecurityOptions = {
  passwordProtect: false,
  password: "",
  preventEditing: false,
  preventPrinting: false,
  preventCopying: false,
  preventAnnotation: false,
};
