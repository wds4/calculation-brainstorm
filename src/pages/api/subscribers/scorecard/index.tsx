import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";
import { verifyPubkeyValidity } from '@/helpers/nip19';
import { ScorecardsWithMetaDataV3 } from '@/types';

/*
to access:
pubkey: e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f
observed: 020f2d21ae09bf35fcdfb65decf1478b846f5f728ab30c5eaabcd6d081a81c3e (adam3us)
http://localhost:3000/api/subscribers/scorecard?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f&observed=020f2d21ae09bf35fcdfb65decf1478b846f5f728ab30c5eaabcd6d081a81c3e

https://calculation-brainstorm.vercel.app/api/subscribers/scorecard?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f&observed=020f2d21ae09bf35fcdfb65decf1478b846f5f728ab30c5eaabcd6d081a81c3e
*/

type ResponseData = {
  success: boolean,
  message: string,
  data?: object,
}
 
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const searchParams = req.query
  if (!searchParams.pubkey) {
    const response:ResponseData = {
      success: false,
      message: 'grapevine calculation engine subscribers/scorecard api: pubkey of subscriber not provided'
    }
    res.status(200).json(response)
  }
  if (!searchParams.observed) {
    const response:ResponseData = {
      success: false,
      message: 'grapevine calculation engine subscribers/scorecard api: pubkey of observed not provided'
    }
    res.status(200).json(response)
  }
  if (searchParams.pubkey) {
    const pubkey1 = searchParams.pubkey
    const observed = searchParams.observed
    if ( (typeof pubkey1 == 'string') && (verifyPubkeyValidity(pubkey1)) && (typeof observed == 'string') && (verifyPubkeyValidity(observed)) ) {
      const client = await db.connect();
      try {
        const result_customer = await client.sql`SELECT * FROM customers WHERE pubkey=${pubkey1} `
        console.log(result_customer)
        if (result_customer.rowCount) {
          const result_users_customer = await client.sql`SELECT id FROM users WHERE pubkey=${pubkey1}`
          const result_users_observed = await client.sql`SELECT id FROM users WHERE pubkey=${observed}`
          const customerUserId = result_users_customer.rows[0].id
          const observedUserId = result_users_observed.rows[0].id
          // fetch scorecards and return them
          const scorecardsTableName = 'notSpam'
          const res_scorecards_customer = await client.sql`SELECT scorecardswithmetadata FROM scorecardsTables WHERE pubkey=${pubkey1} AND name=${scorecardsTableName}`
          if (res_scorecards_customer.rowCount) {
            const scorecardsWithMetaData:ScorecardsWithMetaDataV3 = res_scorecards_customer.rows[0].scorecardswithmetadata
            // TODO: fetch the scorecard of the observed and return it
            console.log(`scorecardsWithMetaData: ${typeof scorecardsWithMetaData}`)
            const oScorecards = scorecardsWithMetaData.data.notSpam
            if (oScorecards.hasOwnProperty(customerUserId)) {
              if (oScorecards[customerUserId].hasOwnProperty(observedUserId)) {
                const oScorecard = oScorecards[customerUserId][observedUserId]
                const response:ResponseData = {
                  success: true,
                  message: 'here is the scorecard you requested:',
                }
                if (typeof oScorecard == 'object') {
                  response.data = {
                    observer: pubkey1,
                    observed: observed,
                    grapeRank: oScorecard
                  }
                }
                res.status(200).json(response)
              }
            }
            const response:ResponseData = {
              success: false,
              message: 'the requested data was not found.',
            }
            res.status(500).json(response)
          } else {
            const response:ResponseData = {
              success: false,
              message: 'scorecards data for pubkey ' + pubkey1 + ' was not found in the scorecardsTables database.',
            }
            res.status(500).json(response)
          }
        } else {
          const response:ResponseData = {
            success: false,
            message: `grapevine calculation engine subscribers/scorecard api: pubkey ${pubkey1} does not exist in the calculation engine customer database`,
          }
          res.status(500).json(response)
        }
      } catch (error) {
        console.log(error)
      } finally {
        client.release();
      }
    } else {
      const response:ResponseData = {
        success: false,
        message: 'grapevine calculation engine subscribers/scorecard api: the provided pubkey is invalid',
      }
      res.status(200).json(response)
    }
  }
}