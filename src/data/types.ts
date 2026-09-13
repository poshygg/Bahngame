export type Locale = "en" | "de";
export type Localized = Record<Locale, string>;
export type Country = {
  id: string;
  name: Localized;
  nativeName: string;
  flag: string;
  status: "available" | "planned";
  color: string;
};
