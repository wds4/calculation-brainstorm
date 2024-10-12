import { GrapeRankParametersWithMetaData, RatingsV0o, ScorecardsV3, ScorecardsWithMetaDataV3 } from "@/types"
import { coreGrapeRankCalculator_basicGrapevineNetwork } from "./individualProtocols/basicGrapevineNetwork"

export const coreGrapeRankCalculator = (ratings:RatingsV0o,scorecardsIn:ScorecardsV3,parametersWithMetaData:GrapeRankParametersWithMetaData) => {
  const grapeRankProtocolUID = parametersWithMetaData.metaData.grapeRankProtocolUID
  if (grapeRankProtocolUID == 'basicGrapevineNetwork') {
    const scorecardsOutWithMetaData:ScorecardsWithMetaDataV3 = coreGrapeRankCalculator_basicGrapevineNetwork(ratings,scorecardsIn,parametersWithMetaData)
    return scorecardsOutWithMetaData
  }
  if (grapeRankProtocolUID == 'basic5StarProductCalculation') {
    // const scorecardsOutWithMetaData = coreGrapeRankCalculator_basic5StarProductCalculation()
  }
  
  // otherwise return error bc the requested protocolUID is not supported
  const mData:object = { grapeRankInputParams: parametersWithMetaData }
  const scorecardsOutWithMetaData:ScorecardsWithMetaDataV3 = {
    success: false,
    message: 'the provided grapeRankProtocolUID is not supported',
    metaData: mData,
    data: {}
  }
  return scorecardsOutWithMetaData
  
}
