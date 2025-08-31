import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Spanish-only resources
import es from '../locales/es.json';

const resources = {
  es: { translation: es },
};

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: 'es',
      fallbackLng: 'es',
      compatibilityJSON: 'v3',
      interpolation: {
        escapeValue: false,
      },
    })
    .catch(() => {
      // Silently ignore initialization errors in production init path
    });
}

export default i18n;
