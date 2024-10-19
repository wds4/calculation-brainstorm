import { db } from "@vercel/postgres";
import { verifyPubkeyValidity } from '@/helpers/nip19';
import { GrapeRankParametersWithMetaData, ScorecardsV3, ScorecardsWithMetaDataV3, GrapeRankParametersBasicNetwork, RatingsWithMetaDataCV0o, RatingsMetaData, RatingsCV0o, RatingsV0o, exampleRatingsWithMetaDataCV0o, observee } from "@/types"
import type { NextApiRequest, NextApiResponse } from 'next'
import { coreGrapeRankCalculator } from "./coreGrapeRankCalculator";
import { secsToTime } from "@/helpers";

/*
to access:

pubkey: e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

http://localhost:3000/api/grapevine/calculate/basicNetwork?name=default&pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

https://calculation-brainstorm.vercel.app/api/grapevine/calculate/basicNetwork?name=default&pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

pubkey: a08175d65051c08b83600abf6f5c18efd455114b4863c65959c92b13ee52f87c

http://localhost:3000/api/grapevine/calculate/basicNetwork?name=default&pubkey=a08175d65051c08b83600abf6f5c18efd455114b4863c65959c92b13ee52f87c

https://calculation-brainstorm.vercel.app/api/grapevine/calculate/basicNetwork?name=default&pubkey=a08175d65051c08b83600abf6f5c18efd455114b4863c65959c92b13ee52f87c

*/
 
type ResponseData = {
  success: boolean,
  message: string,
  data?: object
}

