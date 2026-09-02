import { db, ensureDbReady } from "@/db";
import { points, type Point } from "@/db/schema";
import { asc, between, eq } from "drizzle-orm";
import { endOfMonth, startOfMonth } from "date-fns";
import { format, fromZonedTime, toZonedTime } from "date-fns-tz";

const DEFAULT_TIMEZONE = "America/Sao_Paulo";

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function createPoint(input?: { timestamp?: string | Date }): Promise<Point> {
  await ensureDbReady();
  const id = generateUUID();
  const dateObj = input?.timestamp ? new Date(input.timestamp) : new Date();
  const isoTimestamp = dateObj.toISOString();

  await db.insert(points).values({
    id,
    timestamp: isoTimestamp,
  });

  return {
    id,
    timestamp: isoTimestamp,
  };
}

export async function deletePoint(id: string): Promise<string> {
  await ensureDbReady();
  await db.delete(points).where(eq(points.id, id));
  return id;
}

export async function getPointsByDate(
  date: string,
  timezone: string = DEFAULT_TIMEZONE,
): Promise<Point[]> {
  await ensureDbReady();
  const startString = `${date} 00:00:00`;
  const endString = `${date} 23:59:59.999`;

  const startUTC = fromZonedTime(startString, timezone);
  const endUTC = fromZonedTime(endString, timezone);

  const results = await db
    .select()
    .from(points)
    .where(between(points.timestamp, startUTC.toISOString(), endUTC.toISOString()))
    .orderBy(asc(points.timestamp));

  return results;
}

export async function getTotalMsInMonth(
  date: string,
  timezone: string = DEFAULT_TIMEZONE,
): Promise<{ milliseconds: number; invalidDays: number }> {
  await ensureDbReady();
  const startString = `${date} 00:00:00`;
  const endString = `${date} 23:59:59.999`;

  const monthStart = startOfMonth(new Date(startString));
  const monthEnd = endOfMonth(new Date(endString));

  const monthStartUTC = fromZonedTime(monthStart, timezone);
  const monthEndUTC = fromZonedTime(monthEnd, timezone);

  const allPoints = await db
    .select()
    .from(points)
    .where(
      between(
        points.timestamp,
        monthStartUTC.toISOString(),
        monthEndUTC.toISOString(),
      ),
    )
    .orderBy(asc(points.timestamp));

  const gruposPorDia: Record<string, Date[]> = {};

  allPoints.forEach(ponto => {
    const timestampInTimezone = toZonedTime(new Date(ponto.timestamp), timezone);
    const diaKey = format(timestampInTimezone, "MM-dd", {
      timeZone: timezone,
    });

    if (!gruposPorDia[diaKey]) {
      gruposPorDia[diaKey] = [];
    }
    gruposPorDia[diaKey].push(new Date(ponto.timestamp));
  });

  let invalidDays = 0;
  let milliseconds = 0;

  for (const dia in gruposPorDia) {
    const horarios = gruposPorDia[dia];
    horarios.sort((a, b) => a.getTime() - b.getTime());

    const qtd = horarios.length;
    if (qtd % 2 !== 0) {
      invalidDays++;
      continue;
    }

    for (let i = 0; i < qtd; i += 2) {
      const entrada = horarios[i];
      const saida = horarios[i + 1];
      milliseconds += saida.getTime() - entrada.getTime();
    }
  }

  return {
    milliseconds,
    invalidDays,
  };
}

export async function getPointsInInterval(
  startDate: string,
  endDate: string,
  timezone: string = DEFAULT_TIMEZONE,
): Promise<{
  points: Point[];
  milliseconds: number;
  invalidDays: number;
}> {
  await ensureDbReady();
  const startString = `${startDate} 00:00:00`;
  const endString = `${endDate} 23:59:59.999`;

  const startUTC = fromZonedTime(startString, timezone);
  const endUTC = fromZonedTime(endString, timezone);

  const allPoints = await db
    .select()
    .from(points)
    .where(
      between(
        points.timestamp,
        startUTC.toISOString(),
        endUTC.toISOString(),
      ),
    )
    .orderBy(asc(points.timestamp));

  const gruposPorDia: Record<string, Date[]> = {};

  allPoints.forEach(ponto => {
    const timestampInTimezone = toZonedTime(new Date(ponto.timestamp), timezone);
    const diaKey = format(timestampInTimezone, "MM-dd", {
      timeZone: timezone,
    });

    if (!gruposPorDia[diaKey]) {
      gruposPorDia[diaKey] = [];
    }
    gruposPorDia[diaKey].push(timestampInTimezone);
  });

  let invalidDays = 0;
  let milliseconds = 0;

  for (const dia in gruposPorDia) {
    const horarios = gruposPorDia[dia];
    horarios.sort((a, b) => a.getTime() - b.getTime());

    const qtd = horarios.length;
    if (qtd % 2 !== 0) {
      invalidDays++;
      continue;
    }

    for (let i = 0; i < qtd; i += 2) {
      const entrada = horarios[i];
      const saida = horarios[i + 1];
      milliseconds += saida.getTime() - entrada.getTime();
    }
  }

  return {
    points: allPoints,
    milliseconds,
    invalidDays,
  };
}
