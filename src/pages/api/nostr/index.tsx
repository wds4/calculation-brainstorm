import NDK from '@nostr-dev-kit/ndk'
import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "@vercel/postgres";

/*
to access:
http://localhost:3000/api/nostr
https://calculation-brainstorm.vercel.app/api/nostr
*/

const explicitRelayUrls = [
  'wss://purplepag.es',
  'wss://profiles.nostr1.com',
  'wss://relay.damus.io'
]
const ndk = new NDK({explicitRelayUrls})

type ResponseData = {
  message: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const client = await db.connect();
  try {
    await ndk.connect()
    
    const pubkey1 = 'e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f'
    const filter = { kinds: [3], authors: [pubkey1], limit: 10 }
  
    const sub1 = ndk.subscribe(filter)
    sub1.on('event', async (event) => {
      console.log('event id: ' + event.id)
      console.log('event author: ' + event.pubkey)
      res.status(200).json({ message: 'nostr: kind 3 event received for author: ' + event.pubkey + '; event.id: ' + event.id })
    })
    sub1.on('eose', async () => {
      res.status(200).json({ message: 'nostr: eose received from sub1.'})
    })
  } catch (error) {
    console.log(error)
  } finally {
    client.release();
  }
}