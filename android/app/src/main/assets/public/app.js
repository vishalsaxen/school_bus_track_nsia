/* =========================================================================
   North Star International Academy — Bus Tracker UI logic
   ========================================================================= */

let currentBus = null;
let currentSource = null;
let pollTimer = null;
let googleMap = null;
let googleMarker = null;
let mapsScriptLoaded = false;
let mapsScriptLoading = false;

// A friendly cartoon school-bus mascot (wearing a backpack!) used for the
// map marker, in place of Google's default red pin — a filled SVG data
// URI, so no extra file or network request.
const BUS_MARKER_ICON =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjkwIDEwIDQ5MCAzNTUiPgo8Y2lyY2xlIGN4PSIyMjAiIGN5PSI3MCIgcj0iNyIgZmlsbD0iI0U3QTkzQyIvPgo8Y2lyY2xlIGN4PSI0NzAiIGN5PSI2MCIgcj0iNSIgZmlsbD0iIzJFNUZEOSIvPgo8Y2lyY2xlIGN4PSI1MDAiIGN5PSIxMjAiIHI9IjYiIGZpbGw9IiNFN0E5M0MiLz4KPGNpcmNsZSBjeD0iMTkwIiBjeT0iMTMwIiByPSI1IiBmaWxsPSIjMkU1RkQ5Ii8+Cgo8cmVjdCB4PSIyNjIiIHk9IjQyIiB3aWR0aD0iMTU2IiBoZWlnaHQ9IjExMiIgcng9IjI2IiBmaWxsPSIjMkU1RkQ5IiBzdHJva2U9IiMxMjIxM0IiIHN0cm9rZS13aWR0aD0iNCIvPgo8cmVjdCB4PSIzMDQiIHk9IjgwIiB3aWR0aD0iNzIiIGhlaWdodD0iNTAiIHJ4PSIxMCIgZmlsbD0iIzFCNEJCOCIgc3Ryb2tlPSIjMTIyMTNCIiBzdHJva2Utd2lkdGg9IjMiLz4KPHBhdGggZD0iTTMxMCA0MiBDMzEwIDIwIDM3MCAyMCAzNzAgNDIiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzEyMjEzQiIgc3Ryb2tlLXdpZHRoPSI1IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KCjxwYXRoIGQ9Ik0zMDAgMTE4IEwzMDAgMjAwIiBzdHJva2U9IiNFN0E5M0MiIHN0cm9rZS13aWR0aD0iMTYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8cGF0aCBkPSJNMzgwIDExOCBMMzgwIDIwMCIgc3Ryb2tlPSIjRTdBOTNDIiBzdHJva2Utd2lkdGg9IjE2IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPGNpcmNsZSBjeD0iMzAwIiBjeT0iMjAwIiByPSIxMCIgZmlsbD0iI0M5OEEyQiIvPgo8Y2lyY2xlIGN4PSIzODAiIGN5PSIyMDAiIHI9IjEwIiBmaWxsPSIjQzk4QTJCIi8+Cgo8cmVjdCB4PSIxOTYiIHk9IjEwOCIgd2lkdGg9IjI4OCIgaGVpZ2h0PSIxOTAiIHJ4PSI0NCIgZmlsbD0iI0ZGQzkzQyIgc3Ryb2tlPSIjMTIyMTNCIiBzdHJva2Utd2lkdGg9IjUiLz4KCjxyZWN0IHg9IjIyOCIgeT0iMTQwIiB3aWR0aD0iMjI0IiBoZWlnaHQ9IjkyIiByeD0iMjIiIGZpbGw9IiNCRkUzRkYiIHN0cm9rZT0iIzEyMjEzQiIgc3Ryb2tlLXdpZHRoPSI0Ii8+Cgo8Y2lyY2xlIGN4PSIzMDAiIGN5PSIxODgiIHI9IjI3IiBmaWxsPSIjRkZGRkZGIiBzdHJva2U9IiMxMjIxM0IiIHN0cm9rZS13aWR0aD0iMyIvPgo8Y2lyY2xlIGN4PSIzMDkiIGN5PSIxOTAiIHI9IjEzIiBmaWxsPSIjMTIyMTNCIi8+CjxjaXJjbGUgY3g9IjMxMyIgY3k9IjE4NSIgcj0iNCIgZmlsbD0iI0ZGRkZGRiIvPgoKPHBhdGggZD0iTTM1OCAxNzggUTM4MiAxNTggNDA2IDE3OCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTIyMTNCIiBzdHJva2Utd2lkdGg9IjciIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgoKPGVsbGlwc2UgY3g9IjI2MiIgY3k9IjIzOCIgcng9IjE2IiByeT0iMTAiIGZpbGw9IiNGNkE4QTAiIG9wYWNpdHk9IjAuOCIvPgo8ZWxsaXBzZSBjeD0iNDMwIiBjeT0iMjM4IiByeD0iMTYiIHJ5PSIxMCIgZmlsbD0iI0Y2QThBMCIgb3BhY2l0eT0iMC44Ii8+Cgo8cGF0aCBkPSJNMjUwIDI0OCBRMzQwIDMwMCA0MzAgMjQ4IiBmaWxsPSJub25lIiBzdHJva2U9IiMxMjIxM0IiIHN0cm9rZS13aWR0aD0iNiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CjxwYXRoIGQ9Ik0yNzAgMjU2IFEzNDAgMjg4IDQxMCAyNTYgTDQwMCAyNjIgUTM0MCAyODIgMjgwIDI2MiBaIiBmaWxsPSIjRkZGRkZGIiBzdHJva2U9IiMxMjIxM0IiIHN0cm9rZS13aWR0aD0iMiIvPgoKPGNpcmNsZSBjeD0iMjM0IiBjeT0iMjcyIiByPSIxMyIgZmlsbD0iI0ZGRjZEOCIgc3Ryb2tlPSIjMTIyMTNCIiBzdHJva2Utd2lkdGg9IjMiLz4KPGNpcmNsZSBjeD0iNDQ2IiBjeT0iMjcyIiByPSIxMyIgZmlsbD0iI0ZGRjZEOCIgc3Ryb2tlPSIjMTIyMTNCIiBzdHJva2Utd2lkdGg9IjMiLz4KCjxyZWN0IHg9IjIwNiIgeT0iMjc4IiB3aWR0aD0iMjY4IiBoZWlnaHQ9IjI2IiByeD0iMTAiIGZpbGw9IiNCMEI3QkYiIHN0cm9rZT0iIzEyMjEzQiIgc3Ryb2tlLXdpZHRoPSIzIi8+Cgo8Y2lyY2xlIGN4PSIyNTYiIGN5PSIzMjIiIHI9IjM0IiBmaWxsPSIjMjIyNjJCIiBzdHJva2U9IiMxMjIxM0IiIHN0cm9rZS13aWR0aD0iMyIvPgo8Y2lyY2xlIGN4PSIyNTYiIGN5PSIzMjIiIHI9IjE1IiBmaWxsPSIjQzdDQ0QxIi8+CjxjaXJjbGUgY3g9IjQyNCIgY3k9IjMyMiIgcj0iMzQiIGZpbGw9IiMyMjI2MkIiIHN0cm9rZT0iIzEyMjEzQiIgc3Ryb2tlLXdpZHRoPSIzIi8+CjxjaXJjbGUgY3g9IjQyNCIgY3k9IjMyMiIgcj0iMTUiIGZpbGw9IiNDN0NDRDEiLz4KCjxjaXJjbGUgY3g9IjE1MCIgY3k9IjIyMCIgcj0iNiIgZmlsbD0iI0U3QTkzQyIvPgo8Y2lyY2xlIGN4PSIxMjgiIGN5PSIxODAiIHI9IjQiIGZpbGw9IiMyRTVGRDkiLz4KPHBhdGggZD0iTTExMCAyNTAgbDYgNiBtLTYgMCBsNiAtNiIgc3Ryb2tlPSIjRTdBOTNDIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8Y2lyY2xlIGN4PSI1NDgiIGN5PSIyMDAiIHI9IjYiIGZpbGw9IiMyRTVGRDkiLz4KPHBhdGggZD0iTTU2MCAyNTAgbDYgNiBtLTYgMCBsNiAtNiIgc3Ryb2tlPSIjMkU1RkQ5IiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4K";

