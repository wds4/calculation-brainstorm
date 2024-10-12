import { db } from "@vercel/postgres";
import { verifyPubkeyValidity } from '@/helpers/nip19';
import { defaultGrapeRankNotSpamParametersWithMedaData, exampleScorecardsV3, GrapeRankParametersWithMetaData, ScorecardsV3, ScorecardsWithMetaDataV3, exampleRatingsV0o, RatingsV0o } from "@/types"

/*
to access:
http://localhost:3000/api/grapevine/calculate/basicNetwork?name=default&pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

https://calculation-brainstorm.vercel.app/api/grapevine/calculate/basicNetwork?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f
*/

import type { NextApiRequest, NextApiResponse } from 'next'
import { coreGrapeRankCalculator } from "./coreGrapeRankCalculator";
 
type ResponseData = {
  success: boolean,
  message: string
}
 
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const searchParams = req.query
  if (searchParams.npub) {
    // TODO: support npub
  }
  if ((!searchParams.pubkey) || (!searchParams.name)) {
    const response:ResponseData = {
      success: false,
      message: 'api/grapevine/calculate/basicNetwork api: name and / or pubkey not provided'
    }
    res.status(200).json(response)
  }
  if ((searchParams.pubkey) && (searchParams.name)) {
    // const pubkey1 = 'e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f'
    // const name = 'default' // the name of the ratingsTable
    const pubkey1 = searchParams.pubkey
    const name = searchParams.name
    if ((typeof pubkey1 == 'string') && (verifyPubkeyValidity(pubkey1) && (typeof name == 'string')) ) {
      const client = await db.connect();
      try {
        // const res1 = await client.sql`SELECT * FROM ratingsTables WHERE pubkey=${pubkey1} AND name=${name}`
        // if (res1.rowCount) {
          // const oRatingsTable = res1.rows[0].ratingstable
          // const aContexts = Object.keys(oRatingsTable)
          // console.log('aContexts: ' + JSON.stringify(aContexts))
          // const foo:Ratings = exampleRatingsV0
          // const g:Ratings = {}
          // const p:Ratings = {}


          // REPLACE WITH REAL DATA
          const ratings:RatingsV0o = exampleRatingsV0o // replace this with data from ratings table (matched to this customer)
          const params:GrapeRankParametersWithMetaData = defaultGrapeRankNotSpamParametersWithMedaData // replace this with user supplied preferences from grapeRankProtocols table (matched to this customer)
          const scorecards:ScorecardsV3 = {} // first round scorecards should be empty
          const scorecardsOutWithMetaData_actualData_R1:ScorecardsWithMetaDataV3 = coreGrapeRankCalculator(ratings,scorecards,params)

          // WITH TEST DATA -- SEEMS TO WORK
          const scorecards_in:ScorecardsV3 = exampleScorecardsV3
          const grapeRankParametersWithMetaData:GrapeRankParametersWithMetaData = defaultGrapeRankNotSpamParametersWithMedaData
          const scorecardsOutWithMetaDataR1:ScorecardsWithMetaDataV3 = coreGrapeRankCalculator(exampleRatingsV0o,scorecards_in,grapeRankParametersWithMetaData)
          console.log('scorecardsOutWithMetaDataR1: ' + JSON.stringify(scorecardsOutWithMetaDataR1, null, 4))
          const scorecardsOutWithMetaDataR2:ScorecardsWithMetaDataV3 = coreGrapeRankCalculator(exampleRatingsV0o,scorecardsOutWithMetaDataR1.data,grapeRankParametersWithMetaData)
          console.log('scorecardsOutWithMetaDataR2: ' + JSON.stringify(scorecardsOutWithMetaDataR2, null, 4))
        // }
        const response:ResponseData = {
          success: true,
          message: 'api/grapevine/calculate/basicNetwork: made it to the end of the try block'
        }
        res.status(200).json(response)
      } catch (error) {
        console.log(error)
      } finally {
        client.release();
      }
    } else {
      const response:ResponseData = {
        success: false,
        message: `api/grapevine/calculate/basicNetwork api: the provided pubkey and/or ratings table name is invalid`
      }
      res.status(200).json(response)
    }
  }
}