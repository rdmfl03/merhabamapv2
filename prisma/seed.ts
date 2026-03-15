import {
  Prisma,
  PrismaClient,
  type EventCategory,
} from "@prisma/client";

import { hashPassword } from "../src/lib/auth/password";
import { demoAccounts } from "../src/lib/dev/demo-accounts";

const prisma = new PrismaClient();

const placeholderImages = {
  restaurant: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
  cafe: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80",
  bakery: "https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=1200&q=80",
  market: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
  mosque: "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?auto=format&fit=crop&w=1200&q=80",
  barber: "https://images.unsplash.com/photo-1512690459411-b0fd1c86b8c8?auto=format&fit=crop&w=1200&q=80",
  travel: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
  service: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
  event: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
} as const;

const berlinInterests = JSON.stringify(["FOOD", "EVENTS", "COMMUNITY"]);
const koelnInterests = JSON.stringify(["FAMILY", "SHOPPING", "EVENTS"]);

function openingHours(entries: Array<{ day: string; open: string; close: string }>) {
  return JSON.stringify(entries);
}

async function resetDatabase() {
  await prisma.adminActionLog.deleteMany();
  await prisma.report.deleteMany();
  await prisma.businessClaim.deleteMany();
  await prisma.userActionToken.deleteMany();
  await prisma.savedEvent.deleteMany();
  await prisma.savedPlace.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.event.deleteMany();
  await prisma.place.deleteMany();
  await prisma.placeCategory.deleteMany();
  await prisma.city.deleteMany();
  await prisma.user.deleteMany();
}

async function seedCities() {
  const berlin = await prisma.city.create({
    data: {
      slug: "berlin",
      nameDe: "Berlin",
      nameTr: "Berlin",
      isPilot: true,
    },
  });

  const koeln = await prisma.city.create({
    data: {
      slug: "koeln",
      nameDe: "Köln",
      nameTr: "Koln",
      isPilot: true,
    },
  });

  return { berlin, koeln };
}

async function seedCategories() {
  const categories: Prisma.PlaceCategoryCreateManyInput[] = [
    { slug: "restaurants", nameDe: "Restaurants", nameTr: "Restoranlar", icon: "utensils", sortOrder: 10 },
    { slug: "cafes", nameDe: "Cafes", nameTr: "Kafeler", icon: "coffee", sortOrder: 20 },
    { slug: "bakeries", nameDe: "Baeckereien", nameTr: "Firinlar", icon: "bread", sortOrder: 30 },
    { slug: "markets", nameDe: "Supermaerkte", nameTr: "Marketler", icon: "shopping-basket", sortOrder: 40 },
    { slug: "mosques", nameDe: "Moscheen", nameTr: "Camiler", icon: "landmark", sortOrder: 50 },
    { slug: "barbers", nameDe: "Barbiere", nameTr: "Berberler", icon: "scissors", sortOrder: 60 },
    { slug: "travel-agencies", nameDe: "Reiseburos", nameTr: "Seyahat Acenteleri", icon: "plane", sortOrder: 70 },
    { slug: "services", nameDe: "Dienstleister", nameTr: "Hizmetler", icon: "briefcase", sortOrder: 80 },
  ] as const;

  await prisma.placeCategory.createMany({ data: categories });

  const stored = await prisma.placeCategory.findMany();
  return Object.fromEntries(stored.map((category) => [category.slug, category]));
}

