import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";
import { verifyPubkeyValidity } from '@/helpers/nip19';

/*
to access:
http://localhost:3000/api/grapevine/checkCustomerStatus?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f
https://calculation-brainstorm.vercel.app/api/grapevine/checkCustomerStatus?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f
*/

type ResponseData = {
  success: boolean,
  message: string,
  exists?: boolean
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
      message: 'grapevine calculation engine grapevine/checkCustomerStatus api: pubkey not provided'
    }
    res.status(200).json(response)
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
          // do nothing
          console.log('pubkey already exists in database')
          const response:ResponseData = {
            success: true,
            message: 'pubkey ' + pubkey1 + ' already exists in the customer database',
            exists: true
          }
          res.status(200).json(response)
        } else {
          // const result_insert = await client.sql`INSERT INTO users (pubkey) VALUES (${pubkey1})`
          // console.log(result_insert)
          const response:ResponseData = {
            success: true,
            message: `grapevine calculation engine grapevine/checkCustomerStatus api: pubkey ${pubkey1} does not exist in the calculation engine customer database`,
            exists: false
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
        message: 'grapevine calculation engine grapevine/checkCustomerStatus api: the provided pubkey is invalid',
        exists: false
      }
      res.status(200).json(response)
    }
  }
}