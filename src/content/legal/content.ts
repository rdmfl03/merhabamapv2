import type { AppLocale } from "@/i18n/routing";

import { getLegalCompanyProfile } from "./company";

export type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type LegalPageContent = {
  title: string;
  intro: string;
  sections: LegalSection[];
};

export function getImpressumContent(locale: AppLocale): LegalPageContent {
  const company = getLegalCompanyProfile(locale);

  if (locale === "tr") {
    return {
      title: "Impressum",
      intro:
        "Bu sayfa Almanya odakli yayin icin gerekli temel saglayici bilgilerini yapilandirir. Koseli parantezli alanlar henuz tamamlanmamis bilgileri gosterir ve canliya cikmadan once gercek verilerle degistirilmelidir.",
      sections: [
        {
          title: "Saglayici bilgileri",
          paragraphs: [
            `Ad / sirket: ${company.entityName}`,
            ...company.addressLines,
          ],
        },
        {
          title: "Temsil yetkisi",
          paragraphs: [`Temsil yetkili kisi: ${company.legalRepresentative}`],
        },
        {
          title: "Iletisim",
          paragraphs: [`E-posta: ${company.contactEmail}`],
        },
        {
          title: "Ticaret sicili bilgisi",
          paragraphs: [`Istege bagli kayit bilgisi: ${company.registerEntry}`],
        },
        {
          title: "Vergi bilgisi",
          paragraphs: [`USt-IdNr. / vergi bilgisi: ${company.vatId}`],
        },
        {
          title: "Icerikten sorumlu kisi",
          paragraphs: [
            `Gazetecilik ve editorluk icerikleri icin sorumlu kisi: ${company.contentResponsiblePerson}`,
          ],
        },
        {
          title: "Eksik bilgiler notu",
          paragraphs: [
            "Koseli parantezli tum alanlar bilerek yer tutucu olarak birakilmistir. Bu sayfa, eksik bilgileri gizlemek yerine hangi kurumsal verilerin henuz tamamlanmasi gerektigini acikca gosterir.",
          ],
        },
      ],
    };
  }

  return {
    title: "Impressum",
    intro:
      "Diese Seite bildet die grundlegenden Anbieterangaben fuer einen Deutschland-Launch strukturiert ab. Angaben in eckigen Klammern sind bewusst als Platzhalter markiert und muessen vor dem finalen Launch mit echten Daten ersetzt werden.",
    sections: [
      {
        title: "Angaben gemaess § 5 DDG",
        paragraphs: [
          `Name / Firma: ${company.entityName}`,
          ...company.addressLines,
        ],
      },
      {
        title: "Vertretungsberechtigte Person",
        paragraphs: [`${company.legalRepresentative}`],
      },
      {
        title: "Kontakt",
        paragraphs: [`E-Mail: ${company.contactEmail}`],
      },
      {
        title: "Registereintrag",
        paragraphs: [`Optionaler Registerhinweis: ${company.registerEntry}`],
      },
      {
        title: "Umsatzsteuer",
        paragraphs: [`USt-IdNr. / Steuerangabe: ${company.vatId}`],
      },
      {
        title: "Verantwortlich fuer journalistisch-redaktionelle Inhalte",
        paragraphs: [`${company.contentResponsiblePerson}`],
      },
      {
        title: "Hinweis zu Platzhaltern",
        paragraphs: [
          "MerhabaMap zeigt an dieser Stelle keine erfundenen Unternehmensdaten an. Platzhalter bleiben sichtbar, bis die echten Pflichtangaben vorliegen.",
        ],
      },
    ],
  };
}

