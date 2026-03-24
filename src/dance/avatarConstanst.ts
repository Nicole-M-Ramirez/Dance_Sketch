import { AVATAR_DOC } from "./avatarDoc"

function toAvatarConstantKey(displayName: string): string {
    // Keep it predictable and JS/Python-identifier-safe.
    // Example: "HipHop1" -> "HIPHOP1"
    return displayName.replace(/[^A-Za-z0-9_]/g, "_").toUpperCase()
}

// Map CONSTANT_NAME -> displayName string used at runtime (e.g. "HipHop1").
export const AVATAR_CONSTANTS = Object.freeze(
    Object.fromEntries(
        AVATAR_DOC.map((m) => [toAvatarConstantKey(m.displayName), m.displayName])
    ) as Record<string, string>
)

export type AvatarConstantName = keyof typeof AVATAR_CONSTANTS
export type AvatarConstantValue = (typeof AVATAR_CONSTANTS)[AvatarConstantName]

export function getAvatarConstantNameForDisplayName(displayName: string): string | undefined {
    const key = toAvatarConstantKey(displayName)
    return Object.prototype.hasOwnProperty.call(AVATAR_CONSTANTS, key) ? key : undefined
}


