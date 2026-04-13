import { AVATAR_CONSTANTS, getAvatarConstantNameForDisplayName } from "../../../src/dance/avatarConstants"
import { AVATAR_DOC } from "../../../src/dance/avatarDoc"

describe("avatarConstants", () => {
    it("should generate AVATAR_CONSTANTS correctly from AVATAR_DOC", () => {
        expect(Object.keys(AVATAR_CONSTANTS).length).toBe(AVATAR_DOC.length)

        // Find a known constant
        const michell = AVATAR_DOC.find(move => move.displayName === "Michell")
        expect(michell).toBeDefined()
        if (michell) {
            expect(AVATAR_CONSTANTS["MICHELL"]).toBe(michell.displayName)
            expect(AVATAR_CONSTANTS["MICHELL"]).toBe("Michell")
        }
    })

    it("should return the correct constant name for a valid displayName", () => {
        const result = getAvatarConstantNameForDisplayName("Ninja")
        expect(result).toBe("NINJA")
    })

    it("should return undefined for an invalid displayName", () => {
        const result = getAvatarConstantNameForDisplayName("InvalidAvatarTestxyz")
        expect(result).toBeUndefined()
    })
})
