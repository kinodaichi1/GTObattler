const rangeData = {
  "6max": {
    "UTG": {
      "RAISE": [
        "99p", "TTp", "JJp", "QQp", "KKp", "AAp",
        "A5s", "ATs", "AJs", "AQs", "AKs",
        "KJs", "KQs", "QJs", "JTs",
        "AQo", "AKo"
      ]
    },
    "HJ": {
      "RAISE": [
        "77p", "88p", "99p", "TTp", "JJp", "QQp", "KKp", "AAp",
        "A2s", "A3s", "A4s", "A5s", "A9s", "ATs", "AJs", "AQs", "AKs",
        "K9s", "KTs", "KJs", "KQs",
        "QTs", "QJs",
        "J9s", "JTs",
        "AJo", "AQo", "AKo", "KQo"
      ]
    },
    "CO": {
      "RAISE": [
        "22p", "33p", "44p", "55p", "66p", "77p", "88p", "99p", "TTp", "JJp", "QQp", "KKp", "AAp",
        "A2s", "A3s", "A4s", "A5s", "A6s", "A7s", "A8s", "A9s", "ATs", "AJs", "AQs", "AKs",
        "K5s", "K6s", "K7s", "K8s", "K9s", "KTs", "KJs", "KQs",
        "Q8s", "Q9s", "QTs", "QJs",
        "J8s", "J9s", "JTs",
        "T8s", "T9s",
        "98s", "87s", "76s", "65s",
        "ATo", "AJo", "AQo", "AKo",
        "KJo", "KQo", "QJo"
      ]
    },
    "BTN": {
      "RAISE": [
        "22p", "33p", "44p", "55p", "66p", "77p", "88p", "99p", "TTp", "JJp", "QQp", "KKp", "AAp",
        "A2s", "A3s", "A4s", "A5s", "A6s", "A7s", "A8s", "A9s", "ATs", "AJs", "AQs", "AKs",
        "K2s", "K3s", "K4s", "K5s", "K6s", "K7s", "K8s", "K9s", "KTs", "KJs", "KQs",
        "Q2s", "Q3s", "Q4s", "Q5s", "Q6s", "Q7s", "Q8s", "Q9s", "QTs", "QJs",
        "J7s", "J8s", "J9s", "JTs",
        "T7s", "T8s", "T9s",
        "96s", "97s", "98s",
        "86s", "87s",
        "75s", "76s",
        "64s", "65s",
        "54s",
        "A2o", "A3o", "A4o", "A5o", "A6o", "A7o", "A8o", "A9o", "ATo", "AJo", "AQo", "AKo",
        "K9o", "KTo", "KJo", "KQo",
        "Q9o", "QTo", "QJo",
        "J9o", "JTo",
        "T9o"
      ]
    },
    "SB": {
      "RAISE": [
        "22p", "33p", "44p", "55p", "66p", "77p", "88p", "99p", "TTp", "JJp", "QQp", "KKp", "AAp",
        "A2s", "A3s", "A4s", "A5s", "A6s", "A7s", "A8s", "A9s", "ATs", "AJs", "AQs", "AKs",
        "K2s", "K3s", "K4s", "K5s", "K6s", "K7s", "K8s", "K9s", "KTs", "KJs", "KQs",
        "Q2s", "Q3s", "Q4s", "Q5s", "Q6s", "Q7s", "Q8s", "Q9s", "QTs", "QJs",
        "J2s", "J3s", "J4s", "J5s", "J6s", "J7s", "J8s", "J9s", "JTs",
        "T5s", "T6s", "T7s", "T8s", "T9s",
        "95s", "96s", "97s", "98s",
        "84s", "85s", "86s", "87s",
        "74s", "75s", "76s",
        "63s", "64s", "65s",
        "52s", "53s", "54s",
        "42s", "43s",
        "32s",
        "A4o", "A5o", "A6o", "A7o", "A8o", "A9o", "ATo", "AJo", "AQo", "AKo",
        "KJo", "KQo",
        "QTo", "QJo",
        "JTo"
      ],
      "CALL": [ // LIMPをCALLに変換
        "A2o", "A3o",
        "KTo", "K9o", "K8o", "K7o", "K6o", "K5o", "K4o", "K3o", "K2o",
        "Q9o", "Q8o", "Q7o", "Q6o", "Q5o", "Q4o", "Q3o", "Q2o",
        "J9o", "J8o", "J7o", "J6o", "J5o", "J4o", "J2o",
        "T9o", "T8o", "T7o", "T6o", "T5o", "T4o", "T3o", "T2o",
        "98o", "97o", "96o", "95o", "94o", "93o", "92o",
        "87o", "86o", "85o", "84o", "83o", "82o",
        "76o", "75o", "74o", "73o", "72o",
        "65o", "64o", "63o", "62o",
        "54o", "53o", "52o",
        "43o", "42o",
        "32o"
      ]
    },
    "BB": {
      "3-BET": [
        "JJp", "QQp", "KKp", "AAp",
        "A2s", "A3s", "A4s", "A5s",
        "AJs", "AQs", "AKs",
        "KQs", "KJs", "KTs",
        "QJs", "JTs",
        "AQo", "AKo"
      ],
      "CALL": [
        "22p", "33p", "44p", "55p", "66p", "77p", "88p", "99p", "TTp",
        "A6s", "A7s", "A8s", "A9s", "ATs",
        "K2s", "K3s", "K4s", "K5s", "K6s", "K7s", "K8s", "K9s",
        "Q2s", "Q3s", "Q4s", "Q5s", "Q6s", "Q7s", "Q8s", "Q9s", "QTs",
        "J2s", "J3s", "J4s", "J5s", "J6s", "J7s", "J8s", "J9s",
        "T8s", "T9s",
        "97s", "98s",
        "86s", "87s",
        "75s", "76s",
        "65s",
        "54s",
        "A2o", "A3o", "A4o", "A5o", "A6o", "A7o", "A8o", "A9o", "ATo", "AJo",
        "KTo", "KJo", "KQo",
        "QTo", "QJo",
        "JTo"
      ]
    }
  },
  "hu": {
    "BTN": {
      "RAISE": [
        "22p", "33p", "44p", "55p", "66p", "77p", "88p", "99p", "TTp", "JJp", "QQp", "KKp", "AAp",
        "A2s", "A3s", "A4s", "A5s", "A6s", "A7s", "A8s", "A9s", "ATs", "AJs", "AQs", "AKs",
        "K2s", "K3s", "K4s", "K5s", "K6s", "K7s", "K8s", "K9s", "KTs", "KJs", "KQs",
        "Q2s", "Q3s", "Q4s", "Q5s", "Q6s", "Q7s", "Q8s", "Q9s", "QTs", "QJs",
        "J7s", "J8s", "J9s", "JTs",
        "T7s", "T8s", "T9s",
        "97s", "98s",
        "87s",
        "76s",
        "65s",
        "54s",
        "A2o", "A3o", "A4o", "A5o", "A6o", "A7o", "A8o", "A9o", "ATo", "AJo", "AQo", "AKo",
        "K9o", "KTo", "KJo", "KQo",
        "Q9o", "QTo", "QJo",
        "J9o", "JTo",
        "T9o"
      ]
    },
    "BB": {
      "3-BET": [
        "AAp", "KKp", "QQp", "JJp",
        "AKs", "AQs", "AJs", "A5s", "A4s", "A3s", "A2s",
        "KQs", "KJs", "KTs",
        "QJs",
        "JTs",
        "T9s",
        "AKo", "KQo"
      ],
      "CALL": [
        "TTp", "99p", "88p", "77p", "66p", "55p", "44p", "33p", "22p",
        "ATs", "A9s", "A8s", "A7s", "A6s",
        "K9s", "K8s", "K7s", "K6s", "K5s", "K4s", "K3s", "K2s",
        "QTs", "Q9s", "Q8s", "Q7s", "Q6s", "Q5s", "Q4s", "Q3s", "Q2s",
        "J9s", "J8s", "J7s", "J6s", "J5s", "J4s", "J3s", "J2s",
        "T8s", "T7s", "T6s", "T5s", "T4s", "T3s", "T2s",
        "98s", "97s", "96s", "95s", "94s", "93s", "92s",
        "87s", "86s", "85s", "84s", "83s", "82s",
        "76s", "75s", "74s", "73s", "72s",
        "65s", "64s", "63s", "62s",
        "54s", "53s", "52s",
        "43s", "42s",
        "32s",
        "AQo", "AJo", "ATo", "A9o", "A8o", "A7o", "A6o", "A5o", "A4o", "A3o", "A2o",
        "KJo", "KTo",
        "QJo", "QTo", "Q9o", "Q8o", "Q7o", "Q6o", "Q5o", "Q4o", "Q3o", "Q2o",
        "JTo", "J9o", "J8o",
        "T8o", "T9o",
        "98o", "97o",
        "87o", "86o",
        "76o",
        "65o",
        "54o"
      ]
    }
  }
};