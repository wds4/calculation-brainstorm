import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";
import { verifyPubkeyValidity } from '@/helpers/nip19';

/*
to access:
http://localhost:3000/api/grapevine/requestRatingsTableUpdate?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

https://calculation-brainstorm.vercel.app/api/grapevine/requestRatingsTableUpdate?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

*/

type ResponseData = {
  message: string
}

const testUrl = 'https://interpretation-brainstorm.vercel.app/api/requestInterpretation?req={"universalInterpretationProtocolID":"recommendedBrainstormNotBotsInterpretationProtocol","parameters":"foo"}'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const searchParams = req.query
  if (searchParams.npub) {
    // TODO: support npub
  }
  if (!searchParams.pubkey) {
    res.status(200).json({ message: 'grapevine/requestRatingsTableUpdate api: pubkey not provided' })
  }
  if (searchParams.pubkey) {
    // const pubkey1 = 'e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f'
    const pubkey1 = searchParams.pubkey
    if ((typeof pubkey1 == 'string') && (verifyPubkeyValidity(pubkey1)) ) {
      const client = await db.connect();
      try {
        const result_exists = await client.sql`SELECT EXISTS(SELECT 1 FROM users WHERE pubkey=${pubkey1}) AS "exists"`
        console.log(result_exists)
        if (result_exists.rows[0].exists == true) {
          fetch(testUrl)
            .then((response) => response.json())
            .then(async (data) => {
              console.log('!!!!!!!!!!!!!!!!!!!!!! received data: ' + JSON.stringify(data)) 
              // TODO: store it locally
              const ratingsTableName = 'default'
              const oRatingsTable = data.ratingsTable
              const sRatingsTable = JSON.stringify(oRatingsTable)
              // console.log('oRatingsTable: ' + JSON.stringify(oRatingsTable))
              const result_insert = await client.sql`INSERT INTO ratingsTables (name, pubkey, ratingsTable) VALUES (${ratingsTableName}, ${pubkey1}, ${sRatingsTable}) ON CONFLICT DO NOTHING;`
              console.log(result_insert)
              res.status(200).json({ message: 'pubkey ' + pubkey1 + ' already exists in the customer database; ratingsTable requested from the interp engine; here is what we received: ' + JSON.stringify(data) + '; it was stored locally in sql: ' })
            })
        } else {
          res.status(200).json({ message: `pubkey ${pubkey1} does not yet exist in the calculation engine customer database` })
        }
      } catch (error) {
        console.log(error)
      } finally {
        client.release();
      }
    } else {
      res.status(200).json({ message: 'the provided pubkey is invalid' })
    }
  }
}