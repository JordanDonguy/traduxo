declare module "@react-native-localize" {
  export type Locale = {
    languageCode: string;
    countryCode?: string;
    isRTL: boolean;
  };

  export function getLocales(): Locale[];
  export function getNumberFormatSettings(): any;
  export function getCalendar(): string;
  export function uses24HourClock(): boolean;
  export function usesMetricSystem(): boolean;
  export function usesAutoDateAndTime(): boolean;
}
