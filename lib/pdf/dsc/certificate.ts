import forge from "node-forge";

export type CertificateInfo = {
  ownerName: string;
  organization: string;
  issuer: string;
  serialNumber: string;
  notBefore: Date;
  notAfter: Date;
  isValid: boolean;
  hasPrivateKey: boolean;
};

export class CertificateError extends Error {}

function fieldValue(entity: forge.pki.Certificate["subject"], shortName: string): string {
  const field = entity.getField(shortName);
  return field && typeof field.value === "string" ? field.value : "";
}

/**
 * Parses a .pfx/.p12 file entirely in the browser (node-forge is pure JS) —
 * the certificate bytes and password never leave the device. Throws
 * CertificateError with a user-facing message on a wrong password or a
 * malformed file, which is the only way forge reports either case.
 */
export function parseCertificate(p12Bytes: ArrayBuffer, password: string): CertificateInfo {
  let p12: forge.pkcs12.Pkcs12Pfx;
  try {
    const der = forge.util.createBuffer(new Uint8Array(p12Bytes));
    const asn1 = forge.asn1.fromDer(der);
    p12 = forge.pkcs12.pkcs12FromAsn1(asn1, password);
  } catch {
    throw new CertificateError("Couldn't open that certificate — check the password, or the file may not be a valid .pfx/.p12.");
  }

  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag] ?? [];
  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag] ?? [];
  const cert = certBags[0]?.cert;
  if (!cert) {
    throw new CertificateError("That file doesn't contain a certificate.");
  }

  const now = new Date();
  const isValid = now >= cert.validity.notBefore && now <= cert.validity.notAfter;

  return {
    ownerName: fieldValue(cert.subject, "CN") || "Unknown",
    organization: fieldValue(cert.subject, "O"),
    issuer: fieldValue(cert.issuer, "CN") || fieldValue(cert.issuer, "O") || "Unknown issuer",
    serialNumber: cert.serialNumber,
    notBefore: cert.validity.notBefore,
    notAfter: cert.validity.notAfter,
    isValid,
    hasPrivateKey: keyBags.length > 0,
  };
}
