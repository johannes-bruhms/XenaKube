XenaKube should be understood as a blackbox work for hand, cube, cello-body, live score, and architectural space. That is the cleanest formulation. Not “Rubik’s cube controls cello.” Not “Xenakis with a smart cube.” Not “interactive cello system.” Not “real-time score visualizer.” Those are components. The work itself is a dramaturgy of control: the hand manipulates a cube; the cube mutates a musical law; the cello-body tries to remain coherent; the score exposes the mutation; the room may receive the damage. The strongest artistic center is the tension between manual clarity and systemic opacity. A cube turn is visually simple. A right face turns. A top face turns. A sequence happens. But the consequence is not simple, because the cube is not a button grid. It is a state machine. That is the fundamental drama: small, legible physical actions produce increasingly non-obvious musical consequences. The audience should leave with this perceptual understanding: “I could see what he did with his hands, but I could not fully predict what the cube-world would do in response.” That is stronger than mystery for mystery’s sake. The law must be partly intelligible. If the audience cannot perceive any law, the piece becomes arbitrary. If they perceive too much law, it becomes a demonstration. XenaKube needs to live in the middle zone: rule-governed but unstable. The cello-only decision is correct. Do not dilute it. The cello is not merely a sound source; it is the work’s credibility test. Because the SWAM cello can sound punchy, physical, and photorealistic, it gives the system a body that the audience can track. That body can then be stretched, split, displaced, over-articulated, made impossible, or reassembled. If you add too many effects or too many other sound worlds, you remove the thing that lets the audience measure transformation. The question for every section should be: what is the cello’s body right now? At the beginning, it should be a body. Not a cloud. Not a system. Not a spatialized spectacle. A body. A believable cello-like body gives the piece an initial contract with the listener. Then the cube begins to violate that contract. A turn causes a phrase. A similar turn later causes a different phrase. A small algorithm causes a structural reconfiguration. A scramble causes the cello’s attacks, resonances, register, pressure, and spatial image to stop agreeing with each other. A solve attempt tries to make them agree again. That is the real meaning of scramble and solve. Scramble is not “make it busy.” Solve is not “return to consonance.” Scramble means the cello’s identity becomes distributed across state, register, articulation, and room. Solve means the performer attempts to reconstitute a coherent instrumental body. This gives us a better dramaturgical grammar: Turn: local action. State: accumulated consequence. Spell: rule-level intervention. Scramble: loss of bodily coherence. Solve: attempted restoration of coherence. False solve: apparent restoration with a hidden wound. That grammar is much stronger than a feature list. It gives each system layer a dramatic function. 

“Cube-algorithms” is much stronger than “spells.” It keeps the ritual force without tipping into fantasy. I would make them the piece’s **rule-level gestures**.

Ordinary turns should do this:

`turn → state advances → cello phrase`

Cube-algorithms should do this:

`recognized hand-form → interpretation rule changes → later turns mean differently`

That distinction is the whole point. A cube-algorithm should not be a sound effect, not a preset change, not a toggle, and not merely a flourish. It should be a temporary change in the laws by which the cube produces cello-body, score, and space.

The principle:

**The cube-algorithm itself may have a small audible mark, but its real consequence should be what happens after it.**

So a sexy-move can make a small bow-pressure accent when detected. That is fine. But the dramaturgical event is not the accent. The event is: for the next 4–8 turns, the cello-body behaves under a modified rule.

I would organize the cube-algorithms into a small formal grammar:

| Layer | Ordinary turn | Cube-algorithm |
| ----- | ----- | ----- |
| Local action | Produces a phrase | Alters phrase interpretation |
| State | Advances K/C permutation | Rewires relation between K, C, face, sieve, or body |
| Cello-body | Speaks once | Changes how future speech is embodied |
| Score | Draws an event | Marks a formal bracket or rupture |
| Dramaturgy | Continuity | Pivot, wound, stabilization, mirror, false solve |

So the cube-algorithms become **punctuation marks in the law**, not special effects.

