import i18next from 'i18next';
import i18nextMiddleware from 'i18next-http-middleware';
import FsBackend from 'i18next-fs-backend';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localesDir = path.join(__dirname, '..', 'locales');

await i18next
  .use(FsBackend)
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'ne'],
    backend: {
      loadPath: path.join(localesDir, '{{lng}}/{{ns}}.json')
    },
    ns: ['common'],         // default namespace
    defaultNS: 'common',
    preload: ['en', 'ne'],  // preload both
    detection: {
      // priority order: query ?lang=ne -> header Accept-Language -> cookie
      order: ['querystring', 'header', 'cookie'],
      lookupQuerystring: 'lang',
    },
    returnObjects: true,
    cleanCode: true,
    interpolation: { escapeValue: false }
  });

export const i18n = i18next;
export const i18nMiddleware = i18nextMiddleware.handle(i18next);
