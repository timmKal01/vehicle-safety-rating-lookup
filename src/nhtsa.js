const BASE_URL = 'https://api.nhtsa.gov/SafetyRatings';
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 1000;

async function fetchWithTimeout(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
        return await fetch(url, { signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

async function fetchWithRetry(url, label) {
    let lastErr;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            const res = await fetchWithTimeout(url);
            const body = await res.json().catch(() => null);
            if (res.ok && body) return body;
            const retryable = res.status === 429 || res.status >= 500 || body === null;
            lastErr = new Error(`NHTSA API request failed for ${label}: ${res.status} ${res.statusText}`);
            if (!retryable) throw lastErr;
        } catch (err) {
            lastErr = err.name === 'AbortError'
                ? new Error(`NHTSA API request timed out for ${label} (attempt ${attempt}/${MAX_ATTEMPTS})`)
                : err;
        }
        if (attempt < MAX_ATTEMPTS) {
            const delay = BASE_DELAY_MS * 2 ** (attempt - 1);
            await new Promise((r) => setTimeout(r, delay));
        }
    }
    throw lastErr;
}

/**
 * NHTSA's SafetyRatings API is a two-step lookup: modelyear/make/model returns one VehicleId
 * per trim (a single make/model/year can have several), then each VehicleId is queried
 * separately for the actual star ratings. A single-call approach silently returns nothing
 * useful because the first endpoint doesn't carry rating data itself.
 */
export async function fetchSafetyRatings({ year, make, model }) {
    const listUrl = `${BASE_URL}/modelyear/${encodeURIComponent(year)}/make/${encodeURIComponent(make)}/model/${encodeURIComponent(model)}`;
    const listBody = await fetchWithRetry(listUrl, `${year} ${make} ${model}`);
    const vehicles = (listBody.Results ?? []).filter((v) => v.VehicleId);

    const ratings = [];
    for (const vehicle of vehicles) {
        const ratingUrl = `${BASE_URL}/VehicleId/${vehicle.VehicleId}`;
        const ratingBody = await fetchWithRetry(ratingUrl, `VehicleId ${vehicle.VehicleId}`);
        const r = ratingBody.Results?.[0];
        if (!r) continue;

        ratings.push({
            vehicleId: vehicle.VehicleId,
            vehicleDescription: vehicle.VehicleDescription ?? null,
            modelYear: year,
            make,
            model,
            overallRating: r.OverallRating ?? null,
            overallFrontCrashRating: r.OverallFrontCrashRating ?? null,
            overallSideCrashRating: r.OverallSideCrashRating ?? null,
            rolloverRating: r.RolloverRating ?? null,
            rolloverPossibility: r.RolloverPossibility ?? null,
            sidePoleCrashRating: r.SidePoleCrashRating ?? null,
            electronicStabilityControl: r.NHTSAElectronicStabilityControl ?? null,
            forwardCollisionWarning: r.NHTSAForwardCollisionWarning ?? null,
            laneDepartureWarning: r.NHTSALaneDepartureWarning ?? null,
            complaintsCount: r.ComplaintsCount ?? null,
            recallsCount: r.RecallsCount ?? null,
            investigationCount: r.InvestigationCount ?? null,
        });
    }

    return ratings;
}
