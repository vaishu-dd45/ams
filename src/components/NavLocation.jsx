import React, { useEffect, useState, useRef } from "react";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/reverse";

function NavLocation({ googleApiKey } = {}) {
  const [place, setPlace] = useState(""); // only the name will be shown
  const tries = useRef(0);
  const maxTries = 3;
  const desiredAccuracyMeters = 50; // adjust: lower = stricter

  useEffect(() => {
    let mounted = true;

    if (!navigator.geolocation) {
      // leave blank or setPlace("") so nothing shows
      return;
    }

    const getCoords = () => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (!mounted) return;
          const { latitude, longitude, accuracy } = pos.coords;

          // If accuracy is good enough, reverse geocode
          if (accuracy && accuracy <= desiredAccuracyMeters) {
            const name = await reverseGeocode(latitude, longitude, googleApiKey);
            if (mounted && name) setPlace(name);
            return;
          }

          // If not accurate enough, retry a few times
          tries.current += 1;
          if (tries.current < maxTries) {
            // small timeout before retrying (give GPS a moment)
            setTimeout(getCoords, 1000);
            return;
          }

          // last attempt: still reverse geocode even if accuracy is not ideal
          const name = await reverseGeocode(latitude, longitude, googleApiKey);
          if (mounted && name) setPlace(name);
        },
        (err) => {
          // permission denied or unavailable — keep place empty
          // you may optionally setPlace("") here
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    };

    getCoords();

    return () => {
      mounted = false;
    };
  }, [googleApiKey]);

  // Reverse geocode: prefer city, then town/village, then district/county.
  // If googleApiKey is provided, use Google Geocoding (more accurate in many cases).
  async function reverseGeocode(lat, lon, googleKey) {
    try {
      if (googleKey) {
        // Google Geocoding (requires billing & API key)
        const gRes = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${googleKey}`
        );
        const gData = await gRes.json();
        if (gData.status === "OK" && gData.results && gData.results.length) {
          // parse address components
          const comp = gData.results[0].address_components;
          const getType = (type) =>
            comp.find((c) => c.types && c.types.includes(type))?.long_name;
          const city = getType("locality") || getType("sublocality") || getType("administrative_area_level_2");
          const district = getType("administrative_area_level_2") || getType("administrative_area_level_1");
          return city || district || "";
        }
        return "";
      } else {
        // OpenStreetMap Nominatim
        const res = await fetch(
          `${NOMINATIM_BASE}?lat=${lat}&lon=${lon}&format=json&addressdetails=1`
        );
        const data = await res.json();
        const addr = data.address || {};
        const city =
          addr.city || addr.town || addr.village || addr.hamlet || "";
        const district =
          addr.state_district || addr.county || addr.region || "";
        return city || district || "";
      }
    } catch (e) {
      return "";
    }
  }

  // render only the place name (or nothing if unknown)
  return <span style={{ fontSize: 16, fontWeight: 500 }} className="sm:text-base text-xs">{place}</span>;
}

export default NavLocation
