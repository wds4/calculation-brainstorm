import { db } from "@vercel/postgres";
import { verifyPubkeyValidity } from '@/helpers/nip19';
import { defaultGrapeRankNotSpamParametersWithMedaData, exampleScorecardsV3, GrapeRankParametersWithMetaData, ScorecardsV3, ScorecardsWithMetaDataV3, exampleRatingsV0o, RatingsV0o, GrapeRankParametersBasicNetwork } from "@/types"

/*
to access:
http://localhost:3000/api/grapevine/calculate/basicNetwork?name=default&pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

https://calculation-brainstorm.vercel.app/api/grapevine/calculate/basicNetwork?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f
*/

import type { NextApiRequest, NextApiResponse } from 'next'
import { coreGrapeRankCalculator } from "./coreGrapeRankCalculator";
import { coreGrapeRankCalculator_basicGrapevineNetwork } from "./individualProtocols/basicGrapevineNetwork";
 
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
        const res0 = await client.sql`SELECT * FROM customers WHERE pubkey=${pubkey1}`
        if (res0.rowCount == 0) {
          // return an error because supplied pubkey is not a customer
          const response:ResponseData = {
            success: false,
            message: 'api/grapevine/calculate/basicNetwork: supplied pubkey is not a customer'
          }
          res.status(500).json(response)
        }
        const resX = await client.sql`SELECT * FROM users WHERE pubkey=${pubkey1}`
        if (resX.rowCount == 0) {
          // return an error because pubkey is not in the main user database
          const response:ResponseData = {
            success: false,
            message: 'api/grapevine/calculate/basicNetwork: supplied pubkey is not in the users database; either has not followed anybody, or follows have not been fetched.'
          }
          res.status(500).json(response)
        }
        if ( (res0.rowCount == 1) && (resX.rowCount == 1) ) {
          const userID = resX.rows[0].id
          const customerID = res0.rows[0].id
          const protocolCategoryTableName = 'grapeRankProtocols'
          const protocolSlug = 'basicGrapevineNetwork'

          const res_params_default = await client.sql`SELECT * FROM protocolparameters WHERE customerID=1 AND protocolCategoryTableName=${protocolCategoryTableName} AND protocolSlug=${protocolSlug}`
          const params_def = res_params_default.rows[0].params
          const sParams_def = JSON.stringify(params_def)
          const sParams_default = sParams_def.replaceAll('self',userID)
          const oParams_default = JSON.parse(sParams_default)
          console.log('default params: ' + JSON.stringify(oParams_default, null, 4))
          const res1 = await client.sql`SELECT * FROM protocolparameters WHERE customerID=${customerID} AND protocolCategoryTableName=${protocolCategoryTableName} AND protocolSlug=${protocolSlug}`
          let params_data:GrapeRankParametersBasicNetwork = oParams_default
          if (res1.rowCount == 1) {
            const params_cust = res1.rows[0].params
            const sParams_customer = params_cust.replaceAll('self',userID)
            const oParams_customer = JSON.parse(sParams_customer)
            params_data = oParams_customer
            console.log('default customer: ' + JSON.stringify(oParams_customer, null, 4))
          } else {
            console.log('The customer does not have preferred parameters. Default parameters will be used.')
          }
          const res2 = await client.sql`SELECT * FROM ratingsTables WHERE pubkey=${pubkey1}`
          if (res2.rowCount) {
            const oRatingsTable = res2.rows[0].ratingstable
            console.log('====================== oRatingsTable: ' + JSON.stringify(oRatingsTable))
            /*
            // TODO:
            1. change format of what is stored in ratingstable to be the format like: alice: 'f', zed: 'm'
            2. write a function to replace f and m with interpreted values
            3. OR: reolace f and m with interpreted values before it gets into ratingsTable; 
              use the f and m format in the main users table in the observerObject column (if I decide to use that column)
            */




            // const aContexts = Object.keys(oRatingsTable)
            // console.log('aContexts: ' + JSON.stringify(aContexts))
            // const foo:Ratings = exampleRatingsV0
            // const g:Ratings = {}
            // const p:Ratings = {}
            const params:GrapeRankParametersWithMetaData = {
              metaData: {
                grapeRankProtocolUID: 'basicGrapevineNetwork'
              },
              data: params_data
            }
            // REPLACE WITH REAL DATA
            const ratings:RatingsV0o = exampleRatingsV0o // replace this with data from ratings table (matched to this customer)
            
            // const params:GrapeRankParametersWithMetaData = defaultGrapeRankNotSpamParametersWithMedaData // replace this with user supplied preferences from grapeRankProtocols table (matched to this customer)
            // const scorecards:ScorecardsV3 = {} // first round scorecards should be empty
            // const scorecardsOutWithMetaData_actualData_R1:ScorecardsWithMetaDataV3 = coreGrapeRankCalculator(ratings,scorecards,params)

            // WITH TEST DATA -- SEEMS TO WORK
            const scorecards_in:ScorecardsV3 = exampleScorecardsV3
            // const grapeRankParametersWithMetaData:GrapeRankParametersWithMetaData = defaultGrapeRankNotSpamParametersWithMedaData

            const scorecardsOutWithMetaDataR1:ScorecardsWithMetaDataV3 = coreGrapeRankCalculator(ratings,scorecards_in,params)
            console.log('scorecardsOutWithMetaDataR1: ' + JSON.stringify(scorecardsOutWithMetaDataR1, null, 4))
            const scorecards_next:ScorecardsV3 = scorecardsOutWithMetaDataR1.data

              const scorecardsOutWithMetaDataR2:ScorecardsWithMetaDataV3 = coreGrapeRankCalculator(ratings,scorecards_next,params)
            console.log('scorecardsOutWithMetaDataR2: ' + JSON.stringify(scorecardsOutWithMetaDataR2, null, 4))
          }
          const response:ResponseData = {
            success: true,
            message: 'api/grapevine/calculate/basicNetwork: made it to the end of the try block'
          }
          res.status(200).json(response)
        }
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