export function getPrivacyContent(locale: AppLocale): LegalPageContent {
  const company = getLegalCompanyProfile(locale);

  if (locale === "tr") {
    return {
      title: "Gizlilik Politikasi",
      intro:
        "Bu metin, MerhabaMap'in su anki urun ve isletim yapisina gore hazirlanmis ihtiyatli bir taslaktir. Nihai hukuk incelemesinin yerini tutmaz; amaci hangi veri akislari ve hizmetlerin dikkate alinmasi gerektigini acik gostermektir.",
      sections: [
        {
          title: "Veri sorumlusu",
          paragraphs: [
            `${company.entityName}`,
            ...company.addressLines,
          ],
        },
        {
          title: "Iletisim",
          paragraphs: [
            `Genel iletisim: ${company.contactEmail}`,
            `Gizlilik konulari icin iletisim: ${company.privacyContactEmail}`,
          ],
        },
        {
          title: "Islenen veriler",
          bullets: [
            "kayit ve hesap yonetimi icin e-posta adresi, kullanici adi ve parola hash'i",
            "giris ve oturum yonetimi bilgileri",
            "kaydedilen yerler ve etkinlikler",
            "raporlar, bildirimler ve business claim basvurularinda girilen veriler",
          ],
        },
        {
          title: "Isleme amaclari",
          bullets: [
            "platformu calistirmak ve hesaplari yonetmek",
            "topluluk odakli islevleri sunmak",
            "kaydetme, raporlama ve business claim akislarini isletmek",
          ],
        },
        {
          title: "Hukuki dayanaklar",
          bullets: [
            "sozlesmenin kurulmasi ve ifasi",
            "mesru menfaatler, ozellikle guvenlik, hata analizi ve platformun istikrari",
          ],
        },
        {
          title: "Hosting ve teknik hizmetler",
          bullets: [
            "Netlify (uygulama yayinlama ve runtime)",
            "DigitalOcean (veritabani barindirma)",
            "Cloudflare (CDN ve istek yonlendirme katmani)",
          ],
        },
        {
          title: "E-posta gonderimi",
          paragraphs: [
            "Islemsel e-postalar icin Resend kullanilir. Bu iletiler hesapla ilgili zorunlu surecler icindir; reklam veya analiz araci olarak kullanilmaz.",
          ],
        },
        {
          title: "Cookie ve oturum mekanizmalari",
          paragraphs: [
            "MerhabaMap su anda istege bagli analiz veya pazarlama takibi kullanmaz. Giris ve oturumun surmesi icin gerekli teknik cookie ve benzeri mekanizmalar kullanilabilir.",
          ],
        },
        {
          title: "Saklama suresi",
          paragraphs: [
            "Veriler, ilgili amac devam ettigi surece ve yasal saklama yukumlulukleri gerektirdigi olcude tutulur. Ayrintili silme ve saklama politikalari canliya cikmadan once son kez gozden gecirilmelidir.",
          ],
        },
        {
          title: "Haklariniz",
          bullets: [
            "bilgi talep etme",
            "duzeltme isteme",
            "silme veya kisitlama talep etme",
            "itiraz etme",
            "veri tasinabilirligi",
          ],
        },
        {
          title: "Sikayet hakki",
          paragraphs: [
            "Kullanicilar, veri isleme ile ilgili olarak yetkili bir denetim makamuna sikayette bulunma hakkina sahiptir.",
          ],
        },
      ],
    };
  }

  return {
    title: "Datenschutzerklaerung",
    intro:
      "Diese Datenschutzerklaerung ist als ehrliche Basis fuer den aktuellen Produktstand formuliert. Sie soll die tatsaechlich erkennbaren Datenfluesse und Dienstleister transparent machen und spaeter juristisch verfeinert werden.",
    sections: [
      {
        title: "Verantwortlicher",
        paragraphs: [
          `${company.entityName}`,
          ...company.addressLines,
        ],
      },
      {
        title: "Kontakt",
        paragraphs: [
          `Allgemeine Kontaktadresse: ${company.contactEmail}`,
          `Kontakt fuer Datenschutzanliegen: ${company.privacyContactEmail}`,
        ],
      },
      {
        title: "Welche Daten verarbeitet werden",
        bullets: [
          "Registrierungsdaten wie E-Mail-Adresse, Nutzername und Passwort-Hash",
          "Login- und Sitzungsdaten",
          "gespeicherte Orte und Events",
          "Angaben aus Reports und Meldungen",
          "Angaben aus Business-Claims",
        ],
      },
      {
        title: "Zwecke der Verarbeitung",
        bullets: [
          "Betrieb und Absicherung der Plattform",
          "Bereitstellung von Community-Funktionen wie Speichern, Melden und Claims",
          "Kommunikation zu konto- und plattformbezogenen Vorgaengen",
        ],
      },
      {
        title: "Rechtsgrundlagen",
        bullets: [
          "Vertragserfuellung und vorvertragliche Kommunikation",
          "berechtigte Interessen, insbesondere fuer Sicherheit, Stabilitaet, Missbrauchsvermeidung und Weiterentwicklung des Plattformbetriebs",
        ],
      },
      {
        title: "Hosting und technische Dienstleister",
        bullets: [
          "Netlify fuer Deployment und Auslieferung der Anwendung",
          "DigitalOcean fuer die Datenbank",
          "Cloudflare fuer CDN- und Edge-Auslieferung",
        ],
      },
      {
        title: "E-Mail-Versand",
        paragraphs: [
          "Fuer transaktionale E-Mails wie Verifizierung oder Passwort-Reset wird Resend eingesetzt.",
        ],
      },
      {
        title: "Cookies und Sessions",
        paragraphs: [
          "Nach heutigem Stand verwendet MerhabaMap nur technisch notwendige Session- und Auth-Cookies. Optionale Analytics- oder Marketing-Tracker sind derzeit nicht Teil des Produkts.",
        ],
      },
      {
        title: "Speicherdauer",
        paragraphs: [
          "Personenbezogene Daten werden nur so lange gespeichert, wie es fuer den jeweiligen Zweck, den Plattformbetrieb oder gesetzliche Aufbewahrungspflichten erforderlich ist.",
        ],
      },
      {
        title: "Betroffenenrechte",
        bullets: [
          "Auskunft",
          "Berichtigung",
          "Loeschung",
          "Einschraenkung der Verarbeitung",
          "Widerspruch",
          "Datenuebertragbarkeit",
        ],
      },
      {
        title: "Beschwerderecht",
        paragraphs: [
          "Betroffene koennen sich bei einer zustaendigen Datenschutzaufsichtsbehoerde beschweren.",
        ],
      },
    ],
  };
}

