export interface Avatars {
    name: string          // e.g. "WAVE_LEFT_ARM"
    displayName: string   // what you show in the UI
    descriptionKey?: string
    // exampleKey: {
    //     python: string
    //     javascript: string
    // }
}

export const AVATAR_DOC: readonly Avatars[] = [
    {
        name: "Michell.fbx",
        displayName: "Michell",
       
    },
    {
        name: "Ninja.fbx",
        displayName: "Ninja",
    },
]