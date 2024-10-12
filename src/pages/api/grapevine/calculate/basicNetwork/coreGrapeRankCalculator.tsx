import { GrapeRankParametersWithMetaData, observee, ObserveeObjectV3, ObserverObjectV3, oExpandedScoreParameters, oInitializedScores, ratee, rater, RaterObject, RaterObjectV0o, RatingsV0o, ScorecardsMetaData, ScorecardsV3, ScorecardsWithMetaDataV3 } from "@/types"
import { convertInputToConfidence } from '@/helpers/grapevine' 

export const coreGrapeRankCalculator = (ratings:RatingsV0o,scorecardsIn:ScorecardsV3,parametersWithMetaData:GrapeRankParametersWithMetaData) => {
    const context = parametersWithMetaData.data.context
    const masterObserver = parametersWithMetaData.data.observer
    const grapeRankProtocolUID = parametersWithMetaData.metaData.grapeRankProtocolUID
    
    /*
    if (grapeRankProtocolUID == 'basicGrapevineNetwork') {
      const scorecardsOut = coreGrapeRankCalculator_basicGrapevineNetwork()
    }
    if (grapeRankProtocolUID == 'basic5StarProductCalculation') {
      const scorecardsOut = coreGrapeRankCalculator_basic5StarProductCalculation()
    }
    // otherwise return error bc the requested protocolUID is not supported
    */

    ////////////////////////////////
    // The below presumes we are doing scoreGrapeRankCalculator_basicGrapevineNetwork
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

    // make an object of all raters to use as lookup for their current influence; if unknown, set to default
    let oRaterDataLookup:ObserveeObjectV3 = {}
    if (scorecardsIn[context]) {
      if (scorecardsIn[context][masterObserver]) {
        oRaterDataLookup = scorecardsIn[context][masterObserver]
      }
    }

    const oRatings:RaterObjectV0o = ratings[context]
    const aRaters = Object.keys(oRatings)
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
    
    
    // the ratees in ratings become the observees in scorecardsOut
    // make an array of all observees
    const aObservees:observee[] = []
    for (let r=0; r < aRaters.length; r++) {
      const rater:rater = aRaters[r]
      if (oRatings[rater]) {
        const aObserveesTemp = Object.keys(oRatings[rater])
        for (let x=0; x < aObserveesTemp.length; x++) {
          const ratee:ratee = aObserveesTemp[x]
          if (!aObservees.includes(ratee)) {
            aObservees.push(ratee)
          }
        }
      }
    }
    
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
      for (let r=0; r < aRaters.length; r++) {
        const rater:rater = aRaters[r]
        if (oRatings[rater] && oRatings[rater][observee]) {
          const score = oRatings[rater][observee].score
          const confidence = oRatings[rater][observee].confidence
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
    }

    // cycle through all the observees and use weights and products to calculate all of the other parameters
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
      } else {
        // set to zero ? or omit from final scorecardsOut?
      }
    }
  
    const scorecardsOutWithMetaData:ScorecardsWithMetaDataV3 = {
      success: true,
      metaData: mData,
      data: scorecardsOut,
    }
    return scorecardsOutWithMetaData
  }