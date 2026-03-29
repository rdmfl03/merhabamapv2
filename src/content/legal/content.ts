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
  const contactParagraphs = [`E-Mail: ${company.adminEmail}`];

  if (company.contactPhone) {
    contactParagraphs.push(`Telefon: ${company.contactPhone}`);
  }

  if (locale === "tr") {
    return {
      title: "Impressum",
      intro:
        "Bu sayfa, MerhabaMap platformu için sağlayıcı bilgilerini Almanya odaklı yayın yükümlülükleri bakımından özetler.",
      sections: [
        {
          title: "Sağlayıcı bilgileri",
          paragraphs: [
            `Ad / şirket: ${company.entityName}`,
            "Platform: MerhabaMap",
            ...company.addressLines,
          ],
        },
        {
          title: "Temsile yetkili ortaklar",
          paragraphs: company.legalRepresentatives,
        },
        {
          title: "İletişim",
          paragraphs: contactParagraphs,
        },
        {
          title: "İçerikten sorumlu kişi",
          paragraphs: [
            `Gazetecilik ve editoryal içerikler için sorumlu kişi: ${company.contentResponsiblePerson}`,
          ],
        },
        ...(company.registerEntry
          ? [
              {
                title: "Ticaret sicili bilgisi",
                paragraphs: [`Kayıt bilgisi: ${company.registerEntry}`],
              },
            ]
          : []),
        ...(company.vatId
          ? [
              {
                title: "Vergi bilgisi",
                paragraphs: [`USt-IdNr.: ${company.vatId}`],
              },
            ]
          : []),
      ],
    };
  }

  return {
    title: "Impressum",
    intro:
      "Dieses Impressum enthält die Anbieterkennzeichnung für die Plattform MerhabaMap.",
    sections: [
      {
        title: "Angaben gemäß § 5 DDG",
        paragraphs: [
          `Name / Firma: ${company.entityName}`,
          "Plattform: MerhabaMap",
          ...company.addressLines,
        ],
      },
      {
        title: "Vertretungsberechtigte Gesellschafter",
        paragraphs: company.legalRepresentatives,
      },
      {
        title: "Kontakt",
        paragraphs: contactParagraphs,
      },
      {
        title: "Verantwortlich für journalistisch-redaktionelle Inhalte gemäß § 18 Abs. 2 MStV",
        paragraphs: [`${company.contentResponsiblePerson}`],
      },
      ...(company.registerEntry
        ? [
            {
              title: "Registereintrag",
              paragraphs: [`${company.registerEntry}`],
            },
          ]
        : []),
      ...(company.vatId
        ? [
            {
              title: "Umsatzsteuer",
              paragraphs: [`USt-IdNr.: ${company.vatId}`],
            },
          ]
        : []),
    ],
  };
}

// TODO(legal): Confirm in production whether S3-compatible object storage (e.g. Cloudflare R2 per .env examples) is enabled and whether any CDN or reverse proxy is used in addition to Netlify's own delivery network.

