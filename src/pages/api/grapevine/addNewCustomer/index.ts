import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";
import { verifyPubkeyValidity } from '@/helpers/nip19';

/*
to access:
http://localhost:3000/api/grapevine/addNewCustomer?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

https://calculation-brainstorm.vercel.app/api/grapevine/addNewCustomer?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

*/

type ResponseData = {
  success: boolean
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
    const response:ResponseData = {
      success: false,
      message: 'grapevine/addNewCustomer api: pubkey not provided',
    }
    res.status(500).json(response)
  }
  if (searchParams.pubkey) {
    const pubkey1 = searchParams.pubkey
    if ((typeof pubkey1 == 'string') && (verifyPubkeyValidity(pubkey1)) ) {
      const client = await db.connect();
      try {
        const result_exists = await client.sql`SELECT EXISTS(SELECT 1 FROM customers WHERE pubkey=${pubkey1}) AS "exists"`
        console.log(result_exists)
        if (result_exists.rows[0].exists == true) {
          // do nothing
          console.log('pubkey already exists in database')
          const response:ResponseData = {
            success: false,
            message: `pubkey ${pubkey1} already exists in the customer database`,
          }
          res.status(200).json(response)
        } else {
          const currentTimestamp = Math.floor(Date.now() / 1000)
          console.log('pubkey needs to be inserted!!!')

          const foo1 = await client.sql`INSERT INTO customers (pubkey, whensignedup) VALUES (${pubkey1}, ${currentTimestamp}) ON CONFLICT DO NOTHING;`
          console.log('foo1:')
          console.log(foo1)

          const foo2 = await client.sql`INSERT INTO users (pubkey) VALUES (${pubkey1}) ON CONFLICT DO NOTHING;`
          console.log('foo2:')
          console.log(foo2)
          
          const result_customers = await client.sql`SELECT id FROM customers WHERE pubkey=${pubkey1}`
          console.log('result_customers:')
          console.log(result_customers)
          
          const result_users = await client.sql`SELECT id FROM users WHERE pubkey=${pubkey1}`
          console.log('result_users:')
          console.log(result_users)

          const customerID = result_customers.rows[0].id
          const userID = result_users.rows[0].id
    
          await client.sql`INSERT INTO dosSummaries (pubkey, customerid, userid) VALUES (${pubkey1}, ${customerID}, ${userID}) ON CONFLICT DO NOTHING;`
          await client.sql`INSERT INTO ratingsTables (pubkey, customerid) VALUES (${pubkey1}, ${customerID}) ON CONFLICT DO NOTHING;`
          await client.sql`INSERT INTO scorecardsTables (pubkey, customerid) VALUES (${pubkey1}, ${customerID}) ON CONFLICT DO NOTHING;`
          const response:ResponseData = {
            success: true,
            message: `pubkey ${pubkey1} inserted successfully into the customer, user, dosSummaries, and ratingsTables tables`,
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
        message: 'the provided pubkey is invalid',
      }
      res.status(500).json(response)
    }
  }
}