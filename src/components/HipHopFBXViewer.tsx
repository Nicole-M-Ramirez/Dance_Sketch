import React, { useEffect, useRef, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import * as THREE from "three"
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js"
import * as daw from "../daw/dawState"
import * as player from "../audio/player"

const FBX_BASE = "/MixamoAnimations"

function fbxUrl(name: string): string {
    const base = name.endsWith(".fbx") ? name : `${name}.fbx`
    return `${FBX_BASE}/${base}`
}

type CachedModel = {
    model: THREE.Object3D
    clip: THREE.AnimationClip | null
}

const HipHopFBXViewer: React.FC = () => {
    const dispatch = useDispatch()
    const tasks = useSelector(daw.selectFbxDanceTasks)
    const playing = useSelector(daw.selectPlaying)
    const [position, setPosition] = useState(0)

    const containerRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<THREE.Scene | null>(null)
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
    const clockRef = useRef(new THREE.Clock())
    const mixerRef = useRef<THREE.AnimationMixer | null>(null)
    const currentActionRef = useRef<THREE.AnimationAction | null>(null)
    const currentModelRef = useRef<THREE.Object3D | null>(null)
    const cacheRef = useRef<Record<string, CachedModel>>({})
    const animFrameRef = useRef<number>(0)

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

    // One‑time Three.js setup and render loop
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0x1a1a2e)
        sceneRef.current = scene

        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000)
        camera.position.set(0, 1.2, 2.5)
        camera.lookAt(0, 1, 0)
        cameraRef.current = camera

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        renderer.setSize(320, 420)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.outputColorSpace = THREE.SRGBColorSpace
        container.appendChild(renderer.domElement)
        rendererRef.current = renderer

        const ambient = new THREE.AmbientLight(0xffffff, 0.6)
        scene.add(ambient)
        const dir = new THREE.DirectionalLight(0xffffff, 0.8)
        dir.position.set(2, 5, 3)
        scene.add(dir)

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
            currentModelRef.current = null
            cacheRef.current = {}
        }
    }, [])

    // Switch model / animation when the active task changes
    useEffect(() => {
        if (!shouldShow || !fbxName) {
            // If we're not in an active window, stop animation but keep the last pose visible
            if (currentActionRef.current) {
                currentActionRef.current.stop()
                currentActionRef.current = null
            }
            return
        }

        const scene = sceneRef.current
        if (!scene) return

        const cached = cacheRef.current[fbxName]

        const playModel = (entry: CachedModel) => {
            // Remove previous model from scene
            if (currentModelRef.current) {
                scene.remove(currentModelRef.current)
            }

            scene.add(entry.model)
            currentModelRef.current = entry.model

            if (entry.clip) {
                const mixer = new THREE.AnimationMixer(entry.model)
                mixerRef.current = mixer
                const action = mixer.clipAction(entry.clip)
                action.reset().setLoop(THREE.LoopRepeat, Infinity).play()
                currentActionRef.current = action
            } else {
                mixerRef.current = null
                currentActionRef.current = null
            }
        }

        if (cached) {
            // Already loaded – switch instantly, no cooldown
            playModel(cached)
            return
        }

        // Not cached yet – load but keep the previous model visible until we finish
        const loader = new FBXLoader()
        const url = fbxUrl(fbxName)
        loader.load(
            url,
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

                const clip = fbx.animations && fbx.animations.length > 0 ? fbx.animations[0] : null
                const entry: CachedModel = { model: fbx, clip }
                cacheRef.current[fbxName] = entry

                // Only switch if this is still the active animation
                if (shouldShow && activeTask?.fbxName === fbxName) {
                    playModel(entry)
                }
            },
            undefined,
            (err) => {
                console.error("FBX load error:", err)
            }
        )
    }, [shouldShow, fbxName, activeTask])

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
