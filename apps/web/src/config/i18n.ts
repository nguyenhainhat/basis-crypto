import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import commonEN from '../locales/en/common.json';

const resources = {
  en: {
    common: commonEN,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    defaultNS: 'common',
  });

export default i18n;
