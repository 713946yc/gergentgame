// quests.js
import { supabase } from "./supabaseClient.js";
import { Xp } from "./xp.js";
import { Money } from "./money.js";
import { showPopup } from "./popup.js";

// ------------------ DEFINITIONS ------------------

// Keep these matching your skinsJsonKey / caseName exactly
const ALL_CASE_IDS = [
  "kilowatt",
  "cs20",
  "fever",
  "dreamsandnightmares",
  "dreamhack_2014_cobblestone_souvenir",
  "snakebite",
  "recoil",
  "revolution",
  "glove",
  "gamma",
  "gamma2",
  "csgo_weapon",
  "csgo_weapon2",
  "csgo_weapon3",
  "chroma",
  "chroma2",
  "chroma3",
  "operation_bravo",
  "gallery"
];

export const QUESTS = [
  {
    id: "spend_500_cases",
    title: "Feed The Addiction",
    desc: "Spend a total of $500 on cases.",
    type: "spend_money_on_cases",
    target: 500,
    rewardXp: 100,
    rewardMoney: 1000,
  },
  {
    id: "open_all_cases",
    title: "A Bit of Everything",
    desc: "Open at least one of every case.",
    type: "open_all_case_types",
    target: ALL_CASE_IDS.length,
    rewardXp: 200,
    rewardMoney: 2000,
  },
  {
    id: "snakebite_gloves",
    title: "Gimme My Money",
    desc: "Unbox gloves from a Snakebite case.",
    type: "snakebite_gloves",
    target: 1,
    rewardXp: 200,
    rewardMoney: 2000,
  },
  {
    id: "first_case",
    title: "First Time",
    desc: "Open your very first case.",
    type: "first_case",
    target: 1,
    rewardXp: 10,
    rewardMoney: 50,
  },
  {
    id: "first_exceedingly_rare",
    title: "GOLD GOLD GOLD",
    desc: "Get your first Exceedingly Rare item.",
    type: "first_exceedingly_rare",
    target: 1,
    rewardXp: 100,
    rewardMoney: 500,
  },
];

export const ACHIEVEMENTS = [
  {
    id: "b2b_exceedingly_rare",
    title: "Double Trouble",
    desc: "Get back-to-back Exceedingly Rare drops.",
    type: "b2b_exceedingly_rare",
    target: 1,
    rewardXp: 500,
  },
  {
    id: "kilowatt_100",
    title: "Kilowatt Grinder",
    desc: "Open the Kilowatt case 100 times.",
    type: "kilowatt_100",
    target: 100,
    rewardXp: 100,
  },
  {
    id: "sell_100_items_once",
    title: "Bulk Seller",
    desc: "Sell 100+ items in one go.",
    type: "sell_100_items_once",
    target: 1,
    rewardXp: 150,
  },
  {
    id: "b2b2b_coverts",
    title: "Back 2 Back 2 Back",
    desc: "Get back-to-back-to-back Covert drops.",
    type: "b2b2b_coverts",
    target: 1,
    rewardXp: 500,
  },
  {
    id: "item_10k_value",
    title: "Elon Musk",
    desc: "Obtain an item worth over $10,000.",
    type: "item_10k_value",
    target: 1,
    rewardXp: 200,
  },
];

// ------------------ STATE ------------------

let questState = {};         // quest_id -> { progress, completed }
let achievementState = {};   // achievement_id -> { progress, completed }
let uid = null;

let lastRarity = null;       // for b2b exceedingly rare
let last2Rarities = [];      // for b2b2b coverts

// ------------------ LOAD PROGRESS ------------------

export async function initQuestsUI(currentUid) {
  uid = currentUid;
  await loadProgressFromSupabase();
  renderAll();
}

