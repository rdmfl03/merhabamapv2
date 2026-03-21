import { prisma } from '@/lib/prisma';
import {
  deriveRawEventCityGuessFromText,
  deriveRawEventDatetimeTextFromText,
  deriveRawEventLocationTextFromText,
} from '@/config/ingest-allowlist';

const items = await prisma.rawIngestItem.findMany({
  where: { entityGuess: 'EVENT' },
  select: {
    id: true,
    rawTitle: true,
    rawText: true,
    cityGuess: true,
    rawDatetimeText: true,
    rawLocationText: true,
    status: true,
    sourceUrl: true,
  },
  orderBy: { ingestedAt: 'desc' },
});

const withDerived = items.map((item) => ({
  ...item,
  effectiveCityGuess: item.cityGuess ?? deriveRawEventCityGuessFromText(item.rawText),
  effectiveRawDatetimeText: item.rawDatetimeText ?? deriveRawEventDatetimeTextFromText(item.rawText),
  effectiveRawLocationText: item.rawLocationText ?? deriveRawEventLocationTextFromText(item.rawText),
}));

const summary = {
  total: withDerived.length,
  withCityGuess: withDerived.filter((item) => Boolean(item.effectiveCityGuess)).length,
  withRawDatetimeText: withDerived.filter((item) => Boolean(item.effectiveRawDatetimeText)).length,
  withRawLocationText: withDerived.filter((item) => Boolean(item.effectiveRawLocationText)).length,
  withCityAndDatetime: withDerived.filter(
    (item) => Boolean(item.effectiveCityGuess) && Boolean(item.effectiveRawDatetimeText),
  ).length,
  withAllThree: withDerived.filter(
    (item) =>
      Boolean(item.effectiveCityGuess) &&
      Boolean(item.effectiveRawDatetimeText) &&
      Boolean(item.effectiveRawLocationText),
  ).length,
  stillMissingCityGuess: withDerived.filter((item) => !item.effectiveCityGuess).length,
  stillMissingRawDatetimeText: withDerived.filter((item) => !item.effectiveRawDatetimeText).length,
  stillMissingRawLocationText: withDerived.filter((item) => !item.effectiveRawLocationText).length,
};

const strongest = withDerived
  .filter((item) => item.effectiveCityGuess || item.effectiveRawDatetimeText || item.effectiveRawLocationText)
  .slice(0, 12)
  .map((item) => ({
    title: item.rawTitle,
    cityGuess: item.effectiveCityGuess,
    rawDatetimeText: item.effectiveRawDatetimeText,
    rawLocationText: item.effectiveRawLocationText,
    status: item.status,
    sourceUrl: item.sourceUrl,
  }));

console.log(JSON.stringify({ summary, strongest }, null, 2));
await prisma.$disconnect();
