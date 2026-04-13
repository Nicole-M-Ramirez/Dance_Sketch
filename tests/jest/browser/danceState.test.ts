import danceReducer, { setSearchText, selectSearchText, selectFilteredEntries } from "../../../src/browser/danceState"
import { RootState } from "../../../src/reducers"

jest.mock("../../../src/app/appState", () => ({
    selectScriptLanguage: jest.fn(() => "javascript"),
    selectLocaleCode: jest.fn(() => "en"),
}))

// We need to mock i18next since the slice imports it directly
jest.mock("i18next", () => ({
    t: (key: string) => key,
}))

describe("danceState", () => {
    const initialState = {
        searchText: "",
    }

    it("should return the initial state", () => {
        expect(danceReducer(undefined, { type: "unknown" })).toEqual(initialState)
    })

    it("should handle setSearchText", () => {
        const actual = danceReducer(initialState, setSearchText("hiphop"))
        expect(actual.searchText).toEqual("hiphop")
    })

    it("should select the search text", () => {
        const state = { dance: { searchText: "salsa" } } as RootState
        expect(selectSearchText(state)).toEqual("salsa")
    })

    it("should filter entries based on search text", () => {
        const state = {
            dance: { searchText: "hiphop" },
        } as unknown as RootState

        const filtered = selectFilteredEntries(state)
        
        // Ensure that the filtered entries only contain items matching 'hiphop'
        expect(filtered.length).toBeGreaterThan(0)
        filtered.forEach((entry) => {
            const field = `${entry.name.toLowerCase()}${entry.displayName.toLowerCase()}`
            expect(field).toContain("hiphop")
        })
    })

    it("should return no entries if search text matches nothing", () => {
        const state = {
            dance: { searchText: "invalidrandomsearchterm" },
        } as unknown as RootState

        const filtered = selectFilteredEntries(state)
        expect(filtered.length).toBe(0)
    })
})
