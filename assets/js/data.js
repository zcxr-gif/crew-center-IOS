/* ============================================================================
   Aeromexico Virtual — data.js
   Airline data in one place: identity, staff, fleet, hubs, network, ranks,
   events, requirements.

   THE OPERATIONS PLAN IS THE SOURCE. Everything in this file that the airline's
   Operations Plan states is copied from it rather than decided here — the rank
   ladder and its sector limits (plan §4), the fleet and what each type is for
   (§5), the route tiers and their flight-number series (§6), joining and
   activity (§3), the event calendar (§9), the staff structure (§2). Where this
   file and the plan disagree, the plan is right and this file is a bug.

   Aircraft `type` and `livery` use the canonical Infinite Flight API strings
   on purpose — the Inflight Crew Center matches live flights to a VA's fleet by
   those exact names (see sanitizeFleet in the backend's crewAuth.js), so a typo
   here silently breaks auto-PIREP crediting. Copy them from the Crew Center's
   fleet editor rather than typing them by hand.

   NOTHING IN HERE IS A ROSTER FIGURE. See the note at the foot of the file.
   ========================================================================== */

window.AMV_DATA = {

    /* ---- Identity (plan §1) ---------------------------------------------- */
    airline: {
        name:     'Aeromexico Virtual',
        basedOn:  'Aeroméxico',
        iata:     'AM',
        icao:     'AMX',
        callsign: 'AEROMEXICO',
        alliance: 'SkyTeam',
        platform: 'Infinite Flight',
        server:   'Expert Server',
    },

    /* ---- Who runs the airline (plan §2) -----------------------------------
       The executive team of two, then the directors, then the roles that
       report into them. `ifc` is an Infinite Flight Community profile; a role
       with no name is genuinely vacant and the page says so rather than
       inventing somebody to fill the grid. Plan §2: any role vacant for more
       than 30 days is either filled or formally absorbed. */
    staff: [
        {
            role: 'Chief Executive Officer', short: 'CEO',
            name: 'Randomaviator2', ifc: 'randomaviator2',
            owns: 'Direction, policy, partnerships, external representation, final say on appeals.',
            reports: null,
        },
        {
            role: 'Chief Operating Officer', short: 'COO',
            name: '_ServerNoob', ifc: '_ServerNoob',
            owns: 'Day-to-day running of the airline; deputises for the CEO.',
            reports: 'CEO',
        },
        {
            role: 'Director of Flight Operations', short: 'Flight Ops',
            name: '', ifc: '',
            owns: 'Fleet, network, standard operating procedures, flight report validation.',
            reports: 'COO',
        },
        {
            role: 'Director of Events', short: 'Events',
            name: '', ifc: '',
            owns: 'Event calendar, planning, execution, joint events with other VAs.',
            reports: 'COO',
        },
        {
            role: 'Director of Personnel', short: 'Personnel',
            name: '', ifc: '',
            owns: 'Recruitment, applications, ranks, activity, records.',
            reports: 'COO',
        },
        {
            role: 'Director of Communications', short: 'Comms',
            name: '', ifc: '',
            owns: 'Announcements, IFC presence, social media, brand use.',
            reports: 'COO',
        },
        {
            role: 'Line Trainers', short: 'Training',
            name: '', ifc: '', team: true,
            owns: 'New-pilot support, remedial help, mentoring.',
            reports: 'Director of Flight Operations',
        },
        {
            role: 'Moderators', short: 'Moderation',
            name: '', ifc: '', team: true,
            owns: 'Discord conduct, first-line member support.',
            reports: 'Director of Personnel',
        },
    ],

    /* ---- Bases (plan §1) --------------------------------------------------
       Mexico City is the hub; Monterrey, Guadalajara and Cancún are bases.
       Cancún is a base in the plan and a destination in the network — both are
       true, and the network page counts its sectors off the route list rather
       than claiming a number for it. */
    hubs: [
        { icao: 'MMMX', iata: 'MEX', city: 'Mexico City',  name: 'Benito Juárez Intl',        role: 'Primary hub' },
        { icao: 'MMMY', iata: 'MTY', city: 'Monterrey',    name: 'Mariano Escobedo Intl',     role: 'Base' },
        { icao: 'MMGL', iata: 'GDL', city: 'Guadalajara',  name: 'Miguel Hidalgo y Costilla', role: 'Base' },
        { icao: 'MMUN', iata: 'CUN', city: 'Cancún',       name: 'Cancún Intl',               role: 'Base' },
    ],

    /* ---- Where everything is ----------------------------------------------
       Aerodrome reference points, degrees, WGS-84. Used by the route map to
       place a dot and draw a great circle; nothing else reads them. A sector
       whose airport is not in here is listed by the network page and left off
       the map, because a guessed position is a wrong position. */
    airports: {
        MMMX: [ 19.436,  -99.072], MMGL: [ 20.522, -103.311], MMMY: [ 25.778, -100.107],
        MMUN: [ 21.037,  -86.877], MMTJ: [ 32.541, -116.970], MMSD: [ 23.152, -109.721],
        MMPR: [ 20.680, -105.254], MMMD: [ 20.937,  -89.658],
        KJFK: [ 40.640,  -73.779], KLAX: [ 33.942, -118.408], KIAH: [ 29.984,  -95.341],
        KMIA: [ 25.793,  -80.291], KORD: [ 41.978,  -87.905], CYYZ: [ 43.677,  -79.631],
        LEMD: [ 40.472,   -3.561], LFPG: [ 49.010,    2.548], EHAM: [ 52.309,    4.764],
        EGLL: [ 51.470,   -0.454],
        RJAA: [ 35.765,  140.386], RKSI: [ 37.463,  126.440],
        SCEL: [-33.393,  -70.786], SAEZ: [-34.822,  -58.536], SBGR: [-23.435,  -46.473],
        SPJC: [-12.022,  -77.114],
    },

    /* ---- Fleet (plan §5) --------------------------------------------------
       `releasedAt` is the rank that unlocks the type — the plan's fleet table.
       `operation` and `typical` are that table's own "Operation" and "Typical
       sector" columns, which is what makes this a fleet page rather than a
       spotter's list.

       Two types are ours and are NOT in the plan's table: the 777-200ER and
       the E190. Both are flown, both are photographed below in our own
       colours, so they are published — with a rank derived from what the plan
       does say (the E190 sits with the 737-800 as a type a Cadet can take; the
       777 is a heavy reserved for events, so it is Captain's). Confirm both
       with Flight Operations and correct them here if they land elsewhere.

       `photo` is one of the VA's own airframes, shot in the sim and uploaded to
       the tracker's community-aircraft gallery — the same bucket the live map
       serves them from, so a re-upload there lands here without a deploy. It
       carries `reg` (which airframe this actually is) and the image's real
       pixel dimensions, which the card puts on the <img> tag so the box is
       reserved before decode. A type without a photo falls back to the mark;
       see AMV.fleetMedia in site.js. */
    fleet: [
        {
            type: 'Embraer E190', livery: 'Aeromexico Connect', short: 'E90',
            role: 'Regional', seats: 99, range: '2,400 nm',
            releasedAt: 'Cadet', derivedRank: true,
            operation: 'Regional and feeder sectors, flown as Aeromexico Connect',
            typical: ['MMMX–MMGL', 'MMMX–MMMD'],
            note: 'The type a new pilot flies first: short sectors inside the Cadet limit, on the network a Cadet already has.',
            photo: {
                src: 'https://thebucketstorage2.s3.us-east-2.amazonaws.com/community-aircraft/XAGAH-1768151925204.webp',
                reg: 'XA-GAH', w: 1920, h: 886,
            },
        },
        {
            type: 'Boeing 737-800', livery: 'Aeromexico', short: '738',
            role: 'Narrowbody', seats: 160, range: '2,935 nm',
            releasedAt: 'Cadet',
            operation: 'Domestic trunk and short international',
            typical: ['MMMX–MMUN', 'MMMX–MMTJ'],
            note: 'The everyday workhorse across Mexico and the southern US.',
            photo: {
                src: 'https://thebucketstorage2.s3.us-east-2.amazonaws.com/community-aircraft/XAAMA-1776252960171.webp',
                reg: 'XA-AMA', w: 1920, h: 864,
            },
        },
        {
            type: 'Boeing 737 MAX 8', livery: 'Aeromexico', short: '38M',
            role: 'Narrowbody', seats: 166, range: '3,550 nm',
            releasedAt: 'Second Officer',
            operation: 'Domestic and US transborder',
            typical: ['MMMX–KLAX', 'MMMX–KMIA'],
            note: 'Domestic trunk routes plus the deeper US and Caribbean network.',
            photo: {
                src: 'https://thebucketstorage2.s3.us-east-2.amazonaws.com/community-aircraft/XAMLI-1776275631124.webp',
                reg: 'XA-MLI', w: 1920, h: 886,
            },
        },
        {
            type: 'Boeing 787-8 Dreamliner', livery: 'Aeromexico', short: '788',
            role: 'Long haul', seats: 243, range: '7,355 nm',
            releasedAt: 'First Officer',
            operation: 'Long-haul',
            typical: ['MMMX–LEMD', 'MMMX–SCEL'],
            note: 'Thinner long-haul routes and the South America runs.',
            photo: {
                src: 'https://thebucketstorage2.s3.us-east-2.amazonaws.com/community-aircraft/N961AM-1776329131824.webp',
                reg: 'N961AM', w: 1920, h: 864,
            },
        },
        {
            type: 'Boeing 787-9 Dreamliner', livery: 'Aeromexico', short: '789',
            role: 'Long haul flagship', seats: 274, range: '7,635 nm',
            releasedAt: 'Senior First Officer',
            operation: 'Flagship and ultra-long-range',
            typical: ['MMMX–EGLL', 'MMMX–RJAA', 'MMMX–LFPG'],
            note: 'The backbone of the transatlantic and transpacific network.',
            photo: {
                src: 'https://thebucketstorage2.s3.us-east-2.amazonaws.com/community-aircraft/XAADD-1775817369312.webp',
                reg: 'XA-ADD', w: 1920, h: 886,
            },
        },
        {
            type: 'Boeing 777-200ER', livery: 'Aeromexico', short: '772',
            role: 'Heavy long haul', seats: 277, range: '7,065 nm',
            releasedAt: 'Captain', derivedRank: true,
            operation: 'High-demand event flights and legacy schedules',
            typical: ['MMMX–SPJC'],
            note: 'Reserved for event operations rather than the everyday schedule.',
            photo: {
                src: 'https://thebucketstorage2.s3.us-east-2.amazonaws.com/community-aircraft/N774AM-1768671388140.webp',
                reg: 'N774AM', w: 1920, h: 886,
            },
        },
    ],

    /* ---- Fleet development (plan §5, §14) ---------------------------------
       Types the Operations Plan names and the airline has not put into service.
       They are listed as planned, NOT as fleet, because the plan's own closing
       checklist has "fleet liveries confirmed against the current Infinite
       Flight aircraft list — particularly the Boeing 757 heritage scheme and
       the A320 / A321" as an open item. This site does not publish a paper
       fleet: a type moves into `fleet` above on the day someone confirms the
       livery exists in the sim, and not before. */
    fleetPlanned: [
        {
            type: 'Airbus A320', short: '320', releasedAt: 'Second Officer',
            operation: 'Domestic and regional, codeshare',
            status: 'Livery to be confirmed in Infinite Flight',
        },
        {
            type: 'Airbus A321', short: '321', releasedAt: 'Second Officer',
            operation: 'High-density domestic, codeshare',
            status: 'Livery to be confirmed in Infinite Flight',
        },
        {
            type: 'Boeing 757', short: '757', releasedAt: 'First Officer',
            operation: 'Retro operations, anniversary flights and events',
            status: 'Heritage colours — livery to be confirmed in Infinite Flight',
        },
    ],

    /* ---- Route tiers (plan §6) --------------------------------------------
       The network is published in five tiers, each with its own flight-number
       series. Flight numbers themselves are issued in the crew centre, which
       is why no route below carries one typed in here — when the crew centre
       answers, its real numbers appear on the cards. */
    tiers: [
        { name: 'Domestic',    series: 'AM 1000', note: 'Trunk routes between Mexican cities' },
        { name: 'Transborder', series: 'AM 2000', note: 'United States, Canada, Central America and the Caribbean' },
        { name: 'Long-haul',   series: 'AM 4000', note: 'Europe, South America and Asia' },
        { name: 'Codeshare',   series: 'AM 7000', note: 'SkyTeam partner sectors flown in partner colours' },
        { name: 'Charter',     series: 'AM 9000', note: 'One-off and event flying, by Flight Operations approval' },
    ],

    /* ---- Network (plan §6) ------------------------------------------------
       dist is great-circle nautical miles, rounded. block is scheduled block
       time. `tier` is the plan's publication tier. There is deliberately no
       minimum rank typed in: it is DERIVED from the rank ladder — the higher
       of the rank that unlocks the aircraft and the rank whose sector limit
       covers the block time — exactly as the plan describes the crew centre
       enforcing it at booking. See AMV.minRankFor in site.js. Type a rank in
       here and it will drift from the ladder within a month. */
    routes: [
        { from: 'MMMX', to: 'MMGL', city: 'Guadalajara',   region: 'Domestic',      tier: 'Domestic',    ac: 'E90', dist:  245, block: '1h 15m' },
        { from: 'MMMX', to: 'MMPR', city: 'Puerto Vallarta', region: 'Domestic',    tier: 'Domestic',    ac: 'E90', dist:  355, block: '1h 30m' },
        { from: 'MMMX', to: 'MMMY', city: 'Monterrey',     region: 'Domestic',      tier: 'Domestic',    ac: 'E90', dist:  390, block: '1h 35m' },
        { from: 'MMMX', to: 'MMMD', city: 'Mérida',        region: 'Domestic',      tier: 'Domestic',    ac: 'E90', dist:  545, block: '1h 50m' },
        { from: 'MMMX', to: 'MMUN', city: 'Cancún',        region: 'Domestic',      tier: 'Domestic',    ac: '38M', dist:  700, block: '2h 05m' },
        { from: 'MMMX', to: 'MMSD', city: 'Los Cabos',     region: 'Domestic',      tier: 'Domestic',    ac: '738', dist:  795, block: '2h 25m' },
        { from: 'MMMX', to: 'MMTJ', city: 'Tijuana',       region: 'Domestic',      tier: 'Domestic',    ac: '738', dist: 1290, block: '3h 40m' },

        { from: 'MMMX', to: 'KIAH', city: 'Houston',       region: 'North America', tier: 'Transborder', ac: '738', dist:  650, block: '2h 15m' },
        { from: 'MMMX', to: 'KMIA', city: 'Miami',         region: 'North America', tier: 'Transborder', ac: '38M', dist: 1140, block: '3h 20m' },
        { from: 'MMMX', to: 'KLAX', city: 'Los Angeles',   region: 'North America', tier: 'Transborder', ac: '38M', dist: 1240, block: '3h 45m' },
        { from: 'MMMX', to: 'KORD', city: 'Chicago',       region: 'North America', tier: 'Transborder', ac: '738', dist: 1520, block: '4h 05m' },
        { from: 'MMMX', to: 'CYYZ', city: 'Toronto',       region: 'North America', tier: 'Transborder', ac: '38M', dist: 1990, block: '4h 45m' },
        { from: 'MMMX', to: 'KJFK', city: 'New York',      region: 'North America', tier: 'Transborder', ac: '738', dist: 2085, block: '4h 55m' },

        { from: 'MMMX', to: 'SPJC', city: 'Lima',          region: 'South America', tier: 'Long-haul',   ac: '772', dist: 2330, block: '5h 30m' },
        { from: 'MMMX', to: 'SCEL', city: 'Santiago',      region: 'South America', tier: 'Long-haul',   ac: '788', dist: 3690, block: '8h 15m' },
        { from: 'MMMX', to: 'SBGR', city: 'São Paulo',     region: 'South America', tier: 'Long-haul',   ac: '789', dist: 3690, block: '8h 20m' },
        { from: 'MMMX', to: 'SAEZ', city: 'Buenos Aires',  region: 'South America', tier: 'Long-haul',   ac: '788', dist: 4050, block: '9h 00m' },
        { from: 'MMMX', to: 'LEMD', city: 'Madrid',        region: 'Europe',        tier: 'Long-haul',   ac: '789', dist: 4770, block: '10h 05m' },
        { from: 'MMMX', to: 'EGLL', city: 'London',        region: 'Europe',        tier: 'Long-haul',   ac: '789', dist: 4770, block: '10h 10m' },
        { from: 'MMMX', to: 'EHAM', city: 'Amsterdam',     region: 'Europe',        tier: 'Long-haul',   ac: '788', dist: 4885, block: '10h 20m' },
        { from: 'MMMX', to: 'LFPG', city: 'Paris',         region: 'Europe',        tier: 'Long-haul',   ac: '789', dist: 4890, block: '10h 25m' },
        { from: 'MMMX', to: 'RJAA', city: 'Tokyo',         region: 'Asia Pacific',  tier: 'Long-haul',   ac: '789', dist: 6100, block: '13h 45m' },
        { from: 'MMMX', to: 'RKSI', city: 'Seoul',         region: 'Asia Pacific',  tier: 'Long-haul',   ac: '789', dist: 6180, block: '14h 05m' },
    ],

    /* ---- Rank ladder (plan §4) --------------------------------------------
       Rank does two things: it releases aircraft, and it raises the longest
       sector a pilot may file. `sectorHours` is that cap — null means uncapped
       — and it is what makes the ladder a progression rather than a scoreboard.
       Unlocks are cumulative: a rank keeps everything the ranks below it opened.

       This must stay identical to the ladder configured in the Crew Center
       (Appearance → Ranks). The crew centre is what actually promotes people;
       if the two disagree, the crew centre wins and this file is wrong. */
    ranks: [
        {
            name: 'Cadet', minHours: 0, sectorHours: 3,
            note: 'Where every pilot starts. One sector in your first seven days and you are a line pilot.',
            duty: 'Fly the published network inside the Cadet sector limit. Line Trainers are there for the first few.',
        },
        {
            name: 'Second Officer', minHours: 10, sectorHours: 5,
            note: 'The transborder network opens up, and with it the first sectors into the United States.',
            duty: 'Full domestic flying plus US transborder sectors up to five hours.',
        },
        {
            name: 'First Officer', minHours: 40, sectorHours: 7.5,
            note: 'Widebody flying begins. The 787-8 and the deeper South American network.',
            duty: 'Long-haul sectors up to seven and a half hours; may crew event flights.',
        },
        {
            name: 'Senior First Officer', minHours: 80, sectorHours: 10,
            note: 'The flagship. Madrid, Amsterdam and the transatlantic network on the 787-9.',
            duty: 'Sectors up to ten hours. Expected to help newer pilots on group flights.',
        },
        {
            name: 'Captain', minHours: 200, sectorHours: 13,
            note: 'Command of the long-haul fleet, and the full fleet released.',
            duty: 'Sectors up to thirteen hours. Leads group departures when Flight Ops asks.',
        },
        {
            name: 'Senior Captain', minHours: 500, sectorHours: null,
            note: 'No sector limit at all — Tokyo, Seoul and the ultra-long-range codeshares.',
            duty: 'Event command and mentoring duties. The rank that flies the sectors nobody else may file.',
        },
        {
            name: 'Aeroméxico Airman', minHours: null, sectorHours: null, appointed: true, multiplier: 1.4,
            note: 'Awarded, not earned by hours. Full fleet, no sector limit, and a 1.4× multiplier on every hour logged after it.',
            duty: 'Made by the CEO on the Director of Flight Operations’ recommendation, for sustained contribution — and withdrawn on the same authority if the standard is not kept.',
        },
    ],

    /* ---- How the ladder is applied (plan §4) ------------------------------ */
    rankRules: [
        'The sector limit is a filed block time. A pilot may not book or file a route longer than their rank allows, and Flight Operations will not validate one.',
        'Codeshare flying is bound by the same limit — partner routes reach further than the Aeroméxico network alone, so this is where most pilots first meet it.',
        'Promotion is automatic on reaching the hour threshold, and is applied when the flight report that crosses it is validated.',
        'Hours transferred from another virtual airline are recognised up to 50 hours on production of evidence, and do not count towards Captain or above.',
    ],

    /* ---- Joining (plan §3) ------------------------------------------------
       These are the plan's entry requirements, which are not the ones this site
       carried before: it asked for Grade 3, ten hours and a violation count of
       its own invention. Grade 2 is the plan's bar to APPLY; Infinite Flight
       itself requires Grade 3 to enter the Expert Server, where the airline
       flies, so both are stated rather than one being quietly dropped. */
    requirements: [
        { req: 'An active Infinite Flight Pro subscription', why: 'The airline flies the Expert Server, which Pro is required for.' },
        { req: 'Grade 2 or above to apply', why: 'Grade 3 is what Infinite Flight requires to enter the Expert Server, so that is what you need to fly the line.' },
        { req: 'No active violations or suspensions on the IFC', why: 'Everyone has a bad day. What matters is that nothing is outstanding against you now.' },
        { req: 'An Infinite Flight Community account', why: 'So we can reach you, and you can reach us.' },
        { req: 'Agreement to the Operations Plan and code of conduct', why: 'Fly the callsign properly, follow ATC, be decent to people.' },
    ],

    /* ---- Events (plan §9) -------------------------------------------------
       The calendar carries at least two events a month, published a minimum of
       two weeks ahead. These four are the repo's fallback copy — the crew
       centre's own calendar replaces them the moment it answers, and it is the
       one staff actually publish into. */
    eventTypes: [
        { type: 'Group flight', shape: 'One route, one aircraft type, flown together',            freq: 'Fortnightly' },
        { type: 'Hub takeover', shape: 'Mass departures and arrivals at one Mexican hub',         freq: 'Monthly' },
        { type: 'Fly-in',       shape: 'Open arrival window at a single airport, any Aeroméxico type', freq: 'Monthly' },
        { type: 'Joint event',  shape: 'Flown with a partner virtual airline, usually a city pair',    freq: 'Quarterly' },
        { type: 'Anniversary',  shape: 'Full-network operation marking the airline’s founding',   freq: 'Annually' },
    ],

    eventRunUp: [
        { when: 'Two weeks out', what: 'Route, aircraft, gates, timings and server confirmed. The announcement goes out.' },
        { when: 'One week out',  what: 'Sign-ups open, gate assignments published, partner VAs briefed.' },
        { when: '48 hours out',  what: 'Reminder posted, ATC coverage requested where appropriate.' },
        { when: 'On the day',    what: 'A staff member is on station throughout, from first pushback to last arrival.' },
        { when: 'Within a week', what: 'Attendance, what worked and what did not are written up for the staff channel.' },
    ],

    // Dates are ISO-8601 with an explicit UTC offset so they render correctly
    // in every pilot's local time.
    events: [
        {
            title: 'Valle de México Fly-In',
            date: '2026-09-19T21:00:00Z',
            from: 'Anywhere', to: 'MMMX', ac: 'Any Aeromexico fleet type',
            server: 'Expert', slots: 0, kind: 'Fly-in',
            blurb: 'Bring anything in our fleet into MMMX. Arrival slots are first-come; ATC staffed for three hours.',
        },
        {
            title: 'Connect Regional Rush',
            date: '2026-09-26T20:00:00Z',
            from: 'MMGL', to: 'MMMY', ac: 'Embraer E190',
            server: 'Expert', slots: 24, kind: 'Group flight',
            blurb: 'A short, sharp Connect sector for newer pilots — inside the Cadet limit, and perfect for a first logged event flight.',
        },
        {
            title: 'Águila Transatlántica',
            date: '2026-10-10T19:00:00Z',
            from: 'MMMX', to: 'LEMD', ac: 'Boeing 787-9 Dreamliner',
            server: 'Expert', slots: 40, kind: 'Group flight',
            blurb: 'The full flagship run to Madrid, flown as a group departure out of Mexico City with staffed ATC on the ground.',
        },
        {
            title: 'Pacífico Nocturno',
            date: '2026-10-24T04:00:00Z',
            from: 'MMMX', to: 'RJAA', ac: 'Boeing 787-9 Dreamliner',
            server: 'Expert', slots: 30, kind: 'Group flight',
            blurb: 'Our longest sector, overnight into Narita. Senior Captains only — it is past every other rank’s sector limit.',
        },
    ],

    /* ---- The first twelve months (plan §12) ------------------------------- */
    roadmap: [
        { q: 'Q1', objective: 'Establish operations — staff appointed, crew centre live, network published', measure: 'All director roles filled; regional and domestic tiers open' },
        { q: 'Q2', objective: 'Build the roster and the calendar', measure: '40 active pilots; two events a month held on schedule' },
        { q: 'Q3', objective: 'Open long-haul and partner externally',  measure: '787 tiers flying; two joint events with partner VAs' },
        { q: 'Q4', objective: 'Consolidate — mentoring and the full network', measure: '75 active pilots; line trainers assigned; 80% activity compliance' },
    ],

    /* ---- What the airline holds itself to (plan §1) ----------------------- */
    values: [
        { title: 'Realism first',        note: 'Routes, aircraft and procedures follow the real airline unless the simulator makes that impossible.' },
        { title: 'Members before numbers', note: 'A roster of active pilots who enjoy flying is the goal. Headcount is a by-product, not the target.' },
        { title: 'Staff serve the roster', note: 'Every staff role exists to remove work from pilots, not to add rank.' },
        { title: 'Say what is decided',  note: 'Decisions, rule changes and disciplinary outcomes are communicated in plain terms, promptly.' },
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
    // or comes live from the crew center. If the VA wants a pilot count or an
    // hours total on the site, wire it to the crew center's real figure — do
    // not type a number in here.
};