async function loadProgressFromSupabase() {
  // Quests
  const { data: questRows, error: qErr } = await supabase
    .from("user_quests_progress")
    .select("*")
    .eq("user_id", uid);

  if (qErr) {
    console.error("Failed to load quest progress:", qErr);
  }

  questState = {};
  questRows?.forEach((row) => {
    questState[row.quest_id] = {
      progress: Number(row.progress) || 0,
      completed: !!row.completed,
    };
  });

  // Achievements
  const { data: achRows, error: aErr } = await supabase
    .from("user_achievements_progress")
    .select("*")
    .eq("user_id", uid);

  if (aErr) {
    console.error("Failed to load achievement progress:", aErr);
  }

  achievementState = {};
  achRows?.forEach((row) => {
    achievementState[row.achievement_id] = {
      progress: Number(row.progress) || 0,
      completed: !!row.completed,
    };
  });

  // Make sure all quests/achievements exist in DB
  for (const q of QUESTS) {
    if (!questState[q.id]) {
      questState[q.id] = { progress: 0, completed: false };
      await supabase.from("user_quests_progress").insert({
        user_id: uid,
        quest_id: q.id,
        progress: 0,
        completed: false,
      });
    }
  }

  for (const a of ACHIEVEMENTS) {
    if (!achievementState[a.id]) {
      achievementState[a.id] = { progress: 0, completed: false };
      await supabase.from("user_achievements_progress").insert({
        user_id: uid,
        achievement_id: a.id,
        progress: 0,
        completed: false,
      });
    }
  }
}

// ------------------ RENDERING ------------------

function renderAll() {
  renderList("questsList", QUESTS, questState, true);
  renderList("achievementsList", ACHIEVEMENTS, achievementState, false);
}