const prepareRatingsAndObservees = (oRatingsWithMetaData:RatingsWithMetaDataCV0o,startingTimestamp:number) => {
  console.log(`prepareRatingsAndObservees; ${secsToTime(startingTimestamp)}`)
  const aObservees:observee[] = []
  const numChars_in = JSON.stringify(oRatingsWithMetaData).length
  const megabyteSize_in = numChars_in / 1048576
  console.log(`megabyteSize_in: ${megabyteSize_in}`)
  // console.log(`oRatingsWithMetaData: ${JSON.stringify(oRatingsWithMetaData, null, 4)}`)
  const oRatingsIn:RatingsCV0o = oRatingsWithMetaData.data
  const context = 'notSpam'
  const oRatingsOut:RatingsV0o = {}
  oRatingsOut[context] = {}
  const ratingsMetaData = oRatingsWithMetaData.metaData
  if (ratingsMetaData?.compactFormat) {
    const oReplacements = ratingsMetaData.replacements
    // cycle through ratings
    const aRaters = Object.keys(oRatingsIn[context])
    console.log(`prepareRatingsAndObservees; num raters in total: ${aRaters.length};`)
    for (let r=0; r < Math.min(aRaters.length, 4000); r++) {
      const rater:string = aRaters[r]
      oRatingsOut[context][rater] = {}
      const aRatees = Object.keys(oRatingsIn[context][rater])
      for (let z=0; z < Math.min(aRatees.length, 1000); z++) {
        const ratee:string = aRatees[z]
        if (!aObservees.includes(ratee)) {
          aObservees.push(ratee)
        }
        const placeholder:string = oRatingsIn[context][rater][ratee]
        if (oReplacements[placeholder]) {
          const score = oReplacements[placeholder].score
          const confidence = oReplacements[placeholder].confidence
          oRatingsOut[context][rater][ratee] = {
            score,
            confidence
          }
        }
      }
    }
  } else {
    // ratingsOut = oRatingsWithMetaData.data
  }
  // console.log(`oRatingsOut: ${JSON.stringify(oRatingsOut, null, 4)}`)
  console.log(`prepareRatingsAndObservees; ${secsToTime(startingTimestamp)}; num observees being processed: ${aObservees.length}`)
  const numChars_out = JSON.stringify(oRatingsOut).length
  const megabyteSize_out = numChars_out / 1048576
  console.log(`megabyteSize_out: ${megabyteSize_out}`)
  return { oRatingsOut, aObservees }
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
        const startingTimestamp = Math.floor(Date.now() / 1000)
        console.log(`startingTimestamp: ${startingTimestamp}`)
        const res_customers_customerData = await client.sql`SELECT * FROM customers WHERE pubkey=${pubkey1}`
        if (res_customers_customerData.rowCount == 0) {
          // const uID = res_customers_customerData.rows[0].userID
          // return an error because supplied pubkey is not a customer
          const response:ResponseData = {
            success: false,
            message: 'api/grapevine/calculate/basicNetwork: supplied pubkey is not a customer'
          }
          res.status(500).json(response)
        }
        const res_users_customerData = await client.sql`SELECT * FROM users WHERE pubkey=${pubkey1}`
        if (res_users_customerData.rowCount == 0) {
          // return an error because pubkey is not in the main user database
          const response:ResponseData = {
            success: false,
            message: 'api/grapevine/calculate/basicNetwork: supplied pubkey is not in the users database; either has not followed anybody, or follows have not been fetched.'
          }
          res.status(500).json(response)
        }

        console.log(`===== A ===== time since starting: ${secsToTime(startingTimestamp)}`)

        if ( (res_customers_customerData.rowCount == 1) && (res_users_customerData.rowCount == 1) ) {
          const userID = res_users_customerData.rows[0].id
          const customerID = res_customers_customerData.rows[0].id
          const protocolCategoryTableName = 'grapeRankProtocols'
          const protocolSlug = 'basicGrapevineNetwork'

          const res_params_default = await client.sql`SELECT * FROM protocolparameters WHERE customerID=1 AND protocolCategoryTableName=${protocolCategoryTableName} AND protocolSlug=${protocolSlug}`
          const params_def = res_params_default.rows[0].params
          const sParams_def = JSON.stringify(params_def)
          const sParams_default = sParams_def.replaceAll('self',userID)
          const oParams_default = JSON.parse(sParams_default)
          console.log('default params: ' + JSON.stringify(oParams_default, null, 4))
          const res_params_customer = await client.sql`SELECT * FROM protocolparameters WHERE customerID=${customerID} AND protocolCategoryTableName=${protocolCategoryTableName} AND protocolSlug=${protocolSlug}`
          let params_data:GrapeRankParametersBasicNetwork = oParams_default
          if (res_params_customer.rowCount == 1) {
            const params_cust = res_params_customer.rows[0].params
            const sParams_customer = params_cust.replaceAll('self',userID)
            const oParams_customer = JSON.parse(sParams_customer)
            params_data = oParams_customer
            console.log('default customer: ' + JSON.stringify(oParams_customer, null, 4))
          } else {
            console.log('The customer does not have preferred parameters. Default parameters will be used.')
          }
          console.log(`===== B ===== time since starting: ${secsToTime(startingTimestamp)}`)
          const res_ratingsTables_customer = await client.sql`SELECT ratingswithmetadata FROM ratingsTables WHERE pubkey=${pubkey1}`
          console.log(`===== C ===== time since starting: ${secsToTime(startingTimestamp)}`)
          if (res_ratingsTables_customer.rowCount) {

            const oRatingsWithMetaDataCV0o_real:RatingsWithMetaDataCV0o = res_ratingsTables_customer.rows[0].ratingswithmetadata
            const oRatingsWithMetaDataCV0o:RatingsWithMetaDataCV0o = exampleRatingsWithMetaDataCV0o

            const ratings_metaData_test:RatingsMetaData = oRatingsWithMetaDataCV0o.metaData
            const compactFormat = ratings_metaData_test?.compactFormat
            console.log(compactFormat)
            // const oRatingsTable:RatingsV0o = oRatingsWithMetaData.data
            
            const grapeRankParametersWithMetaData:GrapeRankParametersWithMetaData = {
              metaData: {
                grapeRankProtocolUID: 'basicGrapevineNetwork',
                compactFormat
              },
              data: params_data
            }

            // const ratings_:RatingsV0o = prepareRatingsAndObservees(oRatingsWithMetaDataCV0o,startingTimestamp)
            console.log(`===== D ===== time since starting: ${secsToTime(startingTimestamp)}`)
            const oFoo = prepareRatingsAndObservees(oRatingsWithMetaDataCV0o_real,startingTimestamp)
            console.log(`===== E ===== time since starting: ${secsToTime(startingTimestamp)}`)
            const ratings_prepared:RatingsV0o = oFoo.oRatingsOut
            const aObservees = oFoo.aObservees
            // console.log(typeof ratings_)
            
            // REPLACE WITH REAL DATA
            // const ratings_test:RatingsV0o = exampleRatingsV0o // replace this with data from ratings table (matched to this customer)
            // const ratings_test:RatingsCV0o = exampleRatingsCV0o
            // 

            // const ratings:RatingsV0o = oRatingsWithMetaData.data

            // const grapeRankParametersWithMetaData:GrapeRankParametersWithMetaData = defaultGrapeRankNotSpamParametersWithMedaData // replace this with user supplied preferences from grapeRankProtocols table (matched to this customer)
            // const scorecards:ScorecardsV3 = {} // first round scorecards should be empty
            // const scorecardsOutWithMetaData_actualData_R1:ScorecardsWithMetaDataV3 = coreGrapeRankCalculator(ratings,scorecards,grapeRankParametersWithMetaData)

            // WITH TEST DATA -- SEEMS TO WORK
            // const scorecards_in_test:ScorecardsV3 = exampleScorecardsV3
            // console.log(typeof scorecards_in_test)

            /*
            // TODO 18Oct2024
            - prepareObservees: make aObservees only once so don't have to re-do it with every iteration
            - Use oInfluenceOnly scorecards to save on room 
            - change prepareRatingsAndObservees to represent score, confidence as an array [a,b] instead of an object:
              - save on size
              - maybe faster to look up
            
            ALSO
            increase min number of iterations to see how high I can get it without crashing
            */

            const scorecards_in:ScorecardsV3 = {}
            // const grapeRankParametersWithMetaData:GrapeRankParametersWithMetaData = defaultGrapeRankNotSpamParametersWithMedaData

            let scorecardsOutWithMetaData:ScorecardsWithMetaDataV3 = coreGrapeRankCalculator(ratings_prepared,scorecards_in,grapeRankParametersWithMetaData,aObservees)
            let numCompletedIterations = 0
            do {
              scorecardsOutWithMetaData = coreGrapeRankCalculator(ratings_prepared,scorecardsOutWithMetaData.data,grapeRankParametersWithMetaData,aObservees)
              console.log(`===== numCompletedIterations: ${numCompletedIterations}; time since starting: ${secsToTime(startingTimestamp)}`)
              numCompletedIterations++
            } while (numCompletedIterations < 5)
            
            const sScorecardsWithMetaData = JSON.stringify(scorecardsOutWithMetaData)

            const scorecardsTableName = 'notSpam'
            // const currentTimestamp = Math.floor(Date.now() / 1000)

            const result_insert = await client.sql`INSERT INTO scorecardsTables (name, customerid, pubkey) VALUES (${scorecardsTableName}, ${customerID}, ${pubkey1}) ON CONFLICT DO NOTHING;`
            // const result_update = await client.sql`UPDATE scorecardsTables SET scorecardswithmetadata=${sScorecardsWithMetaData}, lastupdated=${currentTimestamp} WHERE name=${scorecardsTableName} AND pubkey=${pubkey1} ;`

            console.log('!!!!!! insert' + typeof result_insert)
            // console.log('!!!!!! update' + typeof result_update)

            const sScorecardsWithMetaDataChars = sScorecardsWithMetaData.length
            const megabyteSize = sScorecardsWithMetaDataChars / 1048576
            const response:ResponseData = {
              success: true,
              message: 'api/grapevine/calculate/basicNetwork: calculations successful!',
              data: {
                megabyteSize,
                scorecardsOutWithMetaData: scorecardsOutWithMetaData
              }
            }
            res.status(200).json(response)
          }
          const response:ResponseData = {
            success: true,
            message: 'api/grapevine/calculate/basicNetwork: made it to the end of the try block',
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