# Prüfauftrag: Rechtstexte MerhabaMap (Entwurf zur anwaltlichen Freigabe)

## 1. Zweck dieses Dokuments

Die Plattform **MerhabaMap** (Web-App, deutsch/türkisch) veröffentlicht auf der Website **öffentliche Rechtstexte** (Impressum, Datenschutz, Cookies, Nutzungsbedingungen, Community-Regeln, Kontakt). Die Texte sind als **technischer Entwurf** aus Sicht Produkt/IT formuliert und sollen von Ihnen **rechtlich geprüft, ergänzt oder angepasst** werden, soweit für den konkreten Geschäftsbetrieb erforderlich.

Dieses Dokument beschreibt **was existiert**, **wo es im Projekt liegt**, und **welche Fragen wir Ihrer Prüfung ausdrücklich zuordnen**.

---

## 2. Kurz zum Angebot (für die Einordnung)

- **Was:** Informations- und Community-orientierte Entdeckungsplattform für **Orte und Veranstaltungen** (Schwerpunkt Deutschland), mit **Account optional**.
- **Betreiber:** **GbR** (Gesellschaft bürgerlichen Rechts); vertretungsberechtigte Gesellschafter und ladungsfähige Anschrift sind in den Texten aus einer zentralen Konfiguration gespeist — bitte **faktische Richtigkeit** der dort hinterlegten Daten bestätigen oder Korrekturen vorgeben.
- **Sprachen der Rechtstexte:** **Deutsch** und **Türkisch** (TR ist Übersetzung/Orientierung an DE; maßgeblich für deutsches/EU-Recht ist typischerweise die **deutsche Fassung**, sofern Sie nichts anderes empfehlen).

---

## 3. Wo die Texte technisch gepflegt werden

| Inhalt | Pfad im Repository |
|--------|---------------------|
| Fließtexte der Legal-Seiten (DE/TR) | `src/content/legal/content.ts` |
| Betreiber-Stammdaten (Name, Adresse, E-Mails, ggf. USt-ID, Vertretung, Medienverantwortlicher) | `src/content/legal/company.ts` |
| Darstellung (Layout, keine inhaltliche Rechtslogik) | u. a. `src/components/legal/`, Routen unter `src/app/[locale]/…` |

Deployment: **Netlify** (Next.js); vor Netlify kann je nach DNS ein **CDN (z. B. Cloudflare)** vorgeschaltet sein. Datenbank: **PostgreSQL bei DigitalOcean**. Transaktionaler E-Mail-Versand in Produktion: **Resend** (sofern `EMAIL_TRANSPORT=resend`). Karten: **MapTiler** (optional, serverseitig gekapselt) bzw. **OpenStreetMap**-Kacheln.

**Hinweis:** Es gibt **keine** produktive Anbindung eines **S3-kompatiblen Objektspeichers** in der aktuell ausgelieferten Anwendung; optional sind nur Konfigurationsvariablen für eine künftige Medienablage vorgesehen. Wenn Sie später R2/S3 o. Ä. produktiv schalten, muss die Datenschutzerklärung angepasst werden.

---

## 4. Welche Seiten/Routen es gibt (inhaltlich)

Über die Website erreichbar (jeweils mit Locale-Prefix `/de/…` und `/tr/…`):

- **Impressum** — Anbieterkennzeichnung (u. a. Bezug **§ 5 DDG**), Vertretung GbR, Kontakt, Medienstaatsvertrag **§ 18 Abs. 2 MStV** (soweit anwendbar), Haftungshinweise; ergänzend **EU-OS-Plattform** und Hinweis zur **Verbraucherschlichtung** (keine gesonderte/freiwillige Teilnahme, vorbehalten gesetzlich Zwingendes).
- **Datenschutzerklärung** — **Art. 13/14 DSGVO**, BDSG-Bezug, Kategorien, Zwecke, Hosting, Auftragsverarbeiter, Drittlandübermittlung, Cookies/NextAuth, Rechte der Betroffenen, Beschwerderecht.
- **Cookies / ähnliche Technologien** — Kurzüberblick (konsistent zur Datenschutzerklärung).
- **Kontakt** — Erreichbarkeit (kein Ersatz für behördliche Zustellung; Impressum bleibt maßgeblich für Pflichtangaben).
- **AGB / Nutzungsbedingungen** — Nutzung der Plattform, Moderation, Haftungsausschlüsse i. S. v. üblichen Plattform-TNB (Entwurf).
- **Community-Regeln** — Verhaltensregeln, Ergänzung zu AGB/Datenschutz.

