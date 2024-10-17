import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";
import { verifyPubkeyValidity } from '@/helpers/nip19';
import { ScorecardsV3, ScorecardsWithMetaDataV3 } from '@/types';

/*
to access:
http://localhost:3000/api/grapevine/showStoredScorecardsTable?name=notSpam&pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

https://calculation-brainstorm.vercel.app/api/grapevine/showStoredScorecardsTable?name=notSpam&pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

*/

type ResponseData = {
  success: boolean,
  message: string,
  exists?: boolean,
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
    const response:ResponseData = {
      success: false,
      message: 'grapevine/showStoredScorecardsTable api: name and / or pubkey not provided'
    }
    res.status(200).json(response)
  }
  if ((searchParams.pubkey) && (searchParams.name)) {
    // const pubkey1 = 'e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f'
    // const name = 'default' // the name of the ratingsTable
    const pubkey1 = searchParams.pubkey
    const name = searchParams.name
    if ((typeof pubkey1 == 'string') && (verifyPubkeyValidity(pubkey1) && (typeof name == 'string')) ) {
      console.log('============ connecting to the db client now')
      const client = await db.connect();
      try {
        const res1 = await client.sql`SELECT * FROM scorecardsTables WHERE pubkey=${pubkey1} AND name=${name}`

        if (!res1.rowCount) {
          const response:ResponseData = {
            success: false,
            message: `error: no scorecards table entry was found for this user and for this scorecards table name.`
          }
          res.status(500).json(response)
        }
        if (res1.rowCount) {
          const lastUpdated = res1.rows[0].lastupdated
          if (!lastUpdated) {
            const response:ResponseData = {
              success: false,
              message: `error: scorecards have not been calculated for this user.`
            }
            res.status(500).json(response)
          }

          const oScorecardsWithMetadata:ScorecardsWithMetaDataV3 = res1.rows[0].scorecardswithmetadata
          const oScorecards:ScorecardsV3 = oScorecardsWithMetadata.data
          const aContexts:string[] = Object.keys(oScorecards)

          let numObservers = 0
          let numObservations = 0
          for (let c=0; c < aContexts.length; c++) {
            const nextContext = aContexts[c]
            const aObservers = Object.keys(oScorecards[nextContext])
            for (let r=0; r < aObservers.length; r++) {
              const nextObserver = aObservers[r]
              const aObservees = Object.keys(oScorecards[nextContext][nextObserver])
              numObservers++
              for (let x=0; x < aObservees.length; x++) {
                // const nextRatee = aRatees[x]
                numObservations++
              }
            }
          }

          const sScorecards = JSON.stringify(oScorecards)
          const scorecardsChars = sScorecards.length
          const megabyteSize = scorecardsChars / 1048576
          const response:ResponseData = {
            success: true,
            message: `Scorecards Table found in our database!!`,
            exists: true,
            data: {
              name: res1.rows[0].name,
              lastUpdated: lastUpdated,
              scorecardsData: {
                contexts: aContexts,
                numObservers,
                numObservations,
                megabytes: megabyteSize,
                scorecards: oScorecards
              }
            }
          }
          res.status(200).json(response)
        }

      } catch (error) {
        console.log(error)
        const response:ResponseData = {
          success: false,
          message: `error: ${error}`
        }
        res.status(500).json(response)
      } finally {
        client.release();
        console.log('============ releasing the db client now')
      }
    } else {
      const response:ResponseData = {
        success: false,
        message: `the provided pubkey and / or ratings table name is invalid`
      }
      res.status(500).json(response)
    }
  }
}