export function getPrivacyContent(locale: AppLocale): LegalPageContent {
  const company = getLegalCompanyProfile(locale);

  if (locale === "tr") {
    return {
      title: "Gizlilik Politikası",
      intro:
        "Bu gizlilik metni, MerhabaMap kullanılırken hangi kişisel verilerin hangi amaçlarla işlendiğini mevcut teknik kurguya göre özetler.",
      sections: [
        {
          title: "Veri sorumlusu",
          paragraphs: [
            `${company.entityName}`,
            ...company.addressLines,
          ],
        },
        {
          title: "İletişim",
          paragraphs: [
            `Genel iletişim: ${company.infoEmail}`,
            `Gizlilik konuları için iletişim: ${company.privacyContactEmail}`,
          ],
        },
        {
          title: "İşlenen veri kategorileri",
          bullets: [
            "kayıt ve hesap yönetimi için e-posta adresi, kullanıcı adı ve parola özeti",
            "giriş, oturum ve güvenlik için gerekli teknik veriler",
            "tarayıcıda yerel olarak tutulan kayıtlı yer bilgileri, ilgili işlev kullanıldığında",
            "raporlar, bildirimler, talep ve business claim süreçlerinde paylaşılan veriler",
            "e-posta ile iletişime geçildiğinde paylaşılan iletişim ve mesaj içeriği",
            "web sitesinin güvenli sunumu için gerekli bağlantı ve altyapı verileri",
          ],
        },
        {
          title: "İşleme amaçları ve hukuki dayanaklar",
          bullets: [
            "hesap, giriş ve temel platform işlevlerinin sağlanması (sözleşmenin kurulması ve ifası)",
            "kayıtlı içerikler, bildirimler, claims ve destek süreçlerinin yürütülmesi (duruma göre sözleşme öncesi tedbirler veya meşru menfaat)",
            "BT güvenliği, istikrar, hata analizi ve kötüye kullanımın önlenmesi (meşru menfaat)",
            "yasal yükümlülüklerin ve saklama zorunluluklarının yerine getirilmesi (yasal yükümlülük)",
          ],
        },
        {
          title: "Barındırma ve teknik hizmet sağlayıcıları",
          bullets: [
            "Netlify: Next.js uygulamasının oluşturulması, barındırılması ve Netlify ağı üzerinden dağıtımı (bkz. depodaki Netlify dağıtım dokümantasyonu).",
            "DigitalOcean: PostgreSQL veritabanı (yönetilen hizmet; bağlantı, dağıtım ortamındaki veritabanı URL’si üzerinden).",
            "Harita karoları: İstemci tarafında, dağıtımda `NEXT_PUBLIC_MAPTILER_API_KEY` tanımlıysa MapTiler (Pastel raster) karoları yüklenir; anahtar yoksa OpenStreetMap proje sunucularından (`tile.openstreetmap.org`) standart karolar kullanılır. MapTiler yüklemesinde hata olursa uygulama OpenStreetMap’e geçebilir.",
            "İsteğe bağlı: Ortam değişkenleri üzerinden yapılandırıldığında medya veya dosyalar için S3 uyumlu nesne depolama (örnek uç noktalar depo `.env` örneklerinde Cloudflare R2 ile belgelenmiştir).",
          ],
        },
        {
          title: "E-posta iletişimi",
          paragraphs: [
            "Mevcut üretim kurulumunda hesapla ilgili iletiler ve doğrudan e-posta iletişimi için Zoho kullanılmaktadır.",
          ],
        },
        {
          title: "Alıcılar ve olası üçüncü ülke aktarımı",
          paragraphs: [
            "Kişisel veriler, platformun işletilmesi için gerekli olduğu ölçüde yukarıda belirtilen teknik hizmet sağlayıcılarına aktarılır. Bazı sağlayıcılar verileri AB veya AEA dışında da işleyebilir; bu durumda geçerli hukuki aktarım araçlarına (ör. standart sözleşme maddeleri) uyulur, uygun olduğu ölçüde.",
          ],
        },
        {
          title: "Çerezler ve benzeri teknolojiler",
          paragraphs: [
            "Oturum ve giriş için Auth.js/NextAuth tarafından ayarlanan oturum çerezi (üretimde adı `__Secure-authjs.session-token`, geliştirmede `authjs.session-token`).",
            "Dil tercihi için `NEXT_LOCALE` çerezi, dil seçicisi kullanıldığında.",
            "“Kayıtlı” mekânlar için tarayıcıda yerel depolama (`localStorage`).",
            "İsteğe bağlı analiz, pazarlama veya reklam çerezleri kod tabanında kullanılmamaktadır.",
          ],
        },
        {
          title: "İletişim kanalları",
          paragraphs: [
            "Şu anda ayrıca bir bülten veya ayrı bir iletişim formu sunulmamaktadır. İletişim ağırlıklı olarak doğrudan e-posta üzerinden gerçekleşir.",
          ],
        },
        {
          title: "Sorunlu içerikleri bildirme",
          bullets: [
            "Yayındaki mekân ve etkinlikler için arayüzde bildirim (rapor) gönderilebilir; uygun olduğunda talep (claim) ve benzeri süreçler de kullanılabilir.",
            "Yardımcı bilgiler: ilgili sayfanın bağlantısı veya adı, sorunun kısa ve nesnel açıklaması, varsa kanıt veya kaynak.",
            "MerhabaMap bildirimleri inceler; gerekirse içerikleri sınırlayabilir, düzeltebilir veya kaldırabilir. Sabit işlem süreleri taahhüt edilmez.",
            `Veri koruma konuları: ${company.privacyContactEmail}. Diğer içerik veya hukukla ilgili başvurular, iletişim sayfasında ve bu metinde belirtilen e-posta adresleri üzerinden yapılabilir.`,
          ],
        },
        {
          title: "Saklama süresi",
          paragraphs: [
            "Veriler, ilgili amaç için gerekli olduğu sürece, hesap mevcut olduğu sürece veya yasal saklama yükümlülükleri gerektirdiği ölçüde saklanır. Yerel olarak kaydedilen içerikler kullanıcının kendi tarayıcısında tutulur ve kullanıcı tarafından silinebilir.",
          ],
        },
        {
          title: "Haklarınız",
          bullets: [
            "bilgi talep etme",
            "düzeltme isteme",
            "silme veya kısıtlama talep etme",
            "itiraz etme",
            "veri taşınabilirliği",
          ],
        },
        {
          title: "Şikâyet hakkı",
          paragraphs: [
            "İlgili kişiler, kişisel verilerinin işlenmesiyle ilgili olarak yetkili bir veri koruma denetim makamına şikâyette bulunabilir.",
          ],
        },
      ],
    };
  }

  return {
    title: "Datenschutzerklärung",
    intro:
      "Diese Datenschutzerklärung informiert darüber, welche personenbezogenen Daten bei der Nutzung von MerhabaMap verarbeitet werden und zu welchen Zwecken dies geschieht.",
    sections: [
      {
        title: "Verantwortlicher",
        paragraphs: [
          `${company.entityName}`,
          ...company.addressLines,
        ],
      },
      {
        title: "Kontakt für Datenschutzanliegen",
        paragraphs: [
          `Allgemeine Kontaktadresse: ${company.infoEmail}`,
          `Kontakt für Datenschutzanliegen: ${company.privacyContactEmail}`,
        ],
      },
      {
        title: "Verarbeitete Datenkategorien",
        bullets: [
          "Registrierungs- und Kontodaten wie E-Mail-Adresse, Nutzername und Passwort-Hash",
          "Login-, Session- und Sicherheitsdaten, soweit sie für Anmeldung und Schutz des Dienstes erforderlich sind",
          "lokal im Browser gespeicherte Merkliste, soweit die Funktion „Gespeichert“ genutzt wird",
          "Angaben aus Meldungen, Einreichungen, Claims und vergleichbaren Interaktionen",
          "Inhalte und Metadaten von Kontaktanfragen per E-Mail",
          "technische Verbindungs- und Infrastrukturdaten, die für die sichere Bereitstellung der Website erforderlich sein können",
        ],
      },
      {
        title: "Zwecke der Verarbeitung und Rechtsgrundlagen",
        bullets: [
          "Bereitstellung des Dienstes, des Nutzerkontos sowie der Login- und Speicherfunktionen (Art. 6 Abs. 1 lit. b DSGVO)",
          "Bearbeitung von Meldungen, Claims, Support- und Kontaktanfragen (je nach Anlass Art. 6 Abs. 1 lit. b oder lit. f DSGVO)",
          "Gewährleistung von IT-Sicherheit, Stabilität, Fehleranalyse und Missbrauchsprävention (Art. 6 Abs. 1 lit. f DSGVO)",
          "Erfüllung gesetzlicher Pflichten und Aufbewahrungspflichten (Art. 6 Abs. 1 lit. c DSGVO)",
        ],
      },
      {
        title: "Hosting und technische Dienstleister",
        bullets: [
          "Netlify für Build, Hosting und Auslieferung der Next.js-Anwendung über das Netlify-Netzwerk (siehe Projekt-Dokumentation zu Netlify).",
          "DigitalOcean für PostgreSQL als verwaltete Datenbank; Anbindung über die in der jeweiligen Bereitstellungsumgebung gesetzte Datenbank-URL.",
          "Kartenkacheln im Browser: Ist in der ausgelieferten Konfiguration `NEXT_PUBLIC_MAPTILER_API_KEY` gesetzt, werden Kacheln von MapTiler (Rasterkarte „Pastel“) geladen; ohne Schlüssel werden die Standard-Kacheln der OpenStreetMap-Projektserver unter `tile.openstreetmap.org` genutzt. Bei wiederholten Kachelfehlern mit MapTiler kann die Anwendung auf OpenStreetMap wechseln.",
          "Optional: S3-kompatible Objektspeicher für Medien oder Dateien, sofern in der jeweiligen Umgebung konfiguriert (in den `.env`-Beispielen des Repositories u. a. mit Cloudflare-R2-Endpunkt dokumentiert).",
        ],
      },
      {
        title: "E-Mail-Kommunikation",
        paragraphs: [
          "Im aktuellen Produktivbetrieb wird für transaktionale E-Mails und die direkte geschäftliche Kommunikation Zoho eingesetzt.",
        ],
      },
      {
        title: "Empfänger und mögliche Drittlandübermittlung",
        paragraphs: [
          "Personenbezogene Daten werden an die oben genannten technischen Dienstleister übermittelt, soweit der Betrieb der Plattform dies erfordert. Einige Anbieter verarbeiten Daten auch außerhalb der Europäischen Union oder des Europäischen Wirtschaftsraums; in diesen Fällen werden die jeweils anwendbaren zulässigen Übermittlungsmechanismen (z. B. Standardvertragsklauseln der EU-Kommission) eingehalten, soweit einschlägig.",
        ],
      },
      {
        title: "Cookies und ähnliche Technologien",
        paragraphs: [
          "Für Sitzung und Anmeldung setzt Auth.js/NextAuth ein Session-Cookie (in der Produktionsumgebung mit dem Namen `__Secure-authjs.session-token`, in der Entwicklungsumgebung `authjs.session-token`).",
          "Für die Sprachauswahl kann beim Wechsel über den Sprachschalter ein Cookie `NEXT_LOCALE` gesetzt werden.",
          "Für die Funktion „Gespeichert“ werden Orte im lokalen Browser-Speicher (`localStorage`) abgelegt.",
          "Im Frontend-Code sind keine optionalen Analytics-, Marketing- oder Werbe-Tracker eingebunden.",
        ],
      },
      {
        title: "Kontaktkanäle",
        paragraphs: [
          "Aktuell gibt es keinen Newsletter und kein eigenständiges Kontaktformular. Kontaktaufnahmen erfolgen derzeit in erster Linie per E-Mail.",
        ],
      },
      {
        title: "Melden problematischer Inhalte",
        bullets: [
          "Für veröffentlichte Orte und Events stehen in der Oberfläche Meldefunktionen zur Verfügung; wo vorgesehen, können zudem Claims oder vergleichbare Abläufe genutzt werden.",
          "Hilfreich sind die betroffene Seite (Link bzw. Name des Orts oder Events), eine kurze sachliche Darstellung des Problems sowie – soweit vorhanden – Belege oder Quellenangaben.",
          "MerhabaMap prüft eingegangene Hinweise und kann Inhalte bei Bedarf einschränken, berichtigen oder entfernen. Es werden keine festen Bearbeitungsfristen zugesagt.",
          `Datenschutzanliegen richten Sie bitte an ${company.privacyContactEmail}. Weitere inhaltliche oder rechtliche Hinweise können Sie über die auf der Kontaktseite und in diesem Text genannten E-Mail-Adressen vortragen.`,
        ],
      },
      {
        title: "Speicherdauer",
        paragraphs: [
          "Personenbezogene Daten werden nur so lange gespeichert, wie es für den jeweiligen Zweck, den Betrieb der Plattform oder gesetzliche Aufbewahrungspflichten erforderlich ist. Lokal gespeicherte Merkinhalte verbleiben im Browser der Nutzer und können dort gelöscht werden.",
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
        ],
      },
      {
        title: "Beschwerderecht",
        paragraphs: [
          "Betroffene können sich bei einer zuständigen Datenschutzaufsichtsbehörde beschweren.",
        ],
      },
    ],
  };
}

