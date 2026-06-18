"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { dict, type Dict, type Locale } from "./i18n";

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Dict;
};

const LocaleContext = createContext<Ctx>({
  locale: "ka",
  setLocale: () => {},
  t: dict.ka,
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ka");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("locale");
      if (stored === "ka" || stored === "en") {
        setLocaleState(stored);
        document.documentElement.lang = stored;
        document.documentElement.dataset.locale = stored;
      } else {
        document.documentElement.dataset.locale = "ka";
      }
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem("locale", l);
      document.documentElement.lang = l;
      document.documentElement.dataset.locale = l;
    } catch {
      /* ignore */
    }
  };

  return (
    <LocaleContext.Provider
      value={{ locale, setLocale, t: dict[locale] as Dict }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
