// src/browser/danceState.ts
import { createSlice, createSelector } from "@reduxjs/toolkit"
import i18n from "i18next"

import { DANCE_DOC } from "../dance/danceDoc"   // NEW
import { selectScriptLanguage, selectLocaleCode } from "../app/appState"
import type { RootState } from "../reducers"

const danceSlice = createSlice({
    name: "dance",
    initialState: {
        searchText: "",
    },
    reducers: {
        setSearchText(state, { payload }) {
            state.searchText = payload
        },
    },
})

export default danceSlice.reducer
export const { setSearchText } = danceSlice.actions

export const selectSearchText = (state: RootState) => state.dance.searchText

export const selectFilteredEntries = createSelector(
    [selectSearchText, selectScriptLanguage, selectLocaleCode],
    (searchText, language, _) => {
        const term = searchText.toLowerCase()
        return DANCE_DOC.filter(move => {
            const description = i18n.t(move.descriptionKey).toLowerCase()
            const field = `${move.name.toLowerCase()}${move.displayName.toLowerCase()}${description}`
            return field.includes(term)
        })
    }
)