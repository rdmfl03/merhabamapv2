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
  const contactParagraphs = [`E-Mail: ${company.contactEmail}`];

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
          title: "Temsil yetkisi",
          paragraphs: [`Temsil yetkili kişi: ${company.legalRepresentative}`],
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
        title: "Vertretungsberechtigte Person",
        paragraphs: [`${company.legalRepresentative}`],
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
            `Genel iletişim: ${company.contactEmail}`,
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
          title: "Hosting ve teknik hizmet sağlayıcıları",
          bullets: [
            "Netlify (uygulama yayınlama ve çalışma zamanı)",
            "DigitalOcean (veritabanı barındırma)",
            "Cloudflare (CDN ve istek yönlendirme katmanı)",
            "harita görünümlerinde, teknik kurguya bağlı olarak OpenStreetMap veya Mapbox",
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
            "Kişisel veriler, platformun işletilmesi için gerekli olduğu ölçüde teknik hizmet sağlayıcılarına aktarılabilir. Tekil hizmet sağlayıcılar verileri Avrupa Birliği veya Avrupa Ekonomik Alanı dışındaki ülkelerde de işleyebilir; bu durumda ilgili sağlayıcının sunduğu geçerli aktarım mekanizmaları esas alınır.",
          ],
        },
        {
          title: "Çerezler ve benzeri teknolojiler",
          paragraphs: [
            "MerhabaMap şu anda yalnızca oturum, kimlik doğrulama ve yerel kayıt işlevleri için gerekli teknik çerezleri veya benzeri depolama mekanizmalarını kullanır. İsteğe bağlı analiz veya pazarlama takibi mevcut değildir.",
          ],
        },
        {
          title: "İletişim kanalları",
          paragraphs: [
            "Şu anda ayrıca bir bülten veya ayrı bir iletişim formu sunulmamaktadır. İletişim ağırlıklı olarak doğrudan e-posta üzerinden gerçekleşir.",
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
          `Allgemeine Kontaktadresse: ${company.contactEmail}`,
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
          "Netlify für Deployment und Auslieferung der Anwendung",
          "DigitalOcean für die Datenbank",
          "Cloudflare für CDN- und Edge-Auslieferung",
          "für Kartenansichten je nach technischer Konfiguration OpenStreetMap oder Mapbox",
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
          "Personenbezogene Daten können an technische Dienstleister übermittelt werden, soweit dies für Betrieb, Kommunikation oder sichere Auslieferung der Plattform erforderlich ist. Einzelne Dienstleister können Daten außerhalb der Europäischen Union oder des Europäischen Wirtschaftsraums verarbeiten; in diesen Fällen richtet sich die Verarbeitung nach den jeweils vorgesehenen zulässigen Übermittlungsmechanismen.",
        ],
      },
      {
        title: "Cookies und ähnliche Technologien",
        paragraphs: [
          "MerhabaMap verwendet nach aktuellem Stand nur technisch erforderliche Session- und Auth-Cookies sowie lokalen Browser-Speicher, soweit dies für Anmeldung, Kontonutzung oder lokal gespeicherte Orte nötig ist. Optionale Analytics-, Marketing- oder Werbe-Tracker werden derzeit nicht eingesetzt.",
        ],
      },
      {
        title: "Kontaktkanäle",
        paragraphs: [
          "Aktuell gibt es keinen Newsletter und kein eigenständiges Kontaktformular. Kontaktaufnahmen erfolgen derzeit in erster Linie per E-Mail.",
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
            "MerhabaMap, oturumun sürmesi ve giriş işlemlerinin çalışması için gerekli çerezleri kullanabilir. Yerel olarak kaydedilen yerler için tarayıcı depolaması da kullanılabilir.",
          ],
        },
        {
          title: "İsteğe bağlı takip bulunmaması",
          paragraphs: [
            "Mevcut ürün durumunda isteğe bağlı analiz, pazarlama veya reklam çerezleri kullanılmamaktadır.",
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
          "MerhabaMap verwendet technisch erforderliche Session- und Auth-Cookies, damit Anmeldung, Sitzung und sicherheitsrelevante Funktionen funktionieren. Für lokal gespeicherte Orte kann zusätzlich lokaler Browser-Speicher eingesetzt werden.",
        ],
      },
      {
        title: "Kein optionales Tracking nach aktuellem Stand",
        paragraphs: [
          "Für den derzeitigen Produktstand werden keine separaten Analytics-, Marketing- oder Werbe-Cookies eingesetzt.",
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
          paragraphs: [`Genel iletişim: ${company.contactEmail}`],
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
        paragraphs: [`Allgemeine Kontaktadresse: ${company.contactEmail}`],
      },
    ],
  };
}

export function getCommunityRulesContent(locale: AppLocale): LegalPageContent {
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
    ],
  };
}
