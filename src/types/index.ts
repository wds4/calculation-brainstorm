/*
Main goal here is to define types for this equation:
G_out = coreGrapeRankCalculator(G_in, R, P)

G_out:ScorecardsTableObjectV3
G_in:ScorecardsTableObjectV3
R:RatingsTableObject
P:GrapeRankParameters

Or maybe use wrappers (which include metadata) for G_in and G_out?
*/

type context = string
type pubkey = string
type score = number // can refer to a rating as a primary data point or to an average of ratings, so may be referred to as rating, average, or averageScore. min, max depend on the use case (0-1 for notSpam; 0-5 for 5stars or products; may be negative in some use cases). 
type input = number // nonzero, no upper bound
type confidence = number // [0, 1]; can be de novo (rating) or calculated from input (scorecard)
type influence = number // score * confidence; useful if observee can play the role of a rater or observer at a future step; may be defined differently for other use cases (e.g. 5 star ratings)
type weights = number // sum of weights; used as running score during calculations
type products = number // sum of products

type scoreAndConfidence = [score, confidence]
type scoreAndInput = [score, input]
type fullHouse = [influence, score, confidence, input]
// type expanded = [influence, score, confidence, input, weights, products]
type oExpanded = { influence: influence, score: score, confidence: confidence, input: input, weights: weights, products: products }

type rater = pubkey
type ratee = pubkey
type observer = pubkey
type observee = pubkey

// R: RatingsTable

type RateeObject = {
    [key: ratee]: scoreAndConfidence
  }
type RaterObject = {
    [key: rater]: RateeObject
}
export type RatingsTableObject = {
    [key: context]: RaterObject
}

export const testRatingsTableObject:RatingsTableObject = {
    notSpam: {
        alice: {
            bob: [1.0, 0.05],
            charlie: [1.0, 0.05],
            zed: [0.0, 0.1]
        },
        bob: {
            charlie: [1.0, 0.05],
            zed: [0.0, 0.1] 
        },
        zed: {
            zed: [1.0, 0.05]
        }
    }
}

// G: ScorecardsTable 
/*
Multiple versions, depending on which numbers are reported
ScorecardsTableObjectV0 "scoreAndConfidence" -- 
ScorecardsTableObjectV1 "scoreAndInput" -- alternate to V0
ScorecardsTableObjectV2 "fullHouse" -- includes all 4 numbers which is better for running calculations but maybe bad for long term storage
ScorecardsTableObjectV3 "oExpanded" -- bigger footprint but easier to write code

Comparisons:
V0 versus V1: input is cleaner but confidence is easier to use (since influence = score * confidence)

long term storage: 
- V0 is a good choice; in a wrapper that may include rigor as metaData which tells us how confidence was calculated
    Why? bc it reduces filesize compared to others
- VC0 idea for further data compaction: encode pubkeys with id numbers in metaData; then replace pubkeys with id numbers

running calculation using the core grapeRankCalculator:
- V3 is probably what should be used internally and returned
    Why? easiest way to write code without getting parameters mixed up
- V0, V1, V2, V3, or any other reasonable formats should be acceptable as input into the calculator
    type should be ascertained and should be converted to V3 at the start

functions written to convert from one type to another
*/

// ScorecardsTable Version 0: scoreAndConfidence (SAME AS RATINGS TABLE)
type ObserveeObjectV0 = {
    [key: observee]: scoreAndConfidence
  }
type ObserverObjectV0 = {
    [key: observer]: ObserveeObjectV0
}
export type ScorecardsTableObjectV0 = {
    [key: context]: ObserverObjectV0
}

// RatingsOrScorecardsTableJointObject
// Since RatingsTable and ScorecardsTableV0 should be interchangeable, define one that can be either-or
type EeObject = {
    [key: ratee | observee]: scoreAndConfidence
  }
type ErObject = {
    [key: rater | observer]: EeObject
}
export type RatingsOrScorecardsTableJointObject = {
    [key: context]: ErObject
}



export const testScorecardsObjectV0:ScorecardsTableObjectV0 = {
    notSpam: {
        alice: {
            bob: [1.0, 0.05],
            charlie: [1.0, 0.05],
            zed: [0.0, 0.1]
        },
        bob: {
            charlie: [1.0, 0.05],
            zed: [0.0, 0.1] 
        },
        zed: {
            zed: [1.0, 0.05]
        }
    }
}

