
import { LOGIC_FILE } from "./script-convert.js";

/**
 * @type {Array<[string | RegExp, (label: string, match: RegExpMatchArray)=>[string, string]]}
 */
const sceneLabels = [
    ["eclipse", (label)=> [label, label, false]],
    ["openning", (label)=> [label, label, false]],
    //["ending", (label)=> [label, label]], // ignore ending (credits are generated by the script)
    [/^s\d\w+?$/, (label) => [label, `scene${label.substring(1)}`, false]],
    [/^f\d\w+?$/, (label) => [label, LOGIC_FILE, true]],
    [/^skip\d\w+?$/, (label) => [`f${label.substring(4)}`, LOGIC_FILE, true]],
    [/^quizz\d\w+?$/, (label) => [label, `quizz`, true]],
    [/^se\d\w+?$/, (label) => [`s${label.substring(2)}`, `scene${label.substring(1)}`, true]]
    //[/^mm\w+$/, (label) => { i = label.indexOf('click'); return i>= 0 ? label.substring(0, i) : label}], // ignore mirrormoon's easter-egg scenes
];

/**
 * @param {string} label 
 * @returns {[string, string] | null}
 */
function getEntry(label) {
    for (let [format, f] of sceneLabels) {
        let match
        if (format instanceof RegExp)
            match = label.match(format)
        else
            match = (label == format)
        
        if (match) {
            return f(label, match)
        }
    }
    return null
}

/**
 * @param {Array<string>} scriptLines 
 * @return {Map<string, {file: string, lines: Array<string>}>}
 */
function extractScript(scriptLines) {
    /** @type {Map<string, {file: string, lines: Array<string>}>} */
    let scenes = new Map()
    /** @type {Array<string> | null} */
    let scene = null;
    let file = null;
    let keepLabel = false;
    
    const onLabel = (label) => {
        const result = getEntry(label)
        if (result) {
            let label
            [label, file, keepLabel] = result
            if (scenes.has(label))
                scene = scenes.get(label).lines
            else {
                scene = []
                scenes.set(label, {file, lines: scene})
            }
        }
        else {
            scene = null
            file = null
            keepLabel = false;
        }
    }

    for (const line of scriptLines) {
        if (line.startsWith('*')) {
            onLabel(line.substring(1))
            if (keepLabel)
                scene.push(line)
        }
        else if (scene) {
            scene.push(line)
            if (file != LOGIC_FILE) {
                if (line.startsWith("goto")) {
                    scene.push("return")
                    scene = scenes[LOGIC_FILE]
                }
                else if (line == "return") {
                    scene = scenes[LOGIC_FILE]
                }
            }
        }
    }
    return scenes
}

export {
    extractScript
}