export function getContactContent(locale: AppLocale): LegalPageContent {
  const company = getLegalCompanyProfile(locale);

  if (locale === "tr") {
    return {
      title: "Iletisim",
      intro:
        "MerhabaMap ile iletisime gecmek icin su anda en verlaessliche yol e-postadir. Yanit sureleri yogunluga gore degisebilir.",
      sections: [
        {
          title: "Genel iletisim",
          paragraphs: [
            `E-posta: ${company.contactEmail}`,
            "MerhabaMap, topluluk odakli bir platform olarak mesajlari siraya gore yanitlar.",
          ],
        },
        {
          title: "Yanit beklentisi",
          paragraphs: [
            "Taleplerin niteligine ve yogunluga bagli olarak geri donus suresi degisebilir.",
          ],
        },
      ],
    };
  }

  return {
    title: "Kontakt",
    intro:
      "Fuer Kontaktanfragen ist derzeit die E-Mail der verlaesslichste Weg. Antwortzeiten koennen je nach Auslastung und Thema variieren.",
    sections: [
      {
        title: "Kontaktmoeglichkeit",
        paragraphs: [
          `E-Mail: ${company.contactEmail}`,
          "MerhabaMap ist eine community-orientierte Plattform und beantwortet Anfragen nach Verfuegbarkeit.",
        ],
      },
      {
        title: "Hinweis zu Antwortzeiten",
        paragraphs: [
          "Rueckmeldungen koennen je nach Umfang und Dringlichkeit einer Anfrage unterschiedlich schnell erfolgen.",
        ],
      },
    ],
  };
}

