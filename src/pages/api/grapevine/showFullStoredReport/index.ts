import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";
import { verifyPubkeyValidity } from '@/helpers/nip19';
import { ScorecardsV3, ScorecardsWithMetaDataV3 } from '@/types';
import { arrayToObject } from '@/helpers';

/*
returns all data from scorecardsTables and dosSummaries corresponding to the indicated customer

to access:
pubkey: e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

http://localhost:3000/api/grapevine/showFullStoredReport?name=notSpam&pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

https://calculation-brainstorm.vercel.app/api/grapevine/showFullStoredReport?name=notSpam&pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

pubkey: a08175d65051c08b83600abf6f5c18efd455114b4863c65959c92b13ee52f87c

http://localhost:3000/api/grapevine/showFullStoredReport?name=notSpam&pubkey=a08175d65051c08b83600abf6f5c18efd455114b4863c65959c92b13ee52f87c

https://calculation-brainstorm.vercel.app/api/grapevine/showFullStoredReport?name=notSpam&pubkey=a08175d65051c08b83600abf6f5c18efd455114b4863c65959c92b13ee52f87c

*/

type ResponseData = {
  success: boolean,
  message: string,
  exists?: boolean,
  megabyteSizePubkeyLookupByUserId?: number,
  megabyteSizeDosSummaries?: number,
  megabyteSizeScorecardsTables?: number,
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
    res.status(500).json(response)
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
        const resDosSummaries = await client.sql`SELECT * FROM dosSummaries WHERE pubkey=${pubkey1}`
        const resScorecardsTables = await client.sql`SELECT * FROM scorecardsTables WHERE pubkey=${pubkey1} AND name=${name}`
        const resMyUsersData = await client.sql`SELECT id, pubkey FROM users WHERE pubkey=${pubkey1}`;
        const userId1 = resMyUsersData.rows[0].id

        const resultUsers = await client.sql`SELECT id, pubkey FROM users`;

        const oPubkeyLookupByUserId = arrayToObject(resultUsers.rows, 'id')
        
        console.log('============ A')
        if (resDosSummaries.rowCount && resScorecardsTables.rowCount) {
          console.log(`============ B: ${resDosSummaries.rowCount} - ${resScorecardsTables.rowCount}`)
          const lastUpdatedScorecardsTables = resScorecardsTables.rows[0].lastupdated
          const lastUpdatedDosSummaries = resDosSummaries.rows[0].lastupdated
          if (!lastUpdatedScorecardsTables || !lastUpdatedDosSummaries) {
            const response:ResponseData = {
              success: false,
              message: `DosSummaries and/or ScorecardsTables have not been created.`
            }
            res.status(500).json(response)
          }

          const oScorecardsWithMetadata:ScorecardsWithMetaDataV3 = resScorecardsTables.rows[0].scorecardswithmetadata
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
          const megabyteSizeScorecardsTables = scorecardsChars / 1048576

          const megabyteSizeDosSummaries = JSON.stringify(resDosSummaries).length / 1048576
          const dosData = resDosSummaries.rows[0].dosdata // this is a small file; show number of pubkeys for each DoS away
          const lookupIdsByDos = resDosSummaries.rows[0].lookupidsbydos // this is a large file; contains the entire list of users (by id from users table) for each DoS away
        
          // iterate through oScorecards and dosData so that only relevant pubkeys are included in userId lookup object
          const oPubkeyLookupByUserId_pruned:{[key:string]: object} = {}
          const oObservees = oScorecards.notSpam[userId1]
          const aObservees = Object.keys(oObservees)
          oPubkeyLookupByUserId_pruned[userId1] = oPubkeyLookupByUserId[pubkey1]
          for (let x = 0; x < aObservees.length; x++) {
            const observeeId = aObservees[x]
            oPubkeyLookupByUserId_pruned[observeeId] = oPubkeyLookupByUserId[observeeId]
          }

          const megabyteSizePubkeyLookupByUserId = JSON.stringify(oPubkeyLookupByUserId_pruned).length / 1048576

          const response:ResponseData = {
            success: true,
            message: `Data for this pubkey was found in the ScorecardsTables and dosSummaries tables.`,
            exists: true,
            megabyteSizePubkeyLookupByUserId: megabyteSizePubkeyLookupByUserId,
            megabyteSizeDosSummaries: megabyteSizeDosSummaries,
            megabyteSizeScorecardsTables: megabyteSizeScorecardsTables,
            data: {
              pubkeyLookupByUserId: oPubkeyLookupByUserId_pruned,
              dosData: {
                lastUpdated: lastUpdatedDosSummaries,
                dosData,
                lookupIdsByDos
              },
              scorecardsData: {
                name: resScorecardsTables.rows[0].name,
                lastUpdated: lastUpdatedScorecardsTables,
                contexts: aContexts,
                numObservers,
                numObservations,
                scorecards: oScorecards
              }
            }
          }
          res.status(200).json(response)
        } else {
          console.log('============ C')
          const response:ResponseData = {
            success: false,
            message: `Data for this pubkey was not found in both the ScorecardsTables and dosSummaries tables.`
          }
          res.status(500).json(response)
        }

      } catch (error) {
        const response:ResponseData = {
          success: false,
          message: `error: ${error}`
        }
        res.status(500).json(response)
        console.log(error)
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
  } else {
    const response:ResponseData = {
      success: false,
      message: 'grapevine/showFullStoredReport api: name and / or pubkey not provided'
    }
    res.status(500).json(response)
  }
}