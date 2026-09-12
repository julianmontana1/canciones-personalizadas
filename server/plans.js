// The 3 customer-facing plans and the real limits each one buys. A code's `plan`
// field points here; everything about what that code's owner can do (duration,
// video access, photo/clip counts) is derived from this table, not hardcoded
// per-endpoint.
//
// Two distinct "video" numbers matter here, and they're easy to conflate:
//   - maxVideoClips: how many raw video clips can be used as SOURCE MATERIAL
//     (alongside photos) inside a single video creation.
//   - maxVideoProjects: how many independent FINISHED videos a customer can
//     have per song at once — regenerating past this cap isn't allowed until
//     an old one expires (see VIDEO_RETENTION_DAYS in index.js).
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

// Codes created before plans existed (or admin's own personal/unlimited codes)
// don't have a recognized `plan` key. They keep a generous, quinteto-like
// allowance instead of suddenly losing access to video.
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

export const planFor = (code) => PLANS[code?.plan] || DEFAULT_PLAN;