For the current set, I would assign each one a distinct dramaturgical operation.

| Cube-algorithm | Dramaturgical role | Proposed operation |
| ----- | ----- | ----- |
| sexy-move | Local eddy / commutator | Creates a short rule-window where the current region repeats, curls, or intensifies without global reset. Good for local pressure. |
| Niklas | Three-cycle displacement | Cycles three sound-complex identities or three residues of the cello-body. Good for destabilizing without chaos. |
| sune | Orientation tilt / bright rotation | Rotates the current behavior upward: register lift, harmonic tendency, bow-position brightness, or sieve rotation. |
| anti-sune | Inverse orientation / dark rotation | Rotates behavior downward or inward: lower register, tasto/wood, reduced brightness, or reverse sieve rotation. |
| oll-cross | Stabilization cross | Locks four related vertices, pitch classes, or register zones into a temporary coherent field. Good for solve attempts. |
| u-perm | Circulation / exchange | Rotates a three-part relation: K positions, C assignments, spatial residues, or score lanes. Good for making state-memory audible. |
| t-perm | Cut / mirror / false solve | Mirrors or swaps the current mapping. Strong formal hinge. Good near climax or ending. |

The important thing is that these are not seven “cool modes.” They are seven **types of structural intervention**.

I would not make all of them equally dramatic. That becomes noisy. I would give them hierarchy:

**Small cube-algorithms:** sexy-move, Niklas.  
 These can happen more often. They perturb locally.

**Medium cube-algorithms:** sune, anti-sune, u-perm.  
 These should noticeably redirect the field.

**Large cube-algorithms:** oll-cross, t-perm.  
 These should be rare. They should feel like formal pillars.

For the piece, I would probably use only three or four cube-algorithms heavily at first:

Sexy-move for local pressure.

Sune / anti-sune for orientation polarity.

OLL-cross for stabilization.

T-perm for cut, mirror, or false solve.

Everything else can exist in the system but does not need to be dramaturgically foregrounded in the first performance.

The mistake to avoid is making each cube-algorithm trigger a different “sound.” That is exactly where it gets corny. Instead, make each cube-algorithm change a relationship.

For example:

Sexy-move should not mean “play a special sexy-move sound.” It should mean: “the current cello-body curls around the current state for the next few turns.”

Sune should not mean “play a harmonic ping.” It should mean: “the current field rotates toward brightness.”

T-perm should not mean “reset palette.” It should mean: “the current law is cut and mirrored.”

This is the difference between a controller and a dramaturgical instrument.

I would implement each cube-algorithm as a time-limited or turn-limited **rule window**, not a permanent toggle.

Example structure:

```
type CubeAlgorithmWindow = {
 name: 'sexy-move' | 'sune' | 'anti-sune' | 'niklas' | 'oll-cross' | 'u-perm' | 't-perm';
 operation: 'eddy' | 'rotate-bright' | 'rotate-dark' | 'cycle3' | 'stabilize-cross' | 'circulate' | 'mirror-cut';
 turnsRemaining: number;
 strength: number;        // 0..1
 affects: Array<'K' | 'C' | 'sieve' | 'register' | 'articulation' | 'space' | 'score'>;
 entryState: EngineSnapshot;
};
```

Then ordinary turns consult the active window:

```
turn + currentState + activeCubeAlgorithmWindow → phrase decision
```

That way the cube-algorithm becomes audible over time, not just at the instant of recognition.

For the cello specifically, I would define five possible rule domains:

**Register relation:** shift, invert, rotate, or constrain register.

**Sound-complex relation:** swap, cycle, freeze, or decouple C\_i from K\_i.

**Gesture integrity:** make attacks/resonances/gliss tails agree or disagree.

**Sieve behavior:** rotate, mirror, thin, thicken, or lock pitch material.

**Body coherence:** make the cello more singular, split, ghosted, or reassembled.

Those are better targets than “reverb on,” “distortion on,” “delay on,” etc.

A strong mapping would be:

