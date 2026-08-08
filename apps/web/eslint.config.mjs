// eslint-config-next v16 exports flat configs directly — going through
// FlatCompat instead throws "Converting circular structure to JSON".
import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

const config = [
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'] },
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      /*
       * Downgraded from error to warning, deliberately.
       *
       * eslint-plugin-react-hooks v6 added this rule for the React Compiler.
       * It is right that cascading renders are a smell, but it also flags three
       * patterns this app uses intentionally and which have no cheaper form:
       *
       *   1. Hydrating client-only state from localStorage (theme, session).
       *      It cannot be a useState initialiser because that also runs during
       *      SSR, where localStorage does not exist — the read has to happen
       *      after mount.
       *   2. Re-seeding a dialog's form fields when it opens, so a previous
       *      edit does not leak into the next one.
       *   3. Setting an isLoading flag around an async fetch.
       *
       * Left as warnings so the signal stays visible rather than being
       * suppressed outright.
       */
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
];

export default config;
