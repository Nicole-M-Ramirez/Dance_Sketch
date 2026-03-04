import React, { useEffect, useRef, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import * as THREE from "three"
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js"
import * as daw from "../daw/dawState"
import * as player from "../audio/player"


const FBX_BASE = "/MixamoAnimations"
const AVATAR_FBX_NAME = "Avatar.fbx"
function fbxUrl(name: string): string {
    const base = name.endsWith(".fbx") ? name : `${name}.fbx`
    return `${FBX_BASE}/${base}`
}

const HipHopFBXViewer: React.FC = () => {
    const dispatch = useDispatch()
    const tasks = useSelector(daw.selectFbxDanceTasks)
    const playing = useSelector(daw.selectPlaying)
    const avatar = useSelector(daw.selectAvatar)
    const avatarFbxName = avatar?.fbxName || AVATAR_FBX_NAME
    const [position, setPosition] = useState(0)

    const containerRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<THREE.Scene | null>(null)
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
    const clockRef = useRef(new THREE.Clock())

    const avatarRef = useRef<THREE.Object3D | null>(null)
    const [avatarReady, setAvatarReady] = useState(false)

    const mixerRef = useRef<THREE.AnimationMixer | null>(null)
    const currentActionRef = useRef<THREE.AnimationAction | null>(null)
    const clipCacheRef = useRef<Record<string, THREE.AnimationClip | null>>({})
    const animFrameRef = useRef<number>(0)

    const tempoMap = useSelector(daw.selectTempoMap)
    const currentTempo = React.useMemo(
        () => tempoMap.getTempoAtTime(position),
        [tempoMap, position]
    )
    const speed = currentTempo / 120

    useEffect(() => {
        if (!mixerRef.current) {
            return
        }
    
        const baseTempo = tempoMap.points[0]?.tempo ?? 120 // reference BPM
        const tempo = currentTempo || baseTempo
    
        // Match animation speed to current song tempo
        mixerRef.current.timeScale = tempo / baseTempo
    }, [currentTempo, tempoMap])

    // Poll play position when playing so we know when we're inside [start, end]
    useEffect(() => {
        if (!playing) return
        const interval = setInterval(() => {
            setPosition(player.getPosition())
        }, 80)
        return () => clearInterval(interval)
    }, [playing])

    const activeTask = tasks.find((t) => position >= t.start && position < t.end)

    // When position passes task end, remove that task so we don't keep it forever
    useEffect(() => {
        if (!activeTask) return
        if (position >= activeTask.end) {
            dispatch(daw.removeFbxDanceTask(activeTask.id))
        }
    }, [activeTask, position, dispatch])

    const shouldShow = !!activeTask && playing
    const fbxName = activeTask?.fbxName

    // Three.js setup and render loop, re-run when avatar changes
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        setAvatarReady(false)

        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0xB8E8F5)
        sceneRef.current = scene

        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000)
        camera.position.set(0, 1.2, 2.8)
        camera.lookAt(0, 1, 0)
        cameraRef.current = camera

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        renderer.setSize(320, 420)
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

    // Switch animation when the active task changes
    useEffect(() => {
        if (!shouldShow || !fbxName) {
            // If we're not in an active window, stop animation but keep the last pose visible
            if (currentActionRef.current) {
                currentActionRef.current.stop()
                currentActionRef.current = null
            }
            return
        }

        if (!avatarReady || !avatarRef.current || !mixerRef.current) {
            return
        }

        const mixer = mixerRef.current

        const applyClip = (clip: THREE.AnimationClip | null) => {
            if (!clip || !mixer) {
                return
            }

            const previousAction = currentActionRef.current
            const nextAction = mixer.clipAction(clip)

            nextAction.reset().setLoop(THREE.LoopRepeat, Infinity).play()

            if (previousAction && previousAction !== nextAction) {
                previousAction.crossFadeTo(nextAction, 0.3, false)
            }

            currentActionRef.current = nextAction
        }

        const cachedClip = clipCacheRef.current[fbxName]
        if (cachedClip !== undefined) {
            applyClip(cachedClip)
            return
        }

        const loader = new FBXLoader()
        const url = fbxUrl(fbxName)
        let cancelled = false

        loader.load(
            url,
            (fbx) => {
                if (cancelled) {
                    return
                }

                const clip = fbx.animations && fbx.animations.length > 0 ? fbx.animations[0] : null
                clipCacheRef.current[fbxName] = clip

                if (shouldShow && activeTask?.fbxName === fbxName) {
                    applyClip(clip)
                }
            },
            undefined,
            (err) => {
                console.error("FBX animation load error:", err)
            }
        )

        return () => {
            cancelled = true
        }
    }, [shouldShow, fbxName, activeTask, avatarReady])

    if (!shouldShow) {
        // Keep the last frame of the previous animation visible
        return (
            <div
                ref={containerRef}
                className="fixed bottom-4 left-4 z-50 rounded-lg overflow-hidden shadow-lg border border-gray-700"
                style={{ width: 320, height: 420, left: "80%", bottom: "25%" }}
                aria-label="Dance animation (idle)"
            />
        )
    }

    return (
        <div
            ref={containerRef}
            className="fixed bottom-4 left-4 z-50 rounded-lg overflow-hidden shadow-lg border border-gray-700"
            style={{ width: 320, height: 420, left: "80%", bottom: "25%" }}
            aria-label={`Dance animation: ${fbxName}`}
        />
    )
}

export default HipHopFBXViewer
