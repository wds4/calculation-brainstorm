import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";
import { verifyPubkeyValidity } from '@/helpers/nip19';

/*
to access:
http://localhost:3000/api/grapevine/showStoredRatingsTable?name=default&pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

https://calculation-brainstorm.vercel.app/api/grapevine/showStoredRatingsTable?name=default&pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

*/

type ResponseData = {
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
    res.status(200).json({ message: 'grapevine/showStoredRatingsTable api: name and / or pubkey not provided' })
  }
  if ((searchParams.pubkey) && (searchParams.name)) {
    // const pubkey1 = 'e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f'
    // const name = 'default' // the name of the ratingsTable
    const pubkey1 = searchParams.pubkey
    const name = searchParams.name
    if ((typeof pubkey1 == 'string') && (verifyPubkeyValidity(pubkey1) && (typeof name == 'string')) ) {
      const client = await db.connect();
      try {
        const res1 = await client.sql`SELECT * FROM ratingsTables WHERE pubkey=${pubkey1} AND name=${name}`
        if (res1.rowCount) {
          const oRatingsTable = res1.rows[0].ratingstable
          const sRatingsTable = JSON.stringify(oRatingsTable)
          res.status(200).json({ message: 'Here is the ratings table in our database: ' + sRatingsTable })
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