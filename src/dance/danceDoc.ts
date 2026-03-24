export interface DanceMove {
    name: string          // e.g. "WAVE_LEFT_ARM"
    displayName: string   // what you show in the UI
    descriptionKey: string
    bodyPart: "upper" | "lower"
    // exampleKey: {
    //     python: string
    //     javascript: string
    // }
}

export const DANCE_DOC: readonly DanceMove[] = [
    {
        name: "HipHop1.fbx",
        displayName: "HipHop1",
        descriptionKey: "dance:moves.HipHop1.description",
        bodyPart: "upper",
        // exampleKey: {
        //     python: "dance:moves.waveLeftArm.example.python",
        //     javascript: "dance:moves.waveLeftArm.example.javascript",
        // },
    },
    {
        name: "HipHop2.fbx",
        displayName: "HipHop2",
        descriptionKey: "dance:moves.HipHop2.description",
         bodyPart: "upper",
        // exampleKey: {
        //     python: "dance:moves.waveLeftArm.example.python",
        //     javascript: "dance:moves.waveLeftArm.example.javascript",
        // },
    },
    {
        name: "HipHop3.fbx",
        displayName: "HipHop3",
        descriptionKey: "dance:moves.HipHop3.description",
        bodyPart: "upper",
        // exampleKey: {
        //     python: "dance:moves.waveLeftArm.example.python",
        //     javascript: "dance:moves.waveLeftArm.example.javascript",
        // },
    },
    {
        name: "HipHop4.fbx",
        displayName: "HipHop4",
        descriptionKey: "dance:moves.HipHop4.description",
        bodyPart: "upper",
        // exampleKey: {
        //     python: "dance:moves.waveLeftArm.example.python",
        //     javascript: "dance:moves.waveLeftArm.example.javascript",
        // },
    },
    {
        name: "HipHop5.fbx",
        displayName: "HipHop5",
        descriptionKey: "dance:moves.HipHop5.description",
        bodyPart: "upper",
        // exampleKey: {
        //     python: "dance:moves.waveLeftArm.example.python",
        //     javascript: "dance:moves.waveLeftArm.example.javascript",
        // },
    },
    {
        name: "HipHop6.fbx",
        displayName: "HipHop6",
        descriptionKey: "dance:moves.HipHop6.description",
        bodyPart: "upper",
        // exampleKey: {
        //     python: "dance:moves.waveLeftArm.example.python",
        //     javascript: "dance:moves.waveLeftArm.example.javascript",
        // },
    },
    {
        name: "HipHop7.fbx",
        displayName: "HipHop7",
        descriptionKey: "dance:moves.HipHop7.description",
        bodyPart: "upper",
        // exampleKey: {
        //     python: "dance:moves.waveLeftArm.example.python",
        //     javascript: "dance:moves.waveLeftArm.example.javascript",
        // },
    },
]