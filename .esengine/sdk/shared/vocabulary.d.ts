/**
 * @file  vocabulary.ts — the names authored content uses to reach gameplay.
 *
 * Strings, and its own module because of who reads them: an AnimatorController
 * asset names the parameters, an input map names the keys, and an event binding
 * names the combat events — none of which needs a controller, a health bar or a
 * melee solver. These stay on `esengine`; the runtime behind them is
 * `esengine/gameplay`.
 */
/**
 * Animator parameters a controller writes, and the triggers it sets. Names, not
 * clips — and shared with the hunter, so one graph drives a player and an enemy
 * and neither can drift into a private vocabulary.
 */
declare const TPC_SPEED = "speed";
declare const TPC_GROUNDED = "grounded";
/** Set the frame a jump was ACCEPTED, not the frame one was asked for. */
declare const TPC_JUMP = "jump";
declare const TPC_DODGE = "dodge";
declare const TPC_ATTACK = "attack";
/** The key a dodge is asked for on; the animator decides whether there is one. */
declare const DODGE_KEY = "ShiftLeft";
/** The key an attack is asked for on. Same rule: a request, not a clip name. */
declare const ATTACK_KEY = "KeyJ";
/**
 * The events a clip declares that melee reads. Names rather than times: a state
 * that re-times its swing re-times the hit, and nothing else has to be told.
 */
declare const COMBAT_ATTACK_START = "attack-start";
declare const COMBAT_HIT = "hit";
declare const COMBAT_ATTACK_END = "attack-end";

export { ATTACK_KEY, COMBAT_ATTACK_END, COMBAT_ATTACK_START, COMBAT_HIT, DODGE_KEY, TPC_ATTACK, TPC_DODGE, TPC_GROUNDED, TPC_JUMP, TPC_SPEED };
