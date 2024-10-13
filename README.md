This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

I followed the tutorial [here](https://www.telerik.com/blogs/integrate-serverless-sql-database-vercel-postgres) with some minor changes.

- `npx create-next-app` with name: calculation-brainstorm
- push repo to github
- deploy repo on Vercel by adding a new Project which imports the github repo
- create a Postgres database and connect it to the Project
- `npm i -g vercel@latest`
- `npm i @vercel/postgres`
- `vercel link` This step was omitted from the tutorial
- `vercel env pull .env.development.local`
- make sure `.env.development.local` exists locally and that the variables in that file match the ones in the Vercel project
- `npm run dev`
- create file at path: `src/app/api/test/route.ts` 
- visit `http://localhost:3000/api/test` which creates a table in the db which can be seen in the Vercel dashboard
- create file at path: `src/app/api/addPet/route.ts`
- visit `http://localhost:3000/api/addPet?petName=Johnny&ownerName=Mark` which adds a row to the table that was just created

Switch from `src/app` to `src/pages`

## nostr

```
npm install @nostr-dev-kit/ndk
npm install @noble/hashes
npm install nostr-tools
npm install nostr-hooks
```

Thought I needed to do these but I uninstalled them and still seems to work.

```
npm install ws
npm install websocket-polyfill 
# then on any nostr page:
import 'websocket-polyfill
```

## CORS

To fix CORS problems, add `vercel.json`:

```
{
    "headers": [
        {
            "source": "/api/(.*)",
            "headers": [
                { "key": "Access-Control-Allow-Credentials", "value": "true" },
                { "key": "Access-Control-Allow-Origin", "value": "*" },
                { "key": "Access-Control-Allow-Methods", "value": "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
                { "key": "Access-Control-Allow-Headers", "value": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" }
            ]
        }
    ]
}
```

## WORKFLOW

How data is scraped from generic nostr relays

### new customer sign up
- https://calculation-brainstorm.vercel.app/api/grapevine/addNewCustomer?pubkey=pk_customer
    - add pk_customer to customers table
- https://interpretation-brainstorm.vercel.app/api/nostr/listeners/singleUser?pubkey=pk_customer
    - add pk_customer to users table
    - listen for kind 3 and 10000 notes for pk_customer; add pubkeys to users.mutes and users.follows
- https://interpretation-brainstorm.vercel.app/api/manageData/singleUser/insertFollowsAndMutesIntoUsersTable?pubkey=pk_customer
    - for pk_customer, insert pubkeys from users.follows and users.mutes into users, so that they all have a userID
- https://interpretation-brainstorm.vercel.app/api/manageData/singleUser/createObserverObject?pubkey=pk_customer
    - for pk_customer, create observerObject, which is ultra compact (prefers userIDs; 'f' and 'm' format)
    - ??? erase users.follows and users.mutes once observerObject is created
- https://interpretation-brainstorm.vercel.app/api/nostr/listeners/singleUserFollows?pubkey=pk_customer
    - listen for kind 3 and 10000 notes for all follows of pk_customer in blocks of no more than 1000; do not repeat if this step is already achieved; add pubkeys to users.mutes and users.follows
- not yet coded
    - for pk_customer, create DoS summary and store -- where?
    - for pk_customer, create RatingsTables -- ??? do it quickly using DoS data plus users.observerObjects


In customers table, or maybe make two separate tables, need 
- columns for DoS network in compact format (userID instead of pubkey)
- column fo ScoreCards in ultra-compact format (userID and f, m format)

### database maintenance
- listen for kind 3 and 10000 notes for all users who need it, in blocks of no more than 1000

### 

## Getting Started

First, run the development server:

```bash
vercel dev
# or
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
