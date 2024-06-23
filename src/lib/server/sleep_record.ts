import { DateTime } from "luxon";
import { withDBClient, Client as DBClient } from "./db";
import type { SleepRecord } from "$lib/shared_types";
import { getUserSettings } from "./user";
import { TimezoneContext } from "$lib/TimezoneContext";
import { getTargetTimeForDate, isTimeWithinRecordDay, luxonNow } from "$lib/time";
import { error } from "@sveltejs/kit";
import { parseTime } from "$lib/textutils";
import { mustBeUlid, parseDate } from "$lib/validations";

export async function fetchSleepRecord(user_id: string, from_date: string, to_date: string, db?: DBClient): Promise<SleepRecord[]> {
  if (!db) {
    return await withDBClient(db => fetchSleepRecord(user_id, from_date, to_date, db));
  }
  let { rows } = await db.query({
    text: `SELECT
               date::text,
               timezone,
               target::text,
               floor(extract(epoch from target_utc)*1000)::double precision as "targetMillis",
               floor(extract(epoch from actual_sleep_time)*1000)::double precision as "actualSleepTimeMillis"
             FROM sleep_records
             WHERE user_id = $1
               AND date >= $2
               AND date <= $3`,
    values: [user_id, from_date, to_date]
  });
  return rows as SleepRecord[];
}

export async function userTotalDaysRecorded(user_id: string, db?: DBClient): Promise<number> {
  if (!db) {
    return await withDBClient(db => userTotalDaysRecorded(user_id, db));
  }
  let { rows } = await db.query({
    text: `SELECT count(*)::integer as d
             FROM sleep_records
             WHERE user_id = $1`,
    values: [user_id]
  });
  return rows[0].d;
}

export async function recordSleep(user_id: string, date: string, timestamp_millis: number, db?: DBClient): Promise<void> {
  if (!db) {
    return await withDBClient(db => recordSleep(user_id, date, timestamp_millis, db));
  }
  await db.query("begin transaction isolation level serializable");
  try {
    mustBeUlid(user_id, "user_id");
    let user_settings = await getUserSettings(user_id, db);
    let tzContext = TimezoneContext.fromZoneName(user_settings.timezone);
    let now = luxonNow(tzContext);
    let requested_record_date = parseDate(date, tzContext);
    if (requested_record_date > now) {
      throw error(400, `Requested date to record is in the future`);
    }
    let requested_time = DateTime.fromMillis(timestamp_millis, { zone: tzContext.zone });
    let parsed_target = parseTime(user_settings.sleepTargetTime);
    if (!isTimeWithinRecordDay(requested_time, requested_record_date, parsed_target)) {
      throw error(400, `Requested timestamp to record is not within the correct record day`);
    }
    let target_time = getTargetTimeForDate(requested_record_date, parsed_target);
    if (requested_time.minus({ minutes: 1 }) > now) {
      throw error(400, `Requested timestamp to record is in the future`);
    }
    if (requested_time > now) {
      requested_time = now;
    }
    let { rows: existing_records }: { rows: any[] } = await db.query({
      text: `select actual_sleep_time from sleep_records where user_id = $1 and date = $2 for update nowait`,
      values: [user_id, date]
    });
    let values = [user_id, date, tzContext.name, user_settings.sleepTargetTime, target_time.toISO(), requested_time.toISO()];
    if (existing_records.length == 0) {
      await db.query({
        text: `insert into sleep_records (user_id, date, timezone, target, target_utc, actual_sleep_time)
                 values ($1, $2, $3, $4, $5, $6)`,
        values
      });
      // TODO: set up donation info etc later
      // TODO: cancel notifications
    } else {
      if (existing_records[0].actual_sleep_time.getTime() > requested_time.toMillis()) {
        throw error(400, `Can't update existing record to earlier.`);
      }
      await db.query({
        text: `
          update sleep_records
          set
            timezone = $3,
            target = $4,
            target_utc = $5,
            actual_sleep_time = $6
          where user_id = $1 and date = $2`,
        values
      });
      // TODO: update donation info etc later
    }
    await db.query("commit");
  } catch (e) {
    await db.query("rollback");
    throw e;
  }
}
