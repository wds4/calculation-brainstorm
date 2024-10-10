/*
to access:
http://localhost:3000/api/grapevine/calculate/basicNetwork?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f
https://calculation-brainstorm.vercel.app/api/grapevine/calculate/basicNetwork?pubkey=e5272de914bd301755c439b88e6959a43c9d2664831f093c51e9c799a16a102f
*/

import type { NextApiRequest, NextApiResponse } from 'next'
 
type ResponseData = {
  success: boolean,
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
      message: 'grapevine calculation engine grapevine/calculate/basicNetwork api: pubkey not provided'
    }
    res.status(200).json(response)
  }
  const response:ResponseData = {
    success: false,
    message: 'Calculation Engine Grapevine API: apr/grapevine/calculate/basicNetwork.'
  }
  res.status(200).json(response)
}