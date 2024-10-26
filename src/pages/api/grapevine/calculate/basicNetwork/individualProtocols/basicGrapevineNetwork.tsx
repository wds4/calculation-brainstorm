import { GrapeRankParametersWithMetaData, observee, ObserveeObjectV3, rater, RaterObjectV0o, RatingsV0o, ScorecardsV3, ScorecardsWithMetaDataV3 } from "@/types"
import { convertInputToConfidence } from '@/helpers/grapevine' 

export const coreGrapeRankCalculator_basicGrapevineNetwork = (ratings:RatingsV0o,scorecardsIn:ScorecardsV3,parametersWithMetaData:GrapeRankParametersWithMetaData,aObservees:observee[],aRaters:rater[]) => {
    console.log(`coreGrapeRankCalculator_basicGrapevineNetwork ========== A`)
    const context = parametersWithMetaData.data.context
    const masterObserver = parametersWithMetaData.data.observer
    ////////////////////////////////
    const defaultScore = parametersWithMetaData.data.defaults.score
    const defaultConfidence = parametersWithMetaData.data.defaults.confidence
    const defaultInfluence = defaultScore * defaultConfidence
    const attenuation = parametersWithMetaData.data.attenuation
    const rigor = parametersWithMetaData.data.rigor
    const aSeedUsers = parametersWithMetaData.data.seedUsers
    
    const scorecardsOut:ScorecardsV3 = {}

    scorecardsOut[context] = {}
    scorecardsOut[context][masterObserver] = {}

    const mData:object = { grapeRankInputParams: parametersWithMetaData }

    if (!ratings[context]) {
      // there are no ratings that match the desired context; therefore return an empty scorecardsOutWithMetaData, possibly with an error message
      const scorecardsOutWithMetaData:ScorecardsWithMetaDataV3 = {
        success: false,
        metaData: mData,
        data: scorecardsOut,
      }
      console.log('scorecardsOutWithMetaData: ' + JSON.stringify(scorecardsOutWithMetaData, null, 4))
      return scorecardsOutWithMetaData
    }

    type  RaterInfluenceLookup = {
      [key: rater]: number
    }

    console.log(`coreGrapeRankCalculator_basicGrapevineNetwork B`)

    // make an object of all raters to use as lookup for their current influence; if unknown, set to default
    let oRaterDataLookup:ObserveeObjectV3 = {}
    if (scorecardsIn[context]) {
      if (scorecardsIn[context][masterObserver]) {
        oRaterDataLookup = scorecardsIn[context][masterObserver]
      }
    }

    console.log(`coreGrapeRankCalculator_basicGrapevineNetwork C`)

    const oRatings:RaterObjectV0o = ratings[context]

    const oRaterInfluence:RaterInfluenceLookup = {}

    for (let r=0; r < aRaters.length; r++) {
      const rater:rater = aRaters[r]
      if (oRaterDataLookup[rater] && oRaterDataLookup[rater].influence) {
        oRaterInfluence[rater] = oRaterDataLookup[rater].influence
      } else {
        oRaterInfluence[rater] = defaultInfluence // which is usually going to be zero 
      }
    }

    for (let x=0; x < aSeedUsers.length; x++) {
      const nextSeedUser = aSeedUsers[x]
      oRaterInfluence[nextSeedUser] = 1
    }
    
    console.log(`coreGrapeRankCalculator_basicGrapevineNetwork D`)

    console.log(`coreGrapeRankCalculator_basicGrapevineNetwork E`)
    
    // cycle through all observees and calculate weights and products
    const oScores:ObserveeObjectV3 = {}
    for (let x=0; x < aObservees.length; x++) {
      const observee:observee = aObservees[x]
      // initialize scores to zero using oInitializedScores
      // const oScores[observee]:oExpandedScoreParameters = oInitializedScores
      // cycle through all raters and if the rater left a rating for the observee, then increment weights and products
      oScores[observee] = {
        influence: 0,
        score: 0,
        confidence: 0,
        input: 0,
        weights: 0,
        products: 0
      }
      oScores[observee].weights = 0
      oScores[observee].products = 0
      const aRatersThisCycle = Object.keys(oRatings[observee])
      for (let r=0; r < aRatersThisCycle.length; r++) {
        // console.log(`coreGrapeRankCalculator_basicGrapevineNetwork E; r: ${r}`)
        const rater:rater = aRatersThisCycle[r]
        const score = oRatings[observee][rater].score
        const confidence = oRatings[observee][rater].confidence

        const raterInfluence = oRaterInfluence[rater]
        let weight = raterInfluence * confidence
        if (rater != masterObserver) {
          weight = weight * attenuation
        }
        const product = weight * score
        oScores[observee].weights += weight
        oScores[observee].products += product
      }
    }

    console.log(`coreGrapeRankCalculator_basicGrapevineNetwork F`)

    // cycle through all the observees and use weights and products to calculate all of the other parameters
    let sumOfDifferences = 0
    for (let x=0; x < aObservees.length; x++) {
      const observee:observee = aObservees[x]
      if (oScores[observee].weights) {
        const score:number = oScores[observee].products / oScores[observee].weights
        const confidence = convertInputToConfidence(oScores[observee].weights,rigor)
        const input = oScores[observee].weights
        const influence = score * confidence
        scorecardsOut[context][masterObserver][observee] = {
          score: Number(score.toPrecision(4)),
          input: Number(input.toPrecision(4)),
          confidence: Number(confidence.toPrecision(4)),
          influence: Number(influence.toPrecision(4)),
          weights: Number(oScores[observee].weights.toPrecision(4)),
          products: Number(oScores[observee].products.toPrecision(4))
        }
        if (oRaterDataLookup.hasOwnProperty(observee) && oRaterDataLookup[observee].influence) {
          const changeInInfluence = scorecardsOut[context][masterObserver][observee].influence - oRaterDataLookup[observee].influence
          if (changeInInfluence) { 
            // console.log(`changeInInfluence: ${changeInInfluence}`) 
            const changeSquared = changeInInfluence * changeInInfluence
            sumOfDifferences += changeSquared
          }
        }
      } else {
        // set to zero ? or omit from final scorecardsOut?
      }
    }
    scorecardsOut[context][masterObserver][masterObserver] = {
      score: 1,
      input: 9999,
      confidence: 1,
      influence: 1,
      weights: 9999,
      products: 9999
    }
  
    const scorecardsOutWithMetaData:ScorecardsWithMetaDataV3 = {
      success: true,
      metaData: mData,
      data: scorecardsOut,
    }
    console.log(`coreGrapeRankCalculator_basicGrapevineNetwork Z; sumOfDifferences: ${sumOfDifferences}`)
    return scorecardsOutWithMetaData
}