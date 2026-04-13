import avatarReducer, { setSearchText, selectSearchText, selectFilteredEntries } from "../../../src/browser/avatarState"
import { RootState } from "../../../src/reducers"

jest.mock("../../../src/app/appState", () => ({
    selectScriptLanguage: jest.fn(() => "javascript"),
    selectLocaleCode: jest.fn(() => "en"),
}))

jest.mock("i18next", () => ({
    t: (key: string) => key,
}))

describe("avatarState", () => {
    const initialState = {
        searchText: "",
    }

    it("should return the initial state", () => {
        expect(avatarReducer(undefined, { type: "unknown" })).toEqual(initialState)
    })

    it("should handle setSearchText", () => {
        const actual = avatarReducer(initialState, setSearchText("ninja"))
        expect(actual.searchText).toEqual("ninja")
    })

    it("should select the search text", () => {
        const state = { avatar: { searchText: "ninja" } } as RootState
        expect(selectSearchText(state)).toEqual("ninja")
    })

    it("should filter entries based on search text", () => {
        const state = {
            avatar: { searchText: "mich" },
        } as unknown as RootState

        const filtered = selectFilteredEntries(state)
        
        expect(filtered.length).toBeGreaterThan(0)
        filtered.forEach((entry) => {
            const description = entry.descriptionKey || ""
            const field = `${entry.name.toLowerCase()}${entry.displayName.toLowerCase()}${description.toLowerCase()}`
            expect(field).toContain("mich")
        })
    })

    it("should return no entries if search text matches nothing", () => {
        const state = {
            avatar: { searchText: "invalidrandomsearchterm" },
        } as unknown as RootState

        const filtered = selectFilteredEntries(state)
        expect(filtered.length).toBe(0)
    })
})
