import { println } from "./api/passthrough"
import type { DAWData } from "common"
import { TempoMap } from "./app/tempo"

let beatInterval: NodeJS.Timeout | null = null;
let beatCount = 0;

export function startBeatPrinting(dawData: DAWData) {
    // Clear any existing interval
    if (beatInterval) {
        clearInterval(beatInterval);
    }

    // Reset beat counter
    beatCount = 0;

    // Calculate interval based on the tempo curve in the DAW.
    // (We derive BPM from the TempoMap because DAWData doesn't carry `tempo` directly.)
    const tempoMap = new TempoMap(dawData)
    const bpm = tempoMap.getTempoAtMeasure(1)
    const interval = 60 / bpm

    // Set up interval to print on every beat
    beatInterval = setInterval(() => {
        // Only print on the first beat of every 4 beats
        if (beatCount % 4 === 0) {
            println(dawData, "1");
        }
        beatCount++;
    }, interval);
}

export function stopBeatPrinting() {
    if (beatInterval) {
        clearInterval(beatInterval);
        beatInterval = null;
    }
} 