function goTo(screenId) {
  // Leaving the map view: stop any live polling so we don't keep hitting
  // the location endpoint in the background.
  if (screenId !== "screen-map") {
    stopPolling();
  }
  document.querySelectorAll(".screen").forEach((el) => el.classList.add("hidden"));
  document.getElementById(screenId).classList.remove("hidden");
}

function selectBus(busNumber) {
  currentBus = busNumber;
  document.getElementById("choice-bus-num").textContent = busNumber;

  const config = BUS_CONFIG[busNumber] || {};
  document.getElementById("choice-driver-name").textContent = config.driverName || "—";
  document.getElementById("choice-caretaker-name").textContent = config.careTakerName || "—";

  const contactEl = document.getElementById("choice-contact-number");
  if (config.contactNumber) {
    contactEl.textContent = config.contactNumber;
    contactEl.href = `tel:${config.contactNumber}`;
  } else {
    contactEl.textContent = "—";
    contactEl.removeAttribute("href");
  }

  goTo("screen-map-choice");
}

function openMap(source) {
  currentSource = source;
  const config = BUS_CONFIG[currentBus];
  if (!config) {
    alert("No tracking config set up for this bus yet.");
    return;
  }

  if (source === "legacy") {
    // Track.Letsgro blocks being embedded in an iframe (confirmed: their
    // page loads fine standalone but refuses when framed). So instead of
    // showing it inside our app, we open it directly as its own page/tab.
    openExternal(config.legacy);
    return;
  }

  document.getElementById("view-bus-num").textContent = currentBus;
  showGoogleMapView(config);
  goTo("screen-map");
}

