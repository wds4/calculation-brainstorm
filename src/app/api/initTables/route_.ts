import { db } from "@vercel/postgres";
import { NextResponse } from "next/server";

/*
CREATE TABLE IF NOT EXISTS users(
  ID SERIAL PRIMARY KEY,
  pubkey VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS rawDataSourceCategories(
  ID SERIAL PRIMARY KEY,
  SLUG TEXT UNIQUE NOT NULL,
  NAME TEXT,
  DESCRIPTION TEXT
);
*/

export async function GET(request: Request) {
  console.log(request)
  const client = await db.connect();
  try {
      await client.sql`DROP TABLE IF EXISTS users`;
      await client.sql`DROP TABLE IF EXISTS rawDataSourceCategories`;
      await client.sql`DROP TABLE IF EXISTS rawDataSources`;
      await client.sql`DROP TABLE IF EXISTS interpretationEngines`;
      await client.sql`DROP TABLE IF EXISTS interpretationProtocols`;
      await client.sql`
CREATE TABLE IF NOT EXISTS users(
  ID SERIAL PRIMARY KEY,
  pubkey VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS rawDataSourceCategories(
  ID SERIAL PRIMARY KEY,
  SLUG TEXT UNIQUE NOT NULL,
  NAME TEXT,
  DESCRIPTION TEXT
);
      `;
      const res1 = await client.sql`INSERT INTO rawDataSourceCategories (slug, name) VALUES ('nostr', 'nostr') ON CONFLICT DO NOTHING;`;
      const res2 = await client.sql`INSERT INTO rawDataSourceCategories (slug, name) VALUES ('Amazon', 'Amazon') ON CONFLICT DO NOTHING;`;
      const res3 = await client.sql`INSERT INTO rawDataSourceCategories (slug, name) VALUES ('chatGPT', 'Chat GPT') ON CONFLICT DO NOTHING;`;
      const res4 = await client.sql`INSERT INTO rawDataSourceCategories (slug, name) VALUES ('AI', 'AI') ON CONFLICT DO NOTHING;`;
      console.log(res1)
      console.log(res2)
      console.log(res3)
      console.log(res4)
      await client.sql`
CREATE TABLE IF NOT EXISTS rawDataSources(
  ID SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rawDataSourceCategorySlug TEXT NOT NULL -- points to coreTable2, rawDataSourceCategories.slug (alternate: rawDataSourceCategoryID INT NOT NULL, points to rawDataSourceCategories.id)
);
      `;
      await client.sql`
INSERT INTO rawDataSources (slug, name, rawDataSourceCategorySlug) VALUES ('brainstormNostrRelay', 'The Awesome Brainstorm Nostr Relay', 'nostr' );
      `;
      await client.sql`
CREATE TABLE IF NOT EXISTS interpretationEngines(
  ID SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT,
  title TEXT,
  description TEXT,  
  aSupportedRawDataSourceCategorySlugs JSONB NOT NULL -- points to coreTable2, rawDataSourceCategories.slug (alternate: aSupportedRawDataSourceCategoryIDs INT NOT NULL, points to rawDataSourceCategories.id)
);
      `;
      await client.sql`
INSERT INTO interpretationEngines (slug, name, aSupportedRawDataSourceCategorySlugs ) VALUES ('BrainstormNostrInterpEngine', 'The Awesome Brainstorm Nostr Interpretation Engine', '{ "aSlugs": [ "nostr" ] }' );
      `;
      await client.sql`
CREATE TABLE IF NOT EXISTS interpretationProtocols(
  ID SERIAL PRIMARY KEY,
  slug TEXT NOT NULL,
  name TEXT,
  description TEXT,
  rawDataSourceCategorySlug TEXT NOT NULL, -- points to coreTable2, rawDataSourceCategories.slug (alternate: rawDataSourceCategoryID INT NOT NULL, points to rawDataSourceCategories.id)
  UNIQUE (slug, rawDataSourceCategorySlug )
);
      `;
      await client.sql`
INSERT INTO interpretationProtocols (slug, name, rawDataSourceCategorySlug ) VALUES ('basicFollowsInterpretation', 'the Standard Follows Interpretation', 'nostr' );
INSERT INTO interpretationProtocols (slug, name, rawDataSourceCategorySlug ) VALUES ('basicMutesInterpretation', 'the Standard Mutes Interpretation', 'nostr' );
INSERT INTO interpretationProtocols (slug, name, rawDataSourceCategorySlug ) VALUES ('basicReportsInterpretation', 'the Standard Reports Interpretation', 'nostr' );
INSERT INTO interpretationProtocols (slug, name, rawDataSourceCategorySlug ) VALUES ('expandedReportsInterpretation', 'the Expanded Reports Interpretation', 'nostr' );
INSERT INTO interpretationProtocols (slug, name, rawDataSourceCategorySlug ) VALUES ('standardGrapevineNetworkInterpretation', 'the Standard Grapevine Network Interpretation', 'nostr' ); -- this is a combo of follows, mutes, and reports all in one

      `;
      await client.sql`

      `;
      await client.sql`

      `;



      return NextResponse.json({ res1 }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  } finally {
    client.release();
  }
}