import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";

/*
to access:
http://localhost:3000/api/tests/addDog?name=spot
https://calculation-brainstorm.vercel.app/tests/addDog?name=spot
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
  if (!searchParams.name) {
    res.status(200).json({ message: 'tests/addDog api: name not provided' })
  }
  if (searchParams.name) {
    const name1 = searchParams.name
    if (typeof name1 == 'string') {
      const client = await db.connect();
      try {
        const result_exists = await client.sql`SELECT EXISTS(SELECT 1 FROM dogs WHERE name=${name1}) AS "exists"`
        console.log(result_exists)
        if (result_exists.rows[0].exists == true) {
          // do nothing
          console.log('name already exists in database')
          res.status(200).json({ message: 'name ' + name1 + ' already exists in the dog database' })
        } else {
          const result_insert = await client.sql`INSERT INTO dogs (name) VALUES (${name1})`
          console.log(result_insert)
          res.status(200).json({ message: `name ${name1} inserted into the calculation engine dog database` })
        }
        res.status(200).json({ message: 'this is the tests/addDog api' })
      } catch (error) {
        console.log(error)
      } finally {
        client.release();
      }
    } else {
      res.status(200).json({ message: 'the provided name is invalid' })
    }
  }
}