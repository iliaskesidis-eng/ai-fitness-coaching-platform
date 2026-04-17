const Client = {

  createEmpty() {
    return {
      id: null,
      createdAt: null,
      updatedAt: null,
      profile: {
        fullName: '', age: '', sex: '', height: '', weight: '',
        bodyFat: '', restingHR: '', trainingAge: '', clientType: '',
        occupation: '', goals: '', injuryHistory: ''
      },
      metrics: {
        squat1RM: '', bench1RM: '', deadlift1RM: '',
        vo2max: '', mileTime: ''
      },
      movement: {
        mobilityRestrictions: '', stabilityDeficits: '',
        coordinationLiteracy: '', painWithMovement: '', balanceNotes: ''
      },
      diagnostics: {
        forceDecks: { cmjHeight: '', peakPower: '', asymmetry: '', brakingRFD: '', brakingImpulse: '' },
        nordBord:   { leftForce: '', rightForce: '', imbalance: '' },
        forceFrame: { hipAdduction: '', hipAbduction: '', shoulderIR: '', shoulderER: '', asymmetry: '' },
        smartSpeed: { tenMeter: '', twentyMeter: '', cod: '' },
        dynaMo:     { romNotes: '', strengthNotes: '' },
        vbt:        { meanVelocity: '', velocityLoss: '', fvNotes: '' }
      }
    };
  },

  fromForm() {
    const g = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
    const c = this.createEmpty();

    c.profile.fullName     = g('fullName');
    c.profile.age          = g('age');
    c.profile.sex          = g('sex');
    c.profile.height       = g('height');
    c.profile.weight       = g('weight');
    c.profile.bodyFat      = g('bodyFat');
    c.profile.restingHR    = g('restingHR');
    c.profile.trainingAge  = g('trainingAge');
    c.profile.clientType   = g('clientType');
    c.profile.occupation   = g('occupation');
    c.profile.goals        = g('goals');
    c.profile.injuryHistory = g('injuryHistory');

    c.metrics.squat1RM    = g('squat1RM');
    c.metrics.bench1RM    = g('bench1RM');
    c.metrics.deadlift1RM = g('deadlift1RM');
    c.metrics.vo2max      = g('vo2max');
    c.metrics.mileTime    = g('mileTime');

    c.movement.mobilityRestrictions = g('mobilityRestrictions');
    c.movement.stabilityDeficits    = g('stabilityDeficits');
    c.movement.coordinationLiteracy = g('coordinationLiteracy');
    c.movement.painWithMovement     = g('painWithMovement');
    c.movement.balanceNotes         = g('balanceNotes');

    c.diagnostics.forceDecks.cmjHeight      = g('cmjHeight');
    c.diagnostics.forceDecks.peakPower      = g('peakPower');
    c.diagnostics.forceDecks.asymmetry      = g('fdAsymmetry');
    c.diagnostics.forceDecks.brakingRFD     = g('brakingRFD');
    c.diagnostics.forceDecks.brakingImpulse = g('brakingImpulse');

    c.diagnostics.nordBord.leftForce  = g('nbLeft');
    c.diagnostics.nordBord.rightForce = g('nbRight');
    c.diagnostics.nordBord.imbalance  = g('nbImbalance');

    c.diagnostics.forceFrame.hipAdduction = g('ffHipAdd');
    c.diagnostics.forceFrame.hipAbduction = g('ffHipAbd');
    c.diagnostics.forceFrame.shoulderIR   = g('ffShoulderIR');
    c.diagnostics.forceFrame.shoulderER   = g('ffShoulderER');
    c.diagnostics.forceFrame.asymmetry    = g('ffAsymmetry');

    c.diagnostics.smartSpeed.tenMeter    = g('ss10m');
    c.diagnostics.smartSpeed.twentyMeter = g('ss20m');
    c.diagnostics.smartSpeed.cod         = g('ssCOD');

    c.diagnostics.dynaMo.romNotes       = g('dynaROM');
    c.diagnostics.dynaMo.strengthNotes  = g('dynaStrength');

    c.diagnostics.vbt.meanVelocity = g('vbtMeanVel');
    c.diagnostics.vbt.velocityLoss = g('vbtVelLoss');
    c.diagnostics.vbt.fvNotes      = g('vbtFVNotes');

    return c;
  },

  toForm(client) {
    const s = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };

    const p = client.profile;
    s('fullName', p.fullName); s('age', p.age); s('sex', p.sex);
    s('height', p.height); s('weight', p.weight); s('bodyFat', p.bodyFat);
    s('restingHR', p.restingHR); s('trainingAge', p.trainingAge);
    s('clientType', p.clientType); s('occupation', p.occupation);
    s('goals', p.goals); s('injuryHistory', p.injuryHistory);

    const m = client.metrics;
    s('squat1RM', m.squat1RM); s('bench1RM', m.bench1RM);
    s('deadlift1RM', m.deadlift1RM); s('vo2max', m.vo2max); s('mileTime', m.mileTime);

    const mv = client.movement;
    s('mobilityRestrictions', mv.mobilityRestrictions);
    s('stabilityDeficits', mv.stabilityDeficits);
    s('coordinationLiteracy', mv.coordinationLiteracy);
    s('painWithMovement', mv.painWithMovement);
    s('balanceNotes', mv.balanceNotes);

    const d = client.diagnostics;
    s('cmjHeight', d.forceDecks.cmjHeight); s('peakPower', d.forceDecks.peakPower);
    s('fdAsymmetry', d.forceDecks.asymmetry); s('brakingRFD', d.forceDecks.brakingRFD);
    s('brakingImpulse', d.forceDecks.brakingImpulse);

    s('nbLeft', d.nordBord.leftForce); s('nbRight', d.nordBord.rightForce);
    s('nbImbalance', d.nordBord.imbalance);

    s('ffHipAdd', d.forceFrame.hipAdduction); s('ffHipAbd', d.forceFrame.hipAbduction);
    s('ffShoulderIR', d.forceFrame.shoulderIR); s('ffShoulderER', d.forceFrame.shoulderER);
    s('ffAsymmetry', d.forceFrame.asymmetry);

    s('ss10m', d.smartSpeed.tenMeter); s('ss20m', d.smartSpeed.twentyMeter);
    s('ssCOD', d.smartSpeed.cod);

    s('dynaROM', d.dynaMo.romNotes); s('dynaStrength', d.dynaMo.strengthNotes);
    s('vbtMeanVel', d.vbt.meanVelocity); s('vbtVelLoss', d.vbt.velocityLoss);
    s('vbtFVNotes', d.vbt.fvNotes);
  },

  validate(client) {
    const e = [];
    if (!client.profile.fullName)  e.push('Full name is required');
    if (!client.profile.clientType) e.push('Client type is required');
    if (!client.profile.goals)     e.push('Goals field is required');
    return e;
  }
};
