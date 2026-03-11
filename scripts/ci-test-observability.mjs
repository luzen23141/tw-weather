#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);

const getArgValue = (name, fallback) => {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  const value = args[index + 1];
  return value ?? fallback;
};

const scope = getArgValue('--scope', 'all');
const top = Number.parseInt(getArgValue('--top', '10'), 10);

const JEST_RESULTS_PATH = path.resolve('test-results/jest/results.json');
const PLAYWRIGHT_RESULTS_PATH = path.resolve('test-results/playwright/results.json');

const readJson = (filePath, label) => {
  if (!fs.existsSync(filePath)) {
    return { data: null, error: `${label} 結果不存在：${filePath}` };
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return { data: JSON.parse(content), error: null };
  } catch (error) {
    return {
      data: null,
      error: `${label} JSON 解析失敗：${error instanceof Error ? error.message : String(error)}`,
    };
  }
};

const formatDuration = (ms) => `${(ms / 1000).toFixed(2)}s`;

const topRows = [];
let hasViolation = false;

const maybeNumberFromEnv = (name) => {
  const raw = process.env[name];
  if (!raw) return null;
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

if (scope === 'all' || scope === 'jest') {
  const { data: jestData, error } = readJson(JEST_RESULTS_PATH, 'Jest');

  if (!jestData) {
    console.error(`❌ ${error}`);
    hasViolation = true;
  } else {
    const suites = Array.isArray(jestData.testResults) ? jestData.testResults : [];

    for (const suite of suites) {
      const suiteName = typeof suite.name === 'string' ? suite.name : 'unknown-suite';
      const fileRuntime =
        typeof suite?.perfStats?.runtime === 'number' && suite.perfStats.runtime >= 0
          ? suite.perfStats.runtime
          : typeof suite?.startTime === 'number' &&
              typeof suite?.endTime === 'number' &&
              suite.endTime >= suite.startTime
            ? suite.endTime - suite.startTime
            : null;
      const assertions = Array.isArray(suite.assertionResults) ? suite.assertionResults : [];

      let assertionPushed = false;
      for (const assertion of assertions) {
        const duration = assertion?.duration;
        if (typeof duration !== 'number' || duration < 0) continue;

        const ancestorTitles = Array.isArray(assertion.ancestorTitles)
          ? assertion.ancestorTitles.filter((s) => typeof s === 'string')
          : [];
        const title = typeof assertion.title === 'string' ? assertion.title : 'unnamed-test';

        topRows.push({
          source: 'Jest',
          name: [...ancestorTitles, title].join(' › '),
          suite: suiteName,
          duration,
        });
        assertionPushed = true;
      }

      if (!assertionPushed && typeof fileRuntime === 'number' && fileRuntime >= 0) {
        topRows.push({
          source: 'Jest',
          name: path.basename(suiteName),
          suite: suiteName,
          duration: fileRuntime,
        });
      }
    }

    const jestTotalDurationMs = suites.reduce((sum, suite) => {
      const perfRuntime = suite?.perfStats?.runtime;
      if (typeof perfRuntime === 'number' && perfRuntime >= 0) return sum + perfRuntime;

      const startTime = suite?.startTime;
      const endTime = suite?.endTime;
      if (typeof startTime === 'number' && typeof endTime === 'number' && endTime >= startTime) {
        return sum + (endTime - startTime);
      }

      return sum;
    }, 0);

    const jestTotal = Number.isFinite(jestData.numTotalTests) ? jestData.numTotalTests : 0;
    const jestPassed = Number.isFinite(jestData.numPassedTests) ? jestData.numPassedTests : 0;
    const jestFailed = Number.isFinite(jestData.numFailedTests) ? jestData.numFailedTests : 0;

    console.log(
      `Jest KPI: total=${jestTotal}, passed=${jestPassed}, failed=${jestFailed}, duration=${formatDuration(jestTotalDurationMs)}`,
    );

    const jestMaxSeconds = maybeNumberFromEnv('CI_JEST_MAX_SECONDS');
    if (jestMaxSeconds !== null && jestTotalDurationMs / 1000 > jestMaxSeconds) {
      console.error(
        `❌ Jest duration gate failed: ${formatDuration(jestTotalDurationMs)} > ${jestMaxSeconds.toFixed(2)}s`,
      );
      hasViolation = true;
    }
  }
}

const collectPlaywrightRows = (suite, parents = []) => {
  const nextParents =
    typeof suite.title === 'string' && suite.title.length > 0 ? [...parents, suite.title] : parents;

  if (Array.isArray(suite.specs)) {
    for (const spec of suite.specs) {
      const testTitle = typeof spec.title === 'string' ? spec.title : 'unnamed-spec';
      const testResults = Array.isArray(spec.tests)
        ? spec.tests.flatMap((t) => (Array.isArray(t.results) ? t.results : []))
        : [];

      const totalDuration = testResults.reduce((sum, result) => {
        const d = result?.duration;
        return typeof d === 'number' && d >= 0 ? sum + d : sum;
      }, 0);

      topRows.push({
        source: 'Playwright',
        name: [...nextParents, testTitle].join(' › '),
        suite: nextParents.join(' › ') || 'playwright-suite',
        duration: totalDuration,
      });
    }
  }

  if (Array.isArray(suite.suites)) {
    for (const child of suite.suites) {
      collectPlaywrightRows(child, nextParents);
    }
  }
};

if (scope === 'all' || scope === 'e2e') {
  const { data: pwData, error } = readJson(PLAYWRIGHT_RESULTS_PATH, 'Playwright');

  if (!pwData) {
    console.error(`❌ ${error}`);
    hasViolation = true;
  } else {
    const suites = Array.isArray(pwData.suites) ? pwData.suites : [];
    for (const suite of suites) collectPlaywrightRows(suite, []);

    const stats = pwData?.stats ?? {};
    const expected = Number.isFinite(stats.expected) ? stats.expected : 0;
    const unexpected = Number.isFinite(stats.unexpected) ? stats.unexpected : 0;
    const flaky = Number.isFinite(stats.flaky) ? stats.flaky : 0;
    const skipped = Number.isFinite(stats.skipped) ? stats.skipped : 0;
    const total = expected + unexpected + flaky + skipped;
    const executed = expected + unexpected + flaky;
    const durationMs = Number.isFinite(stats.duration) ? stats.duration : 0;
    const passRate = total > 0 ? (expected / total) * 100 : 0;

    console.log(
      `Playwright KPI: total=${total}, executed=${executed}, expected=${expected}, unexpected=${unexpected}, flaky=${flaky}, skipped=${skipped}, passRate=${passRate.toFixed(2)}%, duration=${formatDuration(durationMs)}`,
    );

    const e2eMinTests = maybeNumberFromEnv('CI_E2E_MIN_TESTS') ?? 1;
    if (executed < e2eMinTests) {
      console.error(`❌ E2E KPI gate failed: executed tests ${executed} < ${e2eMinTests}`);
      hasViolation = true;
    }

    const e2eMaxSeconds = maybeNumberFromEnv('CI_E2E_MAX_SECONDS');
    if (e2eMaxSeconds !== null && durationMs / 1000 > e2eMaxSeconds) {
      console.error(
        `❌ E2E duration gate failed: ${formatDuration(durationMs)} > ${e2eMaxSeconds.toFixed(2)}s`,
      );
      hasViolation = true;
    }
  }
}

const filteredRows = topRows
  .filter((row) => Number.isFinite(row.duration) && row.duration >= 0)
  .sort((a, b) => b.duration - a.duration)
  .slice(0, Number.isFinite(top) && top > 0 ? top : 10);

if (filteredRows.length > 0) {
  console.log(`Top ${filteredRows.length} slow tests:`);
  for (const row of filteredRows) {
    console.log(`- [${row.source}] ${row.name} (${formatDuration(row.duration)})`);
  }
}

if (hasViolation) {
  process.exit(1);
}
