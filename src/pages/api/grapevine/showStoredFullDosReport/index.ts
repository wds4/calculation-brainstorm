import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";
import { verifyPubkeyValidity } from '@/helpers/nip19';

/*
to access:
http://localhost:3000/api/grapevine/showStoredFullDosReport?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

https://calculation-brainstorm.vercel.app/api/grapevine/showStoredFullDosReport?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f

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
  if (!searchParams.pubkey) {
    const response:ResponseData = {
      success: false,
      message: 'grapevine/showStoredFullDosReport api: pubkey not provided'
    }
    res.status(200).json(response)
  }
  if (searchParams.pubkey) {
    const pubkey1 = searchParams.pubkey
    if ((typeof pubkey1 == 'string') && (verifyPubkeyValidity(pubkey1)) ) {
      console.log('============ connecting to the db client now')
      const client = await db.connect();
      try {
        const res1 = await client.sql`SELECT * FROM dosSummaries WHERE pubkey=${pubkey1}`

        if (res1.rowCount) {
          const megabyteSize = JSON.stringify(res1).length / 1048576

          const lastUpdated = res1.rows[0].lastupdated
          const dosData = res1.rows[0].dosdata // this is a small file; show number of pubkeys for each DoS away
          const lookupIdsByDos = res1.rows[0].lookupidsbydos // this is a large file; contains the entire list of users (by id from users table) for each DoS away
          
          const response:ResponseData = {
            success: true,
            message: `Full DoS Report found in our database!!`,
            exists: true,
            data: {
              lastUpdated: lastUpdated,
              megabytes: megabyteSize,
              dosData,
              lookupIdsByDos
            }
          }
          res.status(200).json(response)
        }

      } catch (error) {
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
      res.status(200).json(response)
    }
  } else {
    const response:ResponseData = {
      success: false,
      message: `no pubkey was provided`
    }
    res.status(200).json(response)
  }
}