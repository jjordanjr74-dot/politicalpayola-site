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
  renderOtherPanels();
})();