async function seedUsers(cityIds: { berlin: string; koeln: string }) {
  const basePasswordHashes = Object.fromEntries(
    demoAccounts.map((account) => [account.email, hashPassword(account.password)]),
  );

  const [demoUser, businessOwner, moderator, admin, freshUser] = await Promise.all([
    prisma.user.create({
      data: {
        email: "demo.user@example.com",
        hashedPassword: basePasswordHashes["demo.user@example.com"],
        emailVerified: new Date(),
        name: "Demo User",
        username: "demo_user",
        role: "USER",
        preferredLocale: "de",
        onboardingCompletedAt: new Date(),
        onboardingCityId: cityIds.berlin,
        interestsJson: berlinInterests,
      },
    }),
    prisma.user.create({
      data: {
        email: "demo.business@example.com",
        hashedPassword: basePasswordHashes["demo.business@example.com"],
        emailVerified: new Date(),
        name: "Demo Business Owner",
        username: "demo_business",
        role: "BUSINESS_OWNER",
        preferredLocale: "tr",
        onboardingCompletedAt: new Date(),
        onboardingCityId: cityIds.koeln,
        interestsJson: koelnInterests,
      },
    }),
    prisma.user.create({
      data: {
        email: "demo.moderator@example.com",
        hashedPassword: basePasswordHashes["demo.moderator@example.com"],
        emailVerified: new Date(),
        name: "Demo Moderator",
        username: "demo_moderator",
        role: "MODERATOR",
        preferredLocale: "de",
        onboardingCompletedAt: new Date(),
        onboardingCityId: cityIds.berlin,
        interestsJson: JSON.stringify(["EVENTS", "COMMUNITY"]),
      },
    }),
    prisma.user.create({
      data: {
        email: "demo.admin@example.com",
        hashedPassword: basePasswordHashes["demo.admin@example.com"],
        emailVerified: new Date(),
        name: "Demo Admin",
        username: "demo_admin",
        role: "ADMIN",
        preferredLocale: "de",
        onboardingCompletedAt: new Date(),
        onboardingCityId: cityIds.berlin,
        interestsJson: JSON.stringify(["BUSINESS", "EVENTS"]),
      },
    }),
    prisma.user.create({
      data: {
        email: "demo.fresh@example.com",
        hashedPassword: basePasswordHashes["demo.fresh@example.com"],
        emailVerified: new Date(),
        name: "Fresh Demo User",
        username: "demo_fresh",
        role: "USER",
        preferredLocale: "tr",
      },
    }),
  ]);

  return { demoUser, businessOwner, moderator, admin, freshUser };
}

