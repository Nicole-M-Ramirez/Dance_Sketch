import { DANCE_DOC } from "./danceDoc"

function toDanceMoveConstantKey(displayName: string): string {
    // Keep it predictable and JS/Python-identifier-safe.
    // Example: "HipHop1" -> "HIPHOP1"
    return displayName.replace(/[^A-Za-z0-9_]/g, "_").toUpperCase()
}

// Map CONSTANT_NAME -> displayName string used at runtime (e.g. "HipHop1").
export const DANCE_MOVE_CONSTANTS = Object.freeze(
    Object.fromEntries(
        DANCE_DOC.map((m) => [toDanceMoveConstantKey(m.displayName), m.displayName])
    ) as Record<string, string>
)

export type DanceMoveConstantName = keyof typeof DANCE_MOVE_CONSTANTS
export type DanceMoveConstantValue = (typeof DANCE_MOVE_CONSTANTS)[DanceMoveConstantName]

export function getDanceMoveConstantNameForDisplayName(displayName: string): string | undefined {
    const key = toDanceMoveConstantKey(displayName)
    return Object.prototype.hasOwnProperty.call(DANCE_MOVE_CONSTANTS, key) ? key : undefined
}
