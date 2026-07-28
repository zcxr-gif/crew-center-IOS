/* ============================================================================
   Aeromexico Virtual — data.js
   Airline data in one place: fleet, hubs, network, ranks, events.

   Aircraft `type` and `livery` use the canonical Infinite Flight API strings
   on purpose — the Inflight Crew Center matches live flights to a VA's fleet by
   those exact names (see sanitizeFleet in the backend's crewAuth.js), so a typo
   here silently breaks auto-PIREP crediting. Copy them from the Crew Center's
   fleet editor rather than typing them by hand.
   ========================================================================== */

window.AMV_DATA = {

    hubs: [
        { icao: 'MMMX', iata: 'MEX', city: 'Mexico City',  name: 'Benito Juárez Intl',       role: 'Primary hub' },
        { icao: 'MMGL', iata: 'GDL', city: 'Guadalajara',  name: 'Miguel Hidalgo y Costilla', role: 'Focus city' },
        { icao: 'MMMY', iata: 'MTY', city: 'Monterrey',    name: 'Mariano Escobedo Intl',     role: 'Focus city' },
    ],

    fleet: [
        {
            type: 'Boeing 787-9 Dreamliner', livery: 'Aeromexico', short: '789',
            role: 'Long haul flagship', seats: 274, range: '7,635 nm',
            note: 'The backbone of the transatlantic and transpacific network.',
        },
        {
            type: 'Boeing 787-8 Dreamliner', livery: 'Aeromexico', short: '788',
            role: 'Long haul', seats: 243, range: '7,355 nm',
            note: 'Thinner long-haul routes and the South America runs.',
        },
        {
            type: 'Boeing 777-200ER', livery: 'Aeromexico', short: '772',
            role: 'Heavy long haul', seats: 277, range: '7,065 nm',
            note: 'Reserved for high-demand event flights and legacy schedules.',
        },
        {
            type: 'Boeing 737 MAX 8', livery: 'Aeromexico', short: '38M',
            role: 'Narrowbody', seats: 166, range: '3,550 nm',
            note: 'Domestic trunk routes plus the deeper US and Caribbean network.',
        },
        {
            type: 'Boeing 737-800', livery: 'Aeromexico', short: '738',
            role: 'Narrowbody', seats: 160, range: '2,935 nm',
            note: 'The everyday workhorse across Mexico and the southern US.',
        },
        {
            type: 'Embraer E190', livery: 'Aeromexico Connect', short: 'E90',
            role: 'Regional', seats: 99, range: '2,400 nm',
            note: 'Flown as Aeromexico Connect on regional and feeder sectors.',
        },
    ],

    // dist is great-circle nautical miles, rounded. block is scheduled block time.
    routes: [
        { from: 'MMMX', to: 'KJFK', city: 'New York',      region: 'North America', ac: '738', dist: 2085, block: '4h 55m' },
        { from: 'MMMX', to: 'KLAX', city: 'Los Angeles',   region: 'North America', ac: '38M', dist: 1240, block: '3h 45m' },
        { from: 'MMMX', to: 'KIAH', city: 'Houston',       region: 'North America', ac: '738', dist:  650, block: '2h 15m' },
        { from: 'MMMX', to: 'KMIA', city: 'Miami',         region: 'North America', ac: '38M', dist: 1140, block: '3h 20m' },
        { from: 'MMMX', to: 'KORD', city: 'Chicago',       region: 'North America', ac: '738', dist: 1520, block: '4h 05m' },
        { from: 'MMMX', to: 'CYYZ', city: 'Toronto',       region: 'North America', ac: '38M', dist: 1990, block: '4h 45m' },

        { from: 'MMMX', to: 'LEMD', city: 'Madrid',        region: 'Europe',        ac: '789', dist: 4770, block: '10h 05m' },
        { from: 'MMMX', to: 'LFPG', city: 'Paris',         region: 'Europe',        ac: '789', dist: 4890, block: '10h 25m' },
        { from: 'MMMX', to: 'EHAM', city: 'Amsterdam',     region: 'Europe',        ac: '788', dist: 4885, block: '10h 20m' },
        { from: 'MMMX', to: 'EGLL', city: 'London',        region: 'Europe',        ac: '789', dist: 4770, block: '10h 10m' },

        { from: 'MMMX', to: 'RJAA', city: 'Tokyo',         region: 'Asia Pacific',  ac: '789', dist: 6100, block: '13h 45m' },
        { from: 'MMMX', to: 'RKSI', city: 'Seoul',         region: 'Asia Pacific',  ac: '789', dist: 6180, block: '14h 05m' },

        { from: 'MMMX', to: 'SCEL', city: 'Santiago',      region: 'South America', ac: '788', dist: 3690, block: '8h 15m' },
        { from: 'MMMX', to: 'SAEZ', city: 'Buenos Aires',  region: 'South America', ac: '788', dist: 4050, block: '9h 00m' },
        { from: 'MMMX', to: 'SBGR', city: 'São Paulo',     region: 'South America', ac: '789', dist: 3690, block: '8h 20m' },
        { from: 'MMMX', to: 'SPJC', city: 'Lima',          region: 'South America', ac: '772', dist: 2330, block: '5h 30m' },

        { from: 'MMMX', to: 'MMUN', city: 'Cancún',        region: 'Domestic',      ac: '38M', dist:  700, block: '2h 05m' },
        { from: 'MMMX', to: 'MMGL', city: 'Guadalajara',   region: 'Domestic',      ac: 'E90', dist:  245, block: '1h 15m' },
        { from: 'MMMX', to: 'MMMY', city: 'Monterrey',     region: 'Domestic',      ac: 'E90', dist:  390, block: '1h 35m' },
        { from: 'MMMX', to: 'MMTJ', city: 'Tijuana',       region: 'Domestic',      ac: '738', dist: 1290, block: '3h 40m' },
        { from: 'MMMX', to: 'MMSD', city: 'Los Cabos',     region: 'Domestic',      ac: '738', dist:  795, block: '2h 25m' },
        { from: 'MMMX', to: 'MMPR', city: 'Puerto Vallarta', region: 'Domestic',    ac: 'E90', dist:  355, block: '1h 30m' },
        { from: 'MMMX', to: 'MMMD', city: 'Mérida',        region: 'Domestic',      ac: 'E90', dist:  545, block: '1h 50m' },
    ],

    // Mirrors the rank ladder configured in the Crew Center (Appearance → Ranks),
    // so the public site and the crew center never disagree about promotions.
    ranks: [
        { name: 'Cadet',              minHours:    0, note: 'Line training and your first supervised sectors.' },
        { name: 'Second Officer',     minHours:   10, note: 'Cleared for the domestic narrowbody network.' },
        { name: 'First Officer',      minHours:   40, note: 'Full North American route access.' },
        { name: 'Senior First Officer', minHours: 100, note: 'Widebody type training unlocked.' },
        { name: 'Captain',            minHours:  250, note: 'Command of the long-haul fleet.' },
        { name: 'Senior Captain',     minHours:  500, note: 'Event command and mentoring duties.' },
        { name: 'Line Check Captain', minHours: 1000, note: 'Checks and signs off new captains.' },
    ],

    // Edited in this repo and mirrored into the Crew Center's events tool.
    // Dates are ISO-8601 with an explicit UTC offset so they render correctly
    // in every pilot's local time.
    events: [
        {
            title: 'Águila Transatlántica',
            date: '2026-08-15T19:00:00Z',
            from: 'MMMX', to: 'LEMD', ac: 'Boeing 787-9 Dreamliner',
            server: 'Expert', slots: 40,
            blurb: 'The full flagship run to Madrid, flown as a group departure out of Mexico City with staffed ATC on the ground.',
        },
        {
            title: 'Valle de México Fly-In',
            date: '2026-08-29T21:00:00Z',
            from: 'Anywhere', to: 'MMMX', ac: 'Any Aeromexico fleet type',
            server: 'Expert', slots: 0,
            blurb: 'Bring anything in our fleet into MMMX. Arrival slots are first-come; ATC staffed for three hours.',
        },
        {
            title: 'Connect Regional Rush',
            date: '2026-09-12T20:00:00Z',
            from: 'MMGL', to: 'MMMY', ac: 'Embraer E190',
            server: 'Expert', slots: 24,
            blurb: 'A short, sharp Connect sector for newer pilots — perfect for a first logged event flight.',
        },
        {
            title: 'Pacífico Nocturno',
            date: '2026-09-26T04:00:00Z',
            from: 'MMMX', to: 'RJAA', ac: 'Boeing 787-9 Dreamliner',
            server: 'Expert', slots: 30,
            blurb: 'Our longest sector, overnight into Narita. Long-haul badge on completion.',
        },
    ],

    // NO ROSTER FIGURES HERE, DELIBERATELY.
    //
    // This used to carry pilots: 640, hoursFlown: 48200, flightsFiled: 21400 —
    // and a `count` on every fleet type. None of it was real. They were
    // plausible-looking placeholders that the site then printed as fact, in
    // big animated numerals, next to genuinely true things. That is the worst
    // way to be wrong: it reads as authoritative.
    //
    // Everything the site states is now either verifiable from this file
    // (destinations = routes.length, types = fleet.length, hubs = hubs.length)
    // or comes live from the Inflight embed. If the VA wants a pilot count or
    // an hours total on the site, wire it to the crew center's real figure —
    // do not type a number in here.
};
