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
        "Bu sayfa Almanya odakli bir urun yuzeyi icin gerekli yasal iletisim bilgilerinin taslak yapisini sunar. Kose parantezli alanlar lansman oncesi gercek bilgilerle guncellenmelidir.",
      sections: [
        {
          title: "Saglayici bilgileri",
          paragraphs: [
            `Hizmet saglayici: ${company.entityName}`,
            `Yasal temsil: ${company.legalRepresentative}`,
            ...company.addressLines,
          ],
        },
        {
          title: "Iletisim",
          paragraphs: [
            `E-posta: ${company.contactEmail}`,
            `Telefon: ${company.contactPhone}`,
          ],
        },
        {
          title: "Vergi bilgileri",
          paragraphs: [
            `KDV / vergi bilgisi: ${company.vatId}`,
          ],
        },
        {
          title: "Icerikten sorumlu kisi",
          paragraphs: [
            `${company.contentResponsiblePerson}`,
          ],
        },
        {
          title: "Onemli not",
          paragraphs: [
            "MerhabaMap'te yer alan isletme, etkinlik ve topluluk bilgileri duruma gore kullanici, isletme sahibi veya editor incelemesiyle guncellenebilir. Bu sayfadaki yasal bilgiler ürün lansmani oncesi son kez kontrol edilmelidir.",
          ],
        },
      ],
    };
  }

  return {
    title: "Impressum",
    intro:
      "Diese Seite bildet die rechtlich notwendigen Anbieterangaben für einen Deutschland-Launch strukturiert ab. Platzhalter in eckigen Klammern müssen vor dem Produktivstart durch die tatsächlichen Angaben ersetzt werden.",
    sections: [
      {
        title: "Angaben gemäß § 5 TMG",
        paragraphs: [
          `${company.entityName}`,
          `Vertreten durch: ${company.legalRepresentative}`,
          ...company.addressLines,
        ],
      },
      {
        title: "Kontakt",
        paragraphs: [
          `E-Mail: ${company.contactEmail}`,
          `Telefon: ${company.contactPhone}`,
        ],
      },
      {
        title: "Umsatzsteuer / steuerliche Angaben",
        paragraphs: [
          `${company.vatId}`,
        ],
      },
      {
        title: "Verantwortlich für journalistisch-redaktionelle Inhalte",
        paragraphs: [
          `${company.contentResponsiblePerson}`,
        ],
      },
      {
        title: "Hinweis zum Launch-Status",
        paragraphs: [
          "MerhabaMap ist als moderierte Discovery-Plattform für Orte, Events und Business-Claims konzipiert. Vor dem Livegang sollten alle Angaben auf dieser Seite sowie die verlinkten Rechtstexte fachlich und rechtlich überprüft werden.",
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
        "Bu metin MerhabaMap'in mevcut teknik ve urunsel davranisina dayanan dikkatli bir taslak gizlilik yapisidir. Nihai hukuki degerlendirme yerine gecmez; lansman oncesi ayrica kontrol edilmelidir.",
      sections: [
        {
          title: "Genel bakis",
          paragraphs: [
            "MerhabaMap, Almanya'daki Turk toplulugu icin iki dilli bir kesif urunudur. Veri minimizasyonu ve seffaflik temel ilkelerdir.",
          ],
        },
        {
          title: "Veri sorumlusu",
          paragraphs: [
            `${company.entityName}`,
            ...company.addressLines,
            `Genel iletisim: ${company.contactEmail}`,
            `Gizlilik iletisimi: ${company.privacyContactEmail}`,
          ],
        },
        {
          title: "Islenen veri kategorileri",
          bullets: [
            "hesap olusturma sirasinda e-posta adresi, sifre hash'i ve istege bagli isim",
            "profil/onboarding tercihlerinde dil, sehir ve ilgi alanlari",
            "kaydedilen mekan ve etkinlikler",
            "business claim ve rapor akislari icin saglanan iletisim ve aciklama bilgileri",
            "guvenlik ve isletim amacli teknik sunucu loglari",
          ],
        },
        {
          title: "Isleme amaclari",
          bullets: [
            "hesap olusturma, oturum yonetimi ve kimlik dogrulama",
            "kaydedilen icerikler ve kullanici tercihlerini gosterebilme",
            "claim, rapor ve moderasyon sureclerini yurutebilme",
            "sifre sifirlama, e-posta dogrulama ve diger zorunlu iletisimleri gonderebilme",
            "platform guvenligi ve teknik hata takibi",
          ],
        },
        {
          title: "Hesap, profil ve favoriler",
          paragraphs: [
            "MerhabaMap su anda zorunlu olmayan kapsamli profil verileri toplamaz. Dil, sehir ve ilgi alanlari yalnizca deneyimi daha ilgili hale getirmek icin kullanilir.",
          ],
        },
        {
          title: "Claim, rapor ve moderasyon verileri",
          paragraphs: [
            "Business claim ve rapor icerikleri, guven ve platform guvenligi sureclerinin bir parcasi olarak islenir. Bu veriler herkese acik gosterilmez ve yalnizca ilgili dahili inceleme akislarinda kullanilir.",
          ],
        },
        {
          title: "Teknik loglar",
          paragraphs: [
            "Uygulama, calisma guvenligi icin sinirli teknik loglar tutabilir. Amaç hata tespiti, guvenlik ve operasyonel izlenebilirliktir. Loglarda gereksiz kisisel veri tutulmamasi hedeflenir.",
          ],
        },
        {
          title: "Cookies ve benzeri mekanizmalar",
          paragraphs: [
            "Mevcut MVP yapisinda istege bagli reklam veya pazarlama takibi bulunmamaktadir. Hesap girisi ve oturum devamlılığı icin gerekli oturum mekanizmalari kullanilir.",
          ],
        },
        {
          title: "E-posta iletisimleri",
          paragraphs: [
            "Hesap dogrulama, sifre sifirlama, claim durumu veya benzeri zorunlu islemsel iletiler e-posta ile gonderilebilir. Bu iletiler pazarlama amacli degildir.",
          ],
        },
        {
          title: "Haklariniz",
          bullets: [
            "bilgi talep etme",
            "duzeltme isteme",
            "silme veya kisitlama talep etme",
            "itiraz hakki",
            "veri tasinabilirligi hakki",
            "yetkili denetim makamına sikayette bulunma hakki",
          ],
        },
        {
          title: "Saklama ve silme",
          paragraphs: [
            "Veriler isleme amaci ve yasal saklama yukumlulukleri sona erdiginde silinmeli veya uygun sekilde sinirlandirilmalidir. Kesin saklama planlari lansman oncesi ayri olarak gozten gecirilmelidir.",
          ],
        },
      ],
    };
  }

  return {
    title: "Datenschutzerklärung",
    intro:
      "Diese Datenschutzerklärung ist als sorgfältiger Entwurf auf Basis des aktuellen Produktstands von MerhabaMap aufgebaut. Sie ersetzt keine individuelle Rechtsberatung und sollte vor dem Livegang rechtlich geprüft werden.",
    sections: [
      {
        title: "Überblick",
        paragraphs: [
          "MerhabaMap ist eine zweisprachige Discovery-Plattform für Orte, Events und community-relevante Informationen mit Deutschland-Fokus. Das Produkt ist auf Datenminimierung und transparente Verarbeitung ausgelegt.",
        ],
      },
      {
        title: "Verantwortliche Stelle",
        paragraphs: [
          `${company.entityName}`,
          ...company.addressLines,
          `Allgemeine Kontaktadresse: ${company.contactEmail}`,
          `Kontakt für Datenschutzanliegen: ${company.privacyContactEmail}`,
        ],
      },
      {
        title: "Welche Datenkategorien verarbeitet werden",
        bullets: [
          "Kontodaten wie E-Mail-Adresse, Passwort-Hash und optionaler Name",
          "Onboarding- und Profileinstellungen wie Sprache, Stadt und Interessen",
          "gespeicherte Orte und Events",
          "Angaben aus Business-Claims, Reports und Moderationsprozessen",
          "technische Server- und Sicherheitslogs in begrenztem Umfang",
        ],
      },
      {
        title: "Zu welchen Zwecken die Verarbeitung erfolgt",
        bullets: [
          "Bereitstellung von Accounts, Login, Sitzungen und Account-Wiederherstellung",
          "Personalisierung über Stadt-, Sprach- und Interessenspräferenzen",
          "Bereitstellung gespeicherter Inhalte und Profilfunktionen",
          "Bearbeitung von Claims, Reports und Moderationsentscheidungen",
          "Versand transaktionaler E-Mails wie Verifizierung oder Passwort-Reset",
          "Sicherheits-, Missbrauchs- und Betriebszwecke",
        ],
      },
      {
        title: "Accounts, Profile und gespeicherte Inhalte",
        paragraphs: [
          "MerhabaMap erhebt derzeit bewusst nur eine kleine Menge an Profildaten. Sprache, Stadt und Interessen dienen der relevanteren Darstellung von Orten und Events und sind nicht als öffentliches Social-Profil gedacht.",
        ],
      },
      {
        title: "Claims, Reports und Moderationsdaten",
        paragraphs: [
          "Wenn Nutzer Reports oder Business-Claims einreichen, verarbeitet MerhabaMap die übermittelten Daten zur Prüfung, Nachverfolgung und Missbrauchsvermeidung. Diese Inhalte werden nicht öffentlich angezeigt.",
        ],
      },
      {
        title: "Server-Logs und technische Protokolle",
        paragraphs: [
          "Zur Stabilität und Sicherheit des Betriebs können technische Logs anfallen. Diese sollen datensparsam geführt werden und keine unnötigen personenbezogenen Inhalte enthalten.",
        ],
      },
      {
        title: "Cookies und ähnliche Technologien",
        paragraphs: [
          "Im aktuellen MVP werden nach heutigem Stand keine optionalen Werbe- oder Marketing-Tracker eingesetzt. Soweit technisch erforderlich, werden notwendige Sitzungsmechanismen für Anmeldung und Kontonutzung verwendet.",
        ],
      },
      {
        title: "E-Mail-Kommunikation",
        paragraphs: [
          "MerhabaMap versendet transaktionale E-Mails für Kontoverifizierung, Passwort-Reset sowie ausgewählte Vorgangsbestätigungen. Diese Nachrichten dienen dem Betrieb und nicht dem Newsletter- oder Werbezweck.",
        ],
      },
      {
        title: "Betroffenenrechte",
        bullets: [
          "Auskunft",
          "Berichtigung",
          "Löschung",
          "Einschränkung der Verarbeitung",
          "Widerspruch",
          "Datenübertragbarkeit",
          "Beschwerde bei einer zuständigen Aufsichtsbehörde",
        ],
      },
      {
        title: "Speicherdauer und Löschung",
        paragraphs: [
          "Daten sollten gelöscht oder eingeschränkt werden, sobald der Zweck der Verarbeitung entfällt und keine gesetzlichen Aufbewahrungspflichten entgegenstehen. Detaillierte Löschkonzepte sollten vor dem Launch und im laufenden Betrieb überprüft werden.",
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
        "Bu metin MerhabaMap icin lansmana hazir, dikkatli bir kullanim kosullari taslagidir. Nihai hukuki degerlendirme yerine gecmez ve yayin oncesi ayrica kontrol edilmelidir.",
      sections: [
        {
          title: "Hizmet kapsami",
          paragraphs: [
            "MerhabaMap; mekanlar, etkinlikler ve ilgili topluluk bilgilerinin kesfi icin saglanan iki dilli bir platformdur. Tum bilgi ve icerikler her zaman tam, guncel veya eksiksiz olmayabilir.",
          ],
        },
        {
          title: "Kullanici hesaplari",
          paragraphs: [
            "Bazi ozellikler icin hesap gerekir. Kullanicilar erisim bilgilerini guvenli sekilde korumakla sorumludur.",
          ],
        },
        {
          title: "Kabul edilebilir kullanim",
          bullets: [
            "dogruya makul olcude uygun bilgi saglamak",
            "claim ve rapor akilarini kotuye kullanmamak",
            "diger kullanicilar, isletmeler ve topluluklar hakkinda yaniltici iddialar yaymamak",
          ],
        },
        {
          title: "Yasaklanan davranislar",
          bullets: [
            "spam, kotuye kullanim veya sistemin otomatik suistimali",
            "hukuka aykiri, nefreti tesvik eden veya zarar verici icerik",
            "yaniltici sahiplik beyanlari veya sahte business claim gonderimleri",
          ],
        },
        {
          title: "Moderasyon ve bildirimler",
          paragraphs: [
            "MerhabaMap, rapor, claim ve diger guven sinyallerini inceleyebilir; icerikleri yayindan kaldirabilir, duzeltme isteyebilir veya hesap erisimini sinirlayabilir.",
          ],
        },
        {
          title: "Business claim ve dogrulama mantigi",
          paragraphs: [
            "\"Claimed\" ve \"Verified\" ayni anlamda degildir. Claimed durumu, bir sahiplik talebinin onaylandigini; Verified durumu ise belirli bilgilerin MerhabaMap tarafindan ayrica incelendigini ifade eder.",
          ],
        },
        {
          title: "Ucuncu taraf baglantilar ve etkinlikler",
          paragraphs: [
            "MerhabaMap, ucuncu taraf sitelere veya organizator sayfalarina baglantilar gosterebilir. Harici icerik ve islemler ilgili ucuncu tarafin sorumlulugundadir.",
          ],
        },
        {
          title: "Erisilebilirlik ve garanti verilmemesi",
          paragraphs: [
            "Hizmetin kesintisiz veya hatasiz calisacagi garanti edilmez. Teknik bakim, moderasyon veya gelistirme nedenleriyle erisim sinirlanabilir.",
          ],
        },
        {
          title: "Sorumluluk notu",
          paragraphs: [
            "Zorunlu yasal sorumluluk halleri saklidir. Bunun disinda, MVP urun yapisi ve kullanici kaynakli icerikler nedeniyle hukuki metinler yayin oncesi ayri degerlendirilmelidir.",
          ],
        },
        {
          title: "Hesap veya icerik sinirlamalari",
          paragraphs: [
            "Kurallara aykiri kullanim, yaniltici claim veya ciddi guven ihlallerinde hesaplar veya icerikler gecici ya da kalici olarak sinirlanabilir.",
          ],
        },
        {
          title: "Iletisim",
          paragraphs: [
            `Genel iletisim: ${company.contactEmail}`,
          ],
        },
      ],
    };
  }

  return {
    title: "Nutzungsbedingungen",
    intro:
      "Diese Nutzungsbedingungen sind als vorsichtiger Entwurf für den aktuellen MerhabaMap-Produktstand formuliert. Sie sollten vor dem Launch fachlich und rechtlich überprüft werden.",
    sections: [
      {
        title: "Leistungsgegenstand",
        paragraphs: [
          "MerhabaMap stellt eine zweisprachige Discovery-Plattform für Orte, Events und community-relevante Informationen bereit. Die Plattform dient der Orientierung und kann Informationen Dritter enthalten.",
        ],
      },
      {
        title: "Nutzerkonten",
        paragraphs: [
          "Für bestimmte Funktionen wie Speichern, Claims oder Reports ist ein Nutzerkonto erforderlich. Nutzer sind dafür verantwortlich, ihre Zugangsdaten vertraulich zu behandeln.",
        ],
      },
      {
        title: "Zulässige Nutzung",
        bullets: [
          "angemessen wahrheitsgemäße Angaben in Claims und Reports",
          "respektvolle Nutzung der Plattform und ihrer Meldewege",
          "keine missbräuchliche Belastung der technischen Infrastruktur",
        ],
      },
      {
        title: "Unzulässige Inhalte und Verhaltensweisen",
        bullets: [
          "Spam, Missbrauch oder Umgehung von Schutzmechanismen",
          "rechtswidrige, hasserfüllte oder schädigende Inhalte",
          "falsche Besitzansprüche oder bewusst irreführende Einträge",
        ],
      },
      {
        title: "Moderation und Reports",
        paragraphs: [
          "MerhabaMap kann Inhalte prüfen, einschränken, ausblenden oder entfernen, wenn Hinweise auf Verstöße, Missbrauch oder Unrichtigkeit vorliegen. Reports und Moderationsentscheidungen erfolgen nach internen Prüfprozessen.",
        ],
      },
      {
        title: "Business-Claims und Vertrauenssignale",
        paragraphs: [
          "\"Beansprucht\" und \"verifiziert\" sind unterschiedliche Signale. Ein genehmigter Business-Claim bedeutet nicht automatisch, dass sämtliche Angaben redaktionell oder rechtlich geprüft wurden.",
        ],
      },
      {
        title: "Drittinhalte und externe Links",
        paragraphs: [
          "MerhabaMap kann auf externe Veranstaltungs- oder Business-Seiten verlinken. Für Inhalte, Leistungen oder Transaktionen auf Drittseiten ist der jeweilige Drittanbieter verantwortlich.",
        ],
      },
      {
        title: "Verfügbarkeit",
        paragraphs: [
          "MerhabaMap wird als MVP und fortlaufend weiterentwickeltes Produkt betrieben. Eine jederzeitige, fehlerfreie oder vollständige Verfügbarkeit kann nicht zugesagt werden.",
        ],
      },
      {
        title: "Haftungshinweis",
        paragraphs: [
          "Zwingende gesetzliche Haftung bleibt unberührt. Im Übrigen sollte die genaue haftungsrechtliche Formulierung vor dem Launch gesondert überprüft werden.",
        ],
      },
      {
        title: "Sperrung und Beendigung",
        paragraphs: [
          "Bei Verstößen gegen diese Regeln oder bei Sicherheits- und Missbrauchsrisiken kann MerhabaMap Konten oder Inhalte vorübergehend oder dauerhaft einschränken.",
        ],
      },
      {
        title: "Kontakt",
        paragraphs: [
          `Allgemeine Kontaktadresse: ${company.contactEmail}`,
        ],
      },
    ],
  };
}

export function getCommunityRulesContent(locale: AppLocale): LegalPageContent {
  if (locale === "tr") {
    return {
      title: "Topluluk Kurallari",
      intro:
        "Bu sayfa MerhabaMap uzerindeki temel topluluk beklentilerini kisa ve anlasilir bicimde ozetler.",
      sections: [
        {
          title: "Saygili iletisim",
          bullets: [
            "nefret, taciz veya asagilama iceren icerik paylasmayin",
            "kisi veya topluluklara zarar verecek dil kullanmayin",
          ],
        },
        {
          title: "Spam ve yaniltici icerik yok",
          bullets: [
            "yaniltici business claim, sahte rapor veya tekrarli spam gondermeyin",
            "isletmeler ve etkinlikler hakkinda kasitli olarak yanlis bilgi yaymayin",
          ],
        },
        {
          title: "Hukuka uygunluk",
          bullets: [
            "hukuka aykiri icerik paylasmayin",
            "baskalarinin haklarini ihlal eden icerik gondermeyin",
          ],
        },
        {
          title: "Bildirim ve sonuc",
          paragraphs: [
            "Supheli veya sorunlu icerikler raporlanabilir. Ihlalin agirligina gore icerik kaldirma, claim reddi veya hesap kisitlamasi uygulanabilir.",
          ],
        },
      ],
    };
  }

  return {
    title: "Community-Regeln",
    intro:
      "Diese Seite fasst die zentralen Verhaltenserwartungen für MerhabaMap knapp und verständlich zusammen.",
    sections: [
      {
        title: "Respektvoller Umgang",
        bullets: [
          "keine Hassrede, Belästigung oder entwürdigende Inhalte",
          "kein Verhalten, das Einzelpersonen oder Communities gezielt schädigt",
        ],
      },
      {
        title: "Kein Spam und keine Irreführung",
        bullets: [
          "keine missbräuchlichen Claims, Reports oder Massenmeldungen",
          "keine bewusst falschen Angaben über Orte, Events oder Businesses",
        ],
      },
      {
        title: "Rechtskonformes Verhalten",
        bullets: [
          "keine rechtswidrigen Inhalte",
          "keine Inhalte, die Rechte Dritter verletzen",
        ],
      },
      {
        title: "Reports und Konsequenzen",
        paragraphs: [
          "Meldungen helfen bei der Prüfung problematischer Inhalte. Je nach Schwere eines Verstoßes kann MerhabaMap Inhalte entfernen, Claims ablehnen oder Accounts einschränken.",
        ],
      },
    ],
  };
}
