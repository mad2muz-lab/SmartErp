export type MobilizationService = {
  id: string;
  name: string;
  description: string;
  provider: string;
};

export const mobilizationServiceCatalogue: MobilizationService[] = [
  { id: 'medical', name: 'Medical examination', description: 'Candidate books and attends an approved medical appointment.', provider: 'CareBridge Medical Services' },
  { id: 'gamca', name: 'GAMCA / Wafid medical', description: 'Country-specific medical processing, when applicable.', provider: 'CareBridge Medical Services' },
  { id: 'attestation', name: 'HRD / document attestation', description: 'Verify and attest the required education documents.', provider: 'Global Document Assist' },
  { id: 'visa-authorization', name: 'Visa authorization / issuance coordination', description: 'Coordinate visa authorization and issuance steps before visa stamping, where required.', provider: 'Global Document Assist' },
  { id: 'translation-legalization', name: 'Document translation and legalization', description: 'Arrange required document translation, notarization, and legalization based on local requirements.', provider: 'Global Document Assist' },
  { id: 'visa', name: 'Visa stamping', description: 'Coordinate visa submission and status updates.', provider: 'Global Document Assist' },
  { id: 'pre-departure-orientation', name: 'Pre-departure orientation', description: 'Share a structured travel briefing, required documents, and arrival contact instructions.', provider: 'Global Document Assist' },
  { id: 'flight', name: 'Flight booking', description: 'Confirm itinerary with candidate and receiving team.', provider: 'SkyRoute Travel' },
  { id: 'airport-transfer', name: 'Airport pickup and transfer', description: 'Arrange airport pickup and transfer to the agreed destination in Saudi Arabia.', provider: 'SkyRoute Travel' },
  { id: 'post-arrival-documents', name: 'Post-arrival documentation follow-up', description: 'Coordinate Saudi-side follow-up for required post-arrival medical, biometrics, and residence/work authorization steps.', provider: 'Global Document Assist' },
];