Bitte prüfen Sie **Kohärenz** zwischen diesen Seiten (keine Widersprüche, keine doppelten oder veralteten Aussagen).

---

## 5. Konkreter Prüfauftrag (Checkliste)

Bitte insbesondere:

1. **Vollständigkeit und Pflichtangaben** für den **tatsächlichen Geschäftsbetrieb** (kostenlos vs. künftig entgeltliche Leistungen, geschäftsmäßig vs. privat — soweit relevant für Verbraucherrecht, AGB-Kontrolle, Informationspflichten).
2. **Impressum** — Angaben zur **GbR**, **Vertretung**, **Erreichbarkeit**, ggf. **Registereintrag/USt-ID** sofern vorhanden und auskunftspflichtig; **MStV**-Verantwortlicher nur soweit sachlich begründet.
3. **§ 36 VSBG / EU-Online-Streitbeilegung** — ob **Umfang und Form** der Hinweise für Ihr Mandat passen (Online-Verträge mit Verbrauchern, Informationspflichten vs. freiwillige Schlichtung).
4. **Datenschutz** — Rechtsgrundlagen, Transparenz, **Auftragsverarbeitung** (Netlify, DigitalOcean, ggf. Cloudflare, MapTiler/OSM, Resend); **Drittlandübermittlungen** und **geeignete Garantien**; **Cookies** und **TTDSG** (soweit Sie eine ausdrückliche Erwähnung oder Cookie-Banner-Logik für notwendig halten).
5. **AGB** — **Wirksamkeit** bei Verbrauchern (sofern einschlägig), **Kündigung/Sperrung**, **Haftung**, **Anwendbares Recht/Gerichte** — Anpassung an Ihre Risikoempfehlung.
6. **Community-Regeln / Moderation** — Abstimmung mit **Meinungsfreiheit**, **Hausrecht**, **Notice-and-Action**; keine zwingenden Fristversprechen, sofern nicht gewollt.
7. **Zweisprachigkeit** — ob die **türkische Fassung** für Ihre Mandanten ausreicht oder ob Sie **redaktionelle oder rechtliche Anpassungen** in TR empfehlen.

**Ergebnisform:** Wir bitten um **konkrete Änderungsvorschläge** (idealerweise mit **ersetzt Absatz X** / **neuer Absatz zu Thema Y**) oder ein **Kurzgutachten** mit To-do-Liste. Technische Umsetzung der Textänderungen kann danach erfolgen (oder durch Sie gewünschte Formulierungen werden 1:1 übernommen).

---

## 6. Was die Betreiberseite bereits bewusst kommuniziert

- Rechtsform **GbR** und vertretungsberechtigte Gesellschafter in den Texten.
- Im **Impressum** wird **kein** Link auf die EU-Online-Streitbeilegungsplattform geführt — bitte prüfen, ob dies für Ihr Mandat zulässig bzw. ergänzungspflichtig ist.
- Datenschutz: **Hosting/CDN** und **kein produktiver S3-/R2-Einsatz** in der aktuellen App-Version, mit Hinweis auf **Aktualisierungspflicht** bei späterer Aktivierung.

---

## 7. Was Sie im Repository nicht erwarten müssen

- Kein vollständiges **Verarbeitungsverzeichnis** oder **TOM** als separater Rechtsakt (falls gewünscht, bitte als eigenes Deliverable definieren).
- Keine **AV-Vertragsdokumente** der Dienstleister — die Prüfung bezieht sich auf die **Transparenz gegenüber Nutzern** in der Datenschutzerklärung; operatives Vertragswerk ist separat zu führen.

---

## 8. Kontakt für Rückfragen (technisch/inhaltlich)

Rückfragen zur **Umsetzung im Code** oder zu **Screenshots der Live-Seite** klären die technisch Verantwortlichen des Projekts. **Rechtliche Verantwortung** für die finale Freigabe der Texte liegt nach Ihrer Prüfung beim **Betreiber**.

---

*Stand der Projektbeschreibung: März 2026 — bitte bei größeren Produkt- oder Infrastrukturänderungen um Aktualisierung bitten.*
