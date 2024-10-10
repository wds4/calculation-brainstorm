import { db } from "@vercel/postgres";
import { verifyPubkeyValidity } from '@/helpers/nip19';
import { defaultGrapeRankNotSpamParameters, GrapeRankParameters, Ratings, ScorecardsMetaData, ScorecardsV2, ScorecardsV3, ScorecardsWithMetaDataV3, testRatings } from "@/types"
/*
to access:
http://localhost:3000/api/grapevine/calculate/basicNetwork?name=default&pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f
https://calculation-brainstorm.vercel.app/api/grapevine/calculate/basicNetwork?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f
*/

import type { NextApiRequest, NextApiResponse } from 'next'
 
type ResponseData = {
  success: boolean,
  message: string
}

const coreGrapeRankCalculator = (ratings:Ratings,scorecardsIn:ScorecardsV3,grapeRankParameters:GrapeRankParameters) => {
  console.log(typeof ratings)
  console.log(typeof scorecardsIn)
  console.log(typeof grapeRankParameters)

  const scorecardsOut:ScorecardsV3 = {}
  const mData:ScorecardsMetaData = {
    observer: 'foo',
    grapeRankProtocolUID: 'foo',
    rigor: 0.25
  }
  const gOutWithMetaData:ScorecardsWithMetaDataV3 = {
    metaData: mData,
    data: scorecardsOut,
  }
  return gOutWithMetaData
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
      message: 'grapevine/showStoredRatingsTable api: name and / or pubkey not provided'
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
          // const foo:Ratings = testRatings
          // const g:Ratings = {}
          // const p:Ratings = {}
          const scorecards_in:ScorecardsV3 = {}
          const grapeRankParameters:GrapeRankParameters = defaultGrapeRankNotSpamParameters
          // TODO: define grapeRankParameters.seedUsers
          const gOutWithMetaData:ScorecardsWithMetaDataV3 = coreGrapeRankCalculator(testRatings,scorecards_in,grapeRankParameters)
          console.log('gOutWithMetaData: ' + JSON.stringify(gOutWithMetaData))
        // }
      } catch (error) {
        console.log(error)
      } finally {
        client.release();
      }
    } else {
      const response:ResponseData = {
        success: false,
        message: `the provided pubkey and/or ratings table name is invalid`
      }
      res.status(200).json(response)
    }
  }
}