/* ---------------------------------------------------------------------
   Opens a URL outside this app's own UI.
   - Inside the native Android app (once built with Capacitor), this uses
     the @capacitor/browser plugin, which Capacitor auto-exposes at
     window.Capacitor.Plugins.Browser — reliable for opening an external
     link from a native webview.
   - On the web (e.g. testing with Live Server), window.Capacitor isn't
     present, so it falls back to a normal window.open() in a new tab.
   --------------------------------------------------------------------- */
function openExternal(url) {
  if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
    window.Capacitor.Plugins.Browser.open({ url });
  } else {
    window.open(url, "_blank");
  }
}

/* ---------------------------- Google Maps (live marker) view ------------ */

function showGoogleMapView(config) {
  const usingDemo = !config.locationEndpoint;
  document.getElementById("view-source-label").textContent = usingDemo
    ? "Google Maps (demo location)"
    : "Google Maps (live)";

  // The "open in browser" fallback now points to the legacy page, in case
  // the live Google Map fails to load for any reason.
  document.getElementById("open-ext-link").href = config.legacy;

  loadGoogleMapsScript(() => {
    initOrUpdateMap({ lat: config.demoLatLng.lat, lng: config.demoLatLng.lng });
    startPolling(config);
  });
}

function showCapturedMapsError(message) {
  let banner = document.getElementById("maps-debug-banner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "maps-debug-banner";
    banner.style.cssText =
      "position:absolute; left:0; right:0; bottom:0; z-index:20; background:#B54A3F; color:#fff; padding:12px 16px; font-size:12px; line-height:1.5; word-break:break-word;";
    const wrap = document.getElementById("google-map-wrap");
    if (wrap) wrap.appendChild(banner);
  }
  banner.innerHTML = "<strong>Maps error:</strong> " + message;
}

