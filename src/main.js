import { Actor, log } from 'apify';
import { fetchSafetyRatings } from './nhtsa.js';

await Actor.init();

const input = (await Actor.getInput()) ?? {};
const { year, make, model } = input;

if (!year || !make || !model) {
    throw new Error('"year", "make", and "model" are all required.');
}

/** Must match the event name configured in this Actor's pay-per-event pricing on Apify. */
const RATING_LOOKUP_EVENT = 'rating-lookup';

const ratings = await fetchSafetyRatings({ year, make, model });

for (const rating of ratings) {
    await Actor.pushData(rating);
}

await Actor.charge({ eventName: RATING_LOOKUP_EVENT });

log.info(`Found ${ratings.length} trim(s) with safety ratings for ${year} ${make} ${model}`);

await Actor.exit();