export function getCookiesContent(locale: AppLocale): LegalPageContent {
  if (locale === "tr") {
    return {
      title: "Cookies ve Gizlilik",
      intro:
        "Bu sayfa su anki teknik durumu aciklar. MerhabaMap'te bugun itibariyla pazarlama veya analiz takibi yerine yalnizca isletim icin gerekli mekanizmalar dikkate alinmistir.",
      sections: [
        {
          title: "Teknik olarak gerekli cookies",
          paragraphs: [
            "MerhabaMap, oturumun surmesi ve giris islemlerinin calismasi icin gerekli cookie veya benzeri depolama mekanizmalari kullanabilir.",
          ],
        },
        {
          title: "Takip ve analiz durumu",
          paragraphs: [
            "Mevcut urun durumunda istege bagli tracking, analytics veya pazarlama cookies'i bu sayfada beyan edilmemektedir.",
          ],
        },
        {
          title: "Gelecekte degisirse",
          paragraphs: [
            "Teknik kapsam degisirse bu sayfa ve gerekirse ilgili tercih/cozumlendirme akislari ayrica guncellenmelidir.",
          ],
        },
      ],
    };
  }

  return {
    title: "Cookies & Privatsphaere",
    intro:
      "Diese Seite beschreibt den aktuellen technischen Stand. MerhabaMap setzt derzeit keine optionalen Tracking- oder Analytics-Mechanismen voraus, sondern nur das, was fuer Betrieb und Anmeldung notwendig ist.",
    sections: [
      {
        title: "Technisch notwendige Cookies",
        paragraphs: [
          "MerhabaMap kann Session- und Auth-Cookies verwenden, damit Anmeldung, Sitzung und sicherheitsrelevante Funktionen funktionieren.",
        ],
      },
      {
        title: "Kein optionales Tracking nach aktuellem Stand",
        paragraphs: [
          "Fuer den derzeitigen Produktstand werden keine separaten Analytics-, Marketing- oder Werbe-Cookies als Bestandteil dieser Seite beschrieben.",
        ],
      },
      {
        title: "Spaetere Erweiterungen",
        paragraphs: [
          "Wenn kuenftig Tracking oder weitere Dritttools hinzukommen, muessen diese Seite und gegebenenfalls zusaetzliche Einwilligungs- oder Einstellungsmechanismen angepasst werden.",
        ],
      },
    ],
  };
}

