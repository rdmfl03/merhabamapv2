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
        "Bu sayfa, Almanya’da yerleşik çevrimiçi hizmet sağlayıcılarının bilgilendirme yükümlülükleri çerçevesinde MerhabaMap platformunun işleteni hakkında özet ve doğrulanabilir iletişim bilgileri sunar. Metin, özellikle Dijital Hizmetler Yasası (Digitale-Dienste-Gesetz, DDG) ve ilgili düzenlemelerde öngörülen şeffaflık beklentilerine yöneliktir; bireysel hukuki danışmanlığın yerini tutmaz.",
      sections: [
        {
          title: "Sağlayıcı bilgileri",
          paragraphs: [
            `MerhabaMap çevrimiçi teklifinin işleteni ${company.entityName}’dir. Platform, topluluk odaklı mekân ve etkinlik keşfi için kullanıma sunulan bir web uygulamasıdır. Posta adresi: ${company.addressLines.join(", ")}.`,
            "Hizmetin teknik sunumu ve veri işleme ile ilgili ayrıntılar için gizlilik politikasına bakınız; bu sayfa öncelikle kimlik ve iletişim bilgilerini içerir.",
          ],
        },
        {
          title: "Temsile yetkili ortaklar",
          paragraphs: [
            `Şirket türü gereği temsile yetkili ortaklar şunlardır: ${company.legalRepresentatives.join(", ")}. Bu kişiler, GbR’nin dış ilişkilerinde yasal çerçevede yetkilidir.`,
          ],
        },
        {
          title: "İletişim",
          paragraphs: [
            "Aşağıdaki kanallar üzerinden genel sorular, idari bildirimler ve teknik destek talepleri iletilebilir. E-posta, yazılı iletişim ve belge alışverişi için tercih edilen kanaldır.",
            contactParagraphs.join(" · "),
          ],
        },
        {
          title: "İçerikten sorumlu kişi",
          paragraphs: [
            `Gazetecilik ve editoryal içerikler bakımından § 18 Abs. 2 MStV (Medya devlet sözleşmesi) uyarınca sorumlu kişi: ${company.contentResponsiblePerson}. Bu atama, düzenlemenin kapsamına giren içerik türleri için geçerlidir.`,
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
                paragraphs: [
                  `KDV kimlik numarası (USt-IdNr.): ${company.vatId}. Vergi yükümlülükleri, ilgili dönem için geçerli ulusal düzenlemelere tabidir.`,
                ],
              },
            ]
          : []),
        {
          title: "Sorumluluk ve harici bağlantılar",
          paragraphs: [
            "Platform üzerinde görünen kullanıcı veya üçüncü taraf içerikleri, ilgili sağlayıcıların sorumluluğundadır. İşleten, bu içerikleri bilgilendirme amacıyla aracılık eder; yasa gereği zorunlu denetim veya hak ihlâline dair bilgi edinildiğinde müdahale yükümlülüğü saklıdır.",
            "Harici web sitelerine bağlantılar, yalnızca kullanıcı kolaylığı içindir. Bağlantı verilen sitelerin içeriği üzerinde işletenin etkisi yoktur; bu nedenle bağlantı anında ilgili sitelerin içeriği için sorumluluk üstlenilmez.",
          ],
        },
      ],
    };
  }

  return {
    title: "Impressum",
    intro:
      "Dieses Impressum erfüllt die Informationspflichten für digitale Dienste mit Bezug zum deutschen Rechtsraum und dient der transparenten Anbieterkennzeichnung der Plattform MerhabaMap. Es ersetzt keine individuelle Rechtsberatung. Stand: März 2026.",
    sections: [
      {
        title: "Angaben gemäß § 5 DDG",
        paragraphs: [
          `Anbieter dieser Website und des Online-Angebots „MerhabaMap“ ist die ${company.entityName}. MerhabaMap ist eine informations- und community-orientierte Plattform zur Entdeckung von Orten und Veranstaltungen. Die ladungsfähige Anschrift lautet: ${company.addressLines.join(", ")}.`,
          "Ergänzende Hinweise zur Verarbeitung personenbezogener Daten finden Sie in der Datenschutzerklärung. Dieses Impressum konzentriert sich auf Anbieteridentität, Vertretung und Erreichbarkeit.",
        ],
      },
      {
        title: "Vertretungsberechtigte Gesellschafter",
        paragraphs: [
          `Gesellschaftsrechtlich vertretungsberechtigt sind die Gesellschafter: ${company.legalRepresentatives.join(", ")}. Sie vertreten die GbR nach außen im Rahmen der gesetzlichen und gesellschaftsvertraglichen Regelungen.`,
        ],
      },
      {
        title: "Kontakt",
        paragraphs: [
          "Für allgemeine Anfragen, behördliche Zustellungen im erlaubten Umfang sowie für Rückfragen zum Betrieb der Plattform können Sie die folgenden Kontaktdaten nutzen. Für den Nachweis und die Dokumentation empfiehlt sich die schriftliche Kontaktaufnahme per E-Mail.",
          contactParagraphs.join(" · "),
        ],
      },
      {
        title: "Verantwortlich für journalistisch-redaktionelle Inhalte gemäß § 18 Abs. 2 MStV",
        paragraphs: [
          `Für journalistisch-redaktionelle Inhalte im Sinne des Medienstaatsvertrags ist verantwortlich: ${company.contentResponsiblePerson}. Diese Angabe bezieht sich auf Inhalte, die unter den Anwendungsbereich der genannten Vorschrift fallen können.`,
        ],
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
              paragraphs: [
                `Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz: ${company.vatId}. Steuerliche Verpflichtungen richten sich nach den jeweils anwendbaren nationalen Vorschriften.`,
              ],
            },
          ]
        : []),
      {
        title: "Haftung für Inhalte und Links",
        paragraphs: [
          "Als Diensteanbieter sind wir gemäß den allgemeinen gesetzlichen Vorgaben für eigene Inhalte auf diesen Seiten verantwortlich. Für fremde Inhalte, etwa in Nutzerbeiträgen, eingereichten Orts- oder Veranstaltungsdaten oder in Kommunikation zwischen Nutzern, haften wir grundsätzlich nur, soweit uns Kenntnis einer konkreten Rechtsverletzung zukommt und die technische Entfernung oder Sperrung zumutbar ist.",
          "Unser Angebot kann Links zu externen Websites Dritter enthalten. Auf deren Inhalte haben wir keinen Einfluss; deshalb können wir für diese fremden Inhalte keine Gewähr übernehmen. Zum Zeitpunkt der Verlinkung waren die verlinkten Seiten jedoch frei von erkennbaren Rechtsverletzungen. Bei Bekanntwerden von Rechtsverletzungen werden derartige Links unverzüglich entfernt, soweit technisch und organisatorisch zumutbar.",
        ],
      },
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
        "Bu metin, Avrupa Birliği Genel Veri Koruma Tüzüğü (GDPR) ve Almanya Federal Veri Koruma Yasası (BDSG) çerçevesinde, MerhabaMap kullanımı sırasında kişisel verilerin hangi kapsamda, hangi amaçlarla ve hangi hukuki dayanaklarla işlendiğini açıklar. Veri sorumlusu, aşağıda kimlik bilgileri yer alan işletendir. Metin, mevcut ürün ve teknik mimariye göre hazırlanmıştır; işlevler genişledikçe güncellenmelidir. Stand: Mart 2026.",
      sections: [
        {
          title: "Veri sorumlusu",
          paragraphs: [
            `Kişisel verilerden sorumlu olan taraf: ${company.entityName}. Adres: ${company.addressLines.join(", ")}.`,
            "Veri sorumlusu, GDPR anlamında işleme faaliyetlerinin amaçlarını ve araçlarını belirleyen ve bunlarla ilgili kararları veren tüzel veya gerçek kişi veya yapı olarak anlaşılır.",
          ],
        },
        {
          title: "İletişim ve veri koruma ile ilgili talepler",
          paragraphs: [
            `Genel iletişim için ${company.infoEmail} adresi kullanılabilir. Veri koruma konuları, hak talepleri ve gizlilikle ilgili şikâyetler için ayrıca ${company.privacyContactEmail} adresi öngörülmüştür. Taleplerinizi mümkün olduğunca net ve kimlik doğrulamasına imkân verecek şekilde iletmeniz, işleme süresini kısaltır.`,
          ],
        },
        {
          title: "İşlenen veri kategorileri",
          paragraphs: [
            "Hesap oluşturma ve oturum açma sırasında e-posta adresi, kullanıcı adı ve parolanın tek yönlü özetlenmiş (hash) hali işlenir; parola düz metin olarak saklanmaz. Oturum yönetimi ve güvenlik için tarayıcı çerezleri ve sunucu tarafında oturumla bağlantılı teknik kayıtlar kullanılabilir.",
            "Platformda raporlama, bildirim, işletme talebi (claim), içerik önerisi veya destek süreçleri kullanıldığında, bu bağlamlarda ilettiğiniz metinler, iletişim verileri ve teknik protokol verileri işlenebilir. Doğrudan e-posta ile iletişim kurduğunuzda, gönderdiğiniz mesajın içeriği ve iletişim meta verileri (gönderim zamanı, konu başlığı vb.) işlenir.",
            "„Kayıtlı“ veya benzeri işlevler kullanıldığında, seçtiğiniz mekân tanımlayıcıları tarayıcınızda yerel olarak (ör. localStorage) saklanabilir; bu veriler sunucuya yalnızca ilgili ürün akışı açıkça böyle tasarlandıysa aktarılır. Web sitesinin güvenli sunumu için sunucu ve ağ katmanında bağlantı verileri, hata günlükleri ve sınırlı teknik analitik bilgiler oluşabilir.",
          ],
        },
        {
          title: "İşleme amaçları ve hukuki dayanaklar",
          paragraphs: [
            "Hesabın açılması ve sürdürülmesi, sözleşmenin kurulması ve ifası kapsamında gerekli işlemler GDPR md. 6(1)(b) uyarınca yapılır. Bildirimlerin, taleplerin ve müşteri iletişiminin değerlendirilmesi, duruma göre sözleşmeye hazırlık veya ifa (md. 6(1)(b)) veya meşru menfaat (md. 6(1)(f)) — örneğin dolandırıcılığın önlenmesi veya hukuki iddiaların savunulması — üzerine dayanabilir.",
            "Bilgi güvenliği, kötüye kullanımın tespiti, hizmet istikrarı ve hata giderme, GDPR md. 6(1)(f) kapsamında veri sorumlusunun meşru menfaatine dayanır; bu menfaat, kullanıcıların güvenliği ve platformun sürdürülebilir işletimi ile dengelenir. Yasal saklama veya raporlama yükümlülükleri varsa, işleme GDPR md. 6(1)(c) uyarınca yasal yükümlülüğe dayanır.",
          ],
        },
        {
          title: "Barındırma ve teknik hizmet sağlayıcıları",
          paragraphs: [
            "Uygulama, Netlify üzerinde oluşturulur ve barındırılır; içerik dağıtımı Netlify ağı üzerinden yapılır (ayrıntılar depo dokümantasyonunda). Veritabanı olarak yönetilen PostgreSQL hizmeti DigitalOcean tarafından sağlanır; bağlantı, dağıtım ortamındaki DATABASE_URL yapılandırması ile kurulur.",
            "Harita görünümleri istemci tarafında yüklenir. Barındırma ortamında (ör. Netlify) yapılandırılmış bir MapTiler API anahtarı varsa Pastel raster karoları kullanılır; aksi halde OpenStreetMap proje sunucularından (tile.openstreetmap.org) standart karolar yüklenir. MapTiler yüklemesinde tekrarlayan hatalar oluşursa uygulama OpenStreetMap’e geçebilir; bu sırada istekler ilgili karo sunucusuna gider.",
            "Ortam değişkenleri üzerinden yapılandırıldığında, medya veya dosyalar için S3 uyumlu nesne depolama (örnek yapılandırma depoda Cloudflare R2 ile belgelenmiştir) kullanılabilir. Hangi sağlayıcıların fiilen etkin olduğu, ilgili dağıtımın çevre değişkenlerine bağlıdır.",
          ],
        },
        {
          title: "E-posta iletişimi",
          paragraphs: [
            "Mevcut üretim kurulumunda, hesapla ilgili ve doğrudan iş iletişimi e-postaları Zoho altyapısı üzerinden gönderilir ve alınır. Bu bağlamda alıcı ve gönderici adresleri, teslimat durumu ve iletişi içeriği işlenebilir.",
          ],
        },
        {
          title: "Alıcılar ve olası üçüncü ülke aktarımı",
          paragraphs: [
            "Kişisel veriler, platformun işletilmesi için zorunlu olduğu ölçüde, yukarıda adı geçen teknik hizmet sağlayıcılarına aktarılır. Bazı sağlayıcılar verileri Avrupa Birliği veya Avrupa Ekonomik Alanı dışında işleyebilir.",
            "Üçüncü ülkeye aktarım yalnızca GDPR’da öngörülen güvencelerle yapılır — örneğin Avrupa Komisyonu’nun yeterlilik kararı, uygun garantiler (standart sözleşme maddeleri) veya — nadir ve sıkı koşullarda — istisnai hükümler. İlgili garantilerin bir kopyası, makul talep üzerine ve yasal sınırlar içinde sağlanabilir.",
          ],
        },
        {
          title: "Çerezler ve benzeri teknolojiler",
          paragraphs: [
            "Oturum ve kimlik doğrulama için Auth.js/NextAuth bir oturum çerezi kullanır (üretimde adı genellikle __Secure-authjs.session-token, geliştirmede authjs.session-token). Dil seçici kullanıldığında NEXT_LOCALE çerezi ayarlanabilir. Bu çerezler, hizmetin talep edilen işlevlerini sağlamak için teknik olarak gerekli kabul edilir.",
            "Kayıtlı mekân listesi gibi veriler tarayıcıda localStorage ile tutulabilir. İsteğe bağlı pazarlama, reklam veya geniş kapsamlı analitik çerezleri mevcut kod tabanında kullanılmamaktadır; bu durum değişirse bu politika ve gerekirse onay mekanizmaları güncellenmelidir.",
          ],
        },
        {
          title: "İletişim kanalları",
          paragraphs: [
            "Şu anda ayrı bir bülten veya genel iletişim formu sunulmamaktadır. İletişim öncelikle e-posta ile yapılır. İleride formlar veya bültenler eklenirse, ilgili veri işleme bu metinde veya ayrı bilgilendirmelerde açıklanır.",
          ],
        },
        {
          title: "Sorunlu içerikleri bildirme",
          paragraphs: [
            "Yayındaki mekân ve etkinlikler için arayüzde raporlama (bildirim) işlevleri bulunur; uygun olduğunda işletme talebi (claim) ve benzeri süreçler de kullanılabilir. Etkili inceleme için ilgili sayfanın bağlantısı veya adı, sorunun kısa ve tarafsız özeti ve varsa delil veya kaynak belirtilmesi önerilir.",
            "MerhabaMap, bildirimleri örgütsel imkânlar çerçevesinde ve önceliklendirerek işlemeye çalışır; sabit yanıt süreleri taahhüt edilmez. İçerikler, yasal zorunluluk veya platform kuralları uyarınca sınırlandırılabilir, düzeltilebilir veya kaldırılabilir.",
            `Veri koruma başvuruları yalnızca ${company.privacyContactEmail} adresine iletilmelidir. Diğer hukuki veya editoryal başvurular, iletişim sayfası ve bu metinde yer alan e-posta adresleri üzerinden yapılabilir.`,
          ],
        },
        {
          title: "Saklama süreleri",
          paragraphs: [
            "Kişisel veriler, ilgili işleme amacının gerektirdiği süre boyunca ve yasal saklama süreleri (örneğin ticaret veya vergi hukuku) çerçevesinde tutulur. Hesap silindiğinde, silme yükümlülükleri ile çakışmayan veriler genellikle silinir veya anonimleştirilir; yasal olarak saklanması gereken kayıtlar istisna oluşturabilir.",
            "Tarayıcıda yerel saklanan veriler, yalnızca kullanıcının cihazında kalır ve tarayıcı ayarlarından veya önbelleği temizleyerek kaldırılabilir.",
          ],
        },
        {
          title: "Haklarınız",
          paragraphs: [
            "GDPR kapsamında, kişisel verilerinizin işlenip işlenmediğini öğrenme, işleniyorsa buna ilişkin bilgi talep etme, yanlış veya eksik verilerin düzeltilmesini isteme, belirli koşullarda silinmesini veya işlenmesinin kısıtlanmasını talep etme, meşru menfaate dayalı işlemeye itiraz etme ve — sözleşmeye dayalı veya otomatik işlenen verilerde — veri taşınabilirliği hakkına sahipsiniz.",
            "Bu hakların kullanımı ücretsizdir; ancak açıkça temelsiz veya aşırı tekrarlayan taleplerde, GDPR md. 12 uyarınca makul bir ücret veya talebin reddi söz konusu olabilir.",
          ],
        },
        {
          title: "Şikâyet hakkı",
          paragraphs: [
            "Veri işlemesinden şikâyet etme hakkına sahipsiniz. Şikâyet, ikamet ettiğiniz üye devletin, çalıştığınız yerin veya iddia edilen ihlalin gerçekleştiği yerin denetim otoritesine yapılabilir. Veri sorumlusunun bulunduğu eyaletteki denetim otoritesi de yetkili olabilir.",
          ],
        },
      ],
    };
  }

  return {
    title: "Datenschutzerklärung",
    intro:
      "Diese Datenschutzerklärung informiert Sie nach Art. 13 und 14 der Datenschutz-Grundverordnung (DSGVO) in Verbindung mit dem Bundesdatenschutzgesetz (BDSG) über die Verarbeitung personenbezogener Daten bei der Nutzung von MerhabaMap. Maßgeblich ist der jeweilige Stand der Plattform und der dokumentierten technischen Infrastruktur. Stand: März 2026.",
    sections: [
      {
        title: "Verantwortlicher",
        paragraphs: [
          `Verantwortlicher im Sinne der DSGVO ist die ${company.entityName}, erreichbar unter der Anschrift ${company.addressLines.join(", ")}.`,
          "Der Verantwortliche bestimmt allein oder gemeinsam mit anderen die Zwecke und Mittel der Verarbeitung personenbezogener Daten.",
        ],
      },
      {
        title: "Kontakt für Datenschutzanliegen",
        paragraphs: [
          `Für allgemeine Anfragen können Sie ${company.infoEmail} nutzen. Für Anfragen zum Datenschutz, zur Ausübung Ihrer Betroffenenrechte und für Vertrauliches im Zusammenhang mit personenbezogenen Daten ist ${company.privacyContactEmail} vorgesehen. Bitte beschreiben Sie Ihr Anliegen möglichst konkret, damit wir Ihre Identität angemessen prüfen und schneller antworten können.`,
        ],
      },
      {
        title: "Verarbeitete Datenkategorien",
        paragraphs: [
          "Bei Registrierung und Anmeldung verarbeiten wir insbesondere Ihre E-Mail-Adresse, einen von Ihnen gewählten Nutzernamen sowie ein kryptografisch gehashtes Passwort; das Passwort wird nicht im Klartext gespeichert. Für die Authentifizierung und zum Schutz vor Missbrauch fallen ferner Sitzungsdaten, Sicherheitsereignisse und begleitende technische Protokolldaten an.",
          "Wenn Sie Meldungen (Reports) auslösen, Inhalte einreichen, Business-Claims stellen oder den Support kontaktieren, verarbeiten wir die von Ihnen eingegebenen Texte, ggf. Anhänge, Kontaktdaten und die zur Bearbeitung erforderlichen Metadaten. Wenn Sie uns per E-Mail kontaktieren, verarbeiten wir den Inhalt der Nachricht sowie die üblichen Kopfdaten (Absender, Zeitstempel, Betreff).",
          "Die Funktion „Gespeichert“ kann ausgewählte Orte lokal in Ihrem Browser (z. B. im localStorage) ablegen, ohne dass diese Auswahl zwingend mit einem Serverkonto synchronisiert werden muss — es sei denn, die Produktlogik sieht ausdrücklich eine serverseitige Speicherung vor. Zur sicheren Bereitstellung der Website können zudem Verbindungsdaten, begrenzte Logdaten und Infrastrukturmetriken bei Hosting- und Datenbankdienstleistern anfallen.",
        ],
      },
      {
        title: "Zwecke der Verarbeitung und Rechtsgrundlagen",
        paragraphs: [
          "Die Bereitstellung des Nutzerkontos, der Login-Funktion und der vertraglich geschuldeten Plattformleistungen erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung bzw. vorvertragliche Maßnahmen). Die Bearbeitung von Meldungen, Claims und Supportanfragen stützt sich je nach Sachverhalt auf Art. 6 Abs. 1 lit. b DSGVO oder auf Art. 6 Abs. 1 lit. f DSGVO, soweit ein berechtigtes Interesse an der Integrität der Plattform, an der Abwehr rechtswidriger Inhalte und an der Rechtsverfolgung besteht.",
          "Die Gewährleistung der IT-Sicherheit, die Missbrauchsprävention, die Stabilität des Dienstes und die Fehleranalyse stützen sich auf Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse liegt in einem sicheren, zuverlässigen Betrieb; dieses Interesse wird mit Ihren Grundrechten und Freiheiten abgewogen. Soweit wir gesetzlichen Aufbewahrungs- oder Auskunftspflichten unterliegen, ist Art. 6 Abs. 1 lit. c DSGVO einschlägig.",
        ],
      },
      {
        title: "Hosting und technische Dienstleister",
        paragraphs: [
          "Die Next.js-Anwendung wird über Netlify gebaut, gehostet und über das Netlify-Netzwerk ausgeliefert (Einzelheiten siehe Projektdokumentation). Als verwaltete Datenbank wird PostgreSQL bei DigitalOcean eingesetzt; die Anbindung erfolgt über die in der jeweiligen Umgebung konfigurierte Datenbank-URL.",
          "Kartenkacheln werden im Browser geladen. Ist in der Hosting-Umgebung (z. B. Netlify) ein MapTiler-API-Schlüssel hinterlegt, werden Rasterkacheln von MapTiler („Pastel“) bezogen; ohne Schlüssel nutzen wir die Standardkacheln der OpenStreetMap-Projektserver unter tile.openstreetmap.org. Bei wiederholten Ladefehlern mit MapTiler kann die Anwendung automatisch auf OpenStreetMap wechseln; dabei werden Anfragen an den jeweiligen Kachelserver gerichtet.",
          "Optional können über Umgebungsvariablen S3-kompatible Objektspeicher für Medien oder Dateien angebunden sein (in den .env-Beispielen des Repositories u. a. mit Cloudflare R2 skizziert). Welche Speicherdienste tatsächlich aktiv sind, hängt von der konkreten Deploy-Konfiguration ab.",
        ],
      },
      {
        title: "E-Mail-Kommunikation",
        paragraphs: [
          "Im derzeitigen Produktivbetrieb nutzen wir Zoho für den Versand und Empfang transaktionaler und geschäftsbezogener E-Mails. Dabei werden insbesondere Empfänger- und Absenderadressen, Übermittlungsmetadaten sowie der Nachrichteninhalt verarbeitet.",
        ],
      },
      {
        title: "Empfänger und mögliche Drittlandübermittlung",
        paragraphs: [
          "Personenbezogene Daten werden an die vorgenannten technischen Dienstleister weitergegeben, soweit dies für den Betrieb der Plattform erforderlich ist. Einzelne Anbieter können Daten auch in Staaten außerhalb der Europäischen Union oder des Europäischen Wirtschaftsraums verarbeiten.",
          "Eine Übermittlung in Drittländer erfolgt nur, wenn die Voraussetzungen der Kapitel V DSGVO erfüllt sind — etwa durch einen Angemessenheitsbeschluss der Kommission, durch geeignete Garantien (insbesondere die Standardvertragsklauseln der EU-Kommission) oder in den eng begrenzten Ausnahmefällen des Art. 49 DSGVO. Auf Anfrage teilen wir Ihnen mit, welche Garantien im Einzelfall vorliegen, soweit gesetzlich zulässig und zumutbar.",
        ],
      },
      {
        title: "Cookies und ähnliche Technologien",
        paragraphs: [
          "Für Sitzung und Anmeldung setzt Auth.js/NextAuth ein Session-Cookie (in der Produktionsumgebung typischerweise __Secure-authjs.session-token, in der Entwicklungsumgebung authjs.session-token). Über den Sprachschalter kann ein Cookie NEXT_LOCALE gesetzt werden. Diese Technologien sind nach dem derzeitigen Verständnis überwiegend technisch notwendig, um die von Ihnen angeforderten Funktionen bereitzustellen.",
          "Für die Merkliste „Gespeichert“ kann der Browser-Speicher (localStorage) genutzt werden. Im Frontend sind keine optionalen Analytics-, Marketing- oder Werbe-Cookies implementiert. Sollte sich dies ändern, werden diese Erklärung und gegebenenfalls Einwilligungsmechanismen vorab angepasst.",
        ],
      },
      {
        title: "Kontaktkanäle",
        paragraphs: [
          "Derzeit besteht kein Newsletter und kein allgemeines Web-Formular für Kontaktanfragen. Die Kontaktaufnahme erfolgt vorrangig per E-Mail. Sollten wir Formulare oder Newsletter einführen, werden Zweck und Umfang der Datenverarbeitung gesondert und vorab erläutert.",
        ],
      },
      {
        title: "Melden problematischer Inhalte",
        paragraphs: [
          "Für veröffentlichte Orte und Veranstaltungen stehen Meldefunktionen in der Oberfläche zur Verfügung; wo vorgesehen, können ergänzend Business-Claims oder vergleichbare Verfahren genutzt werden. Für eine zügige Prüfung empfehlen wir die Angabe des betroffenen Links oder Namens, einer sachlichen Kurzbeschreibung des Problems sowie — soweit vorhanden — Belege oder Quellenhinweise.",
          "Wir bearbeiten Hinweise im Rahmen unserer organisatorischen Möglichkeiten und priorisieren nach Dringlichkeit und Rechtsrisiko; feste Bearbeitungsfristen können wir nicht zusagen. Inhalte können eingeschränkt, berichtigt oder entfernt werden, sofern dies rechtlich geboten oder nach unseren Community- und Nutzungsregeln zulässig ist.",
          `Datenschutzanliegen richten Sie bitte ausschließlich an ${company.privacyContactEmail}. Weitere inhaltliche oder rechtliche Hinweise können Sie über die auf der Kontaktseite genannten Adressen vortragen.`,
        ],
      },
      {
        title: "Speicherdauer",
        paragraphs: [
          "Wir speichern personenbezogene Daten nur so lange, wie dies für die jeweiligen Zwecke erforderlich ist oder gesetzliche Aufbewahrungspflichten entgegenstehen. Nach Löschung des Nutzerkontos entfernen oder anonymisieren wir Daten, soweit keine Aufbewahrungspflichten oder berechtigten Interessen an einer Fortspeicherung (z. B. zur Rechtsverteidigung) entgegenstehen.",
          "Lokal im Browser gespeicherte Informationen unterliegen Ihrer eigenen Kontrolle und können dort jederzeit gelöscht werden.",
        ],
      },
      {
        title: "Betroffenenrechte",
        paragraphs: [
          "Sie haben das Recht auf Auskunft über die Sie betreffenden personenbezogenen Daten (Art. 15 DSGVO), auf Berichtigung unrichtiger Daten (Art. 16 DSGVO), auf Löschung (Art. 17 DSGVO), auf Einschränkung der Verarbeitung (Art. 18 DSGVO), auf Widerspruch gegen Verarbeitungen, die auf Art. 6 Abs. 1 lit. f DSGVO beruhen (Art. 21 DSGVO), sowie — soweit voraussetzungen erfüllt sind — auf Datenübertragbarkeit (Art. 20 DSGVO).",
          "Die Ausübung dieser Rechte ist grundsätzlich unentgeltlich. Nach Art. 12 Abs. 5 DSGVO kann bei offensichtlich unbegründeten oder — insbesondere bei Wiederholung — exzessiven Anträgen ein angemessenes Entgelt verlangt oder der Antrag abgelehnt werden.",
        ],
      },
      {
        title: "Beschwerderecht",
        paragraphs: [
          "Unbeschadet eines anderweitigen verwaltungsrechtlichen oder gerichtlichen Rechtsbehelfs steht Ihnen das Recht auf Beschwerde bei einer Aufsichtsbehörde zu, insbesondere in dem Mitgliedstaat Ihres gewöhnlichen Aufenthaltsorts, Ihres Arbeitsplatzes oder des Orts der mutmaßlichen Verletzung (Art. 77 DSGVO). Zuständig kann auch die Aufsichtsbehörde am Sitz des Verantwortlichen sein.",
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
        "Bu sayfa, MerhabaMap ile resmi ve yapılandırılmış iletişim kurmak isteyen kullanıcılar, iş ortakları ve makamlar için iletişim yollarını açıklar. Hukuki ve veri koruma konularında özel adresler tanımlanmıştır; böylece taleplerin doğru birime yönlendirilmesi kolaylaşır.",
      sections: [
        {
          title: "Genel iletişim",
          paragraphs: [
            "Genel sorular, öneriler ve iş birliği teklifleri için aşağıdaki kanallar kullanılabilir. E-posta, metin ve eklerin güvenli şekilde iletilmesi ve arşivlenmesi açısından tercih edilen yöntemdir. Telefonla yapılan görüşmelerde, talebin özeti mümkünse yazılı olarak da iletilmelidir.",
            `${contactParagraphs.join(" · ")} MerhabaMap, sınırlı kaynaklarla çalışan bir platform olduğundan yanıtlar önceliklendirilir; acil güvenlik veya hukuki risk içeren başvurular öne alınabilir.`,
          ],
        },
        {
          title: "Gizlilik ve veri koruma",
          paragraphs: [
            `Kişisel veriler, GDPR kapsamındaki haklar veya gizlilik şikâyetleri için lütfen ${company.privacyContactEmail} adresini kullanın. Bu ayrım, talebinizin veri koruma yükümlülükleri çerçevesinde işlenmesini sağlar.`,
          ],
        },
        {
          title: "İletişim şekli ve formlar",
          paragraphs: [
            "Şu anda genel iletişim formu veya bülten kaydı sunulmamaktadır. İletişim doğrudan e-posta üzerinden yapılır. İleride form veya bülten eklenirse, veri işleme ayrıca bilgilendirilecektir.",
          ],
        },
        {
          title: "Yanıt süreleri ve beklentiler",
          paragraphs: [
            "Yanıt süreleri konuya, kapsama ve mevcut iş yüküne bağlıdır. Basit bilgi talepleri genellikle daha kısa sürede yanıtlanır; hukuki inceleme, kimlik doğrulama veya üçüncü tarafların dahil olduğu konularda süre uzayabilir. Acil güvenlik açıkları veya çocukların güvenliğini ilgilendiren ciddi ihlâl bildirimleri mümkün olduğunca önceliklendirilir.",
          ],
        },
      ],
    };
  }

  return {
    title: "Kontakt",
    intro:
      "Diese Seite beschreibt, wie Sie MerhabaMap für allgemeine Anliegen, für datenschutzrechtliche Fragen und für geschäftliche Kontakte erreichen. Eine klare Kanaltrennung hilft, Ihre Anfrage zügig der zuständigen Stelle zuzuleiten.",
    sections: [
      {
        title: "Kontaktmöglichkeiten",
        paragraphs: [
          "Für allgemeine Rückfragen, Kooperationsanfragen und nicht-dringliche Hinweise stehen Ihnen die folgenden Kontaktwege zur Verfügung. Schriftliche Kommunikation per E-Mail ist vorzugswürdig, weil Inhalte nachvollziehbar dokumentiert werden können. Wenn Sie telefonisch Kontakt aufnehmen, empfiehlt sich eine kurze schriftliche Zusammenfassung des Gesprächsgegenstands.",
          `${contactParagraphs.join(" · ")} Als community-orientierte Plattform priorisieren wir Anfragen nach Dringlichkeit und rechtlicher Relevanz; ein Anspruch auf sofortige Bearbeitung besteht nicht.`,
        ],
      },
      {
        title: "Datenschutzanfragen",
        paragraphs: [
          `Bitte richten Sie Anfragen zu personenbezogenen Daten, zur Ausübung Ihrer Betroffenenrechte und spezifische Datenschutzbeschwerden ausschließlich an ${company.privacyContactEmail}, damit diese gesondert und unter Beachtung der gesetzlichen Fristen bearbeitet werden können.`,
        ],
      },
      {
        title: "Kontaktweg und Formulare",
        paragraphs: [
          "Derzeit stellen wir kein allgemeines Kontaktformular und keinen Newsletter bereit. Die Kontaktaufnahme erfolgt unmittelbar per E-Mail. Sollten wir Formulare oder Newsletter einführen, informieren wir gesondert über Zweck und Rechtsgrundlagen der Datenverarbeitung.",
        ],
      },
      {
        title: "Erwartbare Antwortzeiten",
        paragraphs: [
          "Antwortzeiten hängen von Komplexität, erforderlicher Prüfung und aktueller Auslastung ab. Einfache Auskünfte können in der Regel zügiger beantwortet werden als Anliegen, die Identitätsprüfung, Abstimmung mit Dienstleistern oder rechtliche Würdigung erfordern. Hinweise zu schwerwiegenden Sicherheitsvorfällen oder zu Inhalten, die unmittelbare Risiken für Personen bergen, werden nach Möglichkeit vorrangig bearbeitet.",
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
        "Bu bilgilendirme, MerhabaMap’in tarayıcıda hangi çerezleri ve yerel depolama mekanizmalarını kullandığını, bunların amacını ve — GDPR açısından — hangi hukuki dayanağa dayandığını açıklar. Pazarlama veya geniş analitik çerezleri şu an kullanılmamaktadır. Stand: Mart 2026.",
      sections: [
        {
          title: "Teknik olarak gerekli çerezler ve depolama",
          paragraphs: [
            "Kimlik doğrulama ve oturum sürekliliği için Auth.js/NextAuth bir oturum çerezi yerleştirir; üretimde adı genellikle __Secure-authjs.session-token, geliştirme ortamında authjs.session-token şeklindedir. Bu çerez olmadan, güvenli oturum açma ve hesaba bağlı işlevler teknik olarak sağlanamaz.",
            "Dil seçici kullanıldığında, tercihin hatırlanması için NEXT_LOCALE çerezi ayarlanabilir. Kayıtlı mekân listesi gibi veriler, sunucuya aktarılmadan yalnızca cihazınızda localStorage üzerinde tutulabilir; bu işlem tarayıcı tarafında yerel depolamadır ve GDPR’da çerezlere benzer şekilde şeffaflık gerektirir.",
          ],
        },
        {
          title: "Hukuki dayanak",
          paragraphs: [
            "Teknik olarak zorunlu çerezler ve oturum yönetimi, hizmetin kullanılması ve — hesap açılmışsa — sözleşmenin ifası için genellikle GDPR md. 6(1)(b) kapsamında gerekli görülür. Güvenlik ve dolandırıcılığın önlenmesi amacıyla sınırlı ölçüdeki işlemler, md. 6(1)(f) kapsamında meşru menfaate dayanabilir.",
          ],
        },
        {
          title: "İsteğe bağlı takip bulunmaması",
          paragraphs: [
            "Ürünün mevcut sürümünde, reklam veya kapsamlı davranış analizi için üçüncü taraf izleme pikselleri veya isteğe bağlı analitik çerezleri kullanılmamaktadır. Harita karoları gibi içerikler istemci tarafında yüklenir; bu, çerez politikasından farklı olarak gizlilik bildiriminde açıklanan sağlayıcı erişimleri ile ilişkilidir.",
          ],
        },
        {
          title: "Onay ve gelecekteki değişiklikler",
          paragraphs: [
            "İsteğe bağlı takip çerezleri kullanılmadığından, şu an için ayrı bir pazarlama onayı banner’ı öngörülmemiştir. İleride analitik veya reklam çerezleri eklenirse, öncesinde bilgilendirme yapılacak ve — yasal olarak gerekliyse — açık rıza alınacaktır. Tarayıcı ayarlarınızdan çerezleri kısıtlayabilirsiniz; bu durumda bazı işlevler kısmen veya tamamen kullanılamayabilir.",
          ],
        },
      ],
    };
  }

  return {
    title: "Cookies und ähnliche Technologien",
    intro:
      "Die folgenden Angaben beschreiben den Einsatz von Cookies und vergleichbaren lokalen Speichertechniken auf MerhabaMap, deren Funktion und — soweit einschlägig — die Rechtsgrundlagen nach DSGVO. Stand: März 2026.",
    sections: [
      {
        title: "Technisch erforderliche Cookies und Speichermechanismen",
        paragraphs: [
          "Für die Anmeldung und die aufrechterhaltene Sitzung setzt Auth.js/NextAuth ein Session-Cookie (in der Produktionsumgebung typischerweise __Secure-authjs.session-token, in der Entwicklungsumgebung authjs.session-token). Ohne diese Technologie können wir eine sichere Authentifizierung und den zugehörigen Sitzungszustand nicht bereitstellen.",
          "Wenn Sie die Sprache über den Schalter wechseln, kann ein Cookie NEXT_LOCALE gesetzt werden, damit Ihre Präferenz bei Folgeaufrufen erhalten bleibt. Für die Merkliste „Gespeichert“ kann der Browser localStorage verwenden; dabei handelt es sich um eine lokale Speicherung auf Ihrem Endgerät, die wir transparent wie Cookies behandeln.",
        ],
      },
      {
        title: "Rechtsgrundlagen",
        paragraphs: [
          "Technisch notwendige Cookies und die Speicherung von Sitzungsdaten sind überwiegend zur Vertragserfüllung erforderlich, soweit Sie ein Nutzerkonto nutzen (Art. 6 Abs. 1 lit. b DSGVO). Soweit keine Vertragsbeziehung besteht, aber die Bereitstellung ausdrücklich angeforderter Funktionen erfolgt, kann ebenfalls Art. 6 Abs. 1 lit. b DSGVO einschlägig sein. Begleitende Sicherheitsmaßnahmen können zusätzlich auf Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an Integrität und Missbrauchsprävention) gestützt werden.",
        ],
      },
      {
        title: "Kein optionales Tracking nach aktuellem Stand",
        paragraphs: [
          "Im Frontend sind keine separaten Marketing-, Werbe- oder umfassenden Analytics-Cookies eingebunden, die ein verhaltensbezogenes Profiling ermöglichen. Die Darstellung von Kartenkacheln erfolgt clientseitig und wird — einschließlich der beteiligten Anbieter — in der Datenschutzerklärung erläutert; sie ist von dieser Cookie-Übersicht inhaltlich zu unterscheiden.",
        ],
      },
      {
        title: "Einwilligung und spätere Änderungen",
        paragraphs: [
          "Solange keine optionalen Tracking- oder Marketing-Cookies eingesetzt werden, ist kein gesonderter Consent-Banner erforderlich. Sobald wir nicht notwendige Cookies einsetzen, werden wir Sie vorab informieren und — sofern gesetzlich erforderlich — eine wirksame Einholung von Einwilligungen vorsehen. Sie können Cookies in Ihren Browsereinstellungen einschränken oder löschen; dadurch können einzelne Funktionen eingeschränkt oder unbenutzbar werden.",
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
        "Bu kullanım koşulları, MerhabaMap’e erişim ve kullanım ile ilgili tarafların hak ve yükümlülüklerini düzenler. Platform, bilgilendirme ve topluluk odaklı bir keşif hizmetidir; tüketici hukuku veya B2B ilişkileri açısından ek şartlar ayrı sözleşmelerle kararlaştırılabilir. Stand: Mart 2026.",
      sections: [
        {
          title: "Sözleşmenin konusu ve kapsamı",
          paragraphs: [
            "MerhabaMap, Almanya ve ilgili bölgelerde yaşayan topluluklar için mekân, etkinlik ve yönlendirme bilgileri sunan dijital bir platformdur. Hizmetin kapsamı, yayında olan yazılım sürümü ve içerik politikaları ile belirlenir; belirli bir özelliğin süresiz sunulacağı taahhüt edilmez.",
            "Bu koşullar, platforma erişen ve — varsa — hesap oluşturan her kullanıcı için geçerlidir. Özel kampanyalar veya iş ortaklığı anlaşmaları yazılı olarak aksi kararlaştırılmadıkça bu metni tamamlayıcı niteliktedir.",
          ],
        },
        {
          title: "Kullanıcı yükümlülükleri",
          paragraphs: [
            "Hesap bilgilerinizin gizliliğinden ve yetkisiz kullanımdan siz sorumlusunuz. Platforma ilettiğiniz metinlerin, görsellerin ve diğer içeriklerin yasalara ve üçüncü kişilerin haklarına uygun olması gerekir. Yanıltıcı kimlik, sahte konum veya manipülatif değerlendirme davranışları yasaktır.",
          ],
        },
        {
          title: "Yasaklanan içerik ve davranışlar",
          paragraphs: [
            "Nefret söylemi, ayrımcılık, şiddeti teşvik, kişilik haklarına saldırı, fikri mülkiyet ihlâli, yanıltıcı ticari uygulama veya yasa dışı faaliyetlere yönelik içerik veya bağlantılar yasaktır. Platformun güvenliğini tehdit eden, aşırı yük oluşturan veya otomasyonla kötüye kullanan davranışlar — örneğer botlarla izinsiz tarama — yasaktır.",
            "Ticari tanıtım, yalnızca topluluk kuralları ve — varsa — ilgili ücretli veya onaylı işletme özellikleri çerçevesinde yapılabilir. Bağlamsız spam veya alakasız toplu mesajlar yasaktır.",
          ],
        },
        {
          title: "Moderasyon ve hesap önlemleri",
          paragraphs: [
            "MerhabaMap, yasal yükümlülükler ve platform bütünlüğü çerçevesinde içerikleri ön inceleyebilir, kullanıcı bildirimlerini değerlendirebilir, içerikleri düzeltebilir, gizleyebilir veya kaldırabilir. Tekrarlayan veya ağır ihlâllerde hesap geçici veya kalıcı olarak kısıtlanabilir veya sonlandırılabilir.",
            "Önlem alınmadan önce — makul ölçüde — içerik sağlayıcısına açıklama imkânı tanınabilir; acil hukuki risk veya güvenlik tehditleri hariç tutulabilir.",
          ],
        },
        {
          title: "Kullanılabilirlik ve değişiklikler",
          paragraphs: [
            "Platform sürekli geliştirilebilir; işlevler eklenebilir, değiştirilebilir veya kaldırılabilir. Planlı bakım veya mücbir sebepler nedeniyle geçici kesintiler olabilir. Bu koşullar gerektiğinde güncellenir; önemli değişiklikler makul şekilde duyurulur; devam eden kullanım, duyuruyla birlikte değerlendirilebilir.",
          ],
        },
        {
          title: "Fikri mülkiyet",
          paragraphs: [
            "MerhabaMap’in tasarımı, metinleri, marka öğeleri ve yazılım yapısı telif ve marka hukukunun koruması altında olabilir. İzinsiz çoğaltma, tersine mühendislik veya ticari yeniden kullanım yasaktır. Kullanıcılar, yükledikleri içeriklerde gerekli haklara sahip olduklarını beyan eder.",
          ],
        },
        {
          title: "Harici bağlantılar ve üçüncü taraf hizmetleri",
          paragraphs: [
            "Platform, üçüncü taraf web sitelerine veya etkinlik sayfalarına bağlantılar içerebilir. Bu sitelerin içeriği ve gizlilik uygulamaları ilgili sağlayıcıların sorumluluğundadır. Harita ve e-posta gibi gömülü hizmetler, gizlilik politikasında belirtilen sağlayıcı koşullarına tabidir.",
          ],
        },
        {
          title: "Sorumluluğun sınırlandırılması",
          paragraphs: [
            "Hizmet, mevcut haliyle sunulur. Yasaların izin verdiği ölçüde, küçük ihmalkârlık dışında — özellikle dolaylı zararlar, veri kaybı veya kaçırılan kâr için — sorumluluk sınırlanabilir. Zorunlu yasal sorumluluk hükümleri (ör. kasıt veya ağır ihmalkârlık) saklı kalır.",
          ],
        },
        {
          title: "Uygulanacak hukuk ve uyuşmazlık çözümü",
          paragraphs: [
            "Taraflar arasındaki uyuşmazlıklarda — tüketici olmanız hâlinde zorunlu tüketici hukuku hükümleri saklı kalmak üzere — Federal Almanya hukuku uygulanır. Tüketiciler için ikamet yerinizdeki yasal merciler yetkili olabilir.",
          ],
        },
        {
          title: "İletişim",
          paragraphs: [
            `Bu koşullar veya hesabınızla ilgili sorular için ${company.supportEmail} adresine yazabilirsiniz. Veri koruma konuları için gizlilik politikasındaki adres kullanılmalıdır.`,
          ],
        },
      ],
    };
  }

  return {
    title: "Allgemeine Nutzungsbedingungen",
    intro:
      "Diese Nutzungsbedingungen regeln die Nutzung der Plattform MerhabaMap. Sie gelten gegenüber allen Nutzerinnen und Nutzern, die auf das Angebot zugreifen oder ein Nutzerkonto führen. Ergänzend gelten die Datenschutzerklärung sowie die Community-Regeln. Stand: März 2026.",
    sections: [
      {
        title: "Vertragsgegenstand und Leistungsbeschreibung",
        paragraphs: [
          "MerhabaMap ist eine informationsorientierte Plattform zur Entdeckung von Orten, Veranstaltungen und verwandten Inhalten mit Fokus auf community-bezogene Orientierung in Deutschland. Der konkrete Funktionsumfang richtet sich nach dem jeweils bereitgestellten Softwarestand und den veröffentlichten Inhaltsrichtlinien.",
          "Ein Anspruch auf unveränderte Fortführung einzelner Funktionen oder auf eine bestimmte Verfügbarkeit zu jedem Zeitpunkt besteht nicht, soweit nicht zwingendes Recht entgegensteht.",
        ],
      },
      {
        title: "Pflichten der Nutzer",
        paragraphs: [
          "Nutzer sind verpflichtet, ihre Zugangsdaten vertraulich zu behandeln und unbefugte Nutzung ihres Kontos unverzüglich mitzuteilen, sobald sie davon Kenntnis erlangen. Alle über die Plattform bereitgestellten Inhalte müssen mit geltendem Recht, einschließlich Persönlichkeits-, Urheber- und Markenrecht, vereinbar sein. Täuschung über Identität, Standort oder Bewertungen ist unzulässig.",
        ],
      },
      {
        title: "Unzulässige Inhalte und Verhaltensweisen",
        paragraphs: [
          "Untersagt sind insbesondere Inhalte oder Handlungen, die gegen Strafrecht oder Ordnungsrecht verstoßen, Hassrede oder Diskriminierung darstellen, Gewalt verherrlichen, die persönliche Ehre Dritter verletzen oder gewerbsmäßig irreführend sind. Ebenfalls unzulässig sind Störungen der technischen Infrastruktur, automatisierte Abfragen ohne Erlaubnis sowie Spam und unaufgeforderte Massenwerbung ohne erkennbaren Community-Bezug.",
          "Werbliche Inhalte sind nur zulässig, soweit sie den Community-Regeln entsprechen und — falls vorgesehen — über gesonderte geschäftliche Produkte (z. B. Business-Funktionen) abgewickelt werden.",
        ],
      },
      {
        title: "Moderation und Sanktionen",
        paragraphs: [
          "Wir sind berechtigt, Inhalte zu prüfen, zu kürzen, zu sperren oder zu löschen, wenn ein Verstoß gegen diese Bedingungen, gegen Recht oder gegen interne Richtlinien vorliegt oder wenn dies zur Wahrung berechtigter Interessen Dritter oder der Allgemeinheit erforderlich ist. Wiederholte oder schwerwiegende Verstöße können zu vorübergehenden oder dauerhaften Kontosperren führen.",
          "Soweit zumutbar, werden wir vor einschneidenden Maßnahmen Gelegenheit zur Stellungnahme geben, es sei denn, es besteht ein dringendes Rechtsrisiko oder eine Gefahr für Sicherheit und Integrität des Dienstes.",
        ],
      },
      {
        title: "Verfügbarkeit und Änderungen",
        paragraphs: [
          "Wir entwickeln MerhabaMap weiter und können Funktionen anpassen, erweitern oder einstellen. Wartungsarbeiten, technische Störungen oder höhere Gewalt können zu vorübergehenden Einschränkungen führen. Änderungen dieser Nutzungsbedingungen werden wir in geeigneter Form ankündigen, soweit gesetzlich erforderlich oder angemessen; die weitere Nutzung nach wirksamer Änderungsmitteilung kann als Zustimmung gewertet werden, soweit gesetzlich zulässig.",
        ],
      },
      {
        title: "Urheber- und Leistungsschutzrechte",
        paragraphs: [
          "An Texten, Grafiken, der Benutzeroberfläche und der Software von MerhabaMap können Schutzrechte bestehen. Eine Vervielfältigung, öffentliche Zugänglichmachung oder Bearbeitung über die gesetzlich zulässigen Grenzen hinaus bedarf unserer vorherigen Zustimmung. Nutzer versichern, über die erforderlichen Rechte an eingestellten Inhalten zu verfügen.",
        ],
      },
      {
        title: "Externe Inhalte und Drittanbieter",
        paragraphs: [
          "Die Plattform kann Verknüpfungen zu Websites und Angeboten Dritter enthalten. Für Inhalte und Datenschutzpraktiken dieser Angebote sind die jeweiligen Betreiber verantwortlich. Eingebundene Dienste (z. B. Kartenkacheln, E-Mail-Infrastruktur) unterliegen den in der Datenschutzerklärung beschriebenen Verarbeitungen.",
        ],
      },
      {
        title: "Haftungsbeschränkung",
        paragraphs: [
          "Wir haften unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie bei Verletzung von Leben, Körper oder Gesundheit. Im Übrigen haften wir nur bei Verletzung wesentlicher Vertragspflichten (Kardinalpflichten); in diesem Fall ist die Haftung auf den typischerweise vorhersehbaren Schaden begrenzt. Eine Haftung für leichte Fahrlässigkeit bei übrigen Pflichtverletzungen ist ausgeschlossen, soweit gesetzlich zulässig.",
          "Wir übernehmen keine Gewähr für die Vollständigkeit, Aktualität und Richtigkeit nutzergenerierter oder eingetragener Drittinhalte; eine Pflicht zur Vorabprüfung besteht nur im gesetzlich vorgeschriebenen Umfang.",
        ],
      },
      {
        title: "Anwendbares Recht und Gerichtsstand",
        paragraphs: [
          "Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des Kollisionsrechts. Zwingende Verbraucherschutzvorschriften des Staates, in dem Verbraucher ihren gewöhnlichen Aufenthalt haben, bleiben unberührt. Gerichtsstand für Kaufleute, juristische Personen des öffentlichen Rechts oder öffentlich-rechtliche Sondervermögen ist — soweit zulässig — der Sitz des Anbieters.",
        ],
      },
      {
        title: "Schlussbestimmungen",
        paragraphs: [
          "Sollten einzelne Bestimmungen dieser Nutzungsbedingungen unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Regelungen unberührt. An die Stelle unwirksamer Klauseln tritt — soweit erforderlich — eine Regelung, die dem wirtschaftlichen Zweck der unwirksamen Bestimmung am nächsten kommt.",
        ],
      },
      {
        title: "Kontakt",
        paragraphs: [
          `Fragen zu diesen Nutzungsbedingungen oder zu Ihrem Konto richten Sie bitte an ${company.supportEmail}. Datenschutzrechtliche Anfragen sind ausschließlich über die in der Datenschutzerklärung genannte Adresse zu stellen.`,
        ],
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
        "Bu kurallar, MerhabaMap’i güvenilir, saygılı ve hukuka uygun biçimde kullanmayı amaçlar. Kullanım koşullarının ve gizlilik politikasının tamamlayıcısıdırlar; ihlâl hâlinde moderasyon ve hesap önlemleri devreye girebilir. Stand: Mart 2026.",
      sections: [
        {
          title: "Saygılı ve kapsayıcı iletişim",
          paragraphs: [
            "Topluluk üyeleri birbirine ve listelenen işletmelere karşı saygılı davranmalıdır. Nefret söylemi, ırkçılık, cinsiyetçilik, dini veya köken temelli aşağılama veya taciz kabul edilmez. Eleştiri, kişilere yönelik hakaret veya tehdit içermeden, nesnel ve yapıcı olmalıdır.",
            "Özellikle cami, dernek veya kültür mekânı gibi hassas yerler hakkında yorum yaparken topluluk barışına ve yanlış bilgilendirmenin sonuçlarına dikkat edin.",
          ],
        },
        {
          title: "Doğruluk ve güven",
          paragraphs: [
            "Sahte veya yanıltıcı mekân veya etkinlik kayıtları, topluluğun güvenini zedeler ve yasalara aykırı olabilir. Bilerek yanlış adres, kapalı işletmeleri açık gösterme veya telif hakkı ihlâli içeren görseller kullanma yasaktır.",
            "İşletme talepleri (claim) ve raporlar yalnızca gerçek bir yetki veya sorun olduğunda kullanılmalıdır; kötü niyetli veya rekabeti engellemek amaçlı kötüye kullanım, hesap kapatılmasına yol açabilir.",
          ],
        },
        {
          title: "Reklam, spam ve ticari içerik",
          paragraphs: [
            "Platform, öncelikle topluluk faydasına yönelik bilgilendirmedir. Bağlamsız reklam mesajları, zincir iletiler, her gönderiye yapıştırılan iletişim numaraları veya izinsiz toplu tanıtım yasaktır. Ticari içerikler, ilgili kurallar ve — sunuluyorsa — işletme araçları çerçevesinde şeffaf biçimde paylaşılmalıdır.",
          ],
        },
        {
          title: "Raporlama ve taleplerin sorumlu kullanımı",
          paragraphs: [
            "Bildirim ve rapor işlevleri, hukuka aykırı veya kurallara aykırı içerikleri işletmeye iletmek içindir. Asılsız toplu raporlar, bir işletmeyi veya kişiyi yıpratmak için kullanılmamalıdır. Yanlış veya kötü niyetli raporlar, hukuki sonuçlar doğurabilir.",
          ],
        },
        {
          title: "Destek ve uyuşmazlıklar",
          paragraphs: [
            `Kural ihlâli şüphesi veya hesap önlemleri hakkında ${company.supportEmail} adresinden destek isteyebilirsiniz. Ciddi hukuki ihlâl bildirimleri, mümkünse delillerle birlikte iletilmelidir.`,
          ],
        },
        {
          title: "Sorunlu içerikler ve ek başvurular",
          paragraphs: [
            "Arayüzdeki raporlara ek olarak, ağır veya acil durumlarda iletişim sayfasındaki e-posta adresleri kullanılabilir. Gizlilikle ilgili konular gizlilik politikasının „Sorunlu içerikleri bildirme“ bölümü ve privacy e-posta adresi üzerinden yürütülmelidir.",
          ],
        },
      ],
    };
  }

  return {
    title: "Community-Regeln",
    intro:
      "Diese Community-Regeln konkretisieren den respektvollen Umgang auf MerhabaMap und ergänzen die Nutzungsbedingungen sowie die Datenschutzerklärung. Sie dienen dem Schutz von Nutzerinnen und Nutzern, von Unternehmen und der Integrität der Plattform. Stand: März 2026.",
    sections: [
      {
        title: "Respektvoller und diskriminierungsfreier Umgang",
        paragraphs: [
          "Wir erwarten einen sachlichen und wertschätzenden Ton. Beleidigungen, Bedrohungen, Hassrede und diskriminierende Äußerungen — etwa aufgrund Herkunft, Religion, Geschlecht, sexueller Identität oder einer Behinderung — sind unzulässig. Kritik an Orten oder Veranstaltungen soll sachlich bleiben und keine unwahren Tatsachenbehauptungen enthalten.",
          "Inhalte zu sensiblen Orten (z. B. religiöse Einrichtungen oder communitybezogene Treffpunkte) sollten mit Rücksicht auf die betroffenen Communities formuliert werden.",
        ],
      },
      {
        title: "Ehrlichkeit und Vertrauen",
        paragraphs: [
          "Orts- und Veranstaltungsdaten sollen der Wahrheit entsprechen. Das bewusste Eintragen nicht existierender Angebote, das Irreführen über Öffnungszeiten oder Standorte sowie die Verwendung fremder urheberrechtlich geschützter Medien ohne Berechtigung sind untersagt.",
          "Business-Claims und Meldungen dürfen nur bei tatsächlichem Anlass erfolgen. Ein missbräuchlicher Einsatz zur Schädigung anderer Anbieter oder zur unlauteren Wettbewerbsbehinderung kann zu rechtlichen Schritten und zum Ausschluss vom Dienst führen.",
        ],
      },
      {
        title: "Werbung, Spam und kommerzielle Inhalte",
        paragraphs: [
          "MerhabaMap ist primär ein Informations- und Entdeckungsangebot. Aufdringliche oder kontextfremde Werbung, Kettennachrichten, wiederholtes Posten identischer Inhalte und unaufgeforderte Massenansprachen sind unerwünscht. Kommerzielle Hinweise sollen transparent sein und — wo vorgesehen — über die dafür vorgesehenen geschäftlichen Funktionen erfolgen.",
        ],
      },
      {
        title: "Verantwortungsvolle Nutzung von Melde- und Claim-Funktionen",
        paragraphs: [
          "Meldungen unterstützen uns dabei, rechtswidrige oder regelwidrige Inhalte zu erkennen. Sie sind nicht dazu bestimmt, unliebsame — aber rechtlich unbedenkliche — Wettbewerber zu benachteiligen. Vorsätzlich falsche Meldungen können zivil- und strafrechtliche Konsequenzen nach sich ziehen und führen auf der Plattform zu Sanktionen.",
        ],
      },
      {
        title: "Support und Konfliktgespräche",
        paragraphs: [
          `Wenn Sie Fragen zu Moderationsentscheidungen oder zu Ihrem Konto haben, wenden Sie sich bitte an ${company.supportEmail}. Für schwerwiegende Rechtsverletzungen sollten Sie neben der Meldefunktion ausreichende Informationen und — soweit möglich — Nachweise bereitstellen.`,
        ],
      },
      {
        title: "Problematische Inhalte und zusätzliche Kontaktwege",
        paragraphs: [
          "Ergänzend zu den in der Oberfläche angebotenen Meldewegen können schwerwiegende oder dringliche Hinweise auch über die auf der Kontaktseite genannten E-Mail-Adressen eingereicht werden. Datenschutzbezogene Vorgänge sind über die in der Datenschutzerklärung beschriebenen Kanäle zu führen.",
        ],
      },
    ],
  };
}
