
import React, { useEffect, useRef, useState, ChangeEvent  } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useTranslation } from "react-i18next"

import { BrowserTabType } from "./BrowserTab"
import * as dance from "./danceState"
//import type { APIItem, APIParameter } from "../api/api"
import { selectScriptLanguage } from "../app/appState"

import { SearchBar } from "./Utils"
import * as editor from "../ide/Editor"
import * as tabs from "../ide/tabState"
import * as cai from "../cai/caiState"
import { addUIClick } from "../cai/dialogue/student"
import { highlight } from "../ide/highlight"
import { Language } from "common"

import * as THREE from "three"
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js"
import * as daw from "../daw/dawState"

interface DANCEParameter {
    typeKey: string
    descriptionKey: string
    default?: string
}

import type { DanceMove } from "../dance/danceDoc"

type DANCEItem = DanceMove

const Code = ({ source, language }: { source: string, language: Language }) => {
    const { light, dark } = highlight(source, language)
    return <>
        <code className={language + " whitespace-pre overflow-x-auto block dark:hidden"}>
            {light}
        </code>
        <code className={language + " whitespace-pre overflow-x-auto hidden dark:block"}>
            {dark}
        </code>
    </>
}

// Hack from https://stackoverflow.com/questions/46240647/react-how-to-force-a-function-component-to-render
// TODO: Get rid of this by moving obj.details into Redux state.
function useForceUpdate() {
    const [_, setValue] = useState(0) // integer state
    return () => setValue(value => ++value) // update the state to force render
}

const paste = (name: string, obj: DANCEItem) => {
    // const args: string[] = []
    // for (const param in obj.parameters) {
    //     args.push(param)
    // }

    editor.pasteCode(`"${name}"`)
}

const fixValue = (language: Language, value: string) => language !== "python" && ["True", "False"].includes(value) ? value.toLowerCase() : value

const AnimationPreview = ({ name }: { name: string }) => {
    const FBX_BASE = "/MixamoAnimations"
    const AVATAR_FBX_NAME = "Avatar.fbx"
    const base = name.endsWith(".fbx") ? name : `${name}.fbx`
    function fbxUrl(name: string): string {
        const base = name.endsWith(".fbx") ? name : `${name}.fbx`
        return `${FBX_BASE}/${base}`
    }

    const containerRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<THREE.Scene | null>(null)
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
    const clockRef = useRef(new THREE.Clock())
    const avatar = useSelector(daw.selectAvatar)
    const avatarFbxName = avatar?.fbxName || AVATAR_FBX_NAME
    const avatarRef = useRef<THREE.Object3D | null>(null)
    const [avatarReady, setAvatarReady] = useState(false)
    const animFrameRef = useRef<number>(0)
    const currentActionRef = useRef<THREE.AnimationAction | null>(null)
    const clipCacheRef = useRef<Record<string, THREE.AnimationClip | null>>({})

    const mixerRef = useRef<THREE.AnimationMixer | null>(null)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        //setAvatarReady(false)

        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0xB8E8F5)
        sceneRef.current = scene

        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000)
        camera.position.set(0, 1.2, 2.8)
        camera.lookAt(0, 1, 0)
        cameraRef.current = camera

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        renderer.setSize(200, 300)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.outputColorSpace = THREE.SRGBColorSpace
        container.appendChild(renderer.domElement)
        rendererRef.current = renderer

        const ambient = new THREE.AmbientLight(0xffffff, 4)
        scene.add(ambient)
        const dir = new THREE.DirectionalLight(0xffffff, 0.8)
        dir.position.set(2, 5, 3)
        scene.add(dir)

        const avatarLoader = new FBXLoader()
        avatarLoader.load(
            fbxUrl(avatarFbxName),
            (fbx) => {
                fbx.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = true
                        child.receiveShadow = true
                    }
                })
                const scale = 0.01
                fbx.scale.setScalar(scale)
                fbx.position.set(0, 0, 0)

                scene.add(fbx)
                avatarRef.current = fbx

                const mixer = new THREE.AnimationMixer(fbx)
                mixerRef.current = mixer
                setAvatarReady(true)

                
                // mixer.timeScale = speed
            },
            undefined,
            (err) => {
                console.error("FBX avatar load error:", err)
            }
        )

        const animate = () => {
            animFrameRef.current = requestAnimationFrame(animate)
            const delta = clockRef.current.getDelta()
            if (mixerRef.current) mixerRef.current.update(delta)
            renderer.render(scene, camera)
        }
        animate()

        return () => {
            cancelAnimationFrame(animFrameRef.current)
            if (rendererRef.current) {
                rendererRef.current.dispose()
                const parent = rendererRef.current.domElement.parentNode
                if (parent) parent.removeChild(rendererRef.current.domElement)
            }
            rendererRef.current = null
            sceneRef.current = null
            cameraRef.current = null
            mixerRef.current = null
            currentActionRef.current = null
            avatarRef.current = null
            clipCacheRef.current = {}
        }
    }, [avatarFbxName])

    // Load and play the selected move's animation whenever the entry is opened
    useEffect(() => {
        if (!avatarReady || !mixerRef.current) return

        const mixer = mixerRef.current
        const url = fbxUrl(name)

        // Use cached clip if available
        if (clipCacheRef.current[url]) {
            const cachedClip = clipCacheRef.current[url]
            if (cachedClip) {
                if (currentActionRef.current) {
                    currentActionRef.current.stop()
                }
                const action = mixer.clipAction(cachedClip)
                action.reset()
                action.play()
                currentActionRef.current = action
            }
            return
        }

        const loader = new FBXLoader()
        loader.load(
            url,
            (fbx) => {
                const clip = fbx.animations[0]
                clipCacheRef.current[url] = clip || null

                if (clip && mixerRef.current) {
                    if (currentActionRef.current) {
                        currentActionRef.current.stop()
                    }
                    const action = mixerRef.current.clipAction(clip)
                    action.reset()
                    action.play()
                    currentActionRef.current = action
                }
            },
            undefined,
            (err) => {
                console.error("FBX animation load error:", err)
                clipCacheRef.current[url] = null
            }
        )
    }, [name, avatarReady])

    return (
        <div
        ref={containerRef}
        className="fixed bottom-4 left-4 z-50 rounded-lg overflow-hidden shadow-lg border border-gray-700"
        style={{ width: 200, height: 300}}
        aria-label="Dance animation (idle)"
    />
    )
}

