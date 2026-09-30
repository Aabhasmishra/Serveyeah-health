// Verification for the Recommended Investigations feature.
// Run: node scripts/verify-recommended-investigations.js
//
// Checks that a single comma-separated ID string is persisted, normalised and
// returned, that existing rows are untouched, and that the person-decoupling
// behaviour is unchanged.

import * as screeningService from '../src/services/screeningService.js';
import { closePool, query } from '../src/db/pool.js';
import { reclaimScreeningIdsFromFixtures } from './lib/screeningIdSequence.js';

let passed = 0;
let failed = 0;

function check(label, condition, detail) {
  if (condition) {
    passed++;
    console.log(`   ✅ ${label}`);
  } else {
    failed++;
    console.log(`   ❌ ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

async function run() {
  console.log('🧪 Verifying Recommended Investigations\n');

  // ============================================
  console.log('1️⃣  Schema');
  const col = (
    await query(
      `SELECT data_type, is_nullable FROM information_schema.columns
       WHERE table_name = 'shree_raj_health_screenings' AND column_name = 'recommended_investigations'`
    )
  ).rows[0];
  check('recommended_investigations column exists', !!col, JSON.stringify(col));
  check('column is TEXT', col?.data_type === 'text', col?.data_type);
  check('column is nullable', col?.is_nullable === 'YES', col?.is_nullable);

  const before = await screeningService.getAllScreenings({ limit: 100, offset: 0 });
  console.log(`   ℹ️  Existing screening rows: ${before.length}`);
  // Existing rows are not required to be empty: a real screening may legitimately
  // carry selections. What must always hold is that any stored value is a clean
  // comma-separated ID list (or NULL).
  const withInvestigations = before.filter((s) => s.recommended_investigations != null);
  console.log(`   ℹ️  Existing rows with investigations: ${withInvestigations.length}`);
  check(
    'every stored value is a valid ID list or NULL',
    before.every(
      (s) =>
        s.recommended_investigations == null ||
        /^\d+(\s*,\s*\d+)*$/.test(s.recommended_investigations)
    ),
    'found a malformed value'
  );
  check(
    'every stored ID is within the 1-52 catalogue range',
    before.every((s) =>
      (s.recommended_investigations ?? '')
        .split(',')
        .filter(Boolean)
        .every((part) => {
          const n = Number(part.trim());
          return Number.isInteger(n) && n >= 1 && n <= 52;
        })
    ),
    'found an out-of-range ID'
  );

  // ============================================
  console.log('\n2️⃣  Create with a recommended_investigations string');
  const created = await screeningService.createScreening({
    person_name: 'Test Investigation Person',
    age_years: 29,
    is_student: false,
    camp_id: 'C0001',
    worker_id: 'W0001',
    village: 'Verification Village',
    height: 165,
    weight: 60,
    ecg: 'Normal',
    echo_heart: 'Normal',
    advice: 'Recommended investigations verification',
    recommended_investigations: '4,19,22,46,48',
    screening_date: '2026-09-29',
    notes: 'Created by verify-recommended-investigations',
  });
  check('screening created', !!created?.id, created?.id);
  check(
    'IDs persisted as the exact comma-separated string',
    created?.recommended_investigations === '4,19,22,46,48',
    created?.recommended_investigations
  );
  check(
    'no 52 separate columns were introduced',
    (await query(
      `SELECT count(*)::int AS n FROM information_schema.columns
       WHERE table_name = 'shree_raj_health_screenings' AND column_name LIKE '%investig%'`
    )).rows[0].n === 1
  );

  // ============================================
  console.log('\n3️⃣  Person decoupling is unchanged');
  check('person_id auto-generated', /^P\d{4}$/.test(created?.person_id || ''), created?.person_id);
  check('person_name persisted', created?.person_name === 'Test Investigation Person');
  check('legacy user_id is still null', created?.user_id === null, String(created?.user_id));
  check('response carries person object', created?.person?.name === 'Test Investigation Person');
  check('camp_id preserved', created?.camp_id === 'C0001', created?.camp_id);
  check('worker_id preserved', created?.worker_id === 'W0001', created?.worker_id);
  check('ECG multi-select string preserved', created?.ecg === 'Normal', created?.ecg);
  check('2D Echo multi-select string preserved', created?.echo_heart === 'Normal', created?.echo_heart);

  // ============================================
  console.log('\n4️⃣  Value normalisation');
  const messy = await screeningService.createScreening({
    person_name: 'Test Investigation Person',
    camp_id: 'C0001',
    worker_id: 'W0001',
    recommended_investigations: '48, 4,22,19,4,abc,,999',
    screening_date: '2026-09-29',
    notes: 'Created by verify-recommended-investigations',
  });
  check(
    'duplicates removed, sorted ascending, invalid IDs dropped',
    messy?.recommended_investigations === '4,19,22,48',
    messy?.recommended_investigations
  );

  const asArray = await screeningService.createScreening({
    person_name: 'Test Investigation Person',
    camp_id: 'C0001',
    worker_id: 'W0001',
    recommended_investigations: [52, 1, 23],
    screening_date: '2026-09-29',
    notes: 'Created by verify-recommended-investigations',
  });
  check('array input accepted and sorted', asArray?.recommended_investigations === '1,23,52', asArray?.recommended_investigations);

  const none = await screeningService.createScreening({
    person_name: 'Test Investigation Person',
    camp_id: 'C0001',
    worker_id: 'W0001',
    recommended_investigations: '',
    screening_date: '2026-09-29',
    notes: 'Created by verify-recommended-investigations',
  });
  check('empty string stored as NULL', none?.recommended_investigations === null, String(none?.recommended_investigations));

  const omitted = await screeningService.createScreening({
    person_name: 'Test Investigation Person',
    camp_id: 'C0001',
    worker_id: 'W0001',
    screening_date: '2026-09-29',
    notes: 'Created by verify-recommended-investigations',
  });
  check('omitted field stored as NULL', omitted?.recommended_investigations === null, String(omitted?.recommended_investigations));

  // ============================================
  console.log('\n5️⃣  Read paths return the field');
  const byId = await screeningService.getScreeningById(created.id);
  check('getScreeningById returns investigations', byId?.recommended_investigations === '4,19,22,46,48', byId?.recommended_investigations);
  const byPerson = await screeningService.getScreeningsByPersonId(created.person_id);
  check('getScreeningsByPersonId returns investigations', byPerson.some((s) => s.id === created.id && s.recommended_investigations === '4,19,22,46,48'));
  const byCamp = await screeningService.getScreeningsByCampId('C0001');
  check('getScreeningsByCampId returns investigations', byCamp.some((s) => s.id === created.id));

  // ============================================
  console.log('\n6️⃣  Update path');
  const updated = await screeningService.updateScreening(created.id, {
    recommended_investigations: '34,48',
  });
  check('investigations updated', updated?.recommended_investigations === '34,48', updated?.recommended_investigations);

  const cleared = await screeningService.updateScreening(created.id, {
    recommended_investigations: null,
  });
  check('investigations cleared to NULL', cleared?.recommended_investigations === null, String(cleared?.recommended_investigations));
  check('other fields survived the update', cleared?.person_name === 'Test Investigation Person', cleared?.person_name);

  // ============================================
  console.log('\n7️⃣  Existing records preserved and cleanup');
  const cleanupIds = [created.id, messy.id, asArray.id, none.id, omitted.id];
  await query(`DELETE FROM shree_raj_health_screenings WHERE id = ANY($1)`, [cleanupIds]);
  const after = await screeningService.getAllScreenings({ limit: 100, offset: 0 });
  check('verification records removed', after.length === before.length, `${after.length} vs ${before.length}`);
  check('all pre-existing records intact', before.every((s) => after.some((a) => a.id === s.id)));

  const reclaimed = await reclaimScreeningIdsFromFixtures(query);
  check('screening ID sequence reclaimed after cleanup', reclaimed.changed, reclaimed.message);
  console.log(`   ℹ️  ${reclaimed.message}`);

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Results: ${passed} passed, ${failed} failed`);
  await closePool();
  if (failed > 0) process.exit(1);
}

run().catch(async (err) => {
  console.error('\n❌ Verification aborted:', err);
  await closePool();
  process.exit(1);
});
