import type { AppLocale } from "@/i18n/routing";

export type LegalCompanyProfile = {
  entityName: string;
  /** Gesellschafterlich vertretungsberechtigt (GbR); Reihenfolge nur zur Darstellung. */
  legalRepresentatives: string[];
  addressLines: string[];
  infoEmail: string;
  contactEmail: string;
  adminEmail: string;
  contactPhone?: string;
  registerEntry?: string;
  vatId?: string;
  contentResponsiblePerson: string;
  privacyContactEmail: string;
  supportEmail: string;
};

export function getLegalCompanyProfile(locale: AppLocale): LegalCompanyProfile {
  void locale;

  return {
    entityName: "Oflu & Akyazi GbR",
    legalRepresentatives: ["Erdem Oflu", "Samet Akyazi"],
    addressLines: ["Straußstr. 7", "33129 Delbrück", "Deutschland"],
    infoEmail: "info@merhabamap.com",
    contactEmail: "kontakt@merhabamap.com",
    adminEmail: "admin@merhabamap.com",
    contactPhone: "+49 1556 0858164",
    contentResponsiblePerson: "Erdem Oflu, Straußstr. 7, 33129 Delbrück",
    privacyContactEmail: "privacy@merhabamap.com",
    supportEmail: "support@merhabamap.com",
  };
}
