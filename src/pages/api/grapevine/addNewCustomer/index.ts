import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";
import { verifyPubkeyValidity } from '@/helpers/nip19';

/*
to access:
http://localhost:3000/api/grapevine/addNewCustomer?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f
https://calculation-brainstorm.vercel.app/api/grapevine/addNewCustomer?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f
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
  if (!searchParams.pubkey) {
    res.status(200).json({ message: 'grapevine/addNewCustomer api: pubkey not provided' })
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
          res.status(200).json({ message: 'pubkey ' + pubkey1 + ' already exists in the customer database' })
        } else {
          const result_insert = await client.sql`INSERT INTO users (pubkey) VALUES (${pubkey1})`
          console.log(result_insert)
          res.status(200).json({ message: `pubkey ${pubkey1} inserted into the calculation engine customer database` })
        }
        res.status(200).json({ message: 'this is the grapevine/addNewCustomer api' })
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