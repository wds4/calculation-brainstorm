/*
to access:
http://localhost:3000/api/grapevine/calculate
https://calculation-brainstorm.vercel.app/api/grapevine/calculate
*/

import type { NextApiRequest, NextApiResponse } from 'next'
 
type ResponseData = {
  message: string
}
 
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  res.status(200).json({ message: 'Calculation Engine Grapevine API: apr/grapevine/calculate.' })
}