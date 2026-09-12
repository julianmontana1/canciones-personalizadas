// Mirrors server/plans.js. Kept in sync manually since the client bundle and the
// Express server aren't built from a shared package — the UI needs this table to
// filter duration options and gate video/photo UI before ever hitting the server,
// but the server is the one that actually enforces it.
//
// maxVideoClips = source video clips allowed per video creation.
// maxVideoProjects = independent finished videos a song can have at once.
export const PLANS = {
  solo: {
    key: 'solo',
    label: 'Plan Solo',
    songs: 1,
    price: 20000,
    maxDurationSec: 120,
    hasVideo: false,
    maxPhotos: 0,
    maxVideoClips: 0,
    maxVideoProjects: 0,
    maxUploadBytes: 0
  },
  trio: {
    key: 'trio',
    label: 'Pack 3 Canciones',
    songs: 3,
    price: 50000,
    maxDurationSec: 180,
    hasVideo: true,
    maxPhotos: 3,
    maxVideoClips: 0,
    maxVideoProjects: 1,
    maxUploadBytes: 50 * 1024 * 1024
  },
  quinteto: {
    key: 'quinteto',
    label: 'Pack 5 Canciones',
    songs: 5,
    price: 70000,
    maxDurationSec: 240,
    hasVideo: true,
    maxPhotos: 5,
    maxVideoClips: 5,
    maxVideoProjects: 2,
    maxUploadBytes: 90 * 1024 * 1024
  }
};

export const DEFAULT_PLAN = {
  key: 'custom',
  label: 'Personalizado',
  songs: null,
  price: null,
  maxDurationSec: 300,
  hasVideo: true,
  maxPhotos: 5,
  maxVideoClips: 5,
  maxVideoProjects: 5,
  maxUploadBytes: 90 * 1024 * 1024
};

export const planFor = (planKey) => PLANS[planKey] || DEFAULT_PLAN;
