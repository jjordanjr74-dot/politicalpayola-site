(function() {
  const D = window.PAYOLA_DATA || { modules: {}, state_party: [], party_control: [] };
  const mods = D.modules || {};
  const spMap = {};
  (D.state_party || []).forEach(r => { spMap[r.geo] = r; });

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  const UNIT_LABELS = {
    'billions_usd_10yr_deficit_effect': 'Billion USD (10-Yr CBO Score)',
    'censured_/_reprimanded': 'Censured / Reprimanded',
    'convicted_/_guilty_plea': 'Convicted / Guilty Plea',
    'convicted_/_later_pardoned': 'Convicted / Later Pardoned',
    'convicted_/_overturned_on_appeal': 'Convicted / Overturned on Appeal',
    'formal_ethics_violation': 'Formal Ethics Violation',
    'indicted_/_arrested': 'Federal Indictment / Arrest',
    'indicted_/_doj_subpoena_probe': 'DOJ Subpoena & Indictment Probe',
    'indicted_/_ethics_&_police_probe': 'Ethics & Criminal Probe',
    'indicted_/_ethics_&_state_overpayment_probe': 'State & Ethics Probe',
    'indicted_/_fbi_&_ethics_probe': 'FBI & Ethics Investigation',
    'indicted_/_guilty_plea': 'Indicted / Guilty Plea',
    'indicted_/_impeached': 'Indicted & Impeached',
    'indicted_/_resigned': 'Indicted & Resigned',
    'resigned_/_dropped_re-election': 'Resigned / Dropped Re-Election',
    'resigned_/_ethics_findings_released': 'Resigned After Ethics Findings',
    'resigned_under_investigation': 'Resigned Under Investigation',
    'usd_or_year': 'USD / Sentence Term',
    '2025_dollars': '2025 Constant Dollars',
    'dollars_per_gallon': 'USD / Gallon',
    'millions_of_dollars': 'Million USD',
    'percent_of_gdp': '% of U.S. GDP',
    'thousands_of_persons': 'Thousand Persons',
    'lean_index_-100_to_+100': 'Lean Index (-100 to +100)',
    'roll_call_vote': 'Roll-Call Vote',
    'officials_convicted': 'Officials Convicted',
    'USD_per_hour': 'USD / Hour',
    'per_1000_children': 'per 1,000 Children',
    'per_1000_live_births': 'per 1,000 Live Births',
    'per_100k': 'per 100,000 Residents',
    'per_100k_ages_1_19': 'per 100,000 (Ages 1–19)',
    'pct_republican_vote': '% Republican Vote',
    'house_seat_shift_president_party': 'House Seat Shift (President Party)',
    'billion_fy2017_usd': 'Billion USD (FY2017)',
    'billions_usd': 'Billion USD',
    'civilian_casualties_killed_and_injured': 'Civilian Casualties',
    'conflict_record': 'Conflict Record',
    'deaths_estimate': 'Estimated Deaths',
    'deaths_low_estimate': 'Conservative Death Estimate',
    'millions_usd': 'Million USD',
    'yea_votes': 'Yea Votes'
  };

  function humanUnit(u) {
    if (!u) return '';
    const s = String(u).trim();
    if (UNIT_LABELS[s]) return UNIT_LABELS[s];
    if (s.includes('_')) return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return s;
  }

  function cleanMetricTitle(r) {
    if (!r) return '';
    if (r.name && !String(r.name).includes('_')) return String(r.name);
    if (r.scandal_name) return String(r.scandal_name);
    if (r.member_name) return String(r.member_name);
    if (r.person) return String(r.person);
    const m = String(r.metric || '').trim();
    if (!m.includes('_')) return m;
    const pe = String(r.plain_english || '');
    if (pe.includes('—')) {
      const head = pe.split('—')[0].trim();
      if (head.length > 3 && head.length < 95) return head;
    }
    if (pe.includes(':')) {
      const head = pe.split(':')[0].trim();
      if (head.length > 3 && head.length < 90) return head;
    }
    return m.replace(/^scandal_(?:\d{4}_)?/i, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  function resolvePartyCode(r) {
    if (!r) return 'Divided';
    const direct = r.party || r.party_of_central_figures || r.winner_party || r.president_party;
    if (direct) {
      const u = String(direct).trim().toUpperCase();
      if (u.startsWith('D')) return 'D';
      if (u.startsWith('R')) return 'R';
      if (u.includes('BIPARTISAN') || u.includes('BOTH') || u.includes('/')) return 'Divided';
      if (u.startsWith('I')) return 'I';
    }
    const txt = (r.metric || '') + ' ' + (r.plain_english || '');
    const mTag = txt.match(/\(([RD])-[A-Z]{2}/);
    if (mTag) return mTag[1];
    if (txt.includes('Republican ') && !txt.includes('Democratic ')) return 'R';
    if (txt.includes('Democratic ') && !txt.includes('Republican ')) return 'D';
    const pc = r.party_context;
    if (pc && typeof pc === 'object') {
      const p = pc.party || pc.trifecta || pc.state_control || pc.president;
      if (p) {
        const u = String(p).trim().toUpperCase();
        if (u.startsWith('D')) return 'D';
        if (u.startsWith('R')) return 'R';
        if (u.startsWith('I')) return 'I';
      }
    }
    return 'Divided';
  }

  function partyChip(p, label) {
    const raw = String(p || '').trim();
    const u = raw.toUpperCase();
    const k = (u === 'R' || u.startsWith('REP')) ? 'R' : (u === 'D' || u.startsWith('DEM')) ? 'D' : 'Divided';
    const defaultLabel = k === 'R' ? 'Republican (R)' : k === 'D' ? 'Democrat (D)' : 'Bipartisan / Split';
    const display = (label && label !== p) ? label : (raw.length === 1 ? defaultLabel : (raw || 'N/A'));
    return `<span class="chip chip-${k}">${esc(display)}</span>`;
  }

  function cleanPubName(rawPub) {
    let pub = String(rawPub || 'Verified Source').trim();
    if (pub.includes(' — ')) pub = pub.split(' — ')[0].trim();
    if (pub.includes(' - ')) pub = pub.split(' - ')[0].trim();
    if (pub.length > 42) pub = pub.slice(0, 40).replace(/[,;\s]+$/, '') + '…';
    return pub;
  }

  function srcLinks(src, secArr) {
    if (!src) return '';
    const pub = cleanPubName(src.publisher || src.name || src.title);
    const fullTitle = [src.publisher, src.title, src.published_date].filter(Boolean).join(' — ');
    let html = `<a class="chip-src" href="${esc(src.url)}" target="_blank" rel="noopener" title="${esc(fullTitle)}">Primary: ${esc(pub)} ↗</a>`;
    const extras = Array.isArray(secArr) ? secArr : (Array.isArray(src.secondary_sources) ? src.secondary_sources : []);
    extras.slice(0, 2).forEach((u, idx) => {
      try {
        const urlStr = typeof u === 'string' ? u : (u && u.url);
        if (!urlStr) return;
        const labelStr = (typeof u === 'object' && (u.publisher || u.name)) ? cleanPubName(u.publisher || u.name) : new URL(urlStr).hostname.replace(/^www\./, '');
        html += ` <a class="chip-src" href="${esc(urlStr)}" target="_blank" rel="noopener">Cross-Check #${idx+2}: ${esc(labelStr)} ↗</a>`;
      } catch (e) {}
    });
    return html;
  }

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.section-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById('panel-' + btn.dataset.tab);
      if (target) target.classList.add('active');
    });
  });

  // 1. Render Presidential Vacation Days Per Term
  function renderPresidentsVacation() {
    const recs = mods.presidents_vacation || [];
    const tbody = document.getElementById('pres-vac-tbody');
    const cardsEl = document.getElementById('pres-vac-cards');
    if (!tbody || !cardsEl) return;

    const maxAway = Math.max(...recs.map(r => r.total_away_days || 1), 600);
    tbody.innerHTML = recs.map((r, i) => {
      const p = r.party;
      const vacW = Math.round((r.vacation_only_days / maxAway) * 100);
      const totW = Math.round((r.total_away_days / maxAway) * 100);
      return `<tr>
        <td><strong>${i + 1}</strong></td>
        <td><strong>${esc(r.president)}</strong> ${partyChip(p, p)}</td>
        <td>${esc(r.term)} <span style="color:var(--muted)">(${esc(r.period)})</span></td>
        <td><strong style="font-size:1.08rem;color:var(--gold)">${r.vacation_only_days} days</strong> <span style="color:var(--muted)">(${r.pct_term_vacation_only}% · ${r.avg_vacation_days_per_year}/yr)</span>
          <div class="bar-track" style="margin-top:4px;height:7px"><div class="bar-fill-${p}" style="width:${vacW}%"></div></div>
        </td>
        <td><strong>${r.total_away_days} days</strong> <span style="color:var(--muted)">(${r.pct_term_total_away}% · ${r.avg_total_away_days_per_year}/yr)</span>
          <div class="bar-track" style="margin-top:4px;height:7px"><div class="bar-fill-G" style="width:${totW}%"></div></div>
        </td>
        <td>${r.camp_david_days} days</td>
        <td style="font-size:0.82rem">${esc(r.primary_destinations)}</td>
        <td>${srcLinks(r.source)}</td>
      </tr>`;
    }).join('');

    // Summary comparison cards by President (combining terms)
    cardsEl.innerHTML = recs.map(r => `
      <div class="card ${r.party === 'R' ? 'rep-card' : 'dem-card'}">
        <div class="card-top">
          <div>
            <div style="font-size:0.8rem;color:var(--muted)">${esc(r.period)} · ${esc(r.term)}</div>
            <h3 style="font-size:1.15rem">${esc(r.president)}</h3>
          </div>
          ${partyChip(r.party, r.party === 'R' ? 'Republican' : 'Democrat')}
        </div>
        <div style="display:flex;gap:18px;align-items:baseline;margin:4px 0">
          <div>
            <div class="big-num" style="color:var(--gold)">${r.vacation_only_days}d</div>
            <div style="font-size:0.75rem;color:var(--muted)">Vacation / Personal Residence (${r.pct_term_vacation_only}%)</div>
          </div>
          <div>
            <div class="big-num">${r.total_away_days}d</div>
            <div style="font-size:0.75rem;color:var(--muted)">Total Away incl. Camp David (${r.pct_term_total_away}%)</div>
          </div>
        </div>
        <p style="font-size:0.88rem;color:#334155">${esc(r.plain_english)}</p>
        <div style="font-size:0.78rem;color:var(--muted)"><strong>Primary retreats:</strong> ${esc(r.primary_destinations)}</div>
        <div style="margin-top:auto;padding-top:8px">${srcLinks(r.source)}</div>
      </div>
    `).join('');
  }

  // 2. Render Special State Rankings (Domestic Violence, Poverty, School Shootings, Mass Shootings, Mass Deportation)
  function renderSpecialStateTables() {
    const spec = mods.states_special || [];
    const statesAll = mods.states || [];

    // 2A. Domestic Violence
    const dv = spec.filter(r => r.id.startsWith('states_special.domestic_violence.')).sort((a,b) => a.rank - b.rank);
    const dvEl = document.getElementById('table-dv');
    if (dvEl) {
      dvEl.innerHTML = dv.slice(0, 12).map(r => `<tr>
        <td><strong>#${r.rank}</strong></td>
        <td><strong>${esc(r.state_name)} (${r.geo})</strong></td>
        <td>${partyChip(r.party_context.state_control, 'State: ' + r.party_context.state_control)} ${partyChip(r.party_context.presidential_2024, '2024: ' + r.party_context.presidential_2024)}</td>
        <td><strong style="color:var(--rep)">${r.women_ipv_pct}%</strong></td>
        <td>${r.men_ipv_pct}%</td>
        <td><strong>${r.combined_ipv_pct}%</strong></td>
        <td>${r.nisvs_2016_2017_women_pct}%</td>
        <td><span style="color:var(--gold);font-weight:700">${r.unmet_shelter_requests_pct}% unmet</span></td>
        <td>${srcLinks(r.source)}</td>
      </tr>`).join('');
    }

    // 2B. Poverty Rate (from states.json 2024 Census SAIPE)
    const pov = statesAll.filter(r => r.metric === 'Poverty rate (all ages)' && r.geo !== 'DC')
      .sort((a,b) => parseFloat(b.value) - parseFloat(a.value));
    const povEl = document.getElementById('table-poverty');
    if (povEl) {
      povEl.innerHTML = pov.slice(0, 12).map((r, i) => {
        const sp = spMap[r.geo] || {};
        return `<tr>
          <td><strong>#${i + 1}</strong></td>
          <td><strong>${esc(r.geo)}</strong></td>
          <td>${partyChip(sp.state_control || 'R', 'State: ' + (sp.state_control || 'R'))} ${partyChip(sp.presidential_2024_winner || 'R', '2024: ' + (sp.presidential_2024_winner || 'R'))}</td>
          <td><strong style="color:var(--gold);font-size:1.05rem">${r.value}%</strong></td>
          <td>${esc(r.period)}</td>
          <td style="font-size:0.84rem">${esc(r.plain_english)}</td>
          <td>${srcLinks(r.source)}</td>
        </tr>`;
      }).join('');
    }

    // 2C. School Shootings (both by Total and by Rate)
    const sch = spec.filter(r => r.id.startsWith('states_special.school_shootings.'));
    const schTot = [...sch].sort((a,b) => b.incidents_1966_2026 - a.incidents_1966_2026);
    const schRate = [...sch].sort((a,b) => b.rate_per_100k - a.rate_per_100k);
    const schEl = document.getElementById('table-school-shootings');
    if (schEl) {
      schEl.innerHTML = schTot.slice(0, 10).map((r, i) => {
        const rr = schRate[i] || r;
        return `<tr>
          <td><strong>#${i + 1}</strong></td>
          <td><strong>${esc(r.state_name)}</strong> ${partyChip(r.party_context.state_control)}</td>
          <td><strong style="color:var(--gold)">${r.incidents_1966_2026}</strong> <span style="color:var(--muted)">(2013–25: ${r.incidents_2013_2025})</span></td>
          <td>${r.rate_per_100k} / 100k</td>
          <td style="border-left:2px solid var(--border)"><strong>#${i + 1} ${esc(rr.state_name)}</strong> ${partyChip(rr.party_context.state_control)}</td>
          <td><strong style="color:var(--rep)">${rr.rate_per_100k} per 100k</strong> <span style="color:var(--muted)">(${rr.incidents_1966_2026} total)</span></td>
          <td>${srcLinks(r.source)}</td>
        </tr>`;
      }).join('');
    }

    // 2D. Mass Shootings (JAMA Network Open 2014-2022 + GVA 2024, both by Total and by Rate)
    const ms = spec.filter(r => r.id.startsWith('states_special.mass_shootings.'));
    const msTot = [...ms].sort((a,b) => b.incidents_2014_2022 - a.incidents_2014_2022);
    const msRate = [...ms].sort((a,b) => b.rate_per_1m_2014_2022 - a.rate_per_1m_2014_2022);
    const msEl = document.getElementById('table-mass-shootings');
    if (msEl) {
      msEl.innerHTML = msTot.slice(0, 10).map((r, i) => {
        const rr = msRate[i] || r;
        return `<tr>
          <td><strong>#${i + 1}</strong></td>
          <td><strong>${esc(r.state_name)}</strong> ${partyChip(r.party_context.state_control)}</td>
          <td><strong style="color:var(--gold)">${r.incidents_2014_2022}</strong> <span style="color:var(--muted)">(2024: ${r.incidents_2024} · ${r.total_killed_or_injured_2014_2022} casualties)</span></td>
          <td>${r.rate_per_1m_2014_2022} / 1M</td>
          <td style="border-left:2px solid var(--border)"><strong>#${i + 1} ${esc(rr.state_name)}</strong> ${partyChip(rr.party_context.state_control)}</td>
          <td><strong style="color:var(--rep)">${rr.rate_per_1m_2014_2022} per 1M</strong> <span style="color:var(--muted)">(${rr.incidents_2014_2022} events · ${rr.total_killed_or_injured_2014_2022} casualties)</span></td>
          <td>${srcLinks(r.source)}</td>
        </tr>`;
      }).join('');
    }

    // 2E. Mass Deportation Negative Impact (Pew Aug 2025 + AIC + PIIE + NBER)
    const dep = spec.filter(r => r.id.startsWith('states_special.mass_deportation.')).sort((a,b) => b.pct_of_state_labor_force - a.pct_of_state_labor_force);
    const depEl = document.getElementById('table-deportation');
    if (depEl) {
      depEl.innerHTML = dep.slice(0, 12).map((r, i) => `<tr>
        <td><strong>#${i + 1}</strong></td>
        <td><strong>${esc(r.state_name)} (${r.geo})</strong></td>
        <td>${partyChip(r.party_context.state_control, 'State: ' + r.party_context.state_control)} ${partyChip(r.party_context.presidential_2024, '2024: ' + r.party_context.presidential_2024)}</td>
        <td><strong style="color:var(--rep);font-size:1.05rem">${r.pct_of_state_labor_force}% of workforce</strong></td>
        <td><strong>${Number(r.unauthorized_workers).toLocaleString()} workers</strong></td>
        <td>${Number(r.unauthorized_population).toLocaleString()} residents (${r.pct_of_state_households}% of households)</td>
        <td>${r.pct_of_k12_students_with_unauth_parent}% of K-12 kids</td>
        <td>${esc(r.top_industry_by_share)} / ${esc(r.top_industry_by_workers)}</td>
        <td>${srcLinks(r.source)}</td>
      </tr>`).join('');
    }
  }

  const STATE_NAMES = {
    AL:'Alabama', AK:'Alaska', AZ:'Arizona', AR:'Arkansas', CA:'California',
    CO:'Colorado', CT:'Connecticut', DE:'Delaware', FL:'Florida', GA:'Georgia',
    HI:'Hawaii', ID:'Idaho', IL:'Illinois', IN:'Indiana', IA:'Iowa',
    KS:'Kansas', KY:'Kentucky', LA:'Louisiana', ME:'Maine', MD:'Maryland',
    MA:'Massachusetts', MI:'Michigan', MN:'Minnesota', MS:'Mississippi', MO:'Missouri',
    MT:'Montana', NE:'Nebraska', NV:'Nevada', NH:'New Hampshire', NJ:'New Jersey',
    NM:'New Mexico', NY:'New York', NC:'North Carolina', ND:'North Dakota', OH:'Ohio',
    OK:'Oklahoma', OR:'Oregon', PA:'Pennsylvania', RI:'Rhode Island', SC:'South Carolina',
    SD:'South Dakota', TN:'Tennessee', TX:'Texas', UT:'Utah', VT:'Vermont',
    VA:'Virginia', WA:'Washington', WV:'West Virginia', WI:'Wisconsin', WY:'Wyoming', DC:'District of Columbia'
  };

  // Standard 12-column x 8-row U.S. cartogram layout (1-indexed col, row)
  const US_TILE_COORDS = [
    {geo:'AK', col:1, row:1}, {geo:'ME', col:12, row:1},
    {geo:'VT', col:10, row:2}, {geo:'NH', col:11, row:2}, {geo:'MA', col:12, row:2},
    {geo:'WA', col:2, row:3}, {geo:'ID', col:3, row:3}, {geo:'MT', col:4, row:3}, {geo:'ND', col:5, row:3}, {geo:'MN', col:6, row:3}, {geo:'WI', col:7, row:3}, {geo:'MI', col:8, row:3}, {geo:'NY', col:10, row:3}, {geo:'CT', col:11, row:3}, {geo:'RI', col:12, row:3},
    {geo:'OR', col:2, row:4}, {geo:'NV', col:3, row:4}, {geo:'WY', col:4, row:4}, {geo:'SD', col:5, row:4}, {geo:'IA', col:6, row:4}, {geo:'IL', col:7, row:4}, {geo:'IN', col:8, row:4}, {geo:'OH', col:9, row:4}, {geo:'PA', col:10, row:4}, {geo:'NJ', col:11, row:4},
    {geo:'CA', col:2, row:5}, {geo:'UT', col:3, row:5}, {geo:'CO', col:4, row:5}, {geo:'NE', col:5, row:5}, {geo:'MO', col:6, row:5}, {geo:'KY', col:7, row:5}, {geo:'WV', col:8, row:5}, {geo:'VA', col:9, row:5}, {geo:'MD', col:10, row:5}, {geo:'DE', col:11, row:5},
    {geo:'AZ', col:3, row:6}, {geo:'NM', col:4, row:6}, {geo:'KS', col:5, row:6}, {geo:'AR', col:6, row:6}, {geo:'TN', col:7, row:6}, {geo:'NC', col:8, row:6}, {geo:'SC', col:9, row:6}, {geo:'DC', col:10, row:6},
    {geo:'OK', col:5, row:7}, {geo:'LA', col:6, row:7}, {geo:'MS', col:7, row:7}, {geo:'AL', col:8, row:7}, {geo:'GA', col:9, row:7},
    {geo:'HI', col:1, row:8}, {geo:'TX', col:5, row:8}, {geo:'FL', col:10, row:8}
  ];

  function fmtStateVal(val, unit) {
    if (val == null || val === '') return '—';
    const num = Number(val);
    const u = String(unit || '').trim();
    if (!Number.isFinite(num)) return esc(val);
    if (u === '%' || u.toLowerCase().includes('percent') || u.toLowerCase().includes('pct')) {
      return num.toFixed(num % 1 === 0 ? 0 : 1) + '%';
    }
    if (u === 'USD' || u === 'USD_per_hour' || u.toLowerCase().includes('dollar') || u.toLowerCase().includes('usd')) {
      if (Math.abs(num) >= 1000) return '$' + Math.round(num).toLocaleString('en-US');
      return '$' + num.toFixed(num % 1 === 0 ? 0 : 2);
    }
    if (Math.abs(num) >= 1000) return Math.round(num).toLocaleString('en-US');
    return String(Math.round(num * 10) / 10);
  }

  // 3. Render Full 50-State Explorer Across All State Modules (Interactive Map + State Top-10 Dossier + Cards + Table)
  function initFullStateExplorer() {
    const allStateRecs = [].concat(
      mods.states || [],
      mods.states_crime || [],
      mods.states_fiscal || [],
      mods.states_health_env || [],
      mods.states_medicaid || [],
      mods.states_more || []
    ).filter(r => r.geo && r.geo.length === 2 && r.geo !== 'US' && typeof r.value === 'number');

    const metrics = Array.from(new Set(allStateRecs.map(r => r.metric))).sort();
    const sel = document.getElementById('state-metric-select');
    const focusSel = document.getElementById('state-focus-select');
    const mapEl = document.getElementById('us-state-tile-map');
    const dossierEl = document.getElementById('state-spotlight-dossier');
    const mapTitleEl = document.getElementById('state-map-active-metric-title');
    const tbody = document.getElementById('state-explorer-tbody');
    const summaryEl = document.getElementById('state-correlation-summary');
    if (!sel || !tbody) return;

    // Pre-compute rank for every (metric, state) across the 50 states
    const metricRankMap = {};
    metrics.forEach(m => {
      const mRows = allStateRecs.filter(r => r.metric === m && r.geo !== 'DC').sort((a,b) => b.value - a.value);
      const byGeo = {};
      mRows.forEach((r, idx) => {
        byGeo[r.geo] = { rank: idx + 1, total: mRows.length, rec: r };
      });
      const dcRow = allStateRecs.find(r => r.metric === m && r.geo === 'DC');
      if (dcRow) byGeo['DC'] = { rank: null, total: mRows.length, rec: dcRow };
      metricRankMap[m] = { rows: mRows, byGeo };
    });

    sel.innerHTML = metrics.map(m => `<option value="${esc(m)}">${esc(m)}</option>`).join('');
    // Default to Poverty rate or High school graduation rate or first metric
    const preferredMetric = metrics.find(m => m === 'Poverty rate (all ages)') || metrics[0];
    if (preferredMetric) sel.value = preferredMetric;

    let activeState = 'CO';
    if (focusSel) {
      const stateCodes = Object.keys(STATE_NAMES).filter(k => k !== 'DC').sort((a,b) => STATE_NAMES[a].localeCompare(STATE_NAMES[b]));
      focusSel.innerHTML = stateCodes.map(c => `<option value="${c}">${esc(STATE_NAMES[c])} (${c})</option>`).join('');
      focusSel.value = activeState;
    }

    function renderStateDossier(geo) {
      if (!dossierEl) return;
      const stName = STATE_NAMES[geo] || geo;
      const sp = spMap[geo] || {};
      const ctrl = sp.state_control || 'Divided';
      const p24 = sp.presidential_2024_winner || 'R';
      const curMetric = sel.value;
      const curInfo = (metricRankMap[curMetric] && metricRankMap[curMetric].byGeo[geo]) || null;

      // Gather all metrics for this state and rank by where it stands Out Most (closest to #1 or #50)
      const stateMetrics = [];
      metrics.forEach(m => {
        const entry = metricRankMap[m] && metricRankMap[m].byGeo[geo];
        if (entry && entry.rank) {
          const distFromEdge = Math.min(entry.rank - 1, entry.total - entry.rank);
          stateMetrics.push({ metric: m, rank: entry.rank, total: entry.total, rec: entry.rec, distFromEdge });
        }
      });
      // Sort so the active metric is highlighted at the top, followed by the state's Top 10 most defining rankings (#1-#10 or #41-#50)
      stateMetrics.sort((a, b) => a.distFromEdge - b.distFromEdge || a.rank - b.rank);
      const top10Issues = stateMetrics.slice(0, 10);

      dossierEl.innerHTML = `
        <div class="dossier-head">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap">
            <div>
              <div class="dossier-kicker">STATE TOP-10 ISSUE DOSSIER · CLICK ANY METRIC TO MAP</div>
              <h3 class="dossier-state-title">${esc(stName)} <span style="color:var(--muted);font-weight:600">(${esc(geo)})</span></h3>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              ${partyChip(ctrl, 'State Control: ' + (ctrl === 'R' ? 'GOP Trifecta' : ctrl === 'D' ? 'Dem Trifecta' : 'Divided'))}
              ${partyChip(p24, '2024 Vote: ' + (p24 === 'R' ? 'Trump (R)' : 'Harris (D)'))}
            </div>
          </div>
          ${curInfo && curInfo.rec ? `
            <div class="dossier-active-metric-box">
              <div style="font-size:0.72rem;font-weight:800;color:var(--gold);text-transform:uppercase;letter-spacing:0.04em">SELECTED MAP METRIC · NATIONAL RANK ${curInfo.rank ? '#' + curInfo.rank + ' OF ' + curInfo.total : 'DC'}</div>
              <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin:3px 0">
                <strong style="font-size:0.95rem;color:#18130d">${esc(curMetric)}</strong>
                <span style="font-family:var(--mono);font-size:1.25rem;font-weight:800;color:var(--gold)">${fmtStateVal(curInfo.rec.value, curInfo.rec.unit)} <small style="font-size:0.74rem;color:var(--muted);font-weight:600">${esc(humanUnit(curInfo.rec.unit))}</small></span>
              </div>
              <p style="margin:4px 0 0;font-size:0.81rem;color:#334155;line-height:1.45">${esc(curInfo.rec.plain_english)}</p>
            </div>
          ` : ''}
        </div>
        <div class="dossier-list-title">Top 10 Defining Rankings &amp; Plain-English Issues in ${esc(stName)}</div>
        <div class="dossier-issue-list">
          ${top10Issues.map((item, idx) => {
            const isTop = item.rank <= 10;
            const rankBadgeBg = isTop ? '#fef3c7' : '#e0f2fe';
            const rankBadgeCol = isTop ? '#92400e' : '#075985';
            const isSelected = item.metric === curMetric;
            return `<div class="dossier-issue-row ${isSelected ? 'active-issue' : ''}" data-metric="${esc(item.metric)}" title="Click to map ${esc(item.metric)} across all 50 states">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
                <div style="display:flex;align-items:center;gap:7px;min-width:0">
                  <span style="background:${rankBadgeBg};color:${rankBadgeCol};font-family:var(--mono);font-size:0.72rem;font-weight:800;padding:2px 7px;border-radius:5px;white-space:nowrap">Rank #${item.rank}/${item.total}</span>
                  <strong style="font-size:0.86rem;color:#18130d;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${idx + 1}. ${esc(item.metric)}</strong>
                </div>
                <span style="font-family:var(--mono);font-size:0.88rem;font-weight:800;color:#b45309;white-space:nowrap">${fmtStateVal(item.rec.value, item.rec.unit)} <small style="font-weight:600;color:var(--muted)">${esc(humanUnit(item.rec.unit))}</small></span>
              </div>
              <div style="font-size:0.78rem;color:#475569;margin-top:3px;line-height:1.4">${esc(item.rec.plain_english)}</div>
            </div>`;
          }).join('')}
        </div>
      `;

      dossierEl.querySelectorAll('.dossier-issue-row').forEach(row => {
        row.addEventListener('click', () => {
          const targetMetric = row.getAttribute('data-metric');
          if (targetMetric && sel.value !== targetMetric) {
            sel.value = targetMetric;
            updateTable();
          }
        });
      });
    }

    function updateTable() {
      const m = sel.value;
      const mData = metricRankMap[m] || { rows: [], byGeo: {} };
      const rows = mData.rows;
      const unitHint = rows[0] ? humanUnit(rows[0].unit) : '';
      if (mapTitleEl) {
        mapTitleEl.textContent = `${m} ${unitHint ? '(' + unitHint + ')' : ''} — Click Any State to Inspect`;
      }

      const top10 = rows.slice(0, 10);
      let rCnt = 0, dCnt = 0, divCnt = 0, r24 = 0, d24 = 0;
      top10.forEach(r => {
        const sp = spMap[r.geo] || {};
        if (sp.state_control === 'R') rCnt++;
        else if (sp.state_control === 'D') dCnt++;
        else divCnt++;
        if (sp.presidential_2024_winner === 'R') r24++;
        else if (sp.presidential_2024_winner === 'D') d24++;
      });

      if (summaryEl) {
        const top3Names = top10.slice(0, 3).map((r, i) => `<strong>#${i+1} ${esc(STATE_NAMES[r.geo] || r.geo)}</strong> (${fmtStateVal(r.value, r.unit)})`).join(', ');
        summaryEl.innerHTML = `<div style="display:flex;flex-direction:column;gap:6px">
          <div><strong>Plain-English Summary for "${esc(m)}":</strong> Highest states are ${top3Names}. Among the Top 10 states on this metric: ${partyChip('R', rCnt + ' GOP Trifectas')} ${partyChip('D', dCnt + ' Dem Trifectas')} ${partyChip('Divided', divCnt + ' Split States')} · <strong>2024 Vote of Top 10:</strong> <span style="color:#b91c1c;font-weight:800">${r24} Trump (R)</span> vs. <span style="color:#1d4ed8;font-weight:800">${d24} Harris (D)</span>.</div>
        </div>`;
      }

      // Render Interactive 50-State Cartogram Map
      if (mapEl) {
        mapEl.innerHTML = US_TILE_COORDS.map(tile => {
          const sp = spMap[tile.geo] || {};
          const ctrl = sp.state_control || 'Divided';
          const entry = mData.byGeo[tile.geo];
          const valStr = entry && entry.rec ? fmtStateVal(entry.rec.value, entry.rec.unit) : '—';
          const rankStr = entry && entry.rank ? `#${entry.rank}` : '';
          const partyCls = ctrl === 'R' ? 'tile-rep' : ctrl === 'D' ? 'tile-dem' : 'tile-div';
          const selCls = tile.geo === activeState ? 'tile-selected' : '';
          const stFull = STATE_NAMES[tile.geo] || tile.geo;
          return `<button type="button" class="us-state-tile ${partyCls} ${selCls}" data-geo="${tile.geo}" style="grid-column:${tile.col};grid-row:${tile.row}" title="${esc(stFull)} (${tile.geo}) — ${esc(m)}: ${esc(valStr)} (${esc(rankStr)})">
            <span class="tile-top"><span class="tile-geo">${tile.geo}</span><span class="tile-rank">${rankStr}</span></span>
            <span class="tile-val">${esc(valStr)}</span>
          </button>`;
        }).join('');

        mapEl.querySelectorAll('.us-state-tile').forEach(btn => {
          btn.addEventListener('click', () => {
            activeState = btn.getAttribute('data-geo') || 'CO';
            if (focusSel && activeState !== 'DC') focusSel.value = activeState;
            mapEl.querySelectorAll('.us-state-tile').forEach(b => b.classList.toggle('tile-selected', b.getAttribute('data-geo') === activeState));
            renderStateDossier(activeState);
          });
        });
      }

      renderStateDossier(activeState);

      // Table view
      tbody.innerHTML = rows.map((r, idx) => {
        const sp = spMap[r.geo] || {};
        const stFull = STATE_NAMES[r.geo] || r.geo;
        return `<tr style="cursor:pointer" onclick="document.getElementById('state-focus-select').value='${r.geo}';document.getElementById('state-focus-select').dispatchEvent(new Event('change'))">
          <td><strong>#${idx + 1}</strong></td>
          <td><strong>${esc(stFull)} (${esc(r.geo)})</strong></td>
          <td>${partyChip(sp.state_control || 'R', 'State: ' + (sp.state_control || '?'))} ${partyChip(sp.presidential_2024_winner || 'R', '2024: ' + (sp.presidential_2024_winner || '?'))}</td>
          <td><strong style="color:var(--gold)">${fmtStateVal(r.value, r.unit)}</strong> <span style="color:var(--muted)">${esc(humanUnit(r.unit))}</span></td>
          <td>${esc(r.period)}</td>
          <td style="font-size:0.84rem">${esc(r.plain_english)}</td>
          <td>${srcLinks(r.source)}</td>
        </tr>`;
      }).join('');

      // Card dashboard view
      const cardsEl = document.getElementById('state-cards-view');
      if (cardsEl) {
        cardsEl.innerHTML = rows.map((r, idx) => {
          const sp = spMap[r.geo] || {};
          const p24 = sp.presidential_2024_winner || 'R';
          const stateCtrl = sp.state_control || 'Divided';
          const stFull = STATE_NAMES[r.geo] || r.geo;
          return `<div class="bill-card" style="position:relative;cursor:pointer" onclick="document.getElementById('state-focus-select').value='${r.geo}';document.getElementById('state-focus-select').dispatchEvent(new Event('change'));document.getElementById('state-map-explorer-shell').scrollIntoView({behavior:'smooth',block:'nearest'})">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem">
              <span style="font-family:JetBrains Mono,monospace;font-size:0.75rem;font-weight:700;color:var(--fg-muted)">Rank #${idx + 1} of ${rows.length}</span>
              <div style="display:flex;gap:0.3rem">
                <span class="chip chip-${stateCtrl === 'R' ? 'R' : stateCtrl === 'D' ? 'D' : 'Divided'}" style="font-size:0.65rem;padding:0.1rem 0.4rem">${stateCtrl}</span>
                <span class="chip chip-${p24 === 'R' ? 'R' : 'D'}" style="font-size:0.65rem;padding:0.1rem 0.4rem">${p24} '24</span>
              </div>
            </div>
            <h3 style="font-family:Newsreader,serif;font-size:1.1rem;font-weight:700;margin:0 0 0.25rem">${esc(stFull)} (${esc(r.geo)})</h3>
            <div style="font-family:JetBrains Mono,monospace;font-weight:700;font-size:1.45rem;margin:0.45rem 0;color:var(--gold)">${fmtStateVal(r.value, r.unit)} <span style="font-size:0.8rem;color:var(--fg-muted);font-weight:500">${esc(humanUnit(r.unit))}</span></div>
            <div style="font-family:Plus Jakarta Sans,sans-serif;font-size:0.82rem;line-height:1.45;color:var(--fg-body)">${esc(r.plain_english)}</div>
            <div style="font-size:0.7rem;color:var(--fg-muted);margin-top:0.4rem">Period: ${esc(r.period)} · Click to open ${esc(stFull)} Top-10 Dossier</div>
          </div>`;
        }).join('');
      }
    }

    sel.addEventListener('change', updateTable);
    if (focusSel) {
      focusSel.addEventListener('change', () => {
        activeState = focusSel.value || 'CO';
        if (mapEl) {
          mapEl.querySelectorAll('.us-state-tile').forEach(b => b.classList.toggle('tile-selected', b.getAttribute('data-geo') === activeState));
        }
        renderStateDossier(activeState);
      });
    }
    if (metrics.length) updateTable();
  }

  // 3b. Render Top 25 Politicians Receiving the Most Donor/Corporate (PAC) Money
  function renderTop25Pac() {
    const recs = mods.money_top25_pac || [];
    const tbody = document.getElementById('top25-tbody');
    const cardsEl = document.getElementById('top25-cards');
    const partySel = document.getElementById('top25-party');
    const chamberSel = document.getElementById('top25-chamber');
    const searchIn = document.getElementById('top25-search');
    const countEl = document.getElementById('top25-count');
    if (!tbody || !cardsEl) return;

    const fmt = n => '$' + Math.round(n).toLocaleString('en-US');

    function applyFilter() {
      const party = partySel.value;
      const chamber = chamberSel.value;
      const q = (searchIn.value || '').trim().toLowerCase();
      const filtered = recs.filter(r => {
        if (party !== 'ALL' && r.party !== party) return false;
        if (chamber !== 'ALL' && r.chamber !== chamber) return false;
        if (q && !(r.name.toLowerCase().includes(q) || r.geo.toLowerCase().includes(q))) return false;
        return true;
      });

      tbody.innerHTML = filtered.map(r => {
        const maxPac = Math.max(...recs.map(x => x.value || 1));
        const pctW = Math.round((r.value / maxPac) * 100);
        return `<tr>
          <td><strong>${r.metric.split(' ')[0]}</strong></td>
          <td>
            <strong>${esc(r.name)}</strong> ${partyChip(r.party, r.party_full)}<br>
            <span style="color:var(--muted);font-size:0.78rem">${esc(r.geo)}${r.district ? '-' + r.district : ''}</span>
          </td>
          <td>${esc(r.chamber)}</td>
          <td><strong style="color:var(--gold)">${fmt(r.value)}</strong></td>
          <td>
            <div class="bar-track" style="max-width:150px"><div class="bar-fill-${r.party === 'R' ? 'R' : r.party === 'D' ? 'D' : 'G'}" style="width:${pctW}%"></div></div>
            <span style="font-size:0.78rem;color:var(--muted)">${r.pac_pct_of_total}%</span>
          </td>
          <td>${fmt(r.total_receipts)}</td>
          <td><a class="chip-src" href="${esc(r.fec_url)}" target="_blank" rel="noopener">FEC ↗</a></td>
        </tr>`;
      }).join('');

      cardsEl.innerHTML = filtered.map(r => `
        <div class="member-card party-${r.party === 'R' ? 'R' : r.party === 'D' ? 'D' : 'I'}">
          <div class="member-photo-wrap">
            <img src="${esc(r.photo)}" loading="lazy" alt="${esc(r.name)}">
            <div class="member-badges">
              <span class="chip chip-${r.party === 'R' ? 'R' : r.party === 'D' ? 'D' : 'I'}">${r.party}</span>
              <span class="chip chip-src">#${r.metric.split(' ')[0].replace('#','')}</span>
            </div>
          </div>
          <div class="member-body">
            <strong>${esc(r.name)}</strong>
            <span style="color:var(--muted)">${esc(r.chamber)} · ${esc(r.geo)}${r.district ? '-' + r.district : ''}</span>
            <strong style="color:var(--gold)">${fmt(r.value)}</strong>
            <span style="font-size:0.78rem;color:var(--muted)">PAC money · ${r.pac_pct_of_total}% of ${fmt(r.total_receipts)} raised</span>
            <div class="member-actions">
              <a href="${esc(r.fec_url)}" target="_blank" rel="noopener">FEC ↗</a>
            </div>
          </div>
        </div>`).join('');

      countEl.textContent = filtered.length + ' / ' + recs.length + ' lawmakers';
    }

    [partySel, chamberSel].forEach(el => el.addEventListener('change', applyFilter));
    searchIn.addEventListener('input', applyFilter);
    applyFilter();
  }


  // =========================================================================
  // 3c. Render U.S. Demographics & How America Votes Since Reagan (1980–2024)
  // =========================================================================
  function renderVoterDemographics() {
    const recs = mods.us_voter_demographics || [];
    const tbody = document.getElementById('us-demographics-tbody');
    const yrFilter = document.getElementById('demo-year-filter');
    const dimFilter = document.getElementById('demo-dim-filter');
    if (!tbody || !yrFilter || !dimFilter) return;

    function renderDualBar(rVal, dVal, label) {
      if (rVal == null && dVal == null) return `<span style="color:var(--muted);font-size:0.75rem">${esc(label)}: N/A</span>`;
      const r = rVal || 0;
      const d = dVal || 0;
      const other = Math.max(0, 100 - r - d);
      return `
        <div style="margin-bottom:6px">
          <div style="display:flex;justify-content:space-between;font-size:0.78rem;font-weight:600">
            <span>${esc(label)}</span>
            <span><strong style="color:#ef4444">${r}% R</strong> · <strong style="color:#3b82f6">${d}% D</strong></span>
          </div>
          <div class="dual-bar">
            <div class="dual-bar-r" style="width:${r}%"></div>
            ${other > 0 ? `<div class="dual-bar-o" style="width:${other}%"></div>` : ''}
            <div class="dual-bar-d" style="width:${d}%"></div>
          </div>
        </div>`;
    }

    function applyFilters() {
      const yr = yrFilter.value;
      const dim = dimFilter.value;

      const filtered = recs.filter(r => {
        if (yr !== 'ALL' && r.period !== yr) return false;
        return true;
      });

      // Update table headers based on dimension
      const thRace = document.getElementById('th-demo-race');
      const thGender = document.getElementById('th-demo-gender');
      const thAge = document.getElementById('th-demo-age');
      if (thRace) thRace.style.display = (dim === 'ALL' || dim === 'RACE') ? '' : 'none';
      if (thGender) thGender.style.display = (dim === 'ALL' || dim === 'GENDER') ? '' : 'none';
      if (thAge) thAge.style.display = (dim === 'ALL' || dim === 'AGE') ? '' : 'none';

      tbody.innerHTML = filtered.map(r => {
        const race = r.vote_by_race || {};
        const gender = r.vote_by_gender || {};
        const age = r.vote_by_age || {};
        const pop = r.us_pop_race || {};
        const vShare = r.electorate_share_race || {};

        return `<tr>
          <td>
            <div style="font-size:1.1rem;font-weight:800;color:var(--gold)">${r.period}</div>
            <div style="font-weight:700;font-size:0.88rem;color:#111827">${esc(r.matchup)}</div>
            <div style="font-size:0.8rem;color:var(--muted);margin-top:2px">Winner: <strong>${esc(r.winner)}</strong> (${r.overall.R}% R / ${r.overall.D}% D)</div>
            <div style="font-size:0.78rem;color:#334155;margin-top:4px;max-width:280px">${esc(r.plain_english)}</div>
          </td>
          <td>
            <div style="font-size:0.8rem;line-height:1.45;color:#334155">
              <div><strong>White (NH):</strong> ${pop.white_nh}% pop · ${vShare.white_nh}% voters</div>
              <div><strong>Hispanic:</strong> ${pop.hispanic}% pop · ${vShare.hispanic}% voters</div>
              <div><strong>Black:</strong> ${pop.black}% pop · ${vShare.black}% voters</div>
              <div><strong>Asian/Other:</strong> ${pop.asian_other}% pop · ${vShare.asian_other}% voters</div>
            </div>
          </td>
          ${(dim === 'ALL' || dim === 'RACE') ? `<td>
            <div style="min-width:180px">
              ${renderDualBar(race.white ? race.white.R : null, race.white ? race.white.D : null, 'White Voters')}
              ${renderDualBar(race.hispanic ? race.hispanic.R : null, race.hispanic ? race.hispanic.D : null, 'Hispanic Voters')}
              ${renderDualBar(race.black ? race.black.R : null, race.black ? race.black.D : null, 'Black Voters')}
              ${renderDualBar(race.asian ? race.asian.R : null, race.asian ? race.asian.D : null, 'Asian Voters')}
            </div>
          </td>` : ''}
          ${(dim === 'ALL' || dim === 'GENDER') ? `<td>
            <div style="min-width:170px">
              ${renderDualBar(gender.men ? gender.men.R : null, gender.men ? gender.men.D : null, 'Men')}
              ${renderDualBar(gender.women ? gender.women.R : null, gender.women ? gender.women.D : null, 'Women')}
            </div>
          </td>` : ''}
          ${(dim === 'ALL' || dim === 'AGE') ? `<td>
            <div style="min-width:180px">
              ${renderDualBar(age.age_18_29 ? age.age_18_29.R : null, age.age_18_29 ? age.age_18_29.D : null, 'Age 18–29')}
              ${renderDualBar(age.age_30_44 ? age.age_30_44.R : null, age.age_30_44 ? age.age_30_44.D : null, 'Age 30–44')}
              ${renderDualBar(age.age_45_59 ? age.age_45_59.R : null, age.age_45_59 ? age.age_45_59.D : null, 'Age 45–59')}
              ${renderDualBar(age.age_60_plus ? age.age_60_plus.R : null, age.age_60_plus ? age.age_60_plus.D : null, 'Age 60+')}
            </div>
          </td>` : ''}
        </tr>`;
      }).join('');
    }

    yrFilter.addEventListener('change', applyFilters);
    dimFilter.addEventListener('change', applyFilters);
    applyFilters();
  }

  // =========================================================================
  // 3d. Render Active & Past Bills Impacting American Families + Flowcharts
  // =========================================================================
  function renderFamilyImpactBills() {
    const bills = mods.bills_family_impact || [];
    const members = mods.members || [];
    const pacRecs = mods.money_top25_pac || [];
    const pacCandidateIds = new Set(pacRecs.map(r => r.fec_candidate_id));

    const cardsEl = document.getElementById('family-bills-cards');
    const listSel = document.getElementById('family-list-select');
    const impactSel = document.getElementById('family-impact-select');
    const partySel = document.getElementById('family-party-select');
    const searchIn = document.getElementById('family-bill-search');
    const countEl = document.getElementById('family-bills-count');
    const flowTabs = document.getElementById('family-flow-tabs');
    const flowDisplay = document.getElementById('family-flow-display');
    const stateLookup = document.getElementById('family-state-lookup');
    const stateDelegation = document.getElementById('family-state-delegation');

    if (!cardsEl || !listSel) return;

    // 1. Flowchart Interactive Pipelines
    const FLOWCHARTS = {
      general: [
        { step: "Step 1", title: "Donors & PACs Fund Sponsors", desc: "Corporate PACs, financial institutions, and industry lobbies donate millions to congressional leadership and committee chairs." },
        { step: "Step 2", title: "Bill Written & Introduced", desc: "Sponsors write bill text—often shaping tax brackets, Medicaid match formulas, or bank fee rules to favor top campaign contributors." },
        { step: "Step 3", title: "Roll-Call Party Vote", desc: "House and Senate hold roll-call votes. Most economic & healthcare bills pass on strict or near-strict party lines." },
        { step: "Step 4", title: "Federal Rule Shift", desc: "Statutes take effect: federal funding formulas change, statutory debt rules restart, or regulatory fee caps are wiped out." },
        { step: "Step 5", title: "Your Paycheck & Household", desc: "The impact lands directly on working families: higher healthcare premiums, $35 overdraft fees, tighter food aid, or shifted tax burdens." }
      ],
      healthcare: [
        { step: "Step 1", title: "Medicaid & ACA Funding Cut", desc: "Reconciliation legislation cuts $911B from federal Medicaid over 10 years and lets enhanced ACA premium tax credits expire." },
        { step: "Step 2", title: "State Budgets Strained", desc: "States face sudden multi-billion dollar Medicaid budget holes and respond by imposing monthly paperwork hurdles and eligibility purges." },
        { step: "Step 3", title: "10.9M Americans Lose Coverage", desc: "Nonpartisan CBO & KFF calculate ~10.9 million Americans lose health insurance, while safety-net hospitals face insolvency." },
        { step: "Step 4", title: "Family Premiums & ER Costs Jump", desc: "Working families face $700–$2,400/yr higher marketplace premiums; local emergency rooms close maternity and trauma services." }
      ],
      wallet: [
        { step: "Step 1", title: "$5 Overdraft Cap Overturned", desc: "Congress passes S.J.Res. 18 using the Congressional Review Act to kill the CFPB rule capping bank overdraft fees at $5." },
        { step: "Step 2", title: "Big Banks Keep $35 Fees", desc: "Large banks continue charging $35 overdraft penalties, extracting $5 billion per year from cash-strapped American households." },
        { step: "Step 3", title: "Import Tariffs Raised", desc: "Broad consumer tariffs on food, lumber, autos, and electronics are imposed; importers pass duties directly into retail store prices." },
        { step: "Step 4", title: "Paycheck Purchasing Power Falls", desc: "The typical family pays $1,200–$2,100/yr more at grocery stores, car dealerships, and banks—eroding wage gains." }
      ],
      choose: [
        { step: "Step 1", title: "Read What the Bill Does", desc: "Look past party slogans. Check plain-English, nonpartisan CBO, KFF, and CRS findings on who actually benefits and who pays." },
        { step: "Step 2", title: "Check Who Sponsored It", desc: "Identify which representative or senator put the bill up, what party they belong to, and who their top committee donors are." },
        { step: "Step 3", title: "Look Up Your Own Reps", desc: "Use the state lookup below to see how your 2 U.S. Senators and House Representative voted on these exact family bills." },
        { step: "Step 4", title: "Vote With Real Facts", desc: "Hold lawmakers accountable for their actual roll-call voting record on kitchen-table economics rather than 30-second campaign ads." }
      ]
    };

    function renderFlow(flowKey) {
      if (!flowDisplay) return;
      const nodes = FLOWCHARTS[flowKey] || FLOWCHARTS.general;
      flowDisplay.innerHTML = nodes.map(n => `
        <div class="flow-node">
          <div class="fn-step">${esc(n.step)}</div>
          <div class="fn-title">${esc(n.title)}</div>
          <div class="fn-desc">${esc(n.desc)}</div>
        </div>`).join('');
    }
    renderFlow('general');

    if (flowTabs) {
      flowTabs.querySelectorAll('.flow-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          flowTabs.querySelectorAll('.flow-tab-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          renderFlow(btn.getAttribute('data-flow'));
        });
      });
    }

    // 2. Populate State Lookup
    if (stateLookup) {
      const states = Array.from(new Set(members.map(m => m.geo))).filter(Boolean).sort();
      stateLookup.innerHTML = '<option value="">Select Your State (All 50 States + DC)...</option>' +
        states.map(st => `<option value="${st}">${st} — ${getStateName(st)}</option>`).join('');

      stateLookup.addEventListener('change', () => {
        const st = stateLookup.value;
        if (!st || !stateDelegation) {
          if (stateDelegation) stateDelegation.style.display = 'none';
          return;
        }
        const stMembers = members.filter(m => m.geo === st);
        const sens = stMembers.filter(m => m.chamber === 'Senate');
        const reps = stMembers.filter(m => m.chamber === 'House');

        stateDelegation.style.display = 'block';
        stateDelegation.innerHTML = `
          <div style="background:var(--bg-card);border:1px solid rgba(250,204,21,0.3);border-radius:10px;padding:12px;margin-top:8px">
            <h4 style="color:var(--gold);margin:0 0 8px;font-size:0.95rem">Congressional Delegation for ${getStateName(st)} (${st})</h4>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px">
              ${sens.concat(reps).map(m => {
                const isPacTop25 = m.fec_candidate_ids && m.fec_candidate_ids.some(id => pacCandidateIds.has(id));
                return `
                  <div style="display:flex;gap:10px;align-items:center;background:#fffdf9;border:1px solid var(--border);border-radius:8px;padding:8px 10px">
                    <img src="${esc(m.photo_file || 'assets/members/' + m.bioguide_id + '.jpg')}" loading="lazy" style="width:44px;height:44px;border-radius:50%;object-fit:cover;border:2px solid ${m.party === 'R' ? '#ef4444' : m.party === 'D' ? '#3b82f6' : '#facc15'}" alt="${esc(m.name)}">
                    <div style="flex:1;min-width:0">
                      <div style="font-weight:700;font-size:0.86rem;color:#111827">${esc(m.name)} <span class="chip chip-${m.party}">${m.party}</span></div>
                      <div style="font-size:0.76rem;color:var(--muted)">${esc(m.chamber)} · ${esc(m.geo)}${m.district ? '-' + m.district : ''}</div>
                      ${isPacTop25 ? `<div style="font-size:0.72rem;color:var(--gold);font-weight:700">★ Top 25 Corporate/PAC Money Recipient</div>` : ''}
                    </div>
                    <a class="chip-src" href="${esc(m.official_website || '#')}" target="_blank" rel="noopener" style="font-size:0.72rem">Official ↗</a>
                  </div>`;
              }).join('')}
            </div>
          </div>`;
      });
    }

    function getStateName(code) {
      const names = {
        AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",DE:"Delaware",FL:"Florida",GA:"Georgia",
        HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",
        MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",
        NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",
        SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",DC:"District of Columbia"
      };
      return names[code] || code;
    }

    function renderVoteBar(v, title) {
      if (!v) return `<div style="font-size:0.76rem;color:var(--muted)">${esc(title)}: Pending / No Roll Call</div>`;
      const tot = v.yea + v.nay;
      const rYea = v.R_yea || 0;
      const rNay = v.R_nay || 0;
      const dYea = v.D_yea || 0;
      const dNay = v.D_nay || 0;
      return `
        <div style="margin-top:6px;background:#f8fafc;border-radius:6px;padding:6px 8px;border:1px solid rgba(148,163,184,0.18)">
          <div style="display:flex;justify-content:space-between;font-size:0.76rem;font-weight:700">
            <span>${esc(title)}: <strong style="color:var(--gold)">${v.yea} Yea</strong> to <strong>${v.nay} Nay</strong></span>
          </div>
          <div style="display:flex;gap:12px;font-size:0.73rem;margin-top:3px">
            <span style="color:#ef4444">Republicans: <strong>${rYea} Yes</strong> · ${rNay} No</span>
            <span style="color:#3b82f6">Democrats: <strong>${dYea} Yes</strong> · ${dNay} No</span>
          </div>
        </div>`;
    }

    // 3. Filter & Render Bills Cards
    function applyBillFilters() {
      const listVal = listSel.value;
      const impactVal = impactSel.value;
      const partyVal = partySel.value;
      const q = (searchIn.value || '').trim().toLowerCase();

      const filtered = bills.filter(b => {
        if (listVal === 'active_current' && b.status_type !== 'active_current') return false;
        if (listVal === 'top10_negative' && !b.rank_top10_negative) return false;
        if (listVal === 'top20_household' && !b.rank_top20_household) return false;
        if (impactVal !== 'ALL' && (!b.impact_categories || !b.impact_categories.includes(impactVal))) return false;
        if (partyVal !== 'ALL' && (!b.sponsor || b.sponsor.party !== partyVal)) return false;
        if (q) {
          const str = (b.title + ' ' + b.bill_code + ' ' + b.what_it_is + ' ' + b.family_impact_summary + ' ' + (b.sponsor ? b.sponsor.name : '')).toLowerCase();
          if (!str.includes(q)) return false;
        }
        return true;
      });

      cardsEl.innerHTML = filtered.map(b => {
        const sp = b.sponsor || {};
        const isRelief = b.family_impact_direction === 'household_relief';
        const isMixed = b.family_impact_direction === 'mixed_cost_shift';
        const boxClass = isRelief ? 'impact-box relief' : (isMixed ? 'impact-box mixed' : 'impact-box');

        const flowHtml = (b.flowchart_steps && b.flowchart_steps.length) ? `
          <div style="margin-top:10px">
            <div style="font-size:0.74rem;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:0.04em">4-Step Household Impact Flowchart:</div>
            <div class="mini-flow">
              ${b.flowchart_steps.map(step => `<div class="mini-flow-step">${esc(step)}</div>`).join('')}
            </div>
          </div>` : '';

        return `
          <div class="card ${sp.party === 'R' ? 'rep-card' : (sp.party === 'D' ? 'dem-card' : '')}" style="display:flex;flex-direction:column">
            <div class="card-top">
              <div>
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px">
                  <span class="chip ${b.status_type === 'active_current' ? 'chip-R' : 'chip-src'}" style="font-weight:700">${esc(b.status_badge)}</span>
                  ${b.rank_top10_negative ? `<span class="chip chip-R" style="background:#dc2626;color:#fff">#${b.rank_top10_negative} Negative Impact</span>` : ''}
                  ${b.rank_top20_household ? `<span class="chip chip-src">Top 20 #${b.rank_top20_household}</span>` : ''}
                </div>
                <h3 style="font-size:1.05rem;line-height:1.3;margin:0 0 2px">${esc(b.title)}</h3>
                <span style="font-size:0.78rem;color:var(--gold);font-weight:600">${esc(b.bill_code)}</span>
              </div>
              <div>${partyChip(sp.party, sp.party || 'Bipartisan')}</div>
            </div>

            <div style="font-size:0.8rem;color:var(--muted);margin:4px 0 8px">
              <strong>Who Put It Up:</strong> ${esc(sp.name || 'Bipartisan')} ${sp.party ? partyChip(sp.party, sp.party) : ''} (${esc(sp.state || '')} · ${esc(sp.chamber || '')})
            </div>

            <p style="font-size:0.86rem;color:#334155;line-height:1.42;margin:0 0 8px">
              <strong>What It Does:</strong> ${esc(b.what_it_is)}
            </p>

            <div class="${boxClass}">
              <strong style="display:block;margin-bottom:2px;font-size:0.82rem;color:${isRelief ? '#4ade80' : (isMixed ? '#fde047' : '#f87171')}">
                ${isRelief ? '✓ Direct Family & Household Benefit:' : (isMixed ? '⚡ Shifted Cost / Mixed Impact:' : '⚠️ Direct Family & Household Risk:')}
              </strong>
              ${esc(b.family_impact_summary)}
            </div>

            ${flowHtml}

            <div style="margin-top:auto;padding-top:10px">
              <div style="font-size:0.74rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.04em">How Republicans &amp; Democrats Voted:</div>
              ${renderVoteBar(b.house_vote, 'U.S. House Vote')}
              ${renderVoteBar(b.senate_vote, 'U.S. Senate Vote')}
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:8px;border-top:1px solid rgba(148,163,184,0.18);gap:8px;flex-wrap:wrap">
              <span style="font-size:0.76rem;color:var(--muted)">Source: Library of Congress / CBO</span>
              <div style="display:flex;gap:6px;align-items:center">
                <a class="chip-src" href="https://buy.stripe.com/eVq5kwdlxeTh0H2e8V08g1h" target="_blank" rel="noopener" style="background:#fef3c7;color:#92400e;border-color:#f59e0b;font-weight:700">Unbought Alert Pass ($10/mo) ↗</a>
                <a class="chip-src" href="${esc(b.bill_url || b.source.url)}" target="_blank" rel="noopener">Official Record ↗</a>
              </div>
            </div>
          </div>`;
      }).join('');

      countEl.textContent = `${filtered.length} / ${bills.length} bills & laws`;
    }

    [listSel, impactSel, partySel].forEach(el => el.addEventListener('change', applyBillFilters));
    searchIn.addEventListener('input', applyBillFilters);
    applyBillFilters();
  }

  // =========================================================================
  // 3e. Wire Quick Jump Bar Navigation
  // =========================================================================
  function initQuickJumpBar() {
    document.querySelectorAll('.jump-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabKey = btn.getAttribute('data-goto-tab');
        const targetId = btn.getAttribute('data-goto-id');
        if (!tabKey) return;

        // Switch active tab
        document.querySelectorAll('.tab-btn').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-tab') === tabKey);
        });
        document.querySelectorAll('.section-panel').forEach(p => {
          p.classList.toggle('active', p.id === 'panel-' + tabKey);
        });

        // Smooth scroll to target
        if (targetId) {
          setTimeout(() => {
            const el = document.getElementById(targetId);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 80);
        }
      });
    });
  }

  // 4. Render 539-Member Interactive Congress & Senate Photo Wall
  function initCongressWall() {
    const members = mods.members || [];
    const chSel = document.getElementById('cong-chamber');
    const pSel = document.getElementById('cong-party');
    const gSel = document.getElementById('cong-gender');
    const qInp = document.getElementById('cong-search');
    const wall = document.getElementById('congress-photo-wall');
    const countEl = document.getElementById('cong-filter-count');
    if (!wall) return;

    function renderWall() {
      const ch = chSel ? chSel.value : 'ALL';
      const p = pSel ? pSel.value : 'ALL';
      const g = gSel ? gSel.value : 'ALL';
      const q = (qInp ? qInp.value : '').trim().toLowerCase();

      const filtered = members.filter(m => {
        if (ch !== 'ALL' && m.chamber !== ch) return false;
        if (p !== 'ALL' && m.party !== p) return false;
        if (g !== 'ALL' && (m.gender || 'M') !== g) return false;
        if (q && !(m.name.toLowerCase().includes(q) || m.geo.toLowerCase().includes(q))) return false;
        return true;
      });

      const wCnt = filtered.filter(m => m.gender === 'F').length;
      const mCnt = filtered.length - wCnt;
      const rCnt = filtered.filter(m => m.party === 'R').length;
      const dCnt = filtered.filter(m => m.party === 'D').length;
      if (countEl) {
        countEl.innerHTML = `Showing <strong>${filtered.length}</strong> lawmakers: ` +
          `<span style="color:#be185d"><strong>${wCnt} Women (${filtered.length ? Math.round(wCnt*100/filtered.length) : 0}%)</strong></span> · ` +
          `<strong>${mCnt} Men (${filtered.length ? Math.round(mCnt*100/filtered.length) : 0}%)</strong> &nbsp;|&nbsp; ` +
          `${partyChip('D', dCnt + ' Dem')} ${partyChip('R', rCnt + ' GOP')}`;
      }

      wall.innerHTML = filtered.slice(0, 180).map(m => {
        const bg = m.bioguide_id;
        const isF = m.gender === 'F';
        return `<div class="member-card party-${esc(m.party)}">
          <div class="member-photo-wrap">
            <img src="assets/members/${esc(bg)}.jpg" loading="lazy" alt="${esc(m.name)}">
            <div class="member-badges">
              ${partyChip(m.party, m.party + ' · ' + m.geo)}
              <span class="chip" style="background:${isF ? '#db2777' : '#334155'};color:#fff">${isF ? 'Woman' : 'Man'}</span>
            </div>
          </div>
          <div class="member-body">
            <div style="font-weight:800;font-size:0.92rem">${esc(m.name)}</div>
            <div style="color:var(--muted);font-size:0.76rem">${esc(m.chamber)}${m.district != null ? ' · Dist ' + m.district : ''} · ${esc(m.dc_phone || '')}</div>
            <div class="member-actions">
              ${m.official_website ? `<a href="${esc(m.official_website)}" target="_blank" rel="noopener">Site ↗</a>` : ''}
              ${m.contact_form ? `<a href="${esc(m.contact_form)}" target="_blank" rel="noopener">Contact ↗</a>` : ''}
              ${m.fec_candidate_url ? `<a href="${esc(m.fec_candidate_url)}" target="_blank" rel="noopener">FEC $ ↗</a>` : ''}
            </div>
          </div>
        </div>`;
      }).join('');
    }

    [chSel, pSel, gSel].forEach(el => el && el.addEventListener('change', renderWall));
    if (qInp) qInp.addEventListener('input', renderWall);
    renderWall();
  }

  // 5. Render Laws, Economy, Wars, Unions & Scandals
  function renderOtherPanels() {
    // Laws
    const laws = (mods.laws || []).filter(r => r.id.endsWith('.enacted'));
    const textA = mods.laws_text_a || [];
    const textB = mods.laws_text_b || [];
    const summaryMap = {};
    textA.concat(textB).forEach(r => {
      const prefix = r.id.split('.').slice(0, 2).join('.');
      if (r.id.endsWith('.summary')) summaryMap[prefix] = r;
    });
    const voteMap = {};
    (mods.laws || []).forEach(r => {
      const prefix = r.id.split('.').slice(0, 2).join('.');
      voteMap[prefix] = voteMap[prefix] || {};
      if (r.id.endsWith('.house_vote')) voteMap[prefix].house = r;
      if (r.id.endsWith('.senate_vote')) voteMap[prefix].senate = r;
    });

    const lawsEl = document.getElementById('laws-cards');
    if (lawsEl) {
      lawsEl.innerHTML = laws.map(r => {
        const prefix = r.id.split('.').slice(0, 2).join('.');
        const s = summaryMap[prefix] || {};
        const v = voteMap[prefix] || {};
        const p = (r.party_context && r.party_context.president) || 'R';
        return `<div class="card ${p === 'R' ? 'rep-card' : 'dem-card'}">
          <div class="card-top">
            <div>
              <div style="font-size:0.78rem;color:var(--muted)">Signed ${esc(r.period)}</div>
              <h3 style="font-size:1.05rem">${esc(r.metric.replace('Enactment date and signing president for ', ''))}</h3>
            </div>
            ${partyChip(p, 'Signed by ' + p)}
          </div>
          <p style="font-size:0.88rem;color:#334155">${esc(s.plain_english || r.plain_english)}</p>
          <div style="font-size:0.8rem;color:var(--muted)">
            ${v.house ? `<div><strong>House Vote:</strong> ${esc(v.house.plain_english)}</div>` : ''}
            ${v.senate ? `<div><strong>Senate Vote:</strong> ${esc(v.senate.plain_english)}</div>` : ''}
          </div>
          <div style="margin-top:auto;padding-top:8px">${srcLinks(s.source || r.source)}</div>
        </div>`;
      }).join('');
    }

    // Scandals & Unions + Interactive Federal & State Political Corruption Catalog (1980-2026)
    const catalog = mods.corruption_catalog || [];
    const ccScoreboard = document.getElementById('corruption-scoreboard');
    const ccParty = document.getElementById('cc-party');
    const ccLevel = document.getElementById('cc-level');
    const ccChamber = document.getElementById('cc-chamber');
    const ccCat = document.getElementById('cc-category');
    const ccDecade = document.getElementById('cc-decade');
    const ccStatus = document.getElementById('cc-status');
    const ccSearch = document.getElementById('cc-search');
    const ccCount = document.getElementById('cc-count');
    const ccDrawer = document.getElementById('cc-detail-drawer');
    const ccSplitView = document.getElementById('cc-split-view');
    const ccDemCards = document.getElementById('cc-dem-cards');
    const ccRepCards = document.getElementById('cc-rep-cards');
    const ccDemTitle = document.getElementById('cc-dem-col-title');
    const ccRepTitle = document.getElementById('cc-rep-col-title');
    const ccCardsGrid = document.getElementById('cc-cards-grid');
    const ccTbody = document.getElementById('cc-tbody');

    function renderNewsButtons(r) {
      const links = [];
      if (r.source && r.source.url) {
        links.push(`<a class="chip-src" href="${esc(r.source.url)}" target="_blank" rel="noopener" style="background:#fef3c7;color:#92400e;border:1px solid #f59e0b;font-weight:700" title="${esc(r.source.title || r.source.name || 'Official Docket')}">🏛 Official Docket / Record ↗</a>`);
      }
      (r.secondary_sources || []).forEach((s, idx) => {
        if (!s || !s.url) return;
        const label = idx === 0 ? '📰 Newspaper Article #1 ↗' : (idx === 1 ? '📰 Newspaper Clippings #2 ↗' : `📰 Press Source #${idx + 1} ↗`);
        links.push(`<a class="chip-src" href="${esc(s.url)}" target="_blank" rel="noopener" title="${esc(s.name || 'Newspaper Article')}">${label}</a>`);
      });
      return links.join(' ');
    }

    window.openCorruptionCase = function(caseId) {
      const c = catalog.find(x => x.id === caseId);
      if (!c || !ccDrawer) return;
      const isR = c.party === 'R';
      const borderCol = isR ? '#dc2626' : '#2563eb';
      const newsListHtml = (c.secondary_sources || []).map(s => `
        <li style="margin-bottom:6px">
          <a href="${esc(s.url)}" target="_blank" rel="noopener" style="color:#1d4ed8;font-weight:700;text-decoration:underline">
            📰 ${esc(s.name || s.url)} ↗
          </a>
        </li>`).join('');
      const primaryHtml = (c.source && c.source.url) ? `
        <li style="margin-bottom:6px">
          <a href="${esc(c.source.url)}" target="_blank" rel="noopener" style="color:#92400e;font-weight:800;text-decoration:underline">
            🏛 Official Primary Record: ${esc((c.source.publisher ? c.source.publisher + ' — ' : '') + (c.source.title || c.source.name || c.source.url))} ↗
          </a>
        </li>` : '';

      ccDrawer.style.display = 'block';
      ccDrawer.style.borderColor = borderCol;
      ccDrawer.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;border-bottom:1px solid #e2e8f0;padding-bottom:10px;margin-bottom:12px">
          <div>
            <div style="font-size:0.76rem;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;color:${borderCol}">
              VERIFIED CASE DOSSIER · ${esc(c.level)} LEVEL · ${esc(c.chamber)} · ${esc(c.year)} (${esc(c.decade)})
            </div>
            <h3 style="margin:4px 0;font-size:1.3rem;color:#111827">
              ${esc(c.person)} ${partyChip(c.party, c.party === 'R' ? 'Republican (' + c.state + ')' : 'Democrat (' + c.state + ')')}
            </h3>
            <div style="font-size:0.86rem;color:#475569;font-weight:600">${esc(c.office_title)} · Category: <strong>${esc(c.category)}</strong></div>
          </div>
          <button type="button" onclick="document.getElementById('cc-detail-drawer').style.display='none'" style="background:#111827;color:#fff;border:none;border-radius:6px;padding:6px 12px;font-weight:700;cursor:pointer">✕ Close Case File</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px">
          <div>
            <div style="font-size:0.78rem;font-weight:800;color:#111827;text-transform:uppercase;margin-bottom:4px">Crime, Indictment &amp; Scandal Details</div>
            <p style="font-size:0.92rem;line-height:1.5;color:#1e293b;margin:0 0 10px">${esc(c.crime_summary)}</p>
            <div style="background:#f8fafc;border-left:4px solid ${borderCol};padding:10px 12px;border-radius:6px;font-size:0.86rem;color:#111827">
              <strong>Legal Outcome / Sentence / Penalty:</strong> ${esc(c.sentence_or_penalty || c.outcome_badge)}
            </div>
          </div>
          <div>
            <div style="font-size:0.78rem;font-weight:800;color:#111827;text-transform:uppercase;margin-bottom:6px">Clickable Newspaper Clippings &amp; Official Court/Ethics Dockets</div>
            <ul style="margin:0;padding-left:18px;font-size:0.86rem;line-height:1.45">
              ${primaryHtml}
              ${newsListHtml}
            </ul>
          </div>
        </div>`;
      ccDrawer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    function renderCaseCard(r) {
      const isR = r.party === 'R';
      const firstNews = (r.secondary_sources && r.secondary_sources[0]) ? r.secondary_sources[0] : null;
      return `<div class="card ${isR ? 'rep-card' : 'dem-card'}" style="display:flex;flex-direction:column;cursor:pointer" onclick="if(event.target.tagName!=='A'){window.openCorruptionCase('${esc(r.id)}')}">
        <div class="card-top">
          <div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:4px">
              <span class="chip" style="background:#111827;color:#fff;font-weight:800">${esc(r.year)}</span>
              <span class="chip" style="background:#e2e8f0;color:#111827;font-weight:700">${esc(r.level)} · ${esc(r.chamber)}</span>
              <span class="chip" style="background:#fef3c7;color:#92400e;font-weight:700">${esc(r.category)}</span>
            </div>
            <h3 style="font-size:1.06rem;margin:2px 0">${esc(r.person)} <span style="font-size:0.82rem;color:var(--muted)">(${esc(r.state)})</span></h3>
          </div>
          ${partyChip(r.party, r.party === 'R' ? 'GOP' : 'DEM')}
        </div>
        <div style="font-size:0.79rem;font-weight:800;color:${isR ? '#b91c1c' : '#1d4ed8'};margin:2px 0 6px">
          ⚖ ${esc(r.status)}: ${esc(r.outcome_badge)}
        </div>
        <p style="font-size:0.85rem;color:#334155;line-height:1.42;margin:0 0 10px">${esc(r.crime_summary)}</p>
        ${firstNews ? `<div style="font-size:0.77rem;background:#f8fafc;border:1px solid #d6cfc2;border-radius:6px;padding:6px 8px;margin-bottom:8px">
          <strong>Newspaper Headline:</strong> <a href="${esc(firstNews.url)}" target="_blank" rel="noopener" style="color:#1d4ed8;font-weight:700;text-decoration:underline">${esc(firstNews.name)} ↗</a>
        </div>` : ''}
        <div style="margin-top:auto;padding-top:8px;border-top:1px solid rgba(148,163,184,0.22);display:flex;gap:6px;flex-wrap:wrap;align-items:center;justify-content:space-between">
          <div style="display:flex;gap:5px;flex-wrap:wrap">${renderNewsButtons(r)}</div>
          <button type="button" onclick="event.stopPropagation();window.openCorruptionCase('${esc(r.id)}')" style="background:#111827;color:#fff;border:none;border-radius:5px;padding:4px 9px;font-size:0.74rem;font-weight:700;cursor:pointer">Inspect Full Dossier ➔</button>
        </div>
      </div>`;
    }

    function applyCorruptionFilters() {
      if (!catalog.length) return;
      const pVal = ccParty ? ccParty.value : 'ALL';
      const lVal = ccLevel ? ccLevel.value : 'ALL';
      const chVal = ccChamber ? ccChamber.value : 'ALL';
      const catVal = ccCat ? ccCat.value : 'ALL';
      const decVal = ccDecade ? ccDecade.value : 'ALL';
      const stVal = ccStatus ? ccStatus.value : 'ALL';
      const q = (ccSearch ? ccSearch.value : '').trim().toLowerCase();

      const filtered = catalog.filter(r => {
        if (pVal === 'D' && r.party !== 'D') return false;
        if (pVal === 'R' && r.party !== 'R') return false;
        if (lVal !== 'ALL' && r.level !== lVal) return false;
        if (chVal !== 'ALL' && r.chamber !== chVal) return false;
        if (catVal !== 'ALL' && r.category !== catVal) return false;
        if (decVal !== 'ALL' && r.decade !== decVal) return false;
        if (stVal !== 'ALL' && r.status !== stVal) return false;
        if (q) {
          const hay = `${r.person} ${r.state} ${r.chamber} ${r.office_title} ${r.category} ${r.status} ${r.crime_summary} ${r.sentence_or_penalty} ${r.year}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });

      const dList = filtered.filter(r => r.party === 'D');
      const rList = filtered.filter(r => r.party === 'R');
      const fedList = filtered.filter(r => r.level === 'Federal');
      const stateList = filtered.filter(r => r.level === 'State');
      const sexList = filtered.filter(r => r.category === 'Sexual Misconduct & Abuse');
      const bribList = filtered.filter(r => r.category === 'Bribery & Extortion' || r.category === 'Campaign Finance & Wire Fraud');

      if (ccScoreboard) {
        ccScoreboard.innerHTML = `
          <div class="card" style="border-left:4px solid #3b82f6">
            <div style="font-size:0.74rem;font-weight:800;color:#1d4ed8">DEMOCRATIC PARTY CASES (FILTERED)</div>
            <div style="font-size:1.45rem;font-weight:800;margin:4px 0">${dList.length} <span style="font-size:0.82rem;color:var(--muted)">(${filtered.length ? Math.round(dList.length*100/filtered.length) : 0}% of view)</span></div>
            <div style="font-size:0.8rem;color:#475569">U.S. Senate: <strong>${dList.filter(x=>x.chamber==='U.S. Senate').length}</strong> · U.S. House: <strong>${dList.filter(x=>x.chamber==='U.S. House').length}</strong> · State Level: <strong>${dList.filter(x=>x.level==='State').length}</strong></div>
          </div>
          <div class="card" style="border-left:4px solid #ef4444">
            <div style="font-size:0.74rem;font-weight:800;color:#b91c1c">REPUBLICAN PARTY CASES (FILTERED)</div>
            <div style="font-size:1.45rem;font-weight:800;margin:4px 0">${rList.length} <span style="font-size:0.82rem;color:var(--muted)">(${filtered.length ? Math.round(rList.length*100/filtered.length) : 0}% of view)</span></div>
            <div style="font-size:0.8rem;color:#475569">U.S. Senate: <strong>${rList.filter(x=>x.chamber==='U.S. Senate').length}</strong> · U.S. House: <strong>${rList.filter(x=>x.chamber==='U.S. House').length}</strong> · State Level: <strong>${rList.filter(x=>x.level==='State').length}</strong></div>
          </div>
          <div class="card" style="border-left:4px solid #111827">
            <div style="font-size:0.74rem;font-weight:800;color:#111827">CHAMBER &amp; LEVEL BREAKDOWN</div>
            <div style="font-size:1.45rem;font-weight:800;margin:4px 0">${fedList.length} Federal · ${stateList.length} State</div>
            <div style="font-size:0.8rem;color:#475569">Convicted/Plea: <strong>${filtered.filter(x=>x.status.includes('Convicted')).length}</strong> · Expelled: <strong>${filtered.filter(x=>x.status==='Expelled').length}</strong></div>
          </div>
          <div class="card" style="border-left:4px solid #d97706">
            <div style="font-size:0.74rem;font-weight:800;color:#b45309">FINANCIAL CORRUPTION VS. SEXUAL MISCONDUCT</div>
            <div style="font-size:1.45rem;font-weight:800;margin:4px 0">${bribList.length} Financial · ${sexList.length} Sexual</div>
            <div style="font-size:0.8rem;color:#475569">Every case includes clickable newspaper articles &amp; official court/ethics dockets.</div>
          </div>`;
      }

      if (ccCount) {
        ccCount.textContent = `Showing ${filtered.length} of ${catalog.length} verified cases (${dList.length} D · ${rList.length} R)`;
      }

      if (pVal === 'SPLIT') {
        if (ccSplitView) ccSplitView.style.display = 'grid';
        if (ccCardsGrid) ccCardsGrid.style.display = 'none';
        if (ccDemTitle) ccDemTitle.textContent = `Democratic Party (${dList.length} Cases)`;
        if (ccRepTitle) ccRepTitle.textContent = `Republican Party (${rList.length} Cases)`;
        if (ccDemCards) ccDemCards.innerHTML = dList.map(renderCaseCard).join('');
        if (ccRepCards) ccRepCards.innerHTML = rList.map(renderCaseCard).join('');
      } else {
        if (ccSplitView) ccSplitView.style.display = 'none';
        if (ccCardsGrid) {
          ccCardsGrid.style.display = 'grid';
          ccCardsGrid.innerHTML = filtered.map(renderCaseCard).join('');
        }
      }

      if (ccTbody) {
        ccTbody.innerHTML = filtered.map(r => `<tr style="cursor:pointer" onclick="if(event.target.tagName!=='A'){window.openCorruptionCase('${esc(r.id)}')}">
          <td><strong>${esc(r.year)}</strong><div style="font-size:0.72rem;color:var(--muted)">${esc(r.decade)}</div></td>
          <td><strong>${esc(r.person)}</strong> (${esc(r.state)})<div>${partyChip(r.party, r.party === 'R' ? 'Republican' : 'Democrat')}</div></td>
          <td><strong>${esc(r.chamber)}</strong><div style="font-size:0.75rem;color:var(--muted)">${esc(r.level)} · ${esc(r.office_title)}</div></td>
          <td><span class="chip" style="background:#fef3c7;color:#92400e;font-weight:700">${esc(r.category)}</span></td>
          <td style="font-size:0.82rem"><strong>${esc(r.status)}:</strong> ${esc(r.outcome_badge)}<div style="color:#475569;margin-top:2px">${esc(r.crime_summary)}</div></td>
          <td><div style="display:flex;flex-direction:column;gap:4px">${renderNewsButtons(r)}</div></td>
        </tr>`).join('');
      }
    }

    [ccParty, ccLevel, ccChamber, ccCat, ccDecade, ccStatus].forEach(el => el && el.addEventListener('change', applyCorruptionFilters));
    if (ccSearch) ccSearch.addEventListener('input', applyCorruptionFilters);
    applyCorruptionFilters();

    const scanMajor = mods.scandals_major || [];
    const scanComplete = (mods.scandals || []).concat(mods.scandals_complete || []);
    const scanEl = document.getElementById('scandals-cards');
    if (scanEl) {
      scanEl.innerHTML = scanMajor.concat(scanComplete.slice(0, 30)).map(r => {
        const p = (r.party_context && (r.party_context.party || r.party_context.president)) || (r.plain_english.includes('(R') ? 'R' : 'D');
        return `<div class="card ${p === 'R' ? 'rep-card' : 'dem-card'}">
          <div class="card-top">
            <h3 style="font-size:1rem">${esc(r.metric)}</h3>
            ${partyChip(p, p)}
          </div>
          <p style="font-size:0.86rem;color:#334155">${esc(r.plain_english)}</p>
          <div style="margin-top:auto;padding-top:8px">${srcLinks(r.source)}</div>
        </div>`;
      }).join('');
    }

    // Unions
    const unions = mods.unions || [];
    const unionsEl = document.getElementById('unions-tbody');
    if (unionsEl) {
      unionsEl.innerHTML = unions.slice(0, 80).map(r => `<tr>
        <td><strong>${esc(r.metric)}</strong></td>
        <td>${esc(r.period)}</td>
        <td><strong style="color:var(--gold)">${typeof r.value === 'number' ? '$' + r.value.toLocaleString() : esc(r.value)}</strong></td>
        <td style="font-size:0.84rem">${esc(r.plain_english)}</td>
        <td>${srcLinks(r.source)}</td>
      </tr>`).join('');
    }

    // Macro Ledger: Economy (645), Environment (376), Money (200), Wars (108), Midterms (4), Congress Demographics (8)
    const macroModSel = document.getElementById('macro-mod-select');
    const macroSearch = document.getElementById('macro-search');
    const macroCount = document.getElementById('macro-count');
    const macroTbody = document.getElementById('macro-ledger-tbody');
    const allMacro = [].concat(
      mods.economy || [],
      mods.environment || [],
      mods.money || [],
      mods.wars || [],
      mods.midterm_elections || [],
      mods.congress_demographics || []
    );
    function renderMacroTable() {
      if (!macroTbody) return;
      const mVal = macroModSel ? macroModSel.value : 'ALL';
      const q = (macroSearch ? macroSearch.value : '').trim().toLowerCase();
      const filtered = allMacro.filter(r => {
        if (mVal !== 'ALL' && r.module !== mVal) return false;
        if (q) {
          const hay = `${r.metric || ''} ${r.period || ''} ${r.geo || ''} ${r.plain_english || ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
      if (macroCount) macroCount.textContent = `Showing ${Math.min(100, filtered.length)} of ${filtered.length} verified records`;
      macroTbody.innerHTML = filtered.slice(0, 100).map(r => {
        const p = (r.party_context && r.party_context.president) || 'Divided';
        return `<tr>
          <td><span class="chip" style="background:#fef3c7;color:#78350f;font-weight:700">${esc(r.module)}</span></td>
          <td><strong>${esc(r.metric)}</strong></td>
          <td>${esc(r.period)} · ${partyChip(p, 'Pres: ' + p)}</td>
          <td><strong style="color:var(--gold)">${fmtStateVal(r.value, r.unit)}</strong> <span style="font-size:0.75rem;color:var(--muted)">${esc(humanUnit(r.unit))}</span></td>
          <td style="font-size:0.84rem">${esc(r.plain_english)}</td>
          <td>${srcLinks(r.source)}</td>
        </tr>`;
      }).join('');
    }
    if (macroModSel) macroModSel.addEventListener('change', renderMacroTable);
    if (macroSearch) macroSearch.addEventListener('input', renderMacroTable);
    renderMacroTable();
  }

  // Top 20 News Outlets Media Bias, Scraped Output & Voter-Impact Radar
  function initMediaBiasRadar() {
    const mediaList = (mods.media_bias_top20 || []).slice();
    if (!mediaList.length) return;

    const specCols = document.getElementById('media-spectrum-columns');
    const summaryBadges = document.getElementById('media-summary-badges');
    const mbLean = document.getElementById('mb-lean');
    const mbFormat = document.getElementById('mb-format');
    const mbSort = document.getElementById('mb-sort');
    const mbSearch = document.getElementById('mb-search');
    const mbCount = document.getElementById('mb-count');
    const mbDrawer = document.getElementById('mb-detail-drawer');
    const mbGrid = document.getElementById('mb-cards-grid');
    const mbTbody = document.getElementById('mb-tbody');

    const demCount = mediaList.filter(r => r.party_code === 'D').length;
    const cenCount = mediaList.filter(r => r.party_code === 'C').length;
    const repCount = mediaList.filter(r => r.party_code === 'R').length;
    const totalScraped = mediaList.reduce((acc, r) => acc + ((r.scraped_output && r.scraped_output.scraped_count) || 0), 0);

    if (summaryBadges) {
      summaryBadges.innerHTML = `
        <span style="background:#dbeafe;color:#1e40af;border:1px solid #93c5fd;padding:5px 11px;border-radius:999px;font-size:0.76rem;font-weight:800">🔵 ${demCount} Lean Democrat / Liberal</span>
        <span style="background:#f1f5f9;color:#111827;border:1px solid #d6cfc2;padding:5px 11px;border-radius:999px;font-size:0.76rem;font-weight:800">⚪ ${cenCount} Nonpartisan Center / Wire</span>
        <span style="background:#fee2e2;color:#991b1b;border:1px solid #fca5a5;padding:5px 11px;border-radius:999px;font-size:0.76rem;font-weight:800">🔴 ${repCount} Lean Republican / Conservative</span>
        <span style="background:#fef3c7;color:#92400e;border:1px solid #fcd34d;padding:5px 11px;border-radius:999px;font-size:0.76rem;font-weight:800">⚡ ${totalScraped} Live Output Headlines Scraped</span>
      `;
    }

    function leanBadge(r) {
      if (r.party_code === 'D') {
        return `<span style="background:#dbeafe;color:#1d4ed8;border:1px solid #93c5fd;padding:3px 9px;border-radius:999px;font-size:0.73rem;font-weight:800">🔵 ${esc(r.lean_category)} · ${esc(r.party_alignment)} (${r.lean_score})</span>`;
      }
      if (r.party_code === 'R') {
        return `<span style="background:#fee2e2;color:#b91c1c;border:1px solid #fca5a5;padding:3px 9px;border-radius:999px;font-size:0.73rem;font-weight:800">🔴 ${esc(r.lean_category)} · ${esc(r.party_alignment)} (+${r.lean_score})</span>`;
      }
      return `<span style="background:#f1f5f9;color:#111827;border:1px solid #94a3b8;padding:3px 9px;border-radius:999px;font-size:0.73rem;font-weight:800">⚪ ${esc(r.lean_category)} · Nonpartisan Wire/Broadcaster (${r.lean_score})</span>`;
    }

    function renderSpectrumBar(score) {
      const pct = Math.max(4, Math.min(96, Math.round(((score + 100) / 200) * 100)));
      const dotColor = score <= -15 ? '#1d4ed8' : (score >= 15 ? '#b91c1c' : '#111827');
      return `
        <div style="margin:10px 0 6px">
          <div style="display:flex;justify-content:space-between;font-size:0.7rem;font-weight:700;color:#475569;margin-bottom:3px">
            <span>Left / Dem (-100)</span>
            <span>Center (0)</span>
            <span>Right / GOP (+100)</span>
          </div>
          <div style="position:relative;height:10px;border-radius:999px;background:linear-gradient(90deg,#2563eb 0%,#93c5fd 35%,#e2e8f0 50%,#fca5a5 65%,#dc2626 100%)">
            <div style="position:absolute;left:50%;top:-2px;bottom:-2px;width:2px;background:#334155"></div>
            <div style="position:absolute;left:calc(${pct}% - 7px);top:-3px;width:16px;height:16px;border-radius:50%;background:${dotColor};border:2.5px solid #ffffff;box-shadow:0 2px 5px rgba(0,0,0,0.3)" title="Lean Score: ${score}"></div>
          </div>
        </div>
      `;
    }

    if (specCols) {
      const groups = [
        { code: 'D', title: '🔵 Leans Democrat / Liberal (' + demCount + ')', bg: '#eff6ff', border: '#93c5fd', color: '#1e3a8a' },
        { code: 'C', title: '⚪ Nonpartisan Center / Wire (' + cenCount + ')', bg: '#f8fafc', border: '#d6cfc2', color: '#111827' },
        { code: 'R', title: '🔴 Leans Republican / Conservative (' + repCount + ')', bg: '#fef2f2', border: '#fca5a5', color: '#991b1b' }
      ];
      specCols.innerHTML = groups.map(g => {
        const items = mediaList.filter(r => r.party_code === g.code);
        return `<div style="background:${g.bg};border:1.5px solid ${g.border};border-radius:10px;padding:12px">
          <div style="font-weight:800;font-size:0.84rem;color:${g.color};margin-bottom:8px">${g.title}</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            ${items.map(r => `<button type="button" onclick="window.openMediaOutlet('${esc(r.id)}')" style="background:#ffffff;border:1px solid ${g.border};color:#111827;border-radius:999px;padding:4px 10px;font-size:0.76rem;font-weight:700;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,0.04)">#${r.rank} ${esc(r.name)} <span style="opacity:0.7">(${r.lean_score > 0 ? '+' + r.lean_score : r.lean_score})</span></button>`).join('')}
          </div>
        </div>`;
      }).join('');
    }

    window.openMediaOutlet = function(id) {
      const r = mediaList.find(x => x.id === id);
      if (!r || !mbDrawer) return;
      const headlines = (r.scraped_output && r.scraped_output.sample_headlines) || [];
      const secLinks = (r.secondary_sources || []).map(s => `<a class="src-badge" href="${esc(s.url)}" target="_blank" rel="noopener" style="padding:5px 10px;font-weight:700">🔗 ${esc(s.name)}</a>`).join(' ');
      mbDrawer.style.display = 'block';
      mbDrawer.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;border-bottom:1px solid #d6cfc2;padding-bottom:12px;margin-bottom:14px">
          <div>
            <div style="font-size:0.75rem;font-weight:800;color:#0369a1;text-transform:uppercase">TOP 20 OUTLET DOSSIER · RANK #${r.rank} · ${esc(r.medium)}</div>
            <h3 style="margin:4px 0 6px;font-size:1.35rem;color:#111827">${esc(r.name)}</h3>
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
              ${leanBadge(r)}
              <span style="background:#ecfdf5;color:#065f46;border:1px solid #6ee7b7;padding:3px 9px;border-radius:999px;font-size:0.73rem;font-weight:800">✓ Factual Score: ${r.factual_score}/100 (${esc(r.factual_rating)})</span>
              <span style="font-size:0.76rem;color:#475569"><strong>Owner:</strong> ${esc(r.ownership)} · <strong>HQ:</strong> ${esc(r.hq)}</span>
            </div>
          </div>
          <button type="button" onclick="document.getElementById('mb-detail-drawer').style.display='none'" style="background:#f1f5f9;border:1px solid #94a3b8;border-radius:8px;padding:6px 12px;font-weight:800;cursor:pointer">✕ Close Dossier</button>
        </div>
        ${renderSpectrumBar(r.lean_score)}
        <div class="grid-2" style="gap:14px;margin-top:12px">
          <div style="background:#f8fafc;border:1px solid #d6cfc2;border-radius:10px;padding:14px">
            <div style="font-size:0.74rem;font-weight:800;color:#0369a1;text-transform:uppercase;margin-bottom:4px">PLAIN-ENGLISH SUMMARY</div>
            <p style="margin:0 0 10px;font-size:0.9rem;color:#111827;line-height:1.5">${esc(r.plain_english)}</p>
            <div style="font-size:0.74rem;font-weight:800;color:#b45309;text-transform:uppercase;margin-bottom:4px">HOW THIS OUTLET TRANSLATES CONGRESSIONAL VOTES TO YOUR LIFE</div>
            <p style="margin:0 0 10px;font-size:0.88rem;color:#1e293b;line-height:1.5">${esc(r.voter_impact_translation)}</p>
            <div style="font-size:0.8rem;color:#475569"><strong>Audience Split:</strong> ${esc(r.pew_audience_split)}</div>
            <div style="font-size:0.8rem;color:#991b1b;margin-top:4px"><strong>Blindspot Warning:</strong> ${esc(r.blindspot_warning)}</div>
          </div>
          <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:14px">
            <div style="font-size:0.74rem;font-weight:800;color:#92400e;text-transform:uppercase;margin-bottom:6px">⚡ LIVE SCRAPED OUTPUT HEADLINES (${(r.scraped_output && r.scraped_output.scraped_count) || 0} RECENT STORIES ANALYZED)</div>
            <div style="font-size:0.78rem;color:#475569;margin-bottom:8px"><strong>Framing Signature:</strong> ${esc(r.framing_signature)}</div>
            <ul style="margin:0;padding-left:18px;font-size:0.84rem;color:#111827;line-height:1.45">
              ${headlines.map(h => `<li style="margin-bottom:6px"><a href="${esc(h.url)}" target="_blank" rel="noopener" style="color:#0369a1;font-weight:700;text-decoration:underline">${esc(h.title)}</a> <span style="font-size:0.72rem;color:#64748b">(${esc(h.published)})</span></li>`).join('')}
            </ul>
          </div>
        </div>
        <div style="margin-top:14px;display:flex;flex-wrap:wrap;gap:8px;align-items:center">
          <strong style="font-size:0.78rem;color:#111827">Verify Bias Ratings &amp; Live Newsroom:</strong>
          ${srcLinks(r.source)}
          ${secLinks}
        </div>
      `;
      mbDrawer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    function applyMediaFilters() {
      const leanVal = mbLean ? mbLean.value : 'ALL';
      const fmtVal = mbFormat ? mbFormat.value : 'ALL';
      const sortVal = mbSort ? mbSort.value : 'rank';
      const q = mbSearch ? mbSearch.value.trim().toLowerCase() : '';

      let filtered = mediaList.filter(r => {
        if (leanVal !== 'ALL' && r.party_code !== leanVal) return false;
        if (fmtVal !== 'ALL') {
          const m = (r.medium + ' ' + r.format_badge).toLowerCase();
          if (fmtVal === 'Cable' && !m.includes('cable')) return false;
          if (fmtVal === 'Broadcast' && !(m.includes('broadcast') || m.includes('public tv'))) return false;
          if (fmtVal === 'Print' && !(m.includes('print') || m.includes('magazine') || m.includes('tabloid') || m.includes('investigative'))) return false;
          if (fmtVal === 'Wire' && !m.includes('wire')) return false;
          if (fmtVal === 'Audio' && !(m.includes('radio') || m.includes('audio') || m.includes('podcast'))) return false;
        }
        if (q) {
          const hText = ((r.scraped_output && r.scraped_output.sample_headlines) || []).map(h => h.title).join(' ');
          const hay = (r.name + ' ' + r.medium + ' ' + r.party_alignment + ' ' + r.plain_english + ' ' + r.voter_impact_translation + ' ' + r.framing_signature + ' ' + hText).toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });

      filtered.sort((a, b) => {
        if (sortVal === 'factual') return b.factual_score - a.factual_score;
        if (sortVal === 'left') return a.lean_score - b.lean_score;
        if (sortVal === 'right') return b.lean_score - a.lean_score;
        return a.rank - b.rank;
      });

      if (mbCount) mbCount.textContent = `Showing ${filtered.length} of ${mediaList.length} outlets`;

      if (mbGrid) {
        mbGrid.innerHTML = filtered.map(r => {
          const borderClass = r.party_code === 'R' ? 'rep-card' : (r.party_code === 'D' ? 'dem-card' : 'gold-card');
          const headlines = ((r.scraped_output && r.scraped_output.sample_headlines) || []).slice(0, 2);
          return `<div class="card ${borderClass}" style="cursor:pointer;display:flex;flex-direction:column;justify-content:space-between" onclick="if(event.target.tagName!=='A'){window.openMediaOutlet('${esc(r.id)}')}">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap;margin-bottom:6px">
                <div>
                  <span style="font-size:0.72rem;font-weight:800;color:#475569;text-transform:uppercase">RANK #${r.rank} · ${esc(r.format_badge)}</span>
                  <h3 style="margin:2px 0 4px;font-size:1.15rem;color:#111827">${esc(r.name)}</h3>
                </div>
                <span style="background:#ecfdf5;color:#065f46;border:1px solid #6ee7b7;padding:3px 8px;border-radius:999px;font-size:0.72rem;font-weight:800">Factual: ${r.factual_score}/100</span>
              </div>
              <div style="margin-bottom:6px">${leanBadge(r)}</div>
              ${renderSpectrumBar(r.lean_score)}
              <p style="font-size:0.86rem;color:#1e293b;margin:8px 0;line-height:1.45"><strong>Plain-English Lean:</strong> ${esc(r.plain_english)}</p>
              <div style="background:#f8fafc;border-left:3px solid #0369a1;padding:8px 10px;border-radius:6px;font-size:0.82rem;color:#111827;margin-bottom:8px">
                <strong>How It Impacts Your Vote:</strong> ${esc(r.voter_impact_translation)}
              </div>
              <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:8px 10px;font-size:0.78rem;color:#1e293b">
                <div style="font-weight:800;color:#92400e;margin-bottom:4px">⚡ Live Scraped Output Sample (${(r.scraped_output && r.scraped_output.scraped_count) || 0} articles):</div>
                ${headlines.map(h => `<div style="margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">• <a href="${esc(h.url)}" target="_blank" rel="noopener" style="color:#0369a1;font-weight:600">${esc(h.title)}</a></div>`).join('')}
              </div>
            </div>
            <div style="margin-top:10px;padding-top:8px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
              <span style="font-size:0.74rem;font-weight:800;color:#0369a1">🔍 Click Card for Full Dossier &amp; Blindspots</span>
              <div>${srcLinks(r.source)}</div>
            </div>
          </div>`;
        }).join('');
      }

      if (mbTbody) {
        mbTbody.innerHTML = filtered.map(r => {
          const topHeadline = ((r.scraped_output && r.scraped_output.sample_headlines) || [])[0];
          return `<tr style="cursor:pointer" onclick="if(event.target.tagName!=='A'){window.openMediaOutlet('${esc(r.id)}')}">
            <td><strong>#${r.rank} ${esc(r.name)}</strong><div style="font-size:0.74rem;color:#64748b">${esc(r.ownership)}</div></td>
            <td><span class="chip" style="background:#f1f5f9;color:#111827;font-weight:700">${esc(r.medium)}</span></td>
            <td>${leanBadge(r)}<div style="font-size:0.74rem;color:#475569;margin-top:4px">${esc(r.pew_audience_split)}</div></td>
            <td><strong>${r.factual_score}/100</strong><div style="font-size:0.74rem;color:#475569">AllSides: ${esc(r.allsides_rating)} · Ad Fontes: ${esc(r.ad_fontes_zone)}</div></td>
            <td style="font-size:0.82rem">
              <div style="margin-bottom:4px"><strong>Voter Impact:</strong> ${esc(r.voter_impact_translation)}</div>
              ${topHeadline ? `<div style="font-size:0.76rem;color:#0369a1"><strong>Live Output:</strong> <a href="${esc(topHeadline.url)}" target="_blank" rel="noopener">${esc(topHeadline.title)}</a></div>` : ''}
            </td>
            <td>${srcLinks(r.source)}</td>
          </tr>`;
        }).join('');
      }
    }

    [mbLean, mbFormat, mbSort].forEach(el => el && el.addEventListener('change', applyMediaFilters));
    if (mbSearch) mbSearch.addEventListener('input', applyMediaFilters);
    applyMediaFilters();
  }

  // Global search across all 5,050+ records
  const searchInput = document.getElementById('global-search');
  const searchResults = document.getElementById('global-search-results');
  if (searchInput && searchResults) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      if (q.length < 2) {
        searchResults.style.display = 'none';
        return;
      }
      const hits = [];
      Object.keys(mods).forEach(mName => {
        (mods[mName] || []).forEach(r => {
          const hay = ((r.metric || '') + ' ' + (r.plain_english || '') + ' ' + (r.geo || '') + ' ' + (r.name || '')).toLowerCase();
          if (hay.includes(q)) hits.push(r);
        });
      });
      searchResults.style.display = 'block';
      searchResults.innerHTML = `<div style="margin-bottom:10px;font-weight:700;color:var(--gold)">Found ${hits.length} verified records matching "${esc(q)}" (showing top 24):</div>` +
        `<div class="grid-3">` + hits.slice(0, 24).map(r => `<div class="card gold-card">
          <div style="font-size:0.75rem;color:var(--muted)">Module: ${esc(r.module)} · ${esc(r.period)} · ${esc(r.geo)}</div>
          <div style="font-weight:800">${esc(r.metric)}</div>
          <p style="font-size:0.85rem;color:#334155">${esc(r.plain_english)}</p>
          <div>${srcLinks(r.source)}</div>
        </div>`).join('') + `</div>`;
    });
  }

  renderPresidentsVacation();
  renderSpecialStateTables();
  initFullStateExplorer();
  initCongressWall();
  renderTop25Pac();
  renderVoterDemographics();
  renderFamilyImpactBills();
  initQuickJumpBar();
  renderOtherPanels();
  initMediaBiasRadar();
})();