async function seedPlaces(args: {
  berlinId: string;
  koelnId: string;
  categoryBySlug: Record<string, { id: string }>;
  businessOwnerId: string;
  adminId: string;
}) {
  const data: Prisma.PlaceCreateManyInput[] = [
    {
      slug: "nar-lokantasi-berlin",
      name: "Nar Lokantasi Berlin",
      descriptionDe:
        "Fiktives Nachbarschaftsrestaurant mit anatolischen Gerichten, Mittagsmenues und ruhiger Abendatmosphaere in Kreuzberg.",
      descriptionTr:
        "Kreuzberg'de Anadolu yemekleri, ogle menuleri ve sakin aksam ortami sunan kurgusal mahalle restoranı.",
      categoryId: args.categoryBySlug["restaurants"].id,
      cityId: args.berlinId,
      addressLine1: "Oranienstrasse 142",
      postalCode: "10969",
      latitude: 52.5012,
      longitude: 13.4108,
      phone: "+49 30 5551001",
      websiteUrl: "https://demo-nar-lokantasi.example.com",
      openingHoursJson: openingHours([{ day: "Mon-Sun", open: "12:00", close: "22:30" }]),
      images: [placeholderImages.restaurant],
      isPublished: true,
      moderationStatus: "APPROVED" as const,
      verificationStatus: "VERIFIED" as const,
      verifiedAt: new Date(),
      verifiedByUserId: args.adminId,
    },
    {
      slug: "lale-cafe-berlin",
      name: "Lale Cafe Berlin",
      descriptionDe:
        "Helles Demo-Cafe mit türkischem Frühstück, Spezialitätenkaffee und ruhigen Fenstertischen für den Nachmittag.",
      descriptionTr:
        "Turk kahvaltisi, ozel kahve cesitleri ve ogleden sonra icin sakin masa duzeni sunan aydinlik demo kafe.",
      categoryId: args.categoryBySlug["cafes"].id,
      cityId: args.berlinId,
      addressLine1: "Bergmannstrasse 81",
      postalCode: "10961",
      latitude: 52.4894,
      longitude: 13.3955,
      phone: "+49 30 5551002",
      websiteUrl: "https://demo-lale-cafe.example.com",
      openingHoursJson: openingHours([{ day: "Tue-Sun", open: "09:00", close: "20:00" }]),
      images: [placeholderImages.cafe],
      isPublished: true,
      moderationStatus: "APPROVED" as const,
      verificationStatus: "UNVERIFIED" as const,
    },
    {
      slug: "firin-7-berlin",
      name: "Firin 7 Berlin",
      descriptionDe:
        "Fiktive Bäckerei mit Simit, Börek und süßen Backwaren für den schnellen Morgenstart in Neukölln.",
      descriptionTr:
        "Neukolln'de gunluk simit, borek ve tatli urunler sunan kurgusal firin.",
      categoryId: args.categoryBySlug["bakeries"].id,
      cityId: args.berlinId,
      addressLine1: "Hermannstrasse 121",
      postalCode: "12051",
      latitude: 52.4781,
      longitude: 13.4318,
      phone: "+49 30 5551003",
      websiteUrl: null,
      openingHoursJson: openingHours([{ day: "Mon-Sat", open: "07:00", close: "18:30" }]),
      images: [placeholderImages.bakery],
      isPublished: true,
      moderationStatus: "APPROVED" as const,
      verificationStatus: "UNVERIFIED" as const,
    },
    {
      slug: "selamet-market-koeln",
      name: "Selamet Market Köln",
      descriptionDe:
        "Kleiner Demo-Supermarkt mit türkischen Grundnahrungsmitteln, Tiefkühlprodukten und vertrauten Importmarken.",
      descriptionTr:
        "Turk temel gida urunleri, donuk urunler ve tanidik ithal markalar sunan demo mahalle marketi.",
      categoryId: args.categoryBySlug["markets"].id,
      cityId: args.koelnId,
      addressLine1: "Venloer Strasse 234",
      postalCode: "50823",
      latitude: 50.9502,
      longitude: 6.9241,
      phone: "+49 221 5552001",
      websiteUrl: null,
      openingHoursJson: openingHours([{ day: "Mon-Sat", open: "08:30", close: "21:00" }]),
      images: [placeholderImages.market],
      isPublished: true,
      moderationStatus: "APPROVED" as const,
      verificationStatus: "VERIFIED" as const,
      verifiedAt: new Date(),
      verifiedByUserId: args.adminId,
    },
    {
      slug: "mavi-baris-camii-koeln",
      name: "Mavi Baris Camii Köln",
      descriptionDe:
        "Fiktive Moschee mit Gebetsräumen, Nachbarschaftstreffen und Hinweisen zu community-nahen Aktivitäten.",
      descriptionTr:
        "Namaz alani, mahalle bulusmalari ve topluluk etkinlik bilgileri sunan kurgusal cami profili.",
      categoryId: args.categoryBySlug["mosques"].id,
      cityId: args.koelnId,
      addressLine1: "Subbelrather Strasse 188",
      postalCode: "50823",
      latitude: 50.9535,
      longitude: 6.9212,
      phone: "+49 221 5552002",
      websiteUrl: "https://demo-mavi-baris-camii.example.com",
      openingHoursJson: openingHours([{ day: "Mon-Sun", open: "05:00", close: "22:00" }]),
      images: [placeholderImages.mosque],
      isPublished: true,
      moderationStatus: "APPROVED" as const,
      verificationStatus: "UNVERIFIED" as const,
    },
    {
      slug: "usta-berber-koeln",
      name: "Usta Berber Köln",
      descriptionDe:
        "Fiktiver Barber-Shop mit Walk-in-Terminen, klassischem Service und bereits genehmigtem Business-Claim.",
      descriptionTr:
        "Walk-in randevular, klasik servis ve onayli business claim durumuyla kurgusal berber.",
      categoryId: args.categoryBySlug["barbers"].id,
      cityId: args.koelnId,
      addressLine1: "Keupstrasse 54",
      postalCode: "51063",
      latitude: 50.9651,
      longitude: 7.0106,
      phone: "+49 221 5552003",
      websiteUrl: "https://demo-usta-berber.example.com",
      openingHoursJson: openingHours([{ day: "Mon-Sat", open: "09:00", close: "19:00" }]),
      images: [placeholderImages.barber],
      isPublished: true,
      moderationStatus: "APPROVED" as const,
      verificationStatus: "CLAIMED" as const,
      ownerUserId: args.businessOwnerId,
      lastBusinessUpdateAt: new Date(),
    },
    {
      slug: "ankara-reisebuero-berlin",
      name: "Ankara Reisebuero Berlin",
      descriptionDe:
        "Fiktives Reisebüro mit Fokus auf Familienreisen, Türkei-Flügen und beratungsnahen Services.",
      descriptionTr:
        "Aile seyahatleri, Turkiye ucuslari ve danismanlik odakli hizmetler sunan kurgusal seyahat acentesi.",
      categoryId: args.categoryBySlug["travel-agencies"].id,
      cityId: args.berlinId,
      addressLine1: "Sonnenallee 88",
      postalCode: "12045",
      latitude: 52.4775,
      longitude: 13.4412,
      phone: "+49 30 5551004",
      websiteUrl: "https://demo-ankara-reisebuero.example.com",
      openingHoursJson: openingHours([{ day: "Mon-Fri", open: "10:00", close: "18:00" }]),
      images: [placeholderImages.travel],
      isPublished: true,
      moderationStatus: "APPROVED" as const,
      verificationStatus: "UNVERIFIED" as const,
    },
    {
      slug: "hilal-service-point-koeln",
      name: "Hilal Service Point Köln",
      descriptionDe:
        "Fiktiver Dienstleister für Übersetzungen, Formulare und alltagsnahe Unterstützung in Köln.",
      descriptionTr:
        "Ceviri, form yardimi ve gunluk resmi isler icin destek sunan kurgusal hizmet noktasi.",
      categoryId: args.categoryBySlug["services"].id,
      cityId: args.koelnId,
      addressLine1: "Weidengasse 17",
      postalCode: "50668",
      latitude: 50.9465,
      longitude: 6.9589,
      phone: "+49 221 5552004",
      websiteUrl: null,
      openingHoursJson: openingHours([{ day: "Mon-Fri", open: "09:30", close: "17:30" }]),
      images: [placeholderImages.service],
      isPublished: true,
      moderationStatus: "APPROVED" as const,
      verificationStatus: "UNVERIFIED" as const,
    },
  ];

  await prisma.place.createMany({ data });
  const places = await prisma.place.findMany();
  return Object.fromEntries(places.map((place) => [place.slug, place]));
}

