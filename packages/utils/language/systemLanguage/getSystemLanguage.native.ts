import RNLocalize from "@react-native-localize";

export const getSystemLanguage = (): string => {
  const locales = RNLocalize.getLocales();
  if (locales && locales.length > 0) {
    return locales[0].languageCode;
  }
  return "en";
};