export function getTermsContent(locale: AppLocale): LegalPageContent {
  const company = getLegalCompanyProfile(locale);

  if (locale === "tr") {
    return {
      title: "Kullanim Kosullari",
      intro:
        "Bu metin, MerhabaMap'in mevcut urun mantigi icin ihtiyatli bir temel saglar. Amaci kullanicilarin sorumluluklarini ve platformun mudahale imkanlarini acik ve olculu bicimde gostermektir.",
      sections: [
        {
          title: "Platformun konusu",
          paragraphs: [
            "MerhabaMap, topluluk baglaminda mekanlar, etkinlikler ve ilgili giris noktalarini gosteren bir platformdur.",
          ],
        },
        {
          title: "Kullanici sorumlulugu",
          paragraphs: [
            "Kullanicilar, gonderdikleri veya bildirdikleri iceriklerden ve hesap bilgilerinin guvenliginden kendileri sorumludur.",
          ],
        },
        {
          title: "Yasak icerikler ve davranislar",
          bullets: [
            "nefret soylemi veya ayrimci icerikler",
            "hukuka aykiri icerikler",
            "spam veya sistemin kotuye kullanimi",
          ],
        },
        {
          title: "Moderasyon",
          paragraphs: [
            "MerhabaMap, icerikleri inceleyebilir, sinirlayabilir veya kaldirabilir. Gerekirse hesaplara gecici ya da kalici kisitlamalar uygulanabilir.",
          ],
        },
        {
          title: "Harici icerikler",
          paragraphs: [
            "Harici baglantilar veya ucuncu taraf etkinlik sayfalari ilgili saglayicilarin sorumlulugundadir.",
          ],
        },
        {
          title: "Iletisim",
          paragraphs: [`Genel iletisim: ${company.contactEmail}`],
        },
      ],
    };
  }

  return {
    title: "Nutzungsbedingungen",
    intro:
      "Diese Nutzungsbedingungen schaffen eine vorsichtige Basis fuer den derzeitigen Produktstand von MerhabaMap. Sie sollen Verantwortung, Grenzen und Moderationsmoeglichkeiten klar benennen, ohne unzutreffende Versprechen zu machen.",
    sections: [
      {
        title: "Gegenstand der Plattform",
        paragraphs: [
          "MerhabaMap ist eine Plattform fuer Community-bezogene Orte, Events und lokale Orientierung.",
        ],
      },
      {
        title: "Verantwortung der Nutzer",
        paragraphs: [
          "Nutzer sind fuer Inhalte, Meldungen und Angaben verantwortlich, die sie ueber die Plattform uebermitteln.",
        ],
      },
      {
        title: "Unzulaessige Inhalte",
        bullets: [
          "Hassrede oder diskriminierende Inhalte",
          "rechtswidrige Inhalte",
          "Spam oder missbraeuchliche Nutzung der Plattform",
        ],
      },
      {
        title: "Moderation und Konten",
        paragraphs: [
          "MerhabaMap kann Inhalte pruefen, einschränken oder entfernen. Bei erheblichen oder wiederholten Verstoessen koennen Konten voruebergehend oder dauerhaft gesperrt werden.",
        ],
      },
      {
        title: "Externe Inhalte",
        paragraphs: [
          "Verlinkte externe Seiten oder Veranstaltungsangebote liegen in der Verantwortung der jeweiligen Drittanbieter.",
        ],
      },
      {
        title: "Kontakt",
        paragraphs: [`Allgemeine Kontaktadresse: ${company.contactEmail}`],
      },
    ],
  };
}

export function getCommunityRulesContent(locale: AppLocale): LegalPageContent {
  if (locale === "tr") {
    return {
      title: "Topluluk Kurallari",
      intro:
        "Bu kurallar, MerhabaMap'te topluluk odakli ve saygili bir ortami korumak icin sade bicimde formulize edilmistir.",
      sections: [
        {
          title: "Saygili davranis",
          bullets: [
            "saygili ve topluluk duyarliligina uygun iletisim kur",
            "ayrimci veya asagilayici dil kullanma",
          ],
        },
        {
          title: "Dogru bilgi",
          bullets: [
            "sahte mekan veya sahte etkinlik girmeyin",
            "yaniltici claim veya rapor gondermeyin",
          ],
        },
        {
          title: "Reklam ve tanitim",
          bullets: [
            "baglamsiz reklam veya spam paylasmayin",
            "topluluga fayda saglamayan tanitimlari zorlamayin",
          ],
        },
      ],
    };
  }

  return {
    title: "Community-Regeln",
    intro:
      "Diese Regeln sollen einen respektvollen, glaubwuerdigen und community-orientierten Umgang auf MerhabaMap foerdern.",
    sections: [
      {
        title: "Respektvoller Umgang",
        bullets: [
          "begegne anderen Nutzern und Communities respektvoll",
          "keine Diskriminierung oder abwertende Sprache",
        ],
      },
      {
        title: "Keine Fake-Inhalte",
        bullets: [
          "keine Fake-Events oder Fake-Orte einreichen",
          "keine bewusst irrefuehrenden Claims oder Meldungen absenden",
        ],
      },
      {
        title: "Keine Werbung ohne Kontext",
        bullets: [
          "keine aufdringliche oder kontextlose Werbung",
          "keine Spam- oder Massenbeiträge ohne erkennbaren Community-Bezug",
        ],
      },
    ],
  };
}