// Main point of this module.
const Entry = ({ name, obj }: { name: string, obj: DANCEItem & { details?: boolean } }) => {
    // TODO don't mutate obj.details
    const { t } = useTranslation()
    const forceUpdate = useForceUpdate()
    const tabsOpen = !!useSelector(tabs.selectOpenTabs).length
    const language = useSelector(selectScriptLanguage)

    const returnText = t(obj.descriptionKey)
    return (
        <div className="p-3 border-b border-r border-black border-gray-500 dark:border-gray-700">
            <div className="flex justify-between mb-2">
                <span
                    className="font-bold cursor-pointer truncate" title={returnText}
                    onClick={() => { obj.details = !obj.details; forceUpdate(); addUIClick("api read - " + name) }}
                >
                    {name}
                </span>
                <div className="flex">
                    <button
                        className={`hover:bg-gray-200 active:bg-gray-300 h-full pt-1 mr-2 text-xs rounded-full px-2.5 border border-gray-600 ${tabsOpen ? "" : "hidden"}`}
                        onClick={() => { paste(name, obj); addUIClick("api copy - " + name) }}
                        title={t("api:pasteToCodeEditor", { name })}
                        aria-label={t("api:pasteToCodeEditor", { name })}>
                        <i className="icon icon-paste2" />
                    </button>
                    <button className="hover:bg-gray-200 active:bg-gray-300 h-full text-sm rounded-full pl-1.5 border border-gray-600 whitespace-nowrap"
                        onClick={() => { obj.details = !obj.details; forceUpdate(); addUIClick("api read - " + name); }}
                        title={obj.details ? t("ariaDescriptors:api.closeFunctionDetails", { functionName: name }) : t("ariaDescriptors:api.openFunctionDetails", { functionName: name })}
                        aria-label={`${obj.details ? t("ariaDescriptors:api.closeFunctionDetails", { functionName: name }) : t("ariaDescriptors:api.openFunctionDetails", { functionName: name })}`}>
                        <div className="inline-block w-10">{obj.details ? t("api:close") : t("api:open")}</div>
                        <i className={`inline-block align-middle mb-px mx-1 icon icon-${obj.details ? "arrow-down" : "arrow-right"}`} />
                    </button>
                </div>
            </div>
            {obj.details && (
                <>
                    <Details obj={obj} />
                    <AnimationPreview name={name} />
                </>)}
        </div>
    )
}

const Details = ({ obj }: { obj: DANCEItem }) => {
    const language = useSelector(selectScriptLanguage)
    const { t } = useTranslation()

    return (
        <div className="border-t border-gray-500 mt-2 pt-1 text-sm">
            <span dangerouslySetInnerHTML={{ __html: t(obj.descriptionKey) }} />
        </div>
    )
}

const EntryList = () => {
    // const entries = useSelector(dance.selectFilteredEntries)
    // return (<>
    //     {entries.map(([name, variants]) => {
    //         return variants.map((o: DANCEItem, index: number) => <Entry key={name + index} name={name} obj={o} />)
    //     })}
    // </>)

    const moves = useSelector(dance.selectFilteredEntries)
    return (
        <>
            {moves.map((move, index) =>
                <Entry key={move.name + index} name={move.displayName} obj={move} />
            )}
        </>
    )
}

const APISearchBar = () => {
    const dispatch = useDispatch()
    const searchText = useSelector(dance.selectSearchText)
    const dispatchSearch = (event: ChangeEvent<HTMLInputElement>) => dispatch(dance.setSearchText(event.target.value))
    const dispatchReset = () => dispatch(dance.setSearchText(""))
    const caiHighlight = useSelector(cai.selectHighlight)
    const props = { searchText, dispatchSearch, dispatchReset, id: "apiSearchBar", highlight: caiHighlight.zone === "apiSearchBar" }

    return <SearchBar {...props} />
}

export const DANCEBrowser = () => {
    return (
        <>
            <div className="grow-0 pb-3">
                <APISearchBar />
            </div>

            {/* <div className="flex-auto overflow-y-scroll overflow-x-none" role="tabpanel" id={"panel-" + BrowserTabType.API}>
                <EntryList />
            </div> */}
            <div className="flex-auto overflow-y-scroll overflow-x-none"
                 role="tabpanel"
                 id={"panel-" + BrowserTabType.DANCE}>
                <EntryList />
            </div>
        </>
    )
}
