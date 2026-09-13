/** Every colour the game draws. Nothing else should hard-code a hex value. */
/**
 * Daylight marina palette.
 *
 * The scene used to be a dark navy harbour at night, which made everything on
 * it low-contrast. This is the bright version: pale concrete road, tan edge
 * lines, light blue-grey water and olive banks, with the cars carrying the only
 * saturated colour on screen so traffic reads instantly against the surface.
 */
export const COLORS = {
  water: '#9DB5C0',
  waterDeep: '#8FA9B6',
  waterLine: 'rgba(255,255,255,0.14)',
  land: '#C6CE7E',
  landLight: '#D4DA92',
  landDark: '#A8B265',
  rock: '#7C7C74',

  roadShadow: 'rgba(70,78,84,0.30)',
  roadEdge: '#B9B9B1',
  /** Tan lines run along both sides of the road, as on the original circuit. */
  /**
   * The kerb is stone, not paint.
   *
   * It was '#E3C25E', a saturated gold, and on a board of grey concrete and
   * grey-blue water it was the only saturated thing in the frame — so it stopped
   * reading as part of the deck and started reading as a highlighter line drawn
   * around the circuit. What tells you a kerb is there should be that it stands
   * up: it has a side face where it turns away from the camera and a bright
   * arris where it turns into the light. Colour was doing a job that height and
   * lighting do better.
   */
  curbLight: '#CFCABC',
  curbRed: '#B9B2A0',
  road: '#D9D9D2',
  /** Every other lane, so the channels read without dashed dividers. */
  roadAlt: '#C4C4BC',
  roadHighlight: 'rgba(255,255,255,0.18)',
  lane: 'rgba(255,255,255,0.7)',

  player: '#E8452F',
  playerLight: '#FF7A5E',
  playerStripe: '#FFF4D8',
  window: '#BFEAF2',
  ai: '#2C6EA8',
  aiLight: '#4FA8DC',
  aiWindow: '#BEE9F7',

  text: '#F7F4EA',
  muted: 'rgba(247,244,234,0.66)',
  accent: '#2BB6C4',
  accentLight: '#8FF0FA',
  button: 'rgba(8,17,25,0.82)',
  buttonActive: 'rgba(87,213,203,0.30)',
  buttonDisabled: 'rgba(8,17,25,0.42)',
  buttonEdge: 'rgba(247,244,234,0.28)'
} as const;

/**
 * Menu and result-screen palette.
 *
 * The race keeps its muted marine look, but the screens around it are built the
 * way the popular WeChat casual games are: cream cards on a saturated ground,
 * heavy dark outlines, hard offset shadows instead of blurs, and one loud warm
 * colour reserved for the primary action.
 */
export const UI = {
  ground: '#12384E',
  groundDeep: '#0A2233',
  groundStripe: 'rgba(255,255,255,0.028)',
  card: '#FFF6E4',
  cardAlt: '#FFEDCC',
  ink: '#22323F',
  inkSoft: '#6C7C88',
  outline: '#152532',
  primary: '#FFB43C',
  primaryDeep: '#E38C15',
  good: '#5FCF80',
  bad: '#FF6B5E',
  chip: '#1B3F55'
} as const;