export function getContactContent(locale: AppLocale): LegalPageContent {
  const company = getLegalCompanyProfile(locale);
  const contactParagraphs = [`E-Mail: ${company.contactEmail}`];

  if (company.contactPhone) {
    contactParagraphs.push(`Telefon: ${company.contactPhone}`);
  }

  if (locale === "tr") {
    return {
      title: "İletişim",
      intro:
        "MerhabaMap ile iletişime geçmek için ana kanal e-postadır. Telefonla iletişim de mümkündür; yanıt süresi konuya ve yoğunluğa göre değişebilir.",
      sections: [
        {
          title: "Genel iletişim",
          paragraphs: [...contactParagraphs, "MerhabaMap, topluluk odaklı bir platform olarak talepleri mümkün olduğunca sırayla yanıtlar."],
        },
        {
          title: "Gizlilik konuları",
          paragraphs: [`Gizlilik talepleri için: ${company.privacyContactEmail}`],
        },
        {
          title: "İletişim şekli",
          paragraphs: [
            "Şu anda ayrıca bir bülten veya ayrı bir iletişim formu sunulmamaktadır. İletişim ağırlıklı olarak doğrudan e-posta üzerinden gerçekleşir.",
          ],
        },
        {
          title: "Yanıt beklentisi",
          paragraphs: [
            "Taleplerin niteliğine ve yoğunluğa bağlı olarak geri dönüş süresi değişebilir.",
          ],
        },
      ],
    };
  }

  return {
    title: "Kontakt",
    intro:
      "Für Kontaktanfragen ist E-Mail derzeit der wichtigste Weg. Telefonische Kontaktaufnahme ist ebenfalls möglich; Antwortzeiten können je nach Auslastung und Thema variieren.",
    sections: [
      {
        title: "Kontaktmöglichkeiten",
        paragraphs: [...contactParagraphs, "MerhabaMap ist eine community-orientierte Plattform und beantwortet Anfragen nach Verfügbarkeit."],
      },
      {
        title: "Datenschutzanfragen",
        paragraphs: [`Für Datenschutzanliegen: ${company.privacyContactEmail}`],
      },
      {
        title: "Kontaktweg",
        paragraphs: [
          "Aktuell gibt es keinen Newsletter und kein eigenständiges Kontaktformular. Kontaktaufnahmen erfolgen in erster Linie per E-Mail.",
        ],
      },
      {
        title: "Hinweis zu Antwortzeiten",
        paragraphs: [
          "Rückmeldungen können je nach Umfang und Dringlichkeit einer Anfrage unterschiedlich schnell erfolgen.",
        ],
      },
    ],
  };
}

