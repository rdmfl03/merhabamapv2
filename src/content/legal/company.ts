import type { AppLocale } from "@/i18n/routing";

export type LegalCompanyProfile = {
  entityName: string;
  legalRepresentative: string;
  addressLines: string[];
  contactEmail: string;
  contactPhone?: string;
  registerEntry?: string;
  vatId?: string;
  contentResponsiblePerson: string;
  privacyContactEmail: string;
};

export function getLegalCompanyProfile(locale: AppLocale): LegalCompanyProfile {
  void locale;

  return {
    entityName: "Oflu & Akyazi GbR",
    legalRepresentative: "Erdem Oflu",
    addressLines: ["Straußstr. 7", "33129 Delbrück", "Deutschland"],
    contactEmail: "erdem.oflu@merhabamap.com",
    contactPhone: "+49 1556 0858164",
    contentResponsiblePerson: "Erdem Oflu, Straußstr. 7, 33129 Delbrück",
    privacyContactEmail: "erdem.oflu@merhabamap.com",
  };
}