| Cube-algorithm | Rule window | Cello-body result |
| ----- | ----- | ----- |
| sexy-move | Local eddy for next 4 turns | The current behavior intensifies locally: denser articulation, tighter register orbit, repeated but altered traces. |
| Niklas | Three-cycle for next 3 turns | Three residues of the cello-body trade places: attack, sustain, and tail stop belonging to one unified gesture. |
| sune | Bright rotation for next 7 turns | Register and bow color rotate upward; harmonics become more likely; sieve rotates toward brighter cells. |
| anti-sune | Dark rotation for next 7 turns | Register and bow color rotate downward/inward; body becomes woodier, lower, less radiant. |
| oll-cross | Cross-lock for next 6 turns | Four anchors stabilize. Gesture families become clearer. Useful during solve. |
| u-perm | Circulation for next 8–12 turns | A three-part cycle is imposed: K/C assignments, score lanes, or spatial residues circulate. |
| t-perm | Mirror-cut, immediate \+ next 4 turns | The system reflects across an axis: register inversion, path reversal, or C/K decoupling. Strong false-solve device. |

For the score, every cube-algorithm should leave a visual trace. Not a giant animation. A score mark.

Something like:

A vertical glyph at the detection moment.

A thin bracket over the next N turns while the rule-window is active.

A small label: `EDDY`, `CYCLE`, `ROTATE`, `CROSS`, `MIRROR`.

Maybe the cube-algorithm name is shown smaller: `sexy-move`, `Niklas`, `T-perm`.

This matters for Score Follower. The viewer needs to see that the cube-algorithm is not just a sound event; it changes the reading conditions for subsequent events.

I would avoid making the public-facing score say “sexy-move” too prominently unless the speedcubing vocabulary is part of the aesthetic you want. Internally, use the names. Publicly, the score could foreground the operation:

`EDDY / sexy-move`

`MIRROR / T-perm`

`CROSS-LOCK / OLL-cross`

That makes it less cute and more legible.

For scramble–solve dramaturgy, I would place the cube-algorithms like this:

Opening: almost none. Let ordinary turns establish the law.

Early scramble: sexy-move and Niklas. Local disturbance.

Middle scramble: sune / anti-sune. Orientation shifts and color/regional pressure.

Maximum pressure: u-perm or t-perm. The system becomes structurally unstable.

Solve attempt: oll-cross. Stabilization begins.

False solve / ending: t-perm. Mirror-cut reveals that apparent coherence still has a wound.

The strongest ending might be a T-perm that appears to restore order visually but leaves the cello-body wrong: one residue, register, or articulation remains displaced. That is a better ending than a big climax.

Implementation-wise, I would not try to perfect all seven immediately. I would build a clean cube-algorithm framework and implement three high-value operations:

1. `sexy-move → EDDY`  
2. `oll-cross → CROSS-LOCK`  
3. `t-perm → MIRROR-CUT`

Those three already give you local perturbation, stabilization, and structural rupture. That is enough for a 10–15 minute study.

Then add sune / anti-sune as polarity operations:

4. `sune → BRIGHT ROTATION`  
5. `anti-sune → DARK ROTATION`

Then later add Niklas and U-perm as more advanced permutation-specific operations.

The design rule I would write at the top of the implementation file:

```
Cube-algorithms do not add effects.
Cube-algorithms alter the interpretation of subsequent turns.
Every cube-algorithm must affect at least one structural relation:
K/C coupling, register, sieve, gesture integrity, body coherence, score marking, or spatial projection.
Every cube-algorithm must be perceptible in the score.
```

That gives you discipline.

So my actual proposal is:

Redesign cube-algorithms as **temporary law-modifiers** with visible score brackets.

Do not use them as toggles.

Do not use them as sound effects.

Do not make all seven equally important.

Use them to articulate the form:

`ordinary turns establish law → local algorithms perturb law → major algorithms fracture law → stabilizing algorithm attempts repair → mirror algorithm produces false solve.`

