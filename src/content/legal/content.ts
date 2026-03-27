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
        "Bu sayfa Almanya odaklı bir ürün yüzeyi için gerekli yasal iletişim bilgilerinin taslak yapisini sunar. Köşe parantezli alanlar lansman öncesi gerçek bilgilerle güncellenmelidir.",
      sections: [
        {
          title: "Sağlayıcı bilgileri",
          paragraphs: [
            `Hizmet sağlayıcı: ${company.entityName}`,
            `Yasal temsil: ${company.legalRepresentative}`,
            ...company.addressLines,
          ],
        },
        {
          title: "İletişim",
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
          title: "İçerikten sorumlu kişi",
          paragraphs: [
            `${company.contentResponsiblePerson}`,
          ],
        },
        {
          title: "Önemli not",
          paragraphs: [
            "MerhabaMap'te yer alan işletme, etkinlik ve topluluk bilgileri duruma göre kullanıcı, işletme sahibi veya editör incelemesiyle güncellenebilir. Bu sayfadaki yasal bilgiler ürün lansmanı öncesi son kez kontrol edilmelidir.",
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
      title: "Gizlilik Politikası",
      intro:
        "Bu metin MerhabaMap'in mevcut teknik ve ürün davranışına dayanan dikkatli bir taslak gizlilik yapısıdır. Nihai hukuki değerlendirme yerine geçmez; lansman öncesinde ayrıca kontrol edilmelidir.",
      sections: [
        {
          title: "Genel bakış",
          paragraphs: [
            "MerhabaMap, Almanya'daki Türk topluluğu için iki dilli bir keşif ürünüdür. Veri minimizasyonu ve şeffaflık temel ilkelerdir.",
          ],
        },
        {
          title: "Veri sorumlusu",
          paragraphs: [
            `${company.entityName}`,
            ...company.addressLines,
            `Genel iletişim: ${company.contactEmail}`,
            `Gizlilik iletişimi: ${company.privacyContactEmail}`,
          ],
        },
        {
          title: "İşlenen veri kategorileri",
          bullets: [
            "hesap oluşturma sırasında e-posta adresi, şifre hash'i ve isteğe bağlı isim",
            "profil/onboarding tercihlerinde dil, şehir ve ilgi alanları",
            "kaydedilen mekan ve etkinlikler",
            "business claim ve rapor akışları için sağlanan iletişim ve açıklama bilgileri",
            "güvenlik ve işletim amaçlı teknik sunucu logları",
          ],
        },
        {
          title: "İşleme amaclari",
          bullets: [
            "hesap oluşturma, oturum yönetimi ve kimlik doğrulama",
            "kaydedilen içerikler ve kullanıcı tercihlerini gösterebilme",
            "claim, rapor ve moderasyon süreçlerini yürütebilme",
            "şifre sıfırlama, e-posta doğrulama ve diğer zorunlu iletişimleri gönderebilme",
            "platform güvenliği ve teknik hata takibi",
          ],
        },
        {
          title: "Hesap, profil ve favoriler",
          paragraphs: [
            "MerhabaMap şu anda zorunlu olmayan kapsamlı profil verileri toplamaz. Dil, şehir ve ilgi alanları yalnızca deneyimi daha ilgili hale getirmek için kullanılır.",
          ],
        },
        {
          title: "Claim, rapor ve moderasyon verileri",
          paragraphs: [
            "Business claim ve rapor içerikleri, güven ve platform güvenliği süreçlerinin bir parçası olarak işlenir. Bu veriler herkese açık gösterilmez ve yalnızca ilgili dahili inceleme akışlarında kullanılır.",
          ],
        },
        {
          title: "Teknik loglar",
          paragraphs: [
            "Uygulama, çalışma güvenliği için sınırlı teknik loglar tutabilir. Amaç hata tespiti, güvenlik ve operasyonel izlenebilirliktir. Loglarda gereksiz kişisel veri tutulmaması hedeflenir.",
          ],
        },
        {
          title: "Cookies ve benzeri mekanizmalar",
          paragraphs: [
            "Mevcut MVP yapısında isteğe bağlı reklam veya pazarlama takibi bulunmamaktadır. Hesap girişi ve oturum devamlılığı için gerekli oturum mekanizmaları kullanılır.",
          ],
        },
        {
          title: "E-posta iletişimleri",
          paragraphs: [
            "Hesap doğrulama, şifre sıfırlama, claim durumu veya benzeri zorunlu işlemsel iletiler e-posta ile gönderilebilir. Bu iletiler pazarlama amaçlı değildir.",
          ],
        },
        {
          title: "Haklarınız",
          bullets: [
            "bilgi talep etme",
            "düzeltme isteme",
            "silme veya kısıtlama talep etme",
            "itiraz hakkı",
            "veri taşınabilirliği hakkı",
            "yetkili denetim makamına şikayette bulunma hakkı",
          ],
        },
        {
          title: "Saklama ve silme",
          paragraphs: [
            "Veriler işleme amacı ve yasal saklama yükümlülükleri sona erdiğinde silinmeli veya uygun şekilde sınırlandırılmalıdır. Kesin saklama planlari lansman öncesi ayri olarak gözden geçirilmelidir.",
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
        title: "E-Mail-Kommunikatıon",
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

export function getContactContent(locale: AppLocale): LegalPageContent {
  const company = getLegalCompanyProfile(locale);

  if (locale === "tr") {
    return {
      title: "Iletisim",
      intro:
        "Bu sayfa MerhabaMap icin temel iletisim noktalarini teknik olarak hazirlar. Koseli parantezli alanlar canliya cikmadan once gercek bilgilerle tamamlanmalidir.",
      sections: [
        {
          title: "Genel iletisim",
          paragraphs: [
            `E-posta: ${company.contactEmail}`,
            `Telefon: ${company.contactPhone}`,
          ],
        },
        {
          title: "Gizlilik iletisimi",
          paragraphs: [`Gizlilik e-postasi: ${company.privacyContactEmail}`],
        },
        {
          title: "Adres",
          paragraphs: company.addressLines,
        },
      ],
    };
  }

  return {
    title: "Kontakt",
    intro:
      "Diese Seite bereitet die technischen Kontaktpunkte fuer MerhabaMap vor. Platzhalter in eckigen Klammern muessen vor dem Livegang mit den finalen Angaben ersetzt werden.",
    sections: [
      {
        title: "Allgemeiner Kontakt",
        paragraphs: [
          `E-Mail: ${company.contactEmail}`,
          `Telefon: ${company.contactPhone}`,
        ],
      },
      {
        title: "Datenschutzkontakt",
        paragraphs: [`Datenschutz-E-Mail: ${company.privacyContactEmail}`],
      },
      {
        title: "Postanschrift",
        paragraphs: company.addressLines,
      },
    ],
  };
}

export function getCookiesContent(locale: AppLocale): LegalPageContent {
  if (locale === "tr") {
    return {
      title: "Cookie ve Gizlilik Ayarlari",
      intro:
        "Bu sayfa zorunlu bir cerez yonetim merkezi yerine gecerli teknik durumun acik bir yer tutucusudur. Nihai hukuk ve consent akislari canliya cikmadan once ayrica gozden gecirilmelidir.",
      sections: [
        {
          title: "Mevcut durum",
          paragraphs: [
            "MerhabaMap su anda teknik olarak gerekli oturum ve guvenlik mekanizmalarina dayanmaktadir.",
            "Istege bagli pazarlama veya reklam cerezleri icin ayrica bir tercih merkezi bu taslakta etkin degildir.",
          ],
        },
        {
          title: "Canliya cikmadan once",
          bullets: [
            "Kullanilan teknolojilerin son kez dogrulanmasi",
            "Gerekirse consent veya ayar akisinin eklenmesi",
            "Gizlilik sayfasi ile teknik uygulamanin eslestirilmesi",
          ],
        },
      ],
    };
  }

  return {
    title: "Cookies & Privatsphaere",
    intro:
      "Diese Seite ist ein technischer Platzhalter fuer die spaetere Cookie- und Privatsphaerensteuerung. Vor dem Livegang muessen Technik, Consent-Bedarf und Rechtstexte gemeinsam final geprueft werden.",
    sections: [
      {
        title: "Aktueller Stand",
        paragraphs: [
          "MerhabaMap setzt derzeit technisch notwendige Sitzungs- und Sicherheitsmechanismen ein.",
          "Ein separates Einstellungszentrum fuer optionale Marketing- oder Werbecookies ist in diesem Platzhalter noch nicht aktiviert.",
        ],
      },
      {
        title: "Vor dem Go-Live pruefen",
        bullets: [
          "eingesetzte Cookies und aehnliche Technologien",
          "ob ein zusaetzlicher Consent-Flow erforderlich ist",
          "Abgleich zwischen Privacy-Seite und technischer Implementierung",
        ],
      },
    ],
  };
}

export function getTermsContent(locale: AppLocale): LegalPageContent {
  const company = getLegalCompanyProfile(locale);

  if (locale === "tr") {
    return {
      title: "Kullanım Koşulları",
      intro:
        "Bu metin MerhabaMap için lansmana hazır, dikkatli bir kullanım koşulları taslagidir. Nihai hukuki değerlendirme yerine geçmez ve yayin öncesi ayrıca kontrol edilmelidir.",
      sections: [
        {
          title: "Hizmet kapsami",
          paragraphs: [
            "MerhabaMap; mekanlar, etkinlikler ve ilgili topluluk bilgilerinin kesfi için sağlanan iki dilli bir platformdur. Tüm bilgi ve içerikler her zaman tam, güncel veya eksiksiz olmayabilir.",
          ],
        },
        {
          title: "Kullanıcı hesaplari",
          paragraphs: [
            "Bazi ozellikler için hesap gerekir. Kullanıcılar erisim bilgilerini güvenli şekilde korumakla sorumludur.",
          ],
        },
        {
          title: "Kabul edilebilir kullanım",
          bullets: [
            "doğruya makul ölçüde uygun bilgi sağlamak",
            "claim ve rapor akilarini kotuye kullanmamak",
            "diğer kullanıcılar, işletmeler ve topluluklar hakkında yanıltıcı iddialar yaymamak",
          ],
        },
        {
          title: "Yasaklanan davranışlar",
          bullets: [
            "spam, kotuye kullanım veya sistemin otomatik suistimali",
            "hukuka aykiri, nefreti tesvik eden veya zarar verici içerik",
            "yanıltıcı sahiplik beyanlari veya sahte business claim gönderimleri",
          ],
        },
        {
          title: "Moderasyon ve bildirimler",
          paragraphs: [
            "MerhabaMap, rapor, claim ve diğer güven sinyallerini inceleyebilir; içerikleri yayindan kaldırabilir, düzeltme isteyebilir veya hesap erişimini sinirlayabilir.",
          ],
        },
        {
          title: "Business claim ve doğrulama mantigi",
          paragraphs: [
            "\"Claimed\" ve \"Verified\" aynı anlamda değildir. Claimed durumu, bir sahiplik talebinin onaylandigini; Verified durumu ise belirli bilgilerin MerhabaMap tarafindan ayrıca incelendigini ifade eder.",
          ],
        },
        {
          title: "Ucuncu taraf bağlantılar ve etkinlikler",
          paragraphs: [
            "MerhabaMap, ucuncu taraf sitelere veya organizator sayfalarına bağlantılar gosterebilir. Harici içerik ve islemler ilgili ucuncu tarafin sorumlulugundadir.",
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
            "Zorunlu yasal sorumluluk halleri saklidir. Bunun disinda, MVP ürün yapisi ve kullanıcı kaynakli içerikler nedeniyle hukuki metinler yayin öncesi ayri degerlendirilmelidir.",
          ],
        },
        {
          title: "Hesap veya içerik sinirlamalari",
          paragraphs: [
            "Kurallara aykiri kullanım, yanıltıcı claim veya ciddi güven ihlallerinde hesaplar veya içerikler gecici ya da kalici olarak sinirlanabilir.",
          ],
        },
        {
          title: "İletişim",
          paragraphs: [
            `Genel iletişim: ${company.contactEmail}`,
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
          "MerhabaMap wird als MVP und fortlaufend weiterentwickeltes Produkt betrieben. Eine jederzeitige, fehlerfreie oder vollständige Verfügbarkeit kann nicht zugesağt werden.",
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
          title: "Saygili iletişim",
          bullets: [
            "nefret, taciz veya aşağılama içeren içerik paylaşmayın",
            "kişi veya topluluklara zarar verecek dil kullanmayin",
          ],
        },
        {
          title: "Spam ve yanıltıcı içerik yok",
          bullets: [
            "yanıltıcı business claim, sahte rapor veya tekrarli spam göndermeyin",
            "işletmeler ve etkinlikler hakkında kasitli olarak yanlis bilgi yaymayin",
          ],
        },
        {
          title: "Hukuka uygunluk",
          bullets: [
            "hukuka aykiri içerik paylaşmayın",
            "baskalarinin haklarini ihlal eden içerik göndermeyin",
          ],
        },
        {
          title: "Bildirim ve sonuç",
          paragraphs: [
            "Supheli veya sorunlu içerikler raporlanabilir. Ihlalin agirligina göre içerik kaldırma, claim reddi veya hesap kısıtlamasi uygulanabilir.",
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
