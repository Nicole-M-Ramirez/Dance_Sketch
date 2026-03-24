// src/browser/danceState.ts
import { createSlice, createSelector } from "@reduxjs/toolkit"
import i18n from "i18next"

import { AVATAR_DOC } from "../dance/avatarDoc"
import { selectScriptLanguage, selectLocaleCode } from "../app/appState"
import type { RootState } from "../reducers"

const avatarSlice = createSlice({
    name: "avatar",
    initialState: {
        searchText: "",
    },
    reducers: {
        setSearchText(state, { payload }) {
            state.searchText = payload
        },
    },
})

export default avatarSlice.reducer
export const { setSearchText } = avatarSlice.actions

export const selectSearchText = (state: RootState) => state.avatar.searchText

export const selectFilteredEntries = createSelector(
    [selectSearchText, selectScriptLanguage, selectLocaleCode],
    (searchText, _, __) => {
        const term = searchText.toLowerCase()
        return AVATAR_DOC.filter(move => {
            // Avatar docs currently define name/displayName only.
            // Keep search resilient if a localized description key is added later.
            const description = i18n.t((move as { descriptionKey?: string }).descriptionKey ?? "").toLowerCase()
            const field = `${move.name.toLowerCase()}${move.displayName.toLowerCase()}${description}`
            return field.includes(term)
        })
    }
)
