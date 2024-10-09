import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";
import { verifyPubkeyValidity } from '@/helpers/nip19';

/*
to access:
http://localhost:3000/api/grapevine/showStoredRatingsTable?name=default&pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

https://calculation-brainstorm.vercel.app/api/grapevine/showStoredRatingsTable?name=default&pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

*/

type ResponseData = {
  success: boolean,
  message: string,
  data?: object
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
          const aContexts = Object.keys(oRatingsTable)
          let numRaters = 0
          let numRatings = 0
          for (let c=0; c < aContexts.length; c++) {
            const nextContext = aContexts[c]
            const aRaters = Object.keys(oRatingsTable[nextContext])
            for (let r=0; r < aRaters.length; r++) {
              const nextRater = aRaters[r]
              const aRatees = Object.keys(oRatingsTable[nextContext][nextRater])
              numRaters++
              for (let x=0; x < aRatees.length; x++) {
                // const nextRatee = aRatees[x]
                numRatings++
              }
            }
          }

          const sRatingsTable = JSON.stringify(oRatingsTable)
          const ratingsTableChars = sRatingsTable.length
          const megabyteSize = ratingsTableChars / 1048576
          const oDosStats = res1.rows[0].dosstats
          const sDosStats = JSON.stringify(oDosStats)
          const lastUpdated = res1.rows[0].lastupdated
          const response:ResponseData = {
            success: true,
            message: `Ratings Table found in our database!!`,
            data: {
              name: res1.rows[0].name,
              lastUpdated: lastUpdated,
              dosStats: sDosStats,
              ratingsTableData: {
                contexts: aContexts,
                numRaters: numRaters,
                numRatings: numRatings,
                megabytes: megabyteSize,
                ratingsTable: sRatingsTable
              }
            }
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
        message: `the provided pubkey is invalid`
      }
      res.status(200).json(response)
    }
  }
}