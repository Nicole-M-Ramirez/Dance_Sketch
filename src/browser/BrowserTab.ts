// ID creation for browser tabs
export const BrowserTabType = {
    Sound: 0,
    Script: 1,
    API: 2,
    DANCE: 3,
    AVATAR: 4,
} as const

export type BrowserTabType = typeof BrowserTabType[keyof typeof BrowserTabType]
