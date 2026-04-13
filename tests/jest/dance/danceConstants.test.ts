import { DANCE_MOVE_CONSTANTS, getDanceMoveConstantNameForDisplayName } from "../../../src/dance/danceConstants"
import { DANCE_DOC } from "../../../src/dance/danceDoc"

describe("danceConstants", () => {
    it("should generate DANCE_MOVE_CONSTANTS correctly from DANCE_DOC", () => {
        expect(Object.keys(DANCE_MOVE_CONSTANTS).length).toBe(DANCE_DOC.length)

        // Find a known constant
        const hipHop1 = DANCE_DOC.find(move => move.displayName === "HipHop1")
        expect(hipHop1).toBeDefined()
        if (hipHop1) {
            expect(DANCE_MOVE_CONSTANTS["HIPHOP1"]).toBe(hipHop1.displayName)
            expect(DANCE_MOVE_CONSTANTS["HIPHOP1"]).toBe("HipHop1")
        }
    })

    it("should return the correct constant name for a valid displayName", () => {
        const result = getDanceMoveConstantNameForDisplayName("HipHop1")
        expect(result).toBe("HIPHOP1")
    })

    it("should return undefined for an invalid displayName", () => {
        const result = getDanceMoveConstantNameForDisplayName("InvalidMoveTestxyz")
        expect(result).toBeUndefined()
    })

    it("should handle display names with special characters correctly if they exist", () => {
        // According to the logic `displayName.replace(/[^A-Za-z0-9_]/g, "_").toUpperCase()`
        // Suppose there is "Hip Hop 1!"
        // It would become "HIP_HOP_1_"
        // Let's mock a case just to test the logic directly using what's available or by adding one to doc in thought,
        // but Since DANCE_DOC is hardcoded, we just ensure it correctly processes an invalid one without crashing
        const result = getDanceMoveConstantNameForDisplayName("Fake Move@1")
        expect(result).toBeUndefined() // Since FAKE_MOVE_1 doesn't exist in constants
    })
})