// ScorecardsTable Version 1: scoreAndInput
type ObserveeObjectV1 = {
    [key: pubkey]: scoreAndInput
  }
type ObserverObjectV1 = {
    [key: pubkey]: ObserveeObjectV1
}
export type ScorecardsTableObjectV1 = {
    [key: context]: ObserverObjectV1
}
export const testScorecardsObjectV1:ScorecardsTableObjectV1 = {
    notSpam: {
        alice: {
            bob: [1.0, 0.05],
            charlie: [1.0, 0.05],
            zed: [0.0, 0.1]
        },
        bob: {
            charlie: [1.0, 0.05],
            zed: [0.0, 0.1] 
        },
        zed: {
            zed: [1.0, 0.05]
        }
    }
}

// ScorecardsTable Version 2: fullHouse
type ObserveeObjectV2 = {
    [key: pubkey]: fullHouse
  }
type ObserverObjectV2 = {
    [key: pubkey]: ObserveeObjectV2
}
export type ScorecardsTableObjectV2 = {
    [key: context]: ObserverObjectV2
}
export const testScorecardsObjectV2:ScorecardsTableObjectV2 = {
    notSpam: {
        alice: {
            bob: [0.5, 1.0, 0.5, 0.05],
            charlie: [0.5, 1.0, 0.5, 0.05],
            zed: [0.0, 0.0, 0.75, 0.1]
        },
        bob: {
            charlie: [0.5, 1.0, 0.5, 0.05],
            zed: [0.0, 0.0, 0.75, 0.1] 
        },
        zed: {
            zed: [0.5, 1.0, 0.5, 0.05]
        }
    }
}

// ScorecardsTable Version 3: oExpanded
type ObserveeObjectV3 = {
    [key: observee]: oExpanded
  }
type ObserverObjectV3 = {
    [key: observer]: ObserveeObjectV3
}
export type ScorecardsTableObjectV3 = {
    [key: context]: ObserverObjectV3
}
export const testScorecardsObjectV3:ScorecardsTableObjectV3 = {
    notSpam: {
        alice: {
            bob: {
                influence: 0.5, 
                score: 1.0, 
                confidence: 0.5,
                input: 0.05,
                weights: 0,
                products: 0
            }
        },
        bob: {
            charlie: {
                influence: 0.5, 
                score: 1.0, 
                confidence: 0.5,
                input: 0.05,
                weights: 0,
                products: 0
            }
        }
    }
}

// ScorecardsTable and RatingsTable Wrappers

type ScorecardsTableMetaData = {
    observer: observer, // the "owner" of the scorecardTable
    grapeRankProtocolUID?: string,
    rigor?: number
}

type RatingsTableMetaData = {
    observer: observer // the "owner" of the ratingsTable (i.e. the person who commissioned its creation?)
    interpretationPrococolUID?: string
}

export type ScorecardsTableObjectWrapper = {
    metaData: ScorecardsTableMetaData
    data: ScorecardsTableObjectV2
}

export type RatingsTableObjectWrapper = {
    metaData: RatingsTableMetaData
    data: RatingsTableObject
}

// GrapeRank protocol parameters
type GrapeRankParameters = {
    rigor: number,
    attenuation: number,
    defaults: {
        score: number,
        confidence: number
    }
}

// interpretation protocol parameters
type FollowsParameters = {
    score: number,
    confidence: number
}
type MutesParameters = {
    score: number,
    confidence: number
}
type ReportsParameters = {
    score: number,
    confidence: number,
    reportTypes: string[]
}
export interface InterpProtocolParams_follows {
    context: string,
    pubkeys: string[],
    depth: number,
    follows: FollowsParameters
}
export interface InterpProtocolParams_mutes {
    context: string,
    pubkeys: string[],
    depth: number,
    mutes: MutesParameters
}
export interface InterpProtocolParams_reports {
    context: string,
    pubkeys: string[],
    depth: number,
    reports: ReportsParameters
}
export interface InterpProtocolParams_followsAndMutes {
    context: string,
    pubkeys: string[],
    depth: number,
    follows: FollowsParameters,
    mutes: MutesParameters
}