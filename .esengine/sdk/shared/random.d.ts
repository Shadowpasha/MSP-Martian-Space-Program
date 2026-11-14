/**
 * @file    random.ts
 * @brief   A seeded random generator that gives the same numbers on every host.
 *          The generator is SFC32 over 32-bit integer arithmetic only, so a
 *          server, a browser, a mini-game and a phone running the same seed draw
 *          the same sequence — the property shared rules code needs when the
 *          server settles an outcome and the client previews it.
 */
/** A seed: one number, one string, or several of either joined into one. */
type RngSeed = number | string | readonly (number | string)[];
interface Rng {
    /** The next 32 bits as an unsigned integer. */
    nextU32(): number;
    /** A float in [0, 1). */
    float(): number;
    /** An integer in [min, max], both included, without modulo bias. */
    int(min: number, max: number): number;
    /** True with probability `p` (clamped to [0, 1]). */
    chance(p: number): boolean;
    /** One element of a non-empty list. */
    pick<T>(items: readonly T[]): T;
    /** One element chosen by weight; a weight of 0 never wins. */
    weighted<T>(items: readonly T[], weight: (item: T) => number): T;
    /** A shuffled copy; the input is left alone. */
    shuffle<T>(items: readonly T[]): T[];
    /**
     * An independent generator named `label`. It derives from the original seed
     * and the label alone, never from how much this one has drawn, so adding a
     * draw in one place does not move the numbers of another stream.
     */
    fork(label: string | number): Rng;
}
/** A 32-bit hash of a seed, stable across hosts. */
declare function hashSeed(seed: RngSeed): number;
/** A generator that replays the same numbers for the same seed on every host. */
declare function createRng(seed: RngSeed): Rng;

export { createRng, hashSeed };
export type { Rng, RngSeed };
