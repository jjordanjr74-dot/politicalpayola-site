(function() {
  const D = window.PAYOLA_DATA || { modules: {}, state_party: [], party_control: [] };
  const mods = D.modules || {};
  const spMap = {};
  (D.state_party || []).forEach(r => { spMap[r.geo] = r; });

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function partyChip(p, label) {
    const k = (p === 'R' || p === 'Republican') ? 'R' : (p === 'D' || p === 'Democrat') ? 'D' : 'Divided';
    return `<span class="chip chip-${k}">${esc(label || p || 'N/A')}</span>`;
  }

  function srcLinks(src) {
    if (!src) return '';
    let html = `<a class="chip-src" href="${esc(src.url)}" target="_blank" rel="noopener">Primary: ${esc((src.publisher || 'Source').slice(0, 38))} ↗</a>`;
    if (Array.isArray(src.secondary_sources)) {
      src.secondary_sources.slice(0, 2).forEach((u, idx) => {
        try {
          const h = new URL(u).hostname.replace(/^www\./, '');
          html += ` <a class="chip-src" href="${esc(u)}" target="_blank" rel="noopener">Cross-Check #${idx+2}: ${esc(h)} ↗</a>`;
        } catch (e) {}
      });
    }
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
        <p style="font-size:0.88rem;color:#cbd5e1">${esc(r.plain_english)}</p>
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

  // 3. Render Full 50-State Explorer Across All State Modules
  function initFullStateExplorer() {
    const allStateRecs = [].concat(
      mods.states || [],
      mods.states_crime || [],
      mods.states_fiscal || [],
      mods.states_health_env || [],
      mods.states_more || []
    ).filter(r => r.geo && r.geo.length === 2 && r.geo !== 'US' && r.geo !== 'DC' && typeof r.value === 'number');

    const metrics = Array.from(new Set(allStateRecs.map(r => r.metric))).sort();
    const sel = document.getElementById('state-metric-select');
    const tbody = document.getElementById('state-explorer-tbody');
    const summaryEl = document.getElementById('state-correlation-summary');
    if (!sel || !tbody) return;

    sel.innerHTML = metrics.map(m => `<option value="${esc(m)}">${esc(m)}</option>`).join('');

    function updateTable() {
      const m = sel.value;
      const rows = allStateRecs.filter(r => r.metric === m).sort((a,b) => b.value - a.value);
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
        summaryEl.innerHTML = `<strong>Top-10 Party Breakdown for "${esc(m)}":</strong> ` +
          `${partyChip('R', rCnt + ' Republican Trifectas')} · ${partyChip('D', dCnt + ' Democratic Trifectas')} · ${partyChip('Divided', divCnt + ' Divided States')} ` +
          `&nbsp;|&nbsp; <strong>2024 Presidential Vote of Top 10:</strong> <span style="color:#fca5a5">${r24} Trump (R)</span> vs. <span style="color:#93c5fd">${d24} Harris (D)</span>`;
      }
      tbody.innerHTML = rows.map((r, idx) => {
        const sp = spMap[r.geo] || {};
        return `<tr>
          <td><strong>#${idx + 1}</strong></td>
          <td><strong>${esc(r.geo)}</strong></td>
          <td>${partyChip(sp.state_control || 'R', 'State: ' + (sp.state_control || '?'))} ${partyChip(sp.presidential_2024_winner || 'R', '2024: ' + (sp.presidential_2024_winner || '?'))}</td>
          <td><strong style="color:var(--gold)">${r.value}</strong> <span style="color:var(--muted)">${esc(r.unit)}</span></td>
          <td>${esc(r.period)}</td>
          <td style="font-size:0.84rem">${esc(r.plain_english)}</td>
          <td>${srcLinks(r.source)}</td>
        </tr>`;
      }).join('');
    }
    sel.addEventListener('change', updateTable);
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
            <div style="font-weight:700;font-size:0.88rem;color:#f8fafc">${esc(r.matchup)}</div>
            <div style="font-size:0.8rem;color:var(--muted);margin-top:2px">Winner: <strong>${esc(r.winner)}</strong> (${r.overall.R}% R / ${r.overall.D}% D)</div>
            <div style="font-size:0.78rem;color:#cbd5e1;margin-top:4px;max-width:280px">${esc(r.plain_english)}</div>
          </td>
          <td>
            <div style="font-size:0.8rem;line-height:1.45;color:#cbd5e1">
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
                  <div style="display:flex;gap:10px;align-items:center;background:rgba(15,23,42,0.8);border:1px solid var(--border);border-radius:8px;padding:8px 10px">
                    <img src="${esc(m.photo_file || 'assets/members/' + m.bioguide_id + '.jpg')}" loading="lazy" style="width:44px;height:44px;border-radius:50%;object-fit:cover;border:2px solid ${m.party === 'R' ? '#ef4444' : m.party === 'D' ? '#3b82f6' : '#facc15'}" alt="${esc(m.name)}">
                    <div style="flex:1;min-width:0">
                      <div style="font-weight:700;font-size:0.86rem;color:#f8fafc">${esc(m.name)} <span class="chip chip-${m.party}">${m.party}</span></div>
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
        <div style="margin-top:6px;background:rgba(15,23,42,0.7);border-radius:6px;padding:6px 8px;border:1px solid rgba(148,163,184,0.18)">
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

            <p style="font-size:0.86rem;color:#cbd5e1;line-height:1.42;margin:0 0 8px">
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
          `<span style="color:#f472b6"><strong>${wCnt} Women (${filtered.length ? Math.round(wCnt*100/filtered.length) : 0}%)</strong></span> · ` +
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
            <a href="https://buy.stripe.com/dRm5kwepBeThdtOd4R08g1i" target="_blank" rel="noopener" style="margin-top:4px;display:block;text-align:center;padding:5px 8px;border-radius:4px;background:#fef3c7;color:#92400e;border:1px solid #f59e0b;font-size:0.71rem;font-weight:800;text-decoration:none">★ Oppo Brief &amp; CSV ($99/mo)</a>
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
          <p style="font-size:0.88rem;color:#e2e8f0">${esc(s.plain_english || r.plain_english)}</p>
          <div style="font-size:0.8rem;color:var(--muted)">
            ${v.house ? `<div><strong>House Vote:</strong> ${esc(v.house.plain_english)}</div>` : ''}
            ${v.senate ? `<div><strong>Senate Vote:</strong> ${esc(v.senate.plain_english)}</div>` : ''}
          </div>
          <div style="margin-top:auto;padding-top:8px">${srcLinks(s.source || r.source)}</div>
        </div>`;
      }).join('');
    }

    // Scandals & Unions
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
          <p style="font-size:0.86rem;color:#cbd5e1">${esc(r.plain_english)}</p>
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
          <p style="font-size:0.85rem;color:#cbd5e1">${esc(r.plain_english)}</p>
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
})();
