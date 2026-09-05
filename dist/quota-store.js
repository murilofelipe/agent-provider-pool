import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
function today() {
    return new Date().toISOString().slice(0, 10);
}
function thisMonth() {
    return new Date().toISOString().slice(0, 7);
}
function endOfTodayUtc() {
    const d = new Date();
    d.setUTCHours(23, 59, 59, 999);
    return d.toISOString();
}
/**
 * Persists per-(provider, model) quota usage to a local JSON file, so a
 * process restart doesn't forget what's already been spent today -- single
 * process is the assumed usage pattern for this phase (no file-locking).
 */
export class QuotaStore {
    path;
    data;
    constructor(path) {
        this.path = path;
        this.data = this.load();
    }
    load() {
        if (!existsSync(this.path))
            return {};
        try {
            return JSON.parse(readFileSync(this.path, 'utf-8'));
        }
        catch {
            return {};
        }
    }
    save() {
        const dir = dirname(this.path);
        if (dir && !existsSync(dir))
            mkdirSync(dir, { recursive: true });
        writeFileSync(this.path, JSON.stringify(this.data, null, 2));
    }
    record(providerName, model) {
        const providerRecords = (this.data[providerName] ??= {});
        const existing = providerRecords[model];
        const day = today();
        const month = thisMonth();
        if (existing && existing.day === day && existing.month === month)
            return existing;
        // Day and/or month rolled over -- reset the counters that no longer apply.
        const record = {
            day,
            month,
            dailyCount: existing && existing.day === day ? existing.dailyCount : 0,
            monthlyCount: existing && existing.month === month ? existing.monthlyCount : 0,
        };
        providerRecords[model] = record;
        return record;
    }
    /** Proactive check: would the next call already exceed a configured
     * limit, or is this pair still marked exhausted from a recent reactive
     * 429? Does not itself make a network call. */
    isExhausted(providerName, config) {
        const record = this.record(providerName, config.model);
        if (record.exhaustedUntil && record.exhaustedUntil > new Date().toISOString())
            return true;
        if (config.dailyLimit !== undefined && record.dailyCount >= config.dailyLimit)
            return true;
        if (config.monthlyLimit !== undefined && record.monthlyCount >= config.monthlyLimit)
            return true;
        return false;
    }
    /** Call after a successful completion, so the next proactive check sees
     * accurate usage. */
    recordUsage(providerName, model) {
        const record = this.record(providerName, model);
        record.dailyCount += 1;
        record.monthlyCount += 1;
        this.save();
    }
    /** Call when a provider throws `QuotaExceededError` -- forces this pair
     * to read as exhausted for the rest of the day even if the configured
     * limit hadn't nominally been reached (covers a wrong/stale number). */
    markExhausted(providerName, model) {
        const record = this.record(providerName, model);
        record.exhaustedUntil = endOfTodayUtc();
        this.save();
    }
}
//# sourceMappingURL=quota-store.js.map