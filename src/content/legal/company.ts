import type { AppLocale } from "@/i18n/routing";

export type LegalCompanyProfile = {
  entityName: string;
  legalRepresentative: string;
  addressLines: string[];
  contactEmail: string;
  registerEntry: string;
  vatId: string;
  contentResponsiblePerson: string;
  privacyContactEmail: string;
};

export function getLegalCompanyProfile(locale: AppLocale): LegalCompanyProfile {
  void locale;

  return {
    entityName: "MerhabaMap Betreiberin / Betreiber [bitte vor Launch ergänzen]",
    legalRepresentative: "[gesetzliche Vertretung bitte ergänzen]",
    addressLines: [
      "[Straße und Hausnummer bitte ergänzen]",
      "[PLZ Ort, Deutschland bitte ergänzen]",
    ],
    contactEmail: "info@merhabamap.com",
    registerEntry: "[Registergericht und Registernummer, falls vorhanden, bitte ergänzen]",
    vatId: "[USt-IdNr. / Steuerangabe falls vorhanden bitte ergänzen]",
    contentResponsiblePerson: "[verantwortliche Person nach § 18 Abs. 2 MStV bitte ergänzen]",
    privacyContactEmail: "info@merhabamap.com",
  };
}