async function seedEvents(args: { berlinId: string; koelnId: string }) {
  const events: Prisma.EventCreateManyInput[] = [
    {
      slug: "anatolia-late-session-berlin",
      title: "Anatolia Late Session Berlin",
      descriptionDe:
        "Fiktiver Musikabend mit Live-Set, DJ und urbanem Publikum für den Berliner Community-Kalender.",
      descriptionTr:
        "Berlin toplulugu icin canli performans ve DJ seti iceren kurgusal muzik gecesi.",
      category: "CONCERT" as EventCategory,
      cityId: args.berlinId,
      venueName: "Studio Uferhalle",
      addressLine1: "Uferstrasse 8",
      postalCode: "13357",
      latitude: 52.5461,
      longitude: 13.385,
      startsAt: new Date("2026-04-19T19:00:00+02:00"),
      endsAt: new Date("2026-04-19T23:30:00+02:00"),
      organizerName: "Merhaba Sounds",
      externalUrl: "https://demo-events.example.com/anatolia-late-session-berlin",
      imageUrl: placeholderImages.event,
      isPublished: true,
      moderationStatus: "APPROVED" as const,
    },
    {
      slug: "kultur-brunch-koeln",
      title: "Kultur Brunch Köln",
      descriptionDe:
        "Fiktiver Sonntagsbrunch mit Musik, Familienbereich und offenen Gesprächen für verschiedene Generationen.",
      descriptionTr:
        "Muzik, aile alani ve acik sohbetlerle farkli kusaklari bulusturan kurgusal pazar brunch'i.",
      category: "FAMILY" as EventCategory,
      cityId: args.koelnId,
      venueName: "Kulturwerk Köln",
      addressLine1: "Heliosstrasse 37",
      postalCode: "50825",
      latitude: 50.9508,
      longitude: 6.9071,
      startsAt: new Date("2026-04-26T11:00:00+02:00"),
      endsAt: new Date("2026-04-26T15:00:00+02:00"),
      organizerName: "Community Circle Köln",
      externalUrl: null,
      imageUrl: placeholderImages.event,
      isPublished: true,
      moderationStatus: "APPROVED" as const,
    },
    {
      slug: "student-meetup-berlin",
      title: "Student Meetup Berlin",
      descriptionDe:
        "Fiktives Kennenlernformat für Studierende und Berufseinsteiger mit lokalen Tipps und kurzen Inputs.",
      descriptionTr:
        "Ogrenciler ve yeni mezunlar icin yerel ipuclari ve tanisma odakli kurgusal bulusma.",
      category: "STUDENT" as EventCategory,
      cityId: args.berlinId,
      venueName: "Campus Forum Mitte",
      addressLine1: "Invalidenstrasse 43",
      postalCode: "10115",
      latitude: 52.5305,
      longitude: 13.3814,
      startsAt: new Date("2026-04-05T18:00:00+02:00"),
      endsAt: new Date("2026-04-05T21:00:00+02:00"),
      organizerName: "Turkish Students Hub",
      externalUrl: "https://demo-events.example.com/student-meetup-berlin",
      imageUrl: placeholderImages.event,
      isPublished: true,
      moderationStatus: "APPROVED" as const,
    },
    {
      slug: "business-breakfast-koeln",
      title: "Business Breakfast Köln",
      descriptionDe:
        "Fiktives Networking-Frühstück für Selbstständige, Gründerinnen und lokale Professionals.",
      descriptionTr:
        "Girisimciler, serbest calisanlar ve yerel profesyoneller icin kurgusal networking kahvaltisi.",
      category: "BUSINESS" as EventCategory,
      cityId: args.koelnId,
      venueName: "Startpunkt Rhein",
      addressLine1: "Hohenzollernring 58",
      postalCode: "50672",
      latitude: 50.9381,
      longitude: 6.9419,
      startsAt: new Date("2026-05-08T08:30:00+02:00"),
      endsAt: new Date("2026-05-08T10:30:00+02:00"),
      organizerName: "Merhaba Business Circle",
      externalUrl: "https://demo-events.example.com/business-breakfast-koeln",
      imageUrl: placeholderImages.event,
      isPublished: true,
      moderationStatus: "APPROVED" as const,
    },
    {
      slug: "community-iftar-berlin",
      title: "Community Iftar Berlin",
      descriptionDe:
        "Fiktives Community-Iftar mit offenem Nachbarschaftscharakter, freiwilligem Beitrag und ruhiger Moderation.",
      descriptionTr:
        "Acik mahalle katilimina uygun, gonullu katkiya dayali ve sakin akislara sahip kurgusal community iftarı.",
      category: "COMMUNITY" as EventCategory,
      cityId: args.berlinId,
      venueName: "Haus der Begegnung",
      addressLine1: "Prinzenallee 42",
      postalCode: "13359",
      latitude: 52.5519,
      longitude: 13.3757,
      startsAt: new Date("2026-03-20T18:15:00+01:00"),
      endsAt: new Date("2026-03-20T21:00:00+01:00"),
      organizerName: "Neighbourhood Table",
      externalUrl: null,
      imageUrl: placeholderImages.event,
      isPublished: true,
      moderationStatus: "APPROVED" as const,
    },
    {
      slug: "past-kulturabend-koeln",
      title: "Kulturabend Köln Archiv",
      descriptionDe:
        "Vergangenes Demo-Event für Kalender- und Edge-Case-Tests auf der Event-Detailseite.",
      descriptionTr:
        "Etkinlik detay sayfasinda gecmis veri senaryolarini test etmek icin kurgusal gecmis etkinlik.",
      category: "CULTURE" as EventCategory,
      cityId: args.koelnId,
      venueName: "Atelier Süd",
      addressLine1: "Zulpicher Strasse 18",
      postalCode: "50674",
      latitude: 50.9298,
      longitude: 6.9385,
      startsAt: new Date("2026-02-10T18:00:00+01:00"),
      endsAt: new Date("2026-02-10T21:00:00+01:00"),
      organizerName: "Demo Kulturverein",
      externalUrl: "https://demo-events.example.com/past-kulturabend-koeln",
      imageUrl: placeholderImages.event,
      isPublished: true,
      moderationStatus: "APPROVED" as const,
    },
  ];

  await prisma.event.createMany({ data: events });
  const stored = await prisma.event.findMany();
  return Object.fromEntries(stored.map((event) => [event.slug, event]));
}

