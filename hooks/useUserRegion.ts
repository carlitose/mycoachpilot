import { useState, useEffect } from "react";

type UserRegion = "europe" | "world" | "india";

interface UseUserRegionReturn {
  userRegion: UserRegion;
  isLoading: boolean;
}

/**
 * Custom hook per rilevare la region dell'utente tramite geolocation
 * Usa localStorage per cache di 24h per ridurre chiamate API
 *
 * @returns {UseUserRegionReturn} userRegion e isLoading state
 */
export function useUserRegion(): UseUserRegionReturn {
  const [userRegion, setUserRegion] = useState<UserRegion>("world");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Lista completa paesi UE (27 membri)
    const euCountries = [
      "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
      "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
      "PL", "PT", "RO", "SK", "SI", "ES", "SE"
    ];

    const detectRegion = (countryCode: string): UserRegion => {
      if (countryCode === "IN") {
        return "india";
      } else if (euCountries.includes(countryCode)) {
        return "europe";
      }
      return "world";
    };

    // Check localStorage cache first (24h TTL)
    const cachedData = localStorage.getItem("user-region-cache");
    if (cachedData) {
      try {
        const { region, timestamp } = JSON.parse(cachedData);
        const now = Date.now();
        const TTL = 24 * 60 * 60 * 1000; // 24 ore in millisecondi

        // Se cache è valida (< 24h), usa quella
        if (now - timestamp < TTL) {
          setUserRegion(region);
          setIsLoading(false);
          return;
        }
      } catch (e) {
        // Ignora errori di parsing e procedi con API call
      }
    }

    // Nessuna cache valida, chiama API
    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((data) => {
        const country = data.country_code;
        const detectedRegion = detectRegion(country);

        // Salva in cache
        localStorage.setItem(
          "user-region-cache",
          JSON.stringify({
            region: detectedRegion,
            timestamp: Date.now(),
          })
        );

        setUserRegion(detectedRegion);
      })
      .catch(() => {
        // Fallback: world
        setUserRegion("world");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return { userRegion, isLoading };
}