function renderList(containerId, defs, stateMap, isQuest) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  defs.forEach((def) => {
    const state = stateMap[def.id] || { progress: 0, completed: false };

    let rawProgress = Number(state.progress) || 0;
    let displayProgress = rawProgress;
    let displayTarget = def.target;
    let pct;

    // Special handling for "spend money on cases" (progress stored in CENTS)
    if (def.type === "spend_money_on_cases") {
      const targetCents = Number(def.target) * 100;
      pct = Math.min(100, (rawProgress / targetCents) * 100);

      displayProgress = (rawProgress / 100).toFixed(2);
      displayTarget = Number(def.target).toFixed(2);
    } else {
      pct = Math.min(100, (rawProgress / def.target) * 100);
      displayProgress = Math.floor(rawProgress);
    }

    const card = document.createElement("div");
    card.className = "qa-card";
    if (state.completed) card.classList.add("completed");

    const rewardHtml = isQuest
      ? `Reward: ${def.rewardXp} XP + $${def.rewardMoney.toFixed(2)}`
      : `Reward: ${def.rewardXp} XP`;

    const progressLabel =
      def.type === "spend_money_on_cases"
        ? `$${displayProgress} / $${displayTarget}`
        : `${displayProgress} / ${displayTarget}`;

    card.innerHTML = `
      <div class="qa-title-row">
        <div class="qa-card-title">${def.title}</div>
        <div>${
          state.completed
            ? `<span class="qa-badge-complete">Completed</span>`
            : ""
        }</div>
      </div>
      <div class="qa-desc">${def.desc}</div>
      <div class="qa-reward">${rewardHtml}</div>
      <div class="qa-progress-wrapper">
        <div class="qa-progress-label">${progressLabel}</div>
        <div class="qa-progress-bar-bg">
          <div class="qa-progress-bar-fill" style="width:${pct}%;"></div>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}


// ------------------ SAVE HELPERS ------------------

async function upsertQuestProgress(id) {
  const s = questState[id];
  await supabase.from("user_quests_progress").upsert(
    {
      user_id: uid,
      quest_id: id,
      progress: s.progress,
      completed: s.completed,
    },
    { onConflict: "user_id,quest_id" }
  );
}

async function upsertAchievementProgress(id) {
  const s = achievementState[id];
  await supabase.from("user_achievements_progress").upsert(
    {
      user_id: uid,
      achievement_id: id,
      progress: s.progress,
      completed: s.completed,
    },
    { onConflict: "user_id,achievement_id" }
  );
}

// ------------------ REWARD HELPERS ------------------

async function grantXp(amount) {
  if (amount > 0 && uid) {
    await Xp.add(uid, amount);
  }
}

async function grantMoney(amount) {
  if (!uid || amount <= 0) return;

  try {
    // Read current balance
    const { data: rows, error: gErr } = await supabase
      .from("money")
      .select("balance")
      .eq("user_id", uid)
      .single();

    if (gErr) {
      console.error("Failed to read balance:", gErr);
      return;
    }

    const currentBalance = Number(rows.balance || 0);
    const newBalance = currentBalance + Number(amount);

    // Update database
    const { error: uErr } = await supabase
      .from("money")
      .update({ balance: newBalance })
      .eq("user_id", uid);

    if (uErr) {
      console.error("Failed to update balance:", uErr);
      return;
    }

    // ⭐ INSTANT UI UPDATE (same as XP system)
    Money.set(uid, newBalance);

    console.log(`Money granted: $${amount}. New balance: $${newBalance}`);

  } catch (err) {
    console.error("grantMoney() failed:", err);
  }
}




async function completeQuest(q) {
  const s = questState[q.id];
  if (!s || s.completed) return;
  s.completed = true;
  await upsertQuestProgress(q.id);
  await grantXp(q.rewardXp);
  await grantMoney(q.rewardMoney);

  // 🔥 POPUP HERE
  showPopup("quest", "Quest Complete!", q.title);

  renderAll();
}


async function completeAchievement(a) {
  const s = achievementState[a.id];
  if (!s || s.completed) return;
  s.completed = true;
  await upsertAchievementProgress(a.id);
  await grantXp(a.rewardXp);

  showPopup("achievement", "Achievement Unlocked!", a.title);

  renderAll();
}

// ------------------ PUBLIC HOOKS ------------------

/**
 * info = {
 *   caseName: string,
 *   casePrice: number,
 *   itemRarity: string,
 *   itemValue: number,
 *   isGloves?: boolean
 * }
 */
// ------------------ PUBLIC HOOK: CASE OPENED ------------------

export async function handleCaseOpened(info) {
  if (!questState || Object.keys(questState).length === 0) {
    console.error("QuestState not loaded yet. Aborting quest tracking.");
    return;
  }

  const casePrice = Number(info.casePrice || 0);
  const caseId = info.caseName || info.caseId || null;

  if (!caseId) {
    console.error("No case identifier provided to handleCaseOpened().");
  }

  const updates = []; // store async updates so we can await them at the end

  // ============================================================
  // QUEST: first case ever
  // ============================================================
  {
    const q = QUESTS.find((x) => x.id === "first_case");
    const s = questState[q.id];

    if (!s.completed) {
      s.progress = 1;
      updates.push(completeQuest(q));
    }
  }

  // ============================================================
  // QUEST: spend $500 on cases (tracked in CENTS)
  // ============================================================
  {
    const q = QUESTS.find((x) => x.id === "spend_500_cases");
    const s = questState[q.id];

    if (!s.completed && casePrice > 0) {
      const deltaCents = Math.round(casePrice * 100);
      const current = Number(s.progress) || 0;
      const targetCents = q.target * 100;

      s.progress = current + deltaCents;

      if (s.progress >= targetCents) {
        s.progress = targetCents;
        updates.push(completeQuest(q));
      } else {
        updates.push(upsertQuestProgress(q.id));
      }
    }
  }

  // ============================================================
  // QUEST: open all case types (deduped per user)
  // ============================================================
  {
    const q = QUESTS.find((x) => x.id === "open_all_cases");
    const s = questState[q.id];

    if (!s.completed && caseId) {
      const key = `cases_opened_${uid}`;
      const openedRaw = JSON.parse(localStorage.getItem(key) || "[]");

      let opened = Array.isArray(openedRaw) ? openedRaw.slice() : [];

      // add current case if new
      if (!opened.includes(caseId)) {
        opened.push(caseId);
      }

      // remove invalid case IDs + dedupe
      const cleaned = Array.from(
        new Set(opened.filter((id) => ALL_CASE_IDS.includes(id)))
      );

      localStorage.setItem(key, JSON.stringify(cleaned));

      s.progress = cleaned.length;

      if (s.progress >= q.target) {
        s.progress = q.target;
        updates.push(completeQuest(q));
      } else {
        updates.push(upsertQuestProgress(q.id));
      }
    }
  }

  // ============================================================
  // QUEST: snakebite gloves
  // ============================================================
  {
    const q = QUESTS.find((x) => x.id === "snakebite_gloves");
    const s = questState[q.id];

    if (!s.completed) {
      if (caseId === "snakebite" && info.isGloves === true) {
        s.progress = 1;
        updates.push(completeQuest(q));
      }
    }
  }

  // ============================================================
  // QUEST: first exceedingly rare
  // ============================================================
  {
    const q = QUESTS.find((x) => x.id === "first_exceedingly_rare");
    const s = questState[q.id];

    if (!s.completed && info.itemRarity === "exceedingly_rare") {
      s.progress = 1;
      updates.push(completeQuest(q));
    }
  }

  // ============================================================
  // ACHIEVEMENT: kilowatt 100
  // ============================================================
  {
    const a = ACHIEVEMENTS.find((x) => x.id === "kilowatt_100");
    const s = achievementState[a.id];

    if (!s.completed && caseId === "kilowatt") {
      s.progress += 1;

      if (s.progress >= a.target) {
        s.progress = a.target;
        updates.push(completeAchievement(a));
      } else {
        updates.push(upsertAchievementProgress(a.id));
      }
    }
  }

  // ============================================================
  // ACHIEVEMENT: item > $10k
  // ============================================================
  {
    const a = ACHIEVEMENTS.find((x) => x.id === "item_10k_value");
    const s = achievementState[a.id];

    if (!s.completed && Number(info.itemValue || 0) >= 10000) {
      s.progress = 1;
      updates.push(completeAchievement(a));
    }
  }

  // ============================================================
  // ACHIEVEMENT: back-to-back exceedingly rare
  // ============================================================
  {
    const a = ACHIEVEMENTS.find((x) => x.id === "b2b_exceedingly_rare");
    const s = achievementState[a.id];

    if (!s.completed) {
      if (
        info.itemRarity === "exceedingly_rare" &&
        lastRarity === "exceedingly_rare"
      ) {
        s.progress = 1;
        updates.push(completeAchievement(a));
      }
    }
  }

  // ============================================================
  // ACHIEVEMENT: back-to-back-to-back coverts
  // ============================================================
  {
    const a = ACHIEVEMENTS.find((x) => x.id === "b2b2b_coverts");
    const s = achievementState[a.id];

    if (!s.completed) {
      last2Rarities.push(info.itemRarity);
      if (last2Rarities.length > 3) {
        last2Rarities.shift();
      }

      if (
        last2Rarities.length === 3 &&
        last2Rarities.every((r) => r === "covert")
      ) {
        s.progress = 1;
        updates.push(completeAchievement(a));
      }
    }
  }

  // update “last” rarity for next case
  lastRarity = info.itemRarity;

  // ============================================================
  // Run all async updates in order
  // ============================================================
  for (const op of updates) {
    try {
      await op;
    } catch (err) {
      console.error("Quest update failed:", err);
    }
  }

  renderAll();
}


/**
 * Call from inventory.js when selling items in bulk.
 */
/**
 * Call from inventory.js when selling items in bulk.
 */
export async function handleSellItems(count) {
  const a = ACHIEVEMENTS.find((x) => x.id === "sell_100_items_once");
  if (!a) return;

  const s = achievementState[a.id] || { progress: 0, completed: false };

  // ✅ 100 OR MORE items in a single bulk-sell
  if (!s.completed && count >= 100) {
    s.progress = 1;
    achievementState[a.id] = s;
    await completeAchievement(a);
  }
}


