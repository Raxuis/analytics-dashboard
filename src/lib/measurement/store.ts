import { getRedis, type RedisClient } from "../redis";
import type { JourneyEvent } from "./schema";

// One atomic operation: retry deduplication, session milestones and aggregate counters.
export const journeyScript = `
if redis.call('SET', KEYS[1], '1', 'NX', 'EX', 604800) == false then return 0 end
local session = KEYS[2]
if tonumber(redis.call('HGET', session, 'budget') or '0') >= 300 then return 0 end
redis.call('HINCRBY', session, 'budget', 1)
redis.call('HSETNX', 'analytics::journey-meta', 'since', ARGV[1])
local day = redis.call('HGET', session, 'day')
if not day then
  day = ARGV[1]
  redis.call('HSET', session, 'day', day)
end
local aggregate = 'analytics::journey::' .. day
local function count(field)
  redis.call('HINCRBY', aggregate, field, 1)
end
local function milestone(field, condition)
  if condition and redis.call('HSETNX', session, field, '1') == 1 then count(field) end
end
milestone('sessions', true)
if redis.call('HSETNX', session, 'source', ARGV[5]) == 1 then count('source:' .. ARGV[5]) end
if redis.call('HSETNX', session, 'locale', ARGV[6]) == 1 then count('locale:' .. ARGV[6]) end
redis.call('HSET', session, 'seen:' .. ARGV[2], '1')
local name = ARGV[2]
local detail = ARGV[3]
local placement = ARGV[4]
count('event:' .. name)
if detail ~= '' then milestone('detail:' .. name .. ':' .. detail, true) end
local function seen(n) return redis.call('HEXISTS', session, 'seen:' .. n) == 1 end
milestone('ready', seen('scene_ready'))
milestone('opened', name == 'passport_open' and seen('scene_ready'))
milestone('explored', (name == 'spread_view' or name == 'city_view') and redis.call('HEXISTS', session, 'opened') == 1)
if name == 'outbound' then
  redis.call('HSET', session, 'clicked:' .. placement, '1')
  count('outbound:' .. detail .. ':' .. placement)
end
milestone('passport_conversion', name == 'outbound' and placement == 'scene' and redis.call('HEXISTS', session, 'explored') == 1)
milestone('links_opened', seen('links_open'))
milestone('direct_conversion', name == 'outbound' and placement == 'direct' and seen('links_open'))
if name == 'active_time' then milestone('active:' .. ARGV[7], true) end
redis.call('EXPIRE', session, 604800)
redis.call('EXPIRE', aggregate, 604800)
return 1
`;
export async function storeJourney(
  event: JourneyEvent,
  day: string,
  redis: RedisClient = getRedis(),
) {
  return redis.evaluate(
    journeyScript,
    [`analytics::dedup::${event.id}`, `analytics::session::${event.session}`],
    [
      day,
      event.name,
      event.detail ?? "",
      event.placement ?? "",
      event.source,
      event.locale,
      String(event.seconds ?? ""),
    ],
  );
}
