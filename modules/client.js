/**
 * client.js
 * Client data model. Defines the shape of a client record and provides
 * helpers to read from / write to the HTML form.
 */

const Client = {

  // Returns a blank client object with all fields at default values
  createEmpty() {
    return {
      id: null,
      createdAt: null,
      updatedAt: null,

      profile: {
        fullName: '', age: '', sex: '', height: '', weight: '',
        bodyFat: '', restingHR: '', trainingAge: '',
        clientType: '', occupation: '', goals: '', injuryHistory: ''
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
        forceDecks: {
          cmjHeight: '', peakPower: '', asymmetry: '',
          brakingRFD: '', brakingImpulse: ''
        },
        nordBord: { leftForce: '', rightForce: '', imbalance: '' },
        forceFrame: {
          hipAdduction: '', hipAbduction: '',
          shoulderIR: '', shoulderER: '', asymmetry: ''
        },
        smartSpeed: { tenMeter: '', twentyMeter: '', cod: '' },
        dynaMo:     { romNotes: '', strengthNotes: '' },
        vbt:        { meanVelocity: '', velocityLoss: '', fvNotes: '' }
      }
    };
  },

  // Read all form fields into a client object
  fromForm() {
    // TODO: read each input by id and populate the client shape above
    const client = this.createEmpty();
    return client;
  },

  // Populate form fields from a stored client object
  toForm(client) {
    // TODO: set each input value from client fields
  },

  // Return an array of error strings; empty means valid
  validate(client) {
    const errors = [];
    if (!client.profile.fullName)   errors.push('Full name is required');
    if (!client.profile.clientType) errors.push('Client type is required');
    if (!client.profile.goals)      errors.push('Goals field is required');
    return errors;
  }
};
