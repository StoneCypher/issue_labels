
import { defineConfig } from 'vitest/config';



/**
 * Vitest config used by Stryker (see `stryker.config.json`) for mutation testing.
 *
 * Runs every suite that can kill a mutant: the deterministic specs, the
 * stochastic property tests, and any dedicated `*.mutat.ts` tests. Coverage is
 * off because Stryker does its own per-test coverage analysis.
 */
export default defineConfig({

  test: {
    include: ['src/**/*.spec.ts', 'src/**/*.stoch.ts', 'src/**/*.mutat.ts'],
    exclude: ['dist/**', 'node_modules/**', 'src/ts/e2e/**'],
    coverage: {
      enabled: false
    },
    globals: true
  },

});
