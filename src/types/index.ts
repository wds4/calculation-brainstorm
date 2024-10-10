type context = string
type pubkey = string
type score = number // can refer to a rating or to an average of ratings
type input = number // nonzero, no upper bound
type confidence = number // [0, 1]; can be de novo (rating) or calculated from input (scorecard)
type influence = number // score * confidence
type scoreAndConfidence = [score, confidence]
type scoreAndInput = [score, input]
type fullHouse = [influence, score, confidence, input]

// R: RatingsTable

type RateeObject = {
    [key: pubkey]: scoreAndConfidence
  }
type RaterObject = {
    [key: pubkey]: RateeObject
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
// Multiple versions, depending on which numbers are reported

// ScorecardsTable Version 0: scoreAndConfidence (SAME AS RATINGS TABLE)
type ObserveeObjectV0 = {
    [key: pubkey]: scoreAndConfidence
  }
type ObserverObjectV0 = {
    [key: pubkey]: ObserveeObjectV0
}
export type ScorecardsTableObjectV0 = {
    [key: context]: ObserverObjectV0
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