async function main() {
  await resetDatabase();

  const { berlin, koeln } = await seedCities();
  const categoryBySlug = await seedCategories();
  const users = await seedUsers({ berlin: berlin.id, koeln: koeln.id });
  const places = await seedPlaces({
    berlinId: berlin.id,
    koelnId: koeln.id,
    categoryBySlug,
    businessOwnerId: users.businessOwner.id,
    adminId: users.admin.id,
  });
  const events = await seedEvents({ berlinId: berlin.id, koelnId: koeln.id });

  await prisma.savedPlace.createMany({
    data: [
      { userId: users.demoUser.id, placeId: places["nar-lokantasi-berlin"].id },
      { userId: users.demoUser.id, placeId: places["usta-berber-koeln"].id },
    ],
  });

  await prisma.savedEvent.createMany({
    data: [
      { userId: users.demoUser.id, eventId: events["anatolia-late-session-berlin"].id },
      { userId: users.demoUser.id, eventId: events["business-breakfast-koeln"].id },
    ],
  });

  const [pendingClaim, approvedClaim, rejectedClaim] = await Promise.all([
    prisma.businessClaim.create({
      data: {
        userId: users.demoUser.id,
        placeId: places["ankara-reisebuero-berlin"].id,
        claimantName: "Demo User",
        claimantEmail: "demo.user@example.com",
        claimantPhone: "+49 30 5553001",
        message: "Ich teste den pending claim Flow für das lokale Review.",
        evidenceNotes: "Hinweis: rein fiktive Seed-Daten.",
        status: "PENDING",
      },
    }),
    prisma.businessClaim.create({
      data: {
        userId: users.businessOwner.id,
        placeId: places["usta-berber-koeln"].id,
        claimantName: "Demo Business Owner",
        claimantEmail: "demo.business@example.com",
        claimantPhone: "+49 221 5553002",
        message: "Ich verwalte dieses Demo-Profil für Owner-Tests.",
        evidenceNotes: "Website und Telefonnummer wurden intern bestätigt.",
        status: "APPROVED",
        reviewedAt: new Date(),
        reviewedByUserId: users.admin.id,
      },
    }),
    prisma.businessClaim.create({
      data: {
        userId: users.demoUser.id,
        placeId: places["lale-cafe-berlin"].id,
        claimantName: "Demo User",
        claimantEmail: "demo.user@example.com",
        message: "Abgelehnter Test-Claim für Admin-Statuslisten.",
        status: "REJECTED",
        reviewedAt: new Date(),
        reviewedByUserId: users.moderator.id,
      },
    }),
  ]);

  const [openPlaceReport, inReviewEventReport, resolvedPlaceReport] = await Promise.all([
    prisma.report.create({
      data: {
        userId: users.demoUser.id,
        targetType: "PLACE",
        placeId: places["lale-cafe-berlin"].id,
        reason: "INACCURATE_INFORMATION",
        details: "Die Telefonnummer sollte absichtlich als offener Testfall überprüft werden.",
        status: "OPEN",
      },
    }),
    prisma.report.create({
      data: {
        userId: users.demoUser.id,
        targetType: "EVENT",
        eventId: events["business-breakfast-koeln"].id,
        reason: "DUPLICATE",
        details: "In-Review Demo-Fall für Event-Meldungen.",
        status: "IN_REVIEW",
        reviewedAt: new Date(),
        reviewedByUserId: users.moderator.id,
      },
    }),
    prisma.report.create({
      data: {
        userId: users.businessOwner.id,
        targetType: "PLACE",
        placeId: places["selamet-market-koeln"].id,
        reason: "CLOSED_OR_UNAVAILABLE",
        details: "Resolved Demo-Fall für abgeschlossene Moderation.",
        status: "RESOLVED",
        reviewedAt: new Date(),
        reviewedByUserId: users.admin.id,
      },
    }),
  ]);

  await prisma.adminActionLog.createMany({
    data: [
      {
        actorUserId: users.admin.id,
        actionType: "CLAIM_APPROVED",
        targetType: "BUSINESS_CLAIM",
        targetId: approvedClaim.id,
        summary: "Approved demo owner claim and linked place ownership.",
        metadataJson: JSON.stringify({
          placeId: places["usta-berber-koeln"].id,
          ownerUserId: users.businessOwner.id,
          nextStatus: "CLAIMED",
        }),
      },
      {
        actorUserId: users.moderator.id,
        actionType: "REPORT_IN_REVIEW",
        targetType: "REPORT",
        targetId: inReviewEventReport.id,
        summary: "Moved seeded event report into review.",
        metadataJson: JSON.stringify({
          eventId: events["business-breakfast-koeln"].id,
        }),
      },
      {
        actorUserId: users.admin.id,
        actionType: "PLACE_TRUST_STATUS_UPDATED",
        targetType: "PLACE",
        targetId: places["nar-lokantasi-berlin"].id,
        summary: "Confirmed demo place as verified.",
        metadataJson: JSON.stringify({
          previousStatus: "UNVERIFIED",
          nextStatus: "VERIFIED",
        }),
      },
      {
        actorUserId: users.businessOwner.id,
        actionType: "BUSINESS_PLACE_UPDATED",
        targetType: "PLACE",
        targetId: places["usta-berber-koeln"].id,
        summary: "Seeded owner update history for business profile tests.",
        metadataJson: JSON.stringify({
          fields: ["phone", "websiteUrl", "openingHoursJson"],
        }),
      },
    ],
  });

  console.log("Seed complete");
  console.log("Demo accounts:");
  demoAccounts.forEach((account) => {
    console.log(`- ${account.label}: ${account.email} / ${account.password}`);
  });
  console.log(`Pending claim: ${pendingClaim.id}`);
  console.log(`Approved claim: ${approvedClaim.id}`);
  console.log(`Rejected claim: ${rejectedClaim.id}`);
  console.log(`Open place report: ${openPlaceReport.id}`);
  console.log(`Resolved place report: ${resolvedPlaceReport.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
