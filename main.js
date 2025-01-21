class AccountBlock {
    constructor(fusedPlasma, powPlasma, basePlasma, totalPlasma) {
        this.fusedPlasma = fusedPlasma
        this.powPlasma = powPlasma
        this.basePlasma = basePlasma
        this.totalPlasma = totalPlasma
    }
}

class Momentum {
    constructor(height, fusedPlasma, powPlasma, nominalFusedBasePlasma, nominalPowBasePlasma, basePlasma, fusionPrice, workPrice, fusedBlockCount, powBlockCount) {
        this.height = height
        this.fusedPlasma = fusedPlasma
        this.powPlasma = powPlasma
        this.nominalFusedBasePlasma = nominalFusedBasePlasma
        this.nominalPowBasePlasma = nominalPowBasePlasma
        this.basePlasma = basePlasma
        this.totalPlasma = fusedPlasma + powPlasma
        this.fusionPrice = fusionPrice
        this.workPrice = workPrice
        this.fusedBlockCount = fusedBlockCount
        this.powBlockCount = powBlockCount
    }

    get fusionPriceFormatted() {
        return this.fusionPrice.toFixed(2)
    }

    get workPriceFormatted() {
        return this.workPrice.toFixed(2)
    }
}

const ACCOUNT_BLOCK_BASE_PLASMA = 21000
const PLASMA_PER_FUSION_UNIT = 2100
const PLASMA_PER_SECOND_OF_WORK = ACCOUNT_BLOCK_BASE_PLASMA / 30 // assuming it takes 30 seconds on average to compute 21,000 plasma on an average computer

let currentWorkPrice = MIN_RESOURCE_PRICE
let currentFusionPrice = MIN_RESOURCE_PRICE

let momentumHeight = 1
let momentums = []

let secondsBetweenMomentums = 6
let powBlockCount = 0
let fusedBlockCount = 0
let minimumQsrNeeded = 10
let mininumWorkSecondsNeeded = 30

let isPaused = false

let nextMomentumTime = 0

let momentumInterval;
let timerInterval;

window.onload = function () {
    document.getElementById('fusedBlockCount').innerHTML = fusedBlockCount
    document.getElementById('powBlockCount').innerHTML = powBlockCount
    document.getElementById('minQsrNeeded').innerHTML = Math.ceil(minimumQsrNeeded) + ' QSR'
    document.getElementById('mininumWorkSecondsNeeded').innerHTML = Math.ceil(mininumWorkSecondsNeeded) + ' seconds'
    document.getElementById('maxBasePlasma').innerHTML = `Max base plasma:${spaces(21)}${MAX_BASE_PLASMA_IN_MOMENTUM} (200 regular blocks)`
    document.getElementById('fusedBasePlasmaTarget').innerHTML = `Fused base plasma target:${spaces(2)}${TARGET_FUSED_BASE_PLASMA_IN_MOMENTUM}${spaces(2)}(${TARGET_FUSION_RATIO * 100}% / 50 regular blocks)`
    document.getElementById('powBasePlasmaTarget').innerHTML = `PoW base plasma target:${spaces(5)}${TARGET_POW_BASE_PLASMA_IN_MOMENTUM}${spaces(2)}(${TARGET_WORK_RATIO * 100}% / 50 regular blocks)`

    createMomentum()
    updateMomentumList()
    start()
}

function start() {
    if (momentumHeight >= 1000) {
        return
    } 
    nextMomentumTime = Date.now() + secondsBetweenMomentums * 1000
    momentumInterval = setInterval(function() {
        momentumHeight++
        nextMomentumTime = Date.now() + secondsBetweenMomentums * 1000
        createMomentum()
        updateMomentumList()
        document.getElementById('minQsrNeeded').innerHTML = Math.ceil(minimumQsrNeeded) + ' QSR'
        document.getElementById('mininumWorkSecondsNeeded').innerHTML = Math.ceil(mininumWorkSecondsNeeded) + ' seconds'
        if (momentumHeight >= 1000) {
            stop()
        }
    }, secondsBetweenMomentums * 1000)

    updateMomentumTimer()
    timerInterval = setInterval(updateMomentumTimer, 200)
}

function stop() {
    document.getElementById('momentumTimer').value = 0
    clearInterval(momentumInterval)
    clearInterval(timerInterval)
}

function onFusionSliderChange(value) {
    fusedBlockCount = Number(value)
    const maxBlocks = MAX_BASE_PLASMA_IN_MOMENTUM / ACCOUNT_BLOCK_BASE_PLASMA
    if (fusedBlockCount + powBlockCount > maxBlocks) {
        powBlockCount =  maxBlocks - fusedBlockCount
        document.getElementById('powBlockCount').innerHTML = powBlockCount
        document.getElementById('powBlockSlider').value = powBlockCount
    }
    document.getElementById('fusedBlockCount').innerHTML = fusedBlockCount
}

function onPowSliderChange(value) {
    powBlockCount = Number(value)
    const maxBlocks = MAX_BASE_PLASMA_IN_MOMENTUM / ACCOUNT_BLOCK_BASE_PLASMA
    if (fusedBlockCount + powBlockCount > maxBlocks) {
        fusedBlockCount = maxBlocks - powBlockCount
        document.getElementById('fusedBlockCount').innerHTML = fusedBlockCount
        document.getElementById('fusedBlockSlider').value = fusedBlockCount
    }
    document.getElementById('powBlockCount').innerHTML = powBlockCount
}

