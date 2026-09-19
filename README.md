# Vehicle Safety Rating Lookup: NHTSA 5-Star Ratings

Give it a model year, make, and model. Get back official NHTSA safety
ratings for every trim NHTSA has tested: overall, front crash, side crash,
rollover, standard-equipment safety features, and linked
complaint/recall/investigation counts.

## Output (sample)

```json
{
  "vehicleId": 16835,
  "vehicleDescription": "2022 Honda ACCORD 4 DR FWD",
  "modelYear": 2022,
  "make": "Honda",
  "model": "Accord",
  "overallRating": "5",
  "overallFrontCrashRating": "5",
  "overallSideCrashRating": "5",
  "rolloverRating": "5",
  "rolloverPossibility": 0.093,
  "sidePoleCrashRating": "5",
  "electronicStabilityControl": "Standard",
  "forwardCollisionWarning": "Standard",
  "laneDepartureWarning": "Standard",
  "complaintsCount": 244,
  "recallsCount": 4,
  "investigationCount": 1
}
```

A year/make/model with no NHTSA rating on file returns no items, still
billed once for the lookup.

## Who this is for

Completes the full safety picture alongside this portfolio's other two
NHTSA actors, [Vehicle Recall Tracker](https://github.com/timmKal01/vehicle-recall-tracker)
and [Vehicle Complaint Tracker](https://github.com/timmKal01/vehicle-complaint-tracker):

- **Dealers and shoppers** comparing a vehicle's official crash-test rating before a purchase or trade-in.
- **Fleet managers** screening vehicles for a fleet on safety rating, not just price and mileage.
- **Insurance and finance teams** wanting a documented safety profile per vehicle.

## Input

| Field | Type | Description |
|---|---|---|
| `year` | integer | Vehicle model year, e.g. `2022`. |
| `make` | string | Vehicle manufacturer, e.g. `"Honda"`, `"Ford"`, `"Toyota"`. |
| `model` | string | Vehicle model, e.g. `"Accord"`, `"Explorer"`, `"Camry"`. |

```json
{
  "year": 2022,
  "make": "Honda",
  "model": "Accord"
}
```

## How it works

NHTSA's SafetyRatings API is a two-step lookup, not a single call: first a
year/make/model query returns one `VehicleId` per trim NHTSA tested (a
single model year can have several trims with different ratings), then
each `VehicleId` is queried individually for its actual star ratings. This
actor handles both steps and returns one record per trim, with automatic
retries on transient failures. No key, no proxy, no scraping, public-domain
US government data.

## Related products

- [Vehicle Recall Tracker](https://github.com/timmKal01/vehicle-recall-tracker): official confirmed safety recalls for a make/model/year range
- [Vehicle Complaint Tracker](https://github.com/timmKal01/vehicle-complaint-tracker): raw owner-submitted complaints, the early-warning signal before an official recall
