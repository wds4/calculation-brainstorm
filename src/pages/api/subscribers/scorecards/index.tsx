import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";
import { verifyPubkeyValidity } from '@/helpers/nip19';
import { ScorecardsWithMetaDataV3 } from '@/types';

/*
to access:
pubkey: e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f
http://localhost:3000/api/subscribers/scorecards?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f
https://calculation-brainstorm.vercel.app/api/subscribers/scorecards?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f
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
  if (searchParams.npub) {
    // TODO: support npub
  }
  if (!searchParams.pubkey) {
    const response:ResponseData = {
      success: false,
      message: 'grapevine calculation engine subscribers/scorecards api: pubkey not provided'
    }
    res.status(200).json(response)
  }
  if (searchParams.pubkey) {
    const pubkey1 = searchParams.pubkey
    if ((typeof pubkey1 == 'string') && (verifyPubkeyValidity(pubkey1)) ) {
      const client = await db.connect();
      try {
        const result_exists = await client.sql`SELECT EXISTS(SELECT 1 FROM customers WHERE pubkey=${pubkey1}) AS "exists"`
        console.log(result_exists)
        if (result_exists.rows[0].exists == true) {
          // fetch scorecards and return them
          const scorecardsTableName = 'notSpam'
          const res_scorecards_customer = await client.sql`SELECT scorecardswithmetadata FROM scorecardsTables WHERE pubkey=${pubkey1} AND name=${scorecardsTableName}`
          if (res_scorecards_customer.rowCount) {
            const scorecardsWithMetaData:ScorecardsWithMetaDataV3 = res_scorecards_customer.rows[0].scorecardswithmetadata
            const response:ResponseData = {
              success: true,
              message: 'scorecards data for pubkey ' + pubkey1 + ' was found in the scorecardsTables database.',
            }
            if (typeof scorecardsWithMetaData == 'object') {
              response.data = scorecardsWithMetaData
            }
            res.status(200).json(response)
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
            message: `grapevine calculation engine subscribers/scorecards api: pubkey ${pubkey1} does not exist in the calculation engine customer database`,
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
        message: 'grapevine calculation engine subscribers/scorecards api: the provided pubkey is invalid',
      }
      res.status(200).json(response)
    }
  }
}