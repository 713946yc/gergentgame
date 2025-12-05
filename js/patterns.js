// patterns.js
// ------------------------------------------------------------
// EASY + CLEAN PATTERN SYSTEM
// ------------------------------------------------------------
// Supports:
// - simple ranges
// - named special patterns
// - multipliers
// - optional color tags
// ------------------------------------------------------------

// Roll a pattern from 1–999 (adjustable)
export function rollPattern(min = 1, max = 999) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ------------------------------------------------------------
// SUPER EASY DECLARATION FORMAT
// ------------------------------------------------------------
//
// Just add entries like:
//
//   "AK-47 | Case Hardened": [
//       { min: 661, max: 661, tag: "Blue Gem", multiplier: 4.0, color: "#00b7ff" },
//       { min: 670, max: 690, tag: "Blue Gem Tier 2", multiplier: 2.0 }
//   ]
//
// No need for “range: []” anymore.
// Much cleaner and easier to edit.
// ------------------------------------------------------------

export const SPECIAL_PATTERNS = {

    // Example Blue Gem patterns
    "Kukri Knife | Case Hardened": [
        {
            min: 283,
            max: 283,
            tag: "Blue Gem • Tier 2",
            multiplier: 4.0,
            color: "#00b7ff"
        },
        {
            min: 130,
            max: 130,
            tag: "Blue Gem • Tier 2",
            multiplier: 4.0,
            color: "#00b7ff"
        },
        {
            min: 721,
            max: 721,
            tag: "Blue Gem • Tier 2",
            multiplier: 4.0,
            color: "#00b7ff"
        },
        {
            min: 468,
            max: 468,
            tag: "Blue Gem • Tier 2",
            multiplier: 4.0,
            color: "#00b7ff"
        },
        {
            min: 330,
            max: 330,
            tag: "Blue Gem • Tier 2",
            multiplier: 4.0,
            color: "#00b7ff"
        },
        {
            min: 618,
            max: 618,
            tag: "Blue Gem • Tier 1",
            multiplier: 20.0,
            color: "#00b7ff"
        },
        {
            min: 652,
            max: 652,
            tag: "Blue Gem • Tier 1",
            multiplier: 20.0,
            color: "#00b7ff"
        },
        {
            min: 575,
            max: 575,
            tag: "Blue Gem • Tier 1",
            multiplier: 20.0,
            color: "#00b7ff"
        },
        {
            min: 770,
            max: 770,
            tag: "Blue Gem • Tier 1",
            multiplier: 20.0,
            color: "#00b7ff"
        },
        {
            min: 494,
            max: 494,
            tag: "Blue Gem • #1",
            multiplier: 80.0,
            color: "#00b7ff"
        },
    ],
    "Kukri Knife | Fade": [
        {
            min: 763,
            max: 763,
            tag: "100% Fade",
            multiplier: 5.0,
            color: "#da5700ff"
        },
        {
            min: 575,
            max: 575,
            tag: "100% Fade",
            multiplier: 5.0,
            color: "#da5700ff"
        },
        {
            min: 897,
            max: 897,
            tag: "100% Fade",
            multiplier: 5.0,
            color: "#da5700ff"
        },
        {
            min: 636,
            max: 636,
            tag: "100% Fade",
            multiplier: 5.0,
            color: "#da5700ff"
        },
        {
            min: 341,
            max: 341,
            tag: "100% Fade",
            multiplier: 5.0,
            color: "#da5700ff"
        },
    ],
    "Hand Wraps | Overprint": [
        {
            min: 427,
            max: 427,
            tag: "Tier 1 • Polygon",
            multiplier: 1.4,
            color: "#007281ff"
        },
        {
            min: 806,
            max: 806,
            tag: "Tier 1 • Polygon",
            multiplier: 1.4,
            color: "#007281ff"
        },
        {
            min: 641,
            max: 641,
            tag: "Tier 1 • Polygon",
            multiplier: 1.4,
            color: "#007281ff"
        },
        {
            min: 544,
            max: 544,
            tag: "Tier 1 • Polygon",
            multiplier: 1.4,
            color: "#007281ff"
        },
        {
            min: 64,
            max: 64,
            tag: "Tier 1 • Polygon",
            multiplier: 1.4,
            color: "#007281ff"
        },
        {
            min: 679,
            max: 679,
            tag: "Tier 1 • Arrow",
            multiplier: 1.2,
            color: "#007281ff"
        },
        {
            min: 892,
            max: 892,
            tag: "Tier 1 • Arrow",
            multiplier: 1.2,
            color: "#007281ff"
        },
        {
            min: 122,
            max: 122,
            tag: "Tier 1 • Arrow",
            multiplier: 1.2,
            color: "#007281ff"
        },
        {
            min: 162,
            max: 162,
            tag: "Tier 1 • Arrow",
            multiplier: 1.2,
            color: "#007281ff"
        },
        {
            min: 307,
            max: 307,
            tag: "Tier 1 • Arrow",
            multiplier: 1.2,
            color: "#007281ff"
        },
        {
            min: 25,
            max: 25,
            tag: "Mixed",
            multiplier: 1.15,
            color: "#007281ff"
        },
        {
            min: 42,
            max: 42,
            tag: "Mixed",
            multiplier: 1.15,
            color: "#007281ff"
        },
        {
            min: 53,
            max: 53,
            tag: "Mixed",
            multiplier: 1.15,
            color: "#007281ff"
        },
        {
            min: 63,
            max: 63,
            tag: "Mixed",
            multiplier: 1.15,
            color: "#007281ff"
        },
        {
            min: 163,
            max: 163,
            tag: "Mixed",
            multiplier: 1.15,
            color: "#007281ff"
        },
    ],
    "Classic Knife | Fade": [
        {
            min: 763,
            max: 763,
            tag: "100% Fade",
            multiplier: 2.0,
            color: "#da5700ff"
        },
        {
            min: 575,
            max: 575,
            tag: "100% Fade",
            multiplier: 2.0,
            color: "#da5700ff"
        },
        {
            min: 897,
            max: 897,
            tag: "100% Fade",
            multiplier: 2.0,
            color: "#da5700ff"
        },
        {
            min: 636,
            max: 636,
            tag: "100% Fade",
            multiplier: 2.0,
            color: "#da5700ff"
        },
        {
            min: 341,
            max: 341,
            tag: "100% Fade",
            multiplier: 2.0,
            color: "#da5700ff"
        },
    ],
    "Classic Knife | Case Hardened": [
        {
            min: 403,
            max: 403,
            tag: "Blue Gem • #1",
            multiplier: 80.0,
            color: "#00b7ff"
        },
        {
            min: 58,
            max: 58,
            tag: "Blue Gem • Tier 1",
            multiplier: 20.0,
            color: "#00b7ff"
        },
        {
            min: 681,
            max: 681,
            tag: "Blue Gem • Tier 1",
            multiplier: 20.0,
            color: "#00b7ff"
        },
        {
            min: 169,
            max: 169,
            tag: "Blue Gem • Tier 1",
            multiplier: 20.0,
            color: "#00b7ff"
        },
        {
            min: 456,
            max: 456,
            tag: "Blue Gem • Tier 1",
            multiplier: 20.0,
            color: "#00b7ff"
        },
        {
            min: 601,
            max: 601,
            tag: "Blue Gem • Tier 1",
            multiplier: 20.0,
            color: "#00b7ff"
        },
        {
            min: 316,
            max: 316,
            tag: "Blue Gem • Tier 1",
            multiplier: 20.0,
            color: "#00b7ff"
        },
        {
            min: 577,
            max: 577,
            tag: "Blue Gem • Tier 1",
            multiplier: 20.0,
            color: "#00b7ff"
        },
        {
            min: 704,
            max: 704,
            tag: "Blue Gem • Tier 2",
            multiplier: 3.0,
            color: "#00b7ff"
        },
    ],
    "XM1014 | XOXO": [
        {
            min: 178,
            max: 178,
            tag: "Skull • Tier 1",
            multiplier: 5.0,
            color: "#ff009dff"
        },
        {
            min: 766,
            max: 766,
            tag: "Skull • Tier 1",
            multiplier: 5.0,
            color: "#ff009dff"
        },
        {
            min: 579,
            max: 579,
            tag: "Skull • Tier 1",
            multiplier: 5.0,
            color: "#ff009dff"
        },
    ],
    "Specialist Gloves | Crimson Kimono": [
        {
            min: 458,
            max: 458,
            tag: "Skull • Tier 1",
            multiplier: 2.0,
            color: "#860404ff"
        },
        {
            min: 515,
            max: 515,
            tag: "Skull • Tier 1",
            multiplier: 2.0,
            color: "#860404ff"
        },
        {
            min: 559,
            max: 560,
            tag: "Skull • Tier 1",
            multiplier: 2.0,
            color: "#860404ff"
        },
        {
            min: 684,
            max: 684,
            tag: "Skull • Tier 1",
            multiplier: 2.0,
            color: "#860404ff"
        },
        {
            min: 692,
            max: 692,
            tag: "Skull • Tier 1",
            multiplier: 2.0,
            color: "#860404ff"
        },
        {
            min: 699,
            max: 699,
            tag: "Skull • Tier 1",
            multiplier: 2.0,
            color: "#860404ff"
        },
        {
            min: 932,
            max: 932,
            tag: "Skull • Tier 1",
            multiplier: 2.0,
            color: "#860404ff"
        }
    ],
    "Ak-47 | Case Hardened": [
        {
            min: 661,
            max: 661,
            tag: "Blue Gem • #1",
            multiplier: 2000.0,
            color: "#00b7ff"
        },
        {
            min: 151,
            max: 151,
            tag: "Blue Gem • Tier 1",
            multiplier: 50.0,
            color: "#00b7ff"
        },
        {
            min: 955,
            max: 955,
            tag: "Blue Gem • Tier 1",
            multiplier: 50.0,
            color: "#00b7ff"
        },
        {
            min: 321,
            max: 321,
            tag: "Blue Gem • Tier 1",
            multiplier: 50.0,
            color: "#00b7ff"
        },
        {
            min: 387,
            max: 387,
            tag: "Blue Gem • Tier 1",
            multiplier: 50.0,
            color: "#00b7ff"
        },
        {
            min: 670,
            max: 670,
            tag: "Blue Gem • Tier 1",
            multiplier: 50.0,
            color: "#00b7ff"
        },
        {
            min: 179,
            max: 179,
            tag: "Blue Gem • Tier 1",
            multiplier: 50.0,
            color: "#00b7ff"
        },
        {
            min: 592,
            max: 592,
            tag: "Blue Gem • Tier 2",
            multiplier: 20.0,
            color: "#00b7ff"
        },
        {
            min: 4,
            max: 4,
            tag: "Blue Gem • Tier 2",
            multiplier: 20.0,
            color: "#00b7ff"
        },
        {
            min: 905,
            max: 905,
            tag: "Blue Gem • Tier 2",
            multiplier: 20.0,
            color: "#00b7ff"
        },
        {
            min: 13,
            max: 13,
            tag: "Blue Gem • Tier 2",
            multiplier: 20.0,
            color: "#00b7ff"
        },
        {
            min: 168,
            max: 168,
            tag: "Blue Gem • Tier 2",
            multiplier: 20.0,
            color: "#00b7ff"
        },
        {
            min: 429,
            max: 429,
            tag: "Blue Gem • Tier 2",
            multiplier: 20.0,
            color: "#00b7ff"
        }
    ],
    "M9 Bayonet | Case Hardened": [
        {
            min: 601,
            max: 601,
            tag: "Blue Gem • #1",
            multiplier: 60.0,
            color: "#00b7ff"
        },
        {
            min: 417,
            max: 417,
            tag: "Blue Gem • Tier 1",
            multiplier: 20.0,
            color: "#00b7ff"
        }
    ],
    "Flip Knife | Case Hardened": [
        {
            min: 670,
            max: 670,
            tag: "Blue Gem • #1",
            multiplier: 20.0,
            color: "#00b7ff"
        },
        {
            min: 321,
            max: 321,
            tag: "Blue Gem • Tier 1",
            multiplier: 10.0,
            color: "#00b7ff"
        },
        {
            min: 151,
            max: 151,
            tag: "Blue Gem • Tier 1",
            multiplier: 10.0,
            color: "#00b7ff"
        },
        {
            min: 592,
            max: 592,
            tag: "Blue Gem • Tier 1",
            multiplier: 10.0,
            color: "#00b7ff"
        },
        {
            min: 661,
            max: 661,
            tag: "Blue Gem • Tier 1",
            multiplier: 10.0,
            color: "#00b7ff"
        },
        {
            min: 555,
            max: 555,
            tag: "Blue Gem • Tier 1",
            multiplier: 10.0,
            color: "#00b7ff"
        }
    ],
    "Karambit | Case Hardened": [
        {
            min: 387,
            max: 387,
            tag: "Blue Gem • #1",
            multiplier: 500.0,
            color: "#00b7ff"
        },
        {
            min: 442,
            max: 442,
            tag: "Blue Gem • Tier 1",
            multiplier: 10.0,
            color: "#00b7ff"
        },
        {
            min: 269,
            max: 269,
            tag: "Blue Gem • Tier 1",
            multiplier: 10.0,
            color: "#00b7ff"
        },
        {
            min: 321,
            max: 321,
            tag: "Blue Gem • Tier 1",
            multiplier: 10.0,
            color: "#00b7ff"
        },
        {
            min: 73,
            max: 73,
            tag: "Blue Gem • Tier 1",
            multiplier: 10.0,
            color: "#00b7ff"
        },
        {
            min: 955,
            max: 955,
            tag: "Blue Gem • Tier 1",
            multiplier: 10.0,
            color: "#00b7ff"
        },
        {
            min: 853,
            max: 853,
            tag: "Blue Gem • Tier 1",
            multiplier: 10.0,
            color: "#00b7ff"
        },
        {
            min: 902,
            max: 902,
            tag: "Blue Gem • Tier 1",
            multiplier: 10.0,
            color: "#00b7ff"
        },
        {
            min: 507,
            max: 507,
            tag: "Blue Gem • Tier 1",
            multiplier: 10.0,
            color: "#00b7ff"
        },
        {
            min: 776,
            max: 776,
            tag: "Blue Gem • Tier 1",
            multiplier: 10.0,
            color: "#00b7ff"
        }
    ],
    "Bayonet | Case Hardened": [
        {
            min: 555,
            max: 555,
            tag: "Blue Gem • #1",
            multiplier: 20.0,
            color: "#00b7ff"
        },
        {
            min: 592,
            max: 592,
            tag: "Blue Gem • Tier 1",
            multiplier: 6.0,
            color: "#00b7ff"
        },
        {
            min: 670,
            max: 670,
            tag: "Blue Gem • Tier 1",
            multiplier: 6.0,
            color: "#00b7ff"
        },
        {
            min: 151,
            max: 151,
            tag: "Blue Gem • Tier 1",
            multiplier: 6.0,
            color: "#00b7ff"
        },
        {
            min: 179,
            max: 179,
            tag: "Blue Gem • Tier 1",
            multiplier: 6.0,
            color: "#00b7ff"
        }
    ],
    "Bayonet | Case Hardened": [
        {
            min: 567,
            max: 567,
            tag: "Blue Gem • #1",
            multiplier: 15.0,
            color: "#00b7ff"
        }
    ],
    "Gut Knife | Fade": [
        {
            min: 763,
            max: 763,
            tag: "100% Fade",
            multiplier: 2.0,
            color: "#da5700ff"
        }
    ],
    "Flip Knife | Fade": [
        {
            min: 763,
            max: 763,
            tag: "100% Fade",
            multiplier: 2.0,
            color: "#da5700ff"
        }
    ],
    "M9 Bayonet | Fade": [
        {
            min: 763,
            max: 763,
            tag: "100% Fade",
            multiplier: 2.0,
            color: "#da5700ff"
        }
    ],
    "Karambit | Fade": [
        {
            min: 412,
            max: 412,
            tag: "100% Fade",
            multiplier: 2.0,
            color: "#da5700ff"
        }
    ],
    "Five-SeveN | Case Hardened": [
        {
            min: 278,
            max: 278,
            tag: "Blue Gem • #1",
            multiplier: 500.0,
            color: "#00b7ff"
        }
    ],
    "Flip Knife | Marble Fade": [
        {
            min: 412,
            max: 763,
            tag: "Ice & Fire",
            multiplier: 2.0,
            color: "#da0000ff"
        }
    ],
    "Flip Knife | Marble Fade": [
        {
            min: 412,
            max: 412,
            tag: "Ice & Fire",
            multiplier: 75.0,
            color: "#da0000ff"
        }
    ],
    "Bayonet | Marble Fade": [
        {
            min: 412,
            max: 412,
            tag: "Ice & Fire",
            multiplier: 5.0,
            color: "#da0000ff"
        }
    ],
    "M9 Bayonet | Marble Fade": [
        {
            min: 763,
            max: 763,
            tag: "Max Red Tip",
            multiplier: 5.0,
            color: "#ff0000ff"
        },
        {
            min: 575,
            max: 575,
            tag: "Max Red Tip",
            multiplier: 5.0,
            color: "#ff0000ff"
        }
    ],
    "Gut Knife | Marble Fade": [
        {
            min: 412,
            max: 412,
            tag: "Ice & Fire",
            multiplier: 20.0,
            color: "#da0000ff"
        }
    ],
    "Karambit | Marble Fade": [
        {
            min: 412,
            max: 412,
            tag: "Ice & Fire",
            multiplier: 20.0,
            color: "#da0000ff"
        }
    ]
};


// ------------------------------------------------------------
// PATTERN EVALUATOR (MAIN LOGIC)
// ------------------------------------------------------------
//
// INPUT: itemName (string), pattern (number)
//
// OUTPUT:
//  {
//      pattern: Number,
//      tag: String | null,
//      multiplier: Number,
//      color: String | null
//  }
// ------------------------------------------------------------

export function evaluatePattern(itemName, pattern) {
    const defs = SPECIAL_PATTERNS[itemName];

    // No special rules for this skin
    if (!defs) {
        return {
            pattern,
            tag: null,
            multiplier: 1,
            color: null
        };
    }

    // Find first matching rule
    for (const rule of defs) {
        if (pattern >= rule.min && pattern <= rule.max) {
            return {
                pattern,
                tag: rule.tag ?? null,
                multiplier: rule.multiplier ?? 1,
                color: rule.color ?? null
            };
        }
    }

    // Pattern exists but no special match
    return {
        pattern,
        tag: null,
        multiplier: 1,
        color: null
    };
}