/*
to access:
http://localhost:3000/api/tests
https://calculation-brainstorm.vercel.app/api/tests
*/

import type { NextApiRequest, NextApiResponse } from 'next'
 
type ResponseData = {
  message: string
}
 
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  res.status(200).json({ message: 'Calculation Engine API basic tests.' })
}