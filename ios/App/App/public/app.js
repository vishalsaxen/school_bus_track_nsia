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
