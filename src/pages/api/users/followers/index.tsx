import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";
import { verifyPubkeyValidity } from '@/helpers/nip19';
// import { RatingsCV0o, RatingsWithMetaDataCV0o } from '@/types';
import { arrayToObject } from '@/helpers';

/*
to access:
pubkey: e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f
http://localhost:3000/api/users/followers?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f
https://calculation-brainstorm.vercel.app/api/users/followers?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

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
      message: 'grapevine calculation engine users/followers api: pubkey not provided'
    }
    res.status(200).json(response)
  }
  // TODO: need 2 params, one for the customer and one for the target
  // need customer pubkey to fetch from ratingsTables 
  // alternatively: create followers in a customer-agnostic way <== this 
  if (searchParams.pubkey) {
    const pubkey1 = searchParams.pubkey
    if ((typeof pubkey1 == 'string') && (verifyPubkeyValidity(pubkey1)) ) {
      const client = await db.connect();
      try {
        const result_pubkey1 = await client.sql`SELECT id, pubkey FROM users WHERE pubkey=${pubkey1}`
        if (result_pubkey1.rowCount) {
          const id1 = result_pubkey1.rows[0].id
          // calculated followers and muters for this profile
          const result_allUsers = await client.sql`SELECT id, pubkey, whenlastcreatedobserverobject, observerobject FROM users`;
          const oPubkeyLookupByUserId = arrayToObject(result_allUsers.rows, 'id')
          const aFollowers = []
          const aMuters = []
          for (let u=0; u < result_allUsers.rows.length; u++) {
            const whenLastCreatedObserverObject = result_allUsers.rows[u].whenlastcreatedobserverobject
            if (whenLastCreatedObserverObject) {
              const oObserverObject = result_allUsers.rows[u].observerobject              
              const id_rater = result_allUsers.rows[u].id
              const pk_rater = oPubkeyLookupByUserId[id_rater].pubkey
              if (oObserverObject[id_rater].hasOwnProperty(id1)) {
                const placeholder = oObserverObject[id_rater][id1]
                if (placeholder == 'f') {
                  aFollowers.push(pk_rater)
                }
                if (placeholder == 'm') {
                  aMuters.push(pk_rater)
                }
              }
            }
          }
          const response:ResponseData = {
            success: true,
            message: `grapevine calculation engine users/followers api for pubkey ${pubkey1}:`,
            data: {
              numUsers: result_allUsers.rows.length,
              numFollowers: aFollowers.length,
              numMuters: aMuters.length,
              aFollowers,
              aMuters
            }
          }
          res.status(200).json(response)

          /*
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
          */
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