export function getCookiesContent(locale: AppLocale): LegalPageContent {
  if (locale === "tr") {
    return {
      title: "Çerezler ve benzeri teknolojiler",
      intro:
        "Bu sayfa, MerhabaMap'te kullanılan çerezleri ve benzeri yerel depolama mekanizmalarını mevcut teknik kurguya göre özetler.",
      sections: [
        {
          title: "Teknik olarak gerekli çerezler ve depolama",
          paragraphs: [
            "Oturum ve giriş: Auth.js/NextAuth oturum çerezi (üretimde `__Secure-authjs.session-token`, geliştirmede `authjs.session-token`).",
            "Dil tercihi: dil seçicisi kullanıldığında `NEXT_LOCALE` çerezi.",
            "Kayıtlı mekânlar: tarayıcıda `localStorage`.",
          ],
        },
        {
          title: "İsteğe bağlı takip bulunmaması",
          paragraphs: [
            "Kod tabanında isteğe bağlı analiz, pazarlama veya reklam çerezleri veya karşılaştırılabilir üçüncü taraf izleme pikselleri kullanılmamaktadır.",
          ],
        },
        {
          title: "Onay ve gelecekteki değişiklikler",
          paragraphs: [
            "Mevcut kurulumda isteğe bağlı takip çerezleri bulunmadığı için ayrıca bir pazarlama onayı akışı öngörülmemektedir. Teknik kapsam değişirse bu sayfa ve gerekirse ilgili onay mekanizmaları ayrıca güncellenmelidir.",
          ],
        },
      ],
    };
  }

  return {
    title: "Cookies und ähnliche Technologien",
    intro:
      "Diese Seite beschreibt, welche Cookies und vergleichbaren Speichermechanismen MerhabaMap nach aktuellem Stand verwendet.",
    sections: [
      {
        title: "Technisch erforderliche Cookies und Speichermechanismen",
        paragraphs: [
          "Sitzung und Anmeldung: Session-Cookie von Auth.js/NextAuth (Produktion: `__Secure-authjs.session-token`, Entwicklung: `authjs.session-token`).",
          "Spracheinstellung: Cookie `NEXT_LOCALE`, wenn über den Sprachschalter gewechselt wird.",
          "„Gespeichert“-Orte: `localStorage` im Browser.",
        ],
      },
      {
        title: "Kein optionales Tracking nach aktuellem Stand",
        paragraphs: [
          "Im Frontend sind keine separaten Analytics-, Marketing- oder Werbe-Cookies und keine vergleichbaren Tracking-Pixel Dritter eingebunden.",
        ],
      },
      {
        title: "Einwilligung und spätere Änderungen",
        paragraphs: [
          "Da aktuell keine optionalen Tracking- oder Marketing-Cookies eingesetzt werden, ist derzeit kein gesonderter Einwilligungsmechanismus für solche Zwecke vorgesehen. Falls sich der technische Umfang ändert, müssen diese Seite und gegebenenfalls zusätzliche Einwilligungs- oder Einstellungsmechanismen angepasst werden.",
        ],
      },
    ],
  };
}

export function getTermsContent(locale: AppLocale): LegalPageContent {
  const company = getLegalCompanyProfile(locale);

  if (locale === "tr") {
    return {
      title: "Kullanım koşulları",
      intro:
        "Bu kullanım koşulları, MerhabaMap'in mevcut ürün yapısı için kullanıcı sorumluluklarını, platform sınırlarını ve müdahale imkanlarını ana hatlarıyla açıklar.",
      sections: [
        {
          title: "Platformun konusu",
          paragraphs: [
            "MerhabaMap, topluluk bağlamında mekânlar, etkinlikler ve ilgili giriş noktalarını gösteren bir bilgi ve keşif platformudur.",
          ],
        },
        {
          title: "Kullanıcı sorumluluğu",
          paragraphs: [
            "Kullanıcılar, ilettikleri içeriklerden, bildirimlerden ve hesap bilgilerinin güvenliğinden kendileri sorumludur.",
          ],
        },
        {
          title: "Yasak içerikler ve davranışlar",
          bullets: [
            "nefret söylemi veya ayrımcı içerikler",
            "hukuka aykırı içerikler",
            "spam veya sistemin kötüye kullanımı",
          ],
        },
        {
          title: "Moderasyon ve hesaplar",
          paragraphs: [
            "MerhabaMap, içerikleri inceleyebilir, sınırlandırabilir veya kaldırabilir. Gerekirse hesaplara geçici ya da kalıcı kısıtlamalar uygulanabilir.",
          ],
        },
        {
          title: "Kullanılabilirlik ve değişiklikler",
          paragraphs: [
            "MerhabaMap, platform özelliklerini ve içerik kapsamını geliştirebilir, sınırlayabilir veya değiştirebilir. Belirli bir işlevin sürekli erişilebilir olacağına dair ayrıca bir taahhüt verilmez.",
          ],
        },
        {
          title: "Harici içerikler",
          paragraphs: [
            "Harici bağlantılar veya üçüncü taraf sayfalar ilgili sağlayıcıların sorumluluğundadır.",
          ],
        },
        {
          title: "İletişim",
          paragraphs: [`Genel iletişim: ${company.supportEmail}`],
        },
      ],
    };
  }

  return {
    title: "Nutzungsbedingungen",
    intro:
      "Diese Nutzungsbedingungen beschreiben die grundlegenden Regeln für die Nutzung von MerhabaMap, die Verantwortlichkeiten der Nutzer und die Grenzen des Plattformbetriebs.",
    sections: [
      {
        title: "Gegenstand der Plattform",
        paragraphs: [
          "MerhabaMap ist eine Plattform für community-bezogene Orte, Events und lokale Orientierung.",
        ],
      },
      {
        title: "Verantwortung der Nutzer",
        paragraphs: [
          "Nutzer sind für Inhalte, Meldungen und Angaben verantwortlich, die sie über die Plattform übermitteln.",
        ],
      },
      {
        title: "Unzulässige Inhalte",
        bullets: [
          "Hassrede oder diskriminierende Inhalte",
          "rechtswidrige Inhalte",
          "Spam oder missbräuchliche Nutzung der Plattform",
        ],
      },
      {
        title: "Moderation und Konten",
        paragraphs: [
          "MerhabaMap kann Inhalte prüfen, einschränken oder entfernen. Bei erheblichen oder wiederholten Verstößen können Konten vorübergehend oder dauerhaft gesperrt werden.",
        ],
      },
      {
        title: "Verfügbarkeit und Änderungen",
        paragraphs: [
          "MerhabaMap kann Funktionen, Inhalte und technische Ausgestaltung weiterentwickeln, einschränken oder ändern. Ein Anspruch auf jederzeitige Verfügbarkeit bestimmter Funktionen besteht nicht.",
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
        paragraphs: [`Allgemeine Kontaktadresse: ${company.supportEmail}`],
      },
    ],
  };
}

export function getCommunityRulesContent(locale: AppLocale): LegalPageContent {
  const company = getLegalCompanyProfile(locale);

  if (locale === "tr") {
    return {
      title: "Topluluk kuralları",
      intro:
        "Bu kurallar, MerhabaMap'te saygılı, güvenilir ve topluluk odaklı bir ortamı korumaya yardımcı olmak için hazırlanmıştır.",
      sections: [
        {
          title: "Saygılı davranış",
          bullets: [
            "saygılı ve topluluk duyarlılığına uygun iletişim kur",
            "ayrımcı veya aşağılayıcı dil kullanma",
          ],
        },
        {
          title: "Doğru bilgi",
          bullets: [
            "sahte mekân veya sahte etkinlik girmeyin",
            "yanıltıcı claim veya rapor göndermeyin",
          ],
        },
        {
          title: "Reklam ve tanıtım",
          bullets: [
            "bağlamsız reklam veya spam paylaşmayın",
            "topluluğa fayda sağlamayan tanıtımları zorlamayın",
          ],
        },
        {
          title: "Bildirimleri sorumlu kullanın",
          bullets: [
            "bildirim ve rapor araçlarını yalnızca gerçek bir sorun veya gerçek bir hak talebi için kullanın",
            "kişilere zarar vermek amacıyla kötüye kullanımda bulunmayın",
          ],
        },
        {
          title: "Destek ve uyuşmazlık iletişimi",
          paragraphs: [`Genel destek ve uyuşmazlık iletişimi: ${company.supportEmail}`],
        },
        {
          title: "Sorunlu içerikler",
          paragraphs: [
            "Arayüzdeki bildirim işlevlerine ek olarak, ciddi veya hukuki açıdan önemli başvurular iletişim sayfasındaki e-posta adreslerine de gönderilebilir. Gizlilik politikasında “Sorunlu içerikleri bildirme” bölümünde ek bilgi bulunur.",
          ],
        },
      ],
    };
  }

  return {
    title: "Community-Regeln",
    intro:
      "Diese Regeln sollen einen respektvollen, glaubwürdigen und community-orientierten Umgang auf MerhabaMap fördern.",
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
          "keine bewusst irreführenden Claims oder Meldungen absenden",
        ],
      },
      {
        title: "Keine Werbung ohne Kontext",
        bullets: [
          "keine aufdringliche oder kontextlose Werbung",
          "keine Spam- oder Massenbeiträge ohne erkennbaren Community-Bezug",
        ],
      },
      {
        title: "Melde- und Claim-Funktionen verantwortungsvoll nutzen",
        bullets: [
          "Meldungen und Claims nur bei tatsächlichem Anlass absenden",
          "keine Werkzeuge missbrauchen, um andere Personen oder Unternehmen zu behindern",
        ],
      },
      {
        title: "Support und Konfliktkontakt",
        paragraphs: [`Allgemeiner Support- und Konfliktkontakt: ${company.supportEmail}`],
      },
      {
        title: "Problematische Inhalte",
        paragraphs: [
          "Ergänzend zu den Meldefunktionen in der Oberfläche können schwerwiegende oder rechtsrelevante Hinweise auch an die auf der Kontaktseite genannten E-Mail-Adressen gerichtet werden. Die Datenschutzerklärung enthält unter „Melden problematischer Inhalte“ weitere Orientierung.",
        ],
      },
    ],
  };
}
