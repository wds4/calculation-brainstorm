import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";
import { verifyPubkeyValidity } from '@/helpers/nip19';
import { RatingsCV0o, RatingsWithMetaDataCV0o } from '@/types';
import { arrayToObject } from '@/helpers';

/*
to access:
pubkey: e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f
http://localhost:3000/api/users/followers?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f
https://calculation-brainstorm.vercel.app/api/users/followers?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f
*/

const fetchFollowers = (oRatingsWithMetaData:RatingsWithMetaDataCV0o, pubkey1:string, oPubkeyLookupByUserId:{[key:string]: {[key: string]: string}}, oUserIdLookupByPubkey:{[key:string]: {[key:string]:number}}) => {
  const userId1 = oUserIdLookupByPubkey[pubkey1].id
  console.log(`typeof userId1: ${typeof userId1}`)
  const oRatingsIn:RatingsCV0o = oRatingsWithMetaData.data
  const aFollowers:string[] = []
  const aMuters:string[] = []
  const ratingsMetaData = oRatingsWithMetaData.metaData
  if (ratingsMetaData?.compactFormat) {
    const context = 'notSpam'
    const aRaters = Object.keys(oRatingsIn[context])
    for (let r=0; r < aRaters.length; r++) {
      const rater:string = aRaters[r]
      const aRatees = Object.keys(oRatingsIn[context][rater])
      for (let z=0; z < Math.min(aRatees.length, 1000); z++) {
        const ratee:string = aRatees[z]
        // if ((r < 5) && (z < 5)) { console.log(`typeof ratee: ${typeof ratee}`) }
        if (Number(ratee) == userId1) {
          // console.log(`FOUND A RATER!!!: ${rater}`)
          const pk_rater = oPubkeyLookupByUserId[rater].pubkey
          const placeholder:string = oRatingsIn[context][rater][ratee]
          if (placeholder == 'f') {
            aFollowers.push(pk_rater)
          }
          if (placeholder == 'm') {
            aMuters.push(pk_rater)
          }
        }
      }
    }
  }
  return { aFollowers, aMuters }
}

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
      message: 'grapevine calculation engine users/followers api: pubkey not provided'
    }
    res.status(200).json(response)
  }
  if (searchParams.pubkey) {
    const pubkey1 = searchParams.pubkey
    if ((typeof pubkey1 == 'string') && (verifyPubkeyValidity(pubkey1)) ) {
      const client = await db.connect();
      try {
        const result_exists = await client.sql`SELECT EXISTS(SELECT 1 FROM users WHERE pubkey=${pubkey1}) AS "exists"`
        console.log(result_exists)
        if (result_exists.rows[0].exists == true) {
          // calculated followers and muters for this profile
          const resultUsers = await client.sql`SELECT id, pubkey FROM users`;
          const oPubkeyLookupByUserId = arrayToObject(resultUsers.rows, 'id')
          const oUserIdLookupByPubkey = arrayToObject(resultUsers.rows, 'pubkey')
          const res_ratingsTables_customer = await client.sql`SELECT ratingswithmetadata FROM ratingsTables WHERE pubkey=${pubkey1}`
          if (res_ratingsTables_customer.rowCount) {
            const oRatingsWithMetaDataCV0o_real:RatingsWithMetaDataCV0o = res_ratingsTables_customer.rows[0].ratingswithmetadata
            const oFoo = fetchFollowers(oRatingsWithMetaDataCV0o_real,pubkey1,oPubkeyLookupByUserId,oUserIdLookupByPubkey)
            const aFollowers = oFoo.aFollowers
            const aMuters = oFoo.aMuters
            const response:ResponseData = {
              success: true,
              message: `followers and muters data:`,
              data: {
                pubkey: pubkey1,
                followers: aFollowers,
                muters: aMuters,
              }
            }
            res.status(200).json(response)
          }
          const response:ResponseData = {
            success: true,
            message: `grapevine calculation engine users/followers api: pubkey ${pubkey1} exists in the calculation engine users database`,
          }
          res.status(200).json(response)
        } else {
          const response:ResponseData = {
            success: false,
            message: `grapevine calculation engine users/followers api: pubkey ${pubkey1} does not exist in the calculation engine users database`,
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
        message: 'grapevine calculation engine users/followers api: the provided pubkey is invalid',
      }
      res.status(200).json(response)
    }
  }
}