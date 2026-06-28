const ALL_FEATURES = {
  bold: true,
  italic: true,
  underline: true,
  heading: true,
  lists: true,
  link: true,
  youtube: true,
  divider: true,
};

export const RICH_TEXT_FEATURE_SETS = {
  full: ALL_FEATURES,
  eventDescription: {
    ...ALL_FEATURES,
    heading: false,
    youtube: false,
    divider: false,
  },
  eventReport: {
    ...ALL_FEATURES,
    heading: false,
    divider: false,
  },
};

export function resolveRichTextFeatures(features = 'full') {
  if (typeof features === 'string') {
    return RICH_TEXT_FEATURE_SETS[features] || RICH_TEXT_FEATURE_SETS.full;
  }

  return { ...ALL_FEATURES, ...features };
}
