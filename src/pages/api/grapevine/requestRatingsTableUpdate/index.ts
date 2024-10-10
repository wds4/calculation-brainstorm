import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";
import { verifyPubkeyValidity } from '@/helpers/nip19';

/*
to access:
http://localhost:3000/api/grapevine/requestRatingsTableUpdate?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

https://calculation-brainstorm.vercel.app/api/grapevine/requestRatingsTableUpdate?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

*/

type ResponseData = {
  success: boolean,
  message: string
}

// const testUrl = 'https://interpretation-brainstorm.vercel.app/api/requestInterpretation?req={"universalInterpretationProtocolID":"recommendedBrainstormNotBotsInterpretationProtocol","parameters":"foo"}'

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
      message: `grapevine/requestRatingsTableUpdate api: pubkey not provided`
    }
    res.status(500).json(response)
  }
  if (searchParams.pubkey) {
    // const pubkey1 = 'e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f'
    const pubkey1 = searchParams.pubkey
   if ((typeof pubkey1 == 'string') && (verifyPubkeyValidity(pubkey1)) ) {
      const interpEngineUrl = `https://interpretation-brainstorm.vercel.app/api/requestInterpretation?req={"universalInterpretationProtocolID":"recommendedBrainstormNotBotsInterpretationProtocol","parameters":{"context":"notSpam","pubkeys":["${pubkey1}"],"depth":5,"follows":{"score":1.0,"confidence":0.05},"mutes":{"score":0.0,"confidence":0.10}}}`
      const currentTimestamp = Math.floor(Date.now() / 1000)
      const client = await db.connect();
      try {
        const result_exists = await client.sql`SELECT EXISTS(SELECT 1 FROM users WHERE pubkey=${pubkey1}) AS "exists"`
        console.log(result_exists)
        if (result_exists.rows[0].exists == true) {
          fetch(interpEngineUrl)
            .then((response) => response.json())
            .then(async (data) => {
              // console.log('!!!!!!!!!!!!!!!!!!!!!! received data: ' + JSON.stringify(data)) 
              const ratingsTableName = 'default'
              const oRatingsTable = data.ratingsTable
              const sRatingsTable = JSON.stringify(oRatingsTable)
              const oDosStats = data.dosData
              const sDosStats = JSON.stringify(oDosStats)
              // console.log('oRatingsTable: ' + JSON.stringify(oRatingsTable))
              const result_insert = await client.sql`INSERT INTO ratingsTables (name, pubkey) VALUES (${ratingsTableName}, ${pubkey1}) ON CONFLICT DO NOTHING;`
              const result_update = await client.sql`UPDATE ratingsTables SET ratingsTable=${sRatingsTable}, dosStats=${sDosStats}, lastUpdated=${currentTimestamp} WHERE name=${ratingsTableName} AND pubkey=${pubkey1} ;`
              console.log(typeof result_insert)
              console.log(typeof result_update)
              console.log('!!!!!!!!!!! ratingsTableName: ' + ratingsTableName)
              console.log('!!!!!!!!!!! sRatingsTable: ' + sRatingsTable)
              console.log('!!!!!!!!!!! sDosStats: ' + sDosStats)
              const response:ResponseData = {
                success: true,
                message: 'pubkey ' + pubkey1 + ' already exists in the customer database; another ratingsTable was requested from the interp engine; it was stored locally in sql.'
              }
              res.status(200).json(response)
            })
        } else {
          const response:ResponseData = {
            success: false,
            message: `pubkey ${pubkey1} does not yet exist in the calculation engine customer database. Register first before requesting the ratings table.`
          }
          res.status(500).json(response)
        }
      } catch (error) {
        console.log(error)
        const response:ResponseData = {
          success: false,
          message: `unknown error`
        }
        res.status(500).json(response)
      } finally {
        client.release();
      }
    } else {
      const response:ResponseData = {
        success: false,
        message: `the provided pubkey is invalid`
      }
      res.status(500).json(response)
    }
  }
}