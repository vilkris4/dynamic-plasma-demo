const MAX_BASE_PLASMA_IN_MOMENTUM = 4200000
const TARGET_FUSION_RATIO = 0.25
const TARGET_WORK_RATIO = 0.25
const TARGET_FUSED_BASE_PLASMA_IN_MOMENTUM = MAX_BASE_PLASMA_IN_MOMENTUM * TARGET_FUSION_RATIO
const TARGET_POW_BASE_PLASMA_IN_MOMENTUM = MAX_BASE_PLASMA_IN_MOMENTUM * TARGET_WORK_RATIO

const MIN_RESOURCE_PRICE = 1
const MAX_PRICE_CHANGE_RATE = 0.1
const PRICE_CHANGE_DENOMINATOR = 20

// To calculate a block's priority:
// const priority = (fusedPlasma / fusionPrice + powPlasma / workPrice) / basePlasma
// Note: does not determine the priority of uncommitted blocks within an account chain.

function calculateResourcePrice(currentPrice, basePlasma, targetBasePlasma) {
    const changeRate = Math.min(((basePlasma / targetBasePlasma - 1) / PRICE_CHANGE_DENOMINATOR), MAX_PRICE_CHANGE_RATE)
    const newPrice = currentPrice * (1 + changeRate)
    return newPrice >= MIN_RESOURCE_PRICE ? newPrice : MIN_RESOURCE_PRICE
}

function calculateNominalBasePlasma(blocks, fusionPrice, workPrice) {
    let nominalFusedBasePlasma = 0
    let nominalPowBasePlasma = 0
    for (const block of blocks) {
        const effectiveFusedPlasma = block.fusedPlasma / fusionPrice
        const effectivePowPlasma = block.powPlasma / workPrice
        const totalEffectivePlasma = effectiveFusedPlasma + effectivePowPlasma
        nominalFusedBasePlasma += effectiveFusedPlasma / totalEffectivePlasma * block.basePlasma
        nominalPowBasePlasma += effectivePowPlasma / totalEffectivePlasma * block.basePlasma
    }
    return [nominalFusedBasePlasma, nominalPowBasePlasma]
}