function onPausePlayTap() {
    isPaused = !isPaused
    isPaused ? stop() : start()
    document.getElementById('pausePlayButton').innerHTML = isPaused ? 'Play' : 'Pause'
}

function updateMomentumTimer() {
    const remainingTime = nextMomentumTime - Date.now()
    const timerValue = 100 - remainingTime / (secondsBetweenMomentums * 1000) * 100
    document.getElementById('momentumTimer').value = timerValue
}

function updateMomentumList() {
    const frontier = momentums[momentums.length - 1]

    const parent = momentums.length >= 2 ? momentums[momentumHeight - 2] : undefined
    const fusionPriceChange = (parent !== undefined ? ((frontier.fusionPrice/parent.fusionPrice - 1) * 100) : 0).toFixed(2)
    const workPriceChange = (parent !== undefined ? ((frontier.workPrice/parent.workPrice - 1) * 100) : 0).toFixed(2)

    const fusedTargetText = getTargetText(frontier.nominalFusedBasePlasma, TARGET_FUSED_BASE_PLASMA_IN_MOMENTUM)
    const powTargetText = getTargetText(frontier.nominalPowBasePlasma, TARGET_POW_BASE_PLASMA_IN_MOMENTUM)

    const div = document.createElement('div');
    div.innerHTML =
    `Height:${spaces(31)}${frontier.height}
    <br>
    Fused block count:${spaces(5)}${frontier.fusedBlockCount}
    <br>
    PoW block count:${spaces(8)}${frontier.powBlockCount}
    <br>
    Fused base plasma:${spaces(2)}${frontier.nominalFusedBasePlasma} ${fusedTargetText}
    <br>
    PoW base plasma:${spaces(5)}${frontier.nominalPowBasePlasma} ${powTargetText}
    <br>
    <br>
    New fusion price:${spaces(8)}${frontier.fusionPriceFormatted} (${fusionPriceChange}%) ${spaces(3)}
    <br> 
    New PoW price:${spaces(11)}${frontier.workPriceFormatted} (${workPriceChange}%) 
    <br>
    <br>
    ---------------------------------------------------------------------------------------------
    <br>
    <br>
    `
    document.getElementById('momentumList').prepend(div);
}

function getTargetText(plasma, target) {
    let text = "(On target)"
    if (plasma > target) {
        text = "(Over target)"
    }
    if (plasma < target) {
        text = "(Below target)"
    }
    return text
}

function spaces(count) {
    let spaces = '';
    for (let i = 0; i < count; i++) {
        spaces += '&thinsp;'
    }
    return spaces
}

function createMomentum() {
    console.log("Creating momentum height " + momentumHeight)
    console.log("With " + fusedBlockCount + " fused blocks")
    console.log("With " + powBlockCount + " PoW blocks")
    
    let totalBasePlasma = 0
    let totalFusedPlasma = 0
    let totalPowPlasma = 0
    const blocks = []
    for (let i = 0; i < fusedBlockCount; i++) {
        const basePlasma = ACCOUNT_BLOCK_BASE_PLASMA
        const fusedPlasma = basePlasma * currentFusionPrice
        totalBasePlasma += basePlasma
        totalFusedPlasma += fusedPlasma
        blocks.push(new AccountBlock(fusedPlasma, 0, basePlasma))
    }

    for (let i = 0; i < powBlockCount; i++) {
        const basePlasma = ACCOUNT_BLOCK_BASE_PLASMA
        const powPlasma = basePlasma * currentWorkPrice
        totalBasePlasma += basePlasma
        totalPowPlasma += powPlasma
        blocks.push(new AccountBlock(0, powPlasma, basePlasma))
    }
   
    const [fusedBasePlasma, powBasePlasma] = calculateNominalBasePlasma(blocks, currentFusionPrice, currentWorkPrice)
    const fusionPrice = calculateResourcePrice(currentFusionPrice, fusedBasePlasma, TARGET_FUSED_BASE_PLASMA_IN_MOMENTUM)
    const workPrice = calculateResourcePrice(currentWorkPrice, powBasePlasma, TARGET_POW_BASE_PLASMA_IN_MOMENTUM)
    console.log("New fusion price is " + fusionPrice + " change: " + ((fusionPrice/currentFusionPrice - 1) * 100).toFixed(2) + "%")
    console.log("New work price is " + workPrice + " change: " + ((workPrice/currentWorkPrice - 1) * 100).toFixed(2) + "%")
    console.log("#####################################")
    currentFusionPrice = fusionPrice
    currentWorkPrice = workPrice
    minimumQsrNeeded = Math.max(ACCOUNT_BLOCK_BASE_PLASMA * fusionPrice / PLASMA_PER_FUSION_UNIT, 10)
    mininumWorkSecondsNeeded = Math.max(ACCOUNT_BLOCK_BASE_PLASMA * workPrice / PLASMA_PER_SECOND_OF_WORK, 30)
    momentums.push(
        new Momentum(
            momentumHeight,
            totalFusedPlasma,
            totalPowPlasma,
            fusedBasePlasma,
            powBasePlasma,
            totalBasePlasma,
            fusionPrice,
            workPrice,
            fusedBlockCount,
            powBlockCount
        )
    )
}
