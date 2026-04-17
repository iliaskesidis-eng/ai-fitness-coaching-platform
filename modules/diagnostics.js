const Diagnostics = {

  hasDiagnostics(client) {
    const d = client.diagnostics;
    return !!(
      d.forceDecks.cmjHeight   || d.forceDecks.peakPower   ||
      d.nordBord.leftForce     || d.nordBord.rightForce     ||
      d.forceFrame.hipAdduction || d.forceFrame.hipAbduction ||
      d.forceFrame.shoulderIR  || d.forceFrame.shoulderER   ||
      d.smartSpeed.tenMeter    || d.smartSpeed.twentyMeter  ||
      d.dynaMo.romNotes        || d.dynaMo.strengthNotes    ||
      d.vbt.meanVelocity       || d.vbt.velocityLoss
    );
  },

  process(client) {
    if (!this.hasDiagnostics(client)) {
      return {
        available: false,
        flags: [],
        findings: [],
        recommendations: [],
        summary: 'Advanced diagnostic data is not available for this assessment. ' +
          'Where relevant, the following assessments are recommended prior to ' +
          'return-to-sport or high-performance programming: ForceDecks CMJ protocol, ' +
          'NordBord eccentric hamstring assessment, ForceFrame isometric hip and ' +
          'shoulder profile, and SmartSpeed linear acceleration and COD timing.'
      };
    }

    const flags = [];
    const findings = [];
    const recommendations = [];
    const d = client.diagnostics;

    // -----------------------------------------------------------------------
    // ForceDecks
    // -----------------------------------------------------------------------
    if (d.forceDecks.cmjHeight || d.forceDecks.peakPower) {
      const cmjH     = parseFloat(d.forceDecks.cmjHeight);
      const pp       = parseFloat(d.forceDecks.peakPower);
      const asym     = parseFloat(d.forceDecks.asymmetry);
      const brkRFD   = parseFloat(d.forceDecks.brakingRFD);
      const brkImp   = parseFloat(d.forceDecks.brakingImpulse);

      let text = 'ForceDecks CMJ assessment: ';
      if (cmjH) text += `jump height ${cmjH} cm; `;
      if (pp)   text += `peak power ${pp.toLocaleString()} W; `;

      if (asym && asym > 15) {
        flags.push({ device: 'ForceDecks', severity: 'high',
          flag: `CMJ asymmetry ${asym}% — exceeds 15% clinical threshold. Compensatory bilateral strategy present.` });
        text += `FLAGGED: bilateral GRF asymmetry of ${asym}% detected. `;
        recommendations.push(
          'ForceDecks: Address bilateral GRF asymmetry through unilateral plyometric and strength work. ' +
          'Single-leg drop landings, lateral bounds, and split-stance reactive drills before progressing bilateral power.'
        );
      } else if (asym) {
        flags.push({ device: 'ForceDecks', severity: 'low',
          flag: `CMJ asymmetry ${asym}% — within acceptable clinical range.` });
        text += `Asymmetry ${asym}% — within acceptable range. `;
      }

      if (brkRFD) {
        text += `Braking RFD ${brkRFD.toLocaleString()} N/s; `;
        if (brkRFD < 5000) {
          flags.push({ device: 'ForceDecks', severity: 'medium',
            flag: `Braking RFD ${brkRFD} N/s — below threshold for safe high-speed deceleration demands.` });
          recommendations.push(
            'ForceDecks: Low braking RFD indicates deceleration deficit. ' +
            'Eccentric overload, Nordic variations, and progressive deceleration drills are indicated before return to field sport.'
          );
        }
      }

      if (brkImp) text += `Braking impulse ${brkImp} N·s. `;
      findings.push(text.replace(/;\s*$/, '.'));
    }

    // -----------------------------------------------------------------------
    // NordBord
    // -----------------------------------------------------------------------
    if (d.nordBord.leftForce || d.nordBord.rightForce) {
      const left      = parseFloat(d.nordBord.leftForce);
      const right     = parseFloat(d.nordBord.rightForce);
      const imbalance = parseFloat(d.nordBord.imbalance) ||
        (left && right
          ? Math.abs(left - right) / Math.max(left, right) * 100
          : null);

      let text = 'NordBord hamstring assessment: ';
      if (left)  text += `left ${left} N; `;
      if (right) text += `right ${right} N; `;

      if (imbalance != null) {
        const im = parseFloat(imbalance.toFixed(1));
        if (im > 15) {
          flags.push({ device: 'NordBord', severity: 'high',
            flag: `Hamstring side-to-side imbalance ${im}% — exceeds 15% clinical threshold for hamstring strain risk.` });
          text += `FLAGGED: imbalance of ${im}% detected. `;
          recommendations.push(
            `NordBord: Hamstring imbalance of ${im}% requires targeted correction. ` +
            'Nordic curl progression with 1–2 additional sets on the weaker limb per session. ' +
            'Do not progress sprint intensity above 75% until imbalance reduces to below 10%.'
          );
        } else if (im > 10) {
          flags.push({ device: 'NordBord', severity: 'medium',
            flag: `Hamstring imbalance ${im}% — within moderate range; monitor closely.` });
          text += `Imbalance ${im}% — monitor and address. `;
        } else {
          text += `Imbalance ${im}% — acceptable clinical range. `;
        }
      }

      findings.push(text.replace(/;\s*$/, '.'));
    }

    // -----------------------------------------------------------------------
    // ForceFrame
    // -----------------------------------------------------------------------
    if (d.forceFrame.hipAdduction || d.forceFrame.hipAbduction ||
        d.forceFrame.shoulderIR   || d.forceFrame.shoulderER) {
      const hipAdd   = parseFloat(d.forceFrame.hipAdduction);
      const hipAbd   = parseFloat(d.forceFrame.hipAbduction);
      const shldrIR  = parseFloat(d.forceFrame.shoulderIR);
      const shldrER  = parseFloat(d.forceFrame.shoulderER);
      const asym     = parseFloat(d.forceFrame.asymmetry);

      let text = 'ForceFrame isometric profile: ';
      if (hipAdd) text += `hip adduction ${hipAdd} N; `;
      if (hipAbd) text += `hip abduction ${hipAbd} N; `;
      if (shldrIR) text += `shoulder IR ${shldrIR} N; `;
      if (shldrER) text += `shoulder ER ${shldrER} N. `;

      if (shldrIR && shldrER) {
        const erIR = (shldrER / shldrIR) * 100;
        if (erIR < 60) {
          flags.push({ device: 'ForceFrame', severity: 'medium',
            flag: `Shoulder ER:IR ratio ${erIR.toFixed(0)}% — external rotation weakness relative to internal rotation.` });
          recommendations.push(
            `ForceFrame: ER:IR ratio of ${erIR.toFixed(0)}% indicates posterior shoulder deficiency. ` +
            'Band ER, face pulls, and prone Y/T/W patterns required. ' +
            'Do not advance overhead or throwing volume until ratio exceeds 66%.'
          );
        }
      }

      if (hipAdd && hipAbd) {
        const addAbd = (hipAdd / hipAbd) * 100;
        if (addAbd < 75) {
          flags.push({ device: 'ForceFrame', severity: 'medium',
            flag: `Hip adductor:abductor ratio ${addAbd.toFixed(0)}% — relative adductor weakness.` });
          recommendations.push(
            'ForceFrame: Copenhagen adduction progressions and short-lever adductor work required. ' +
            'Relevant for groin load management in cutting and kicking sports.'
          );
        }
      }

      if (asym && asym > 15) {
        flags.push({ device: 'ForceFrame', severity: 'high',
          flag: `Overall isometric asymmetry ${asym}% — bilateral strength imbalance across profile.` });
        recommendations.push(
          'ForceFrame: Bilateral asymmetry across isometric profile requires targeted unilateral correction before advancing primary loading.'
        );
      }

      findings.push(text.replace(/;\s*$/, '.'));
    }

    // -----------------------------------------------------------------------
    // SmartSpeed
    // -----------------------------------------------------------------------
    if (d.smartSpeed.tenMeter || d.smartSpeed.twentyMeter) {
      const t10  = parseFloat(d.smartSpeed.tenMeter);
      const t20  = parseFloat(d.smartSpeed.twentyMeter);
      const cod  = d.smartSpeed.cod;

      let text = 'SmartSpeed timing: ';
      if (t10)  text += `10 m ${t10} s; `;
      if (t20)  text += `20 m ${t20} s; `;
      if (t10 && t20) {
        const split = (t20 - t10).toFixed(2);
        text += `10–20 m split ${split} s (max velocity contribution); `;
      }
      if (cod)  text += `COD: ${cod}. `;

      findings.push(text.replace(/;\s*$/, '.'));
    }

    // -----------------------------------------------------------------------
    // DynaMo
    // -----------------------------------------------------------------------
    if (d.dynaMo.romNotes || d.dynaMo.strengthNotes) {
      let text = 'DynaMo assessment — ';
      if (d.dynaMo.romNotes)      text += `ROM: ${d.dynaMo.romNotes}. `;
      if (d.dynaMo.strengthNotes) text += `Isolated strength: ${d.dynaMo.strengthNotes}.`;
      findings.push(text);
    }

    // -----------------------------------------------------------------------
    // VBT / GymAware
    // -----------------------------------------------------------------------
    if (d.vbt.meanVelocity || d.vbt.velocityLoss || d.vbt.fvNotes) {
      const vel    = parseFloat(d.vbt.meanVelocity);
      const vLoss  = parseFloat(d.vbt.velocityLoss);
      const fvNote = d.vbt.fvNotes;

      let text = 'VBT / GymAware data: ';

      if (vel) {
        text += `mean velocity ${vel} m/s — `;
        if (vel > 1.0)       text += 'speed-strength zone; ';
        else if (vel > 0.75) text += 'strength-speed zone; ';
        else if (vel > 0.5)  text += 'hypertrophy zone; ';
        else                 text += 'maximal strength zone; ';
      }

      if (vLoss) {
        text += `velocity loss ${vLoss}%. `;
        if (vLoss > 25) {
          flags.push({ device: 'VBT', severity: 'medium',
            flag: `Intra-set velocity loss ${vLoss}% — high neuromuscular fatigue accumulation within set.` });
          recommendations.push(
            `VBT: Velocity loss of ${vLoss}% exceeds optimal range for power development. ` +
            'Reduce reps per set or increase inter-set rest. ' +
            'Target <20% loss for power-speed, <30% for hypertrophy-strength.'
          );
        }
      }

      if (fvNote) text += fvNote;
      findings.push(text.replace(/;\s*$/, '.'));
    }

    return {
      available: true,
      flags,
      findings,
      recommendations,
      summary: findings.join('\n\n')
    };
  }
};