function loadGoogleMapsScript(onReady) {
  if (mapsScriptLoaded) {
    onReady();
    return;
  }
  if (mapsScriptLoading) {
    // Script is already on its way in — wait for it.
    window.__onGoogleMapsReady = window.__onGoogleMapsReady || [];
    window.__onGoogleMapsReady.push(onReady);
    return;
  }

  mapsScriptLoading = true;
  window.__onGoogleMapsReady = [onReady];

  // Capture the specific error text Google's library logs via
  // console.error (e.g. "RefererNotAllowedMapError") — this is exactly
  // what a remote DevTools console would show us, captured directly in
  // the app instead.
  let capturedMapsError = null;
  const originalConsoleError = console.error;
  console.error = function (...args) {
    const text = args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ");
    if (text.toLowerCase().includes("google maps") || text.toLowerCase().includes("mapserror")) {
      capturedMapsError = text;
      showCapturedMapsError(capturedMapsError);
    }
    originalConsoleError.apply(console, args);
  };

  window.__googleMapsCallback = function () {
    mapsScriptLoaded = true;
    mapsScriptLoading = false;
    window.__onGoogleMapsReady.forEach((fn) => fn());
    window.__onGoogleMapsReady = [];
  };

  // Google Maps calls this specific, official global function whenever the
  // key/request is rejected for an auth-related reason (invalid key, wrong
  // referrer, billing not enabled, API not enabled, etc.) — it's the one
  // reliable way to see the *real* reason without needing a remote
  // devtools connection, since it fires before Maps shows its generic
  // "Oops!" overlay.
  window.gm_authFailure = function () {
    const el = document.getElementById("google-map-wrap");
    if (el) {
      el.innerHTML =
        '<div class="map-error" style="align-items:flex-start; padding:20px;">' +
        '<div style="width:100%; text-align:left; font-size:12.5px; line-height:1.6; color:#B54A3F;">' +
        "<strong>Google Maps auth error (gm_authFailure)</strong><br/><br/>" +
        "Captured console message:<br/>" +
        "<code style=\"display:block; word-break:break-word; background:rgba(0,0,0,0.15); padding:8px; border-radius:6px; margin-top:4px;\">" + (capturedMapsError || "(none captured — check the general categories below)") + "</code><br/><br/>" +
        "This usually means: an invalid key, a referrer/app restriction mismatch, the Maps JavaScript API not enabled on this project, or a billing issue.<br/><br/>" +
        "Key in use (first 20 chars): " + String(GOOGLE_MAPS_API_KEY).slice(0, 20) + "…" +
        "</div></div>";
    }
  };

  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=__googleMapsCallback`;
  script.async = true;
  script.onerror = () => {
    document.getElementById("google-map-wrap").innerHTML =
      '<div class="map-error">Couldn\'t load Google Maps. Check that GOOGLE_MAPS_API_KEY in config.js is set and valid.</div>';
  };
  document.head.appendChild(script);
}

let googleInfoWindow = null;

function initOrUpdateMap(location) {
  const el = document.getElementById("google-map-canvas");
  const latLng = { lat: location.lat, lng: location.lng };

  updateStatusPanel(location);

  if (!googleMap) {
    googleMap = new google.maps.Map(el, {
      center: latLng,
      zoom: 15,
      disableDefaultUI: true,
      zoomControl: true,
    });
    googleMarker = new google.maps.Marker({
      position: latLng,
      map: googleMap,
      title: `Bus No. ${currentBus}`,
      icon: {
        url: BUS_MARKER_ICON,
        scaledSize: new google.maps.Size(72, 52),
        anchor: new google.maps.Point(36, 50),
      },
    });
    googleInfoWindow = new google.maps.InfoWindow();
    googleMarker.addListener("click", () => {
      googleInfoWindow.setContent(buildInfoWindowContent(location));
      googleInfoWindow.open(googleMap, googleMarker);
    });

    // Safety net: if the container's size wasn't fully settled at the
    // moment the map was created (common when a map sits in a screen that
    // was just switched to), force Maps to recompute its size and
    // re-center once the browser has caught up.
    requestAnimationFrame(() => {
      google.maps.event.trigger(googleMap, "resize");
      googleMap.setCenter(latLng);
    });
  } else {
    googleMap.panTo(latLng);
    googleMarker.setPosition(latLng);
    // Keep an already-open info window's contents current.
    if (googleInfoWindow.getMap()) {
      googleInfoWindow.setContent(buildInfoWindowContent(location));
    }
  }
}

function buildInfoWindowContent(location) {
  if (!location.address && !location.status) {
    return `<div style="font-size:13px;">Bus No. ${currentBus}<br/><span style="color:#5C6B80;">Fetching live status…</span></div>`;
  }
  const updated = location.lastUpdate
    ? new Date(location.lastUpdate).toLocaleTimeString()
    : "—";
  return `
    <div style="font-size:13px; line-height:1.5; max-width:220px;">
      <strong>Bus No. ${currentBus}</strong><br/>
      ${location.address || ""}<br/>
      <span style="color:#5C6B80;">
        ${location.status || ""}${location.speed !== undefined ? ` · ${location.speed} km/h` : ""}
      </span><br/>
      <span style="color:#8D98A8; font-size:11.5px;">Updated ${updated}</span>
    </div>
  `;
}

function updateStatusPanel(location) {
  const panel = document.getElementById("status-panel");
  const hasData = Boolean(location.vehicleName || location.address || location.status);
  panel.classList.toggle("loading", !hasData);

  document.getElementById("status-vehicle").textContent = location.vehicleName || "—";
  document.getElementById("status-location").textContent = location.address || "—";
  document.getElementById("status-speed").textContent =
    location.speed !== undefined ? `${location.speed} km/h` : "—";
  document.getElementById("status-ignition").textContent = location.status || "—";
  document.getElementById("status-updated").textContent = location.lastUpdate
    ? new Date(location.lastUpdate).toLocaleString()
    : "—";
}

function startPolling(config) {
  stopPolling();

  if (!config.locationEndpoint) {
    // No real endpoint configured yet — nothing to poll, demo marker just
    // stays put at demoLatLng.
    return;
  }

  const poll = async () => {
    try {
      const location = await fetchBusLocation(config.locationEndpoint);
      initOrUpdateMap(location);
    } catch (err) {
      console.warn("Couldn't fetch bus location:", err);
    }
  };

  poll(); // fetch immediately, then on an interval
  pollTimer = setInterval(poll, POLL_INTERVAL_MS);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}
