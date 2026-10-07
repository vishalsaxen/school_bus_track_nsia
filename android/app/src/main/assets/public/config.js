/* =========================================================================
   Bus tracking config
   -------------------------------------------------------------------------
   1) GOOGLE_MAPS_API_KEY — your Maps JavaScript API key.
   2) BUS_CONFIG[n].legacy — the Track.Letsgro tracking page URL (opened
      directly in the browser/system browser via the "Track.Letsgro" tile,
      since their page blocks iframe embedding).
   3) BUS_CONFIG[n].locationEndpoint — Letsgro's internal live-position API,
      polled every POLL_INTERVAL_MS to move the marker on the Google Map.
   4) demoLatLng — fallback position, only used if locationEndpoint ever
      fails to respond.
   ========================================================================= */

const GOOGLE_MAPS_API_KEY = "AIzaSyCixTuCtfTIKNnoWpKgMEnuhQiTFfKMbWQ";

const BUS_CONFIG = {
  1: {
    legacy: "https://track.letsgro.co/v1/auth/live?token=.eJxNysEKAiEQgOFXWebcxo6jC_kEXboFRQwsohKSbWCuENG7lxjR9ft_eDIsd5-m4Bh0RyOpVcfwkfJDrOJ8CdZ_RZBS_zqbq6_OsNuiOBwHog1DHYqJwU05xNi6kDT2KHpU-wG1RI24RiVP7bYm-_MtPdqb02IvDC94A6hxL5I.adcDuA.Cv_TozvJbojUho0LnfpKygClfGM",
    locationEndpoint: "https://api.letsgro.co/api/v1/auth/poll_position_public_tracking?type=token&token=.eJxNysEKAiEQgOFXWebcxo6jC_kEXboFRQwsohKSbWCuENG7lxjR9ft_eDIsd5-m4Bh0RyOpVcfwkfJDrOJ8CdZ_RZBS_zqbq6_OsNuiOBwHog1DHYqJwU05xNi6kDT2KHpU-wG1RI24RiVP7bYm-_MtPdqb02IvDC94A6hxL5I.adcDuA.Cv_TozvJbojUho0LnfpKygClfGM",
    demoLatLng: { lat: 28.6139, lng: 77.209 }, // fallback only, used if locationEndpoint ever fails
    driverName: "Satish",
    careTakerName: "Anisha Salve",
    contactNumber: "9209216613",
  },
  3: {
    legacy: "https://track.letsgro.co/v1/auth/live?token=.eJxTqo5RKi1OLYrPTIlRslIwNjM21VGIUQKKlMEFDUEiKallmcmpMGUmFqYWSKJ5ibmpIPEYJV8PQ6MwN3MDQ8sYJZCCssSczJT4ksycHIi8kYmxma6hka6hcYihpZWhsZWJoZ6ZqWUURHVyYklqen5RJURtUmlxjFKtEgBKii7B.adVXZg.37WOG0Tamscv7i2oucpordWLhGA",
    locationEndpoint: "https://api.letsgro.co/api/v1/auth/poll_position_public_tracking?type=token&token=.eJxTqo5RKi1OLYrPTIlRslIwNjM21VGIUQKKlMEFDUEiKallmcmpMGUmFqYWSKJ5ibmpIPEYJV8PQ6MwN3MDQ8sYJZCCssSczJT4ksycHIi8kYmxma6hka6hcYihpZWhsZWJoZ6ZqWUURHVyYklqen5RJURtUmlxjFKtEgBKii7B.adVXZg.37WOG0Tamscv7i2oucpordWLhGA",
    demoLatLng: { lat: 28.6304, lng: 77.2177 },
    driverName: "Santosh Nikalje",
    careTakerName: "Archana Kute",
    contactNumber: "7038976295",
  },
};

// How often to re-fetch the bus's position, in milliseconds, once
// locationEndpoint is set.
const POLL_INTERVAL_MS = 5000;

/* -------------------------------------------------------------------------
   Parses Letsgro's poll_position_public_tracking response shape:

   {
     "data": {
       "address": "...",
       "device_name": "MH12VF7019",
       "device_status": "IGNITION OFF",
       "last_update": "2026-09-15T11:35:02.285+0000",
       "latitude": "18.589917777777778",   <- string, needs parseFloat
       "longitude": "74.00370666666667",   <- string, needs parseFloat
       "speed": "0.0",
       ...
     }
   }
   ------------------------------------------------------------------------- */
async function fetchBusLocation(endpoint) {
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error(`Location request failed (${res.status})`);
  const json = await res.json();
  const data = json.data;

  if (!data || data.latitude === undefined || data.longitude === undefined) {
    throw new Error("Unexpected response shape from Letsgro");
  }

  return {
    lat: parseFloat(data.latitude),
    lng: parseFloat(data.longitude),
    vehicleName: data.device_name,
    address: data.address,
    status: data.device_status,
    speed: data.speed,
    lastUpdate: data.last_update,
  };
}
