// 简单的中英文&同义词成因库
const WORSEN_CAUSES = [
  { key: "过度放牧", aliases: ["过度放牧", "超载放牧", "牲畜过多"], weight: 0.18 },
  { key: "过度樵采", aliases: ["过度樵采", "乱砍滥伐", "砍伐森林"], weight: 0.2 },
  { key: "不合理灌溉", aliases: ["不合理灌溉", "过度灌溉", "灌溉不当", "排水不良"], weight: 0.16 },
  { key: "开垦方式不当", aliases: ["不合理开垦", "开垦方式不当", "坡耕地开垦"], weight: 0.14 },
  { key: "气候变暖少雨", aliases: ["气候变暖", "降水减少", "干旱", "极端干旱"], weight: 0.18 },
  { key: "人口和经济压力", aliases: ["人口压力", "经济开发过度", "过度开采地下水"], weight: 0.14 }
];

const IMPROVE_CAUSES = [
  { key: "退耕还林还草", aliases: ["退耕还林", "退耕还草", "植被恢复"], weight: 0.2 },
  { key: "封山育林", aliases: ["封山育林", "封育保护", "天然封育"], weight: 0.16 },
  { key: "防风固沙工程", aliases: ["防风固沙", "种植防护林", "修建沙障"], weight: 0.2 },
  { key: "节水灌溉", aliases: ["滴灌", "喷灌", "节水灌溉", "改良灌溉制度"], weight: 0.16 },
  { key: "合理放牧轮牧", aliases: ["轮牧", "休牧", "合理放牧"], weight: 0.14 },
  { key: "生态补偿与政策", aliases: ["生态补偿", "生态恢复政策", "绿色发展政策"], weight: 0.14 }
];

// 图片等级：0~1 区间五档
const LEVEL_IMAGES = [
  { max: 0.2, src: "images/level1_placeholder.jpg", alt: "几乎未发生荒漠化的草地-轻微" },
  { max: 0.4, src: "images/level2_placeholder.jpg", alt: "轻度荒漠化，植被略有破碎" },
  { max: 0.6, src: "images/level3_placeholder.jpg", alt: "中度荒漠化，沙地与植被相间" },
  { max: 0.8, src: "images/level4_placeholder.jpg", alt: "重度荒漠化，以沙地为主" },
  { max: 1.01, src: "images/level5_placeholder.jpg", alt: "极重度荒漠化，几乎无植被" }
];

let worsenSelected = [];
let improveSelected = [];

function normalize(text) {
  return text.trim().toLowerCase();
}

function findCause(text) {
  const t = normalize(text);

  for (const item of WORSEN_CAUSES) {
    if (item.aliases.some(a => normalize(a) === t)) {
      return { ...item, type: "worsen" };
    }
  }
  for (const item of IMPROVE_CAUSES) {
    if (item.aliases.some(a => normalize(a) === t)) {
      return { ...item, type: "improve" };
    }
  }
  return null;
}

function getAllCauses() {
  return [
    ...WORSEN_CAUSES.map(c => ({ ...c, type: "worsen" })),
    ...IMPROVE_CAUSES.map(c => ({ ...c, type: "improve" }))
  ];
}

function updateScore() {
  const worsen = worsenSelected.reduce((s, c) => s + c.weight, 0);
  const improve = improveSelected.reduce((s, c) => s + c.weight, 0);
  // 这里简单用：score = clamp( worsen - improve + 0.5, 0, 1 )
  let score = worsen - improve + 0.5;
  score = Math.max(0, Math.min(1, score));

  const scoreText = document.getElementById("score-text");
  const scoreFill = document.getElementById("score-fill");
  const img = document.getElementById("desert-image");

  scoreText.textContent = score.toFixed(2);
  scoreFill.style.width = `${(1 - score) * 100}%`; // 分数越高，可视区域越少，象征土地退化

  const level = LEVEL_IMAGES.find(l => score <= l.max) || LEVEL_IMAGES[LEVEL_IMAGES.length - 1];
  img.src = level.src;
  img.alt = level.alt;
}

function renderLists() {
  const worsenUl = document.getElementById("worsen-list");
  const improveUl = document.getElementById("improve-list");

  worsenUl.innerHTML = "";
  improveUl.innerHTML = "";

  worsenSelected.forEach((c, idx) => {
    const li = document.createElement("li");
    const spanLabel = document.createElement("span");
    spanLabel.className = "label";
    spanLabel.textContent = c.key;

    const spanWeight = document.createElement("span");
    spanWeight.className = "weight";
    spanWeight.textContent = `+${(c.weight * 100).toFixed(0)}%`;

    const btn = document.createElement("button");
    btn.className = "remove-btn";
    btn.textContent = "移除";
    btn.addEventListener("click", () => {
      worsenSelected.splice(idx, 1);
      renderLists();
      updateScore();
    });

    li.appendChild(spanLabel);
    li.appendChild(spanWeight);
    li.appendChild(btn);
    worsenUl.appendChild(li);
  });

  improveSelected.forEach((c, idx) => {
    const li = document.createElement("li");
    const spanLabel = document.createElement("span");
    spanLabel.className = "label";
    spanLabel.textContent = c.key;

    const spanWeight = document.createElement("span");
    spanWeight.className = "weight";
    spanWeight.textContent = `-${(c.weight * 100).toFixed(0)}%`;

    const btn = document.createElement("button");
    btn.className = "remove-btn";
    btn.textContent = "移除";
    btn.addEventListener("click", () => {
      improveSelected.splice(idx, 1);
      renderLists();
      updateScore();
    });

    li.appendChild(spanLabel);
    li.appendChild(spanWeight);
    li.appendChild(btn);
    improveUl.appendChild(li);
  });
}

function showFeedback(msg, type = "") {
  const el = document.getElementById("feedback");
  el.textContent = msg;
  el.className = `feedback ${type}`.trim();
}

function updateSuggestList(keyword) {
  const listEl = document.getElementById("suggest-list");
  const kw = keyword.trim();

  if (!kw) {
    listEl.innerHTML = "";
    listEl.classList.add("hidden");
    return;
  }

  const lower = normalize(kw);
  const all = getAllCauses();

  const matched = all.filter(c =>
    c.aliases.some(a => normalize(a).includes(lower)) ||
    normalize(c.key).includes(lower)
  ).slice(0, 8);

  if (matched.length === 0) {
    listEl.innerHTML = "";
    listEl.classList.add("hidden");
    return;
  }

  listEl.innerHTML = "";
  matched.forEach(cause => {
    const li = document.createElement("li");

    const main = document.createElement("span");
    main.className = "suggest-main";
    main.textContent = cause.key;

    const tag = document.createElement("span");
    tag.className = "suggest-tag";
    tag.textContent = cause.type === "worsen" ? "导致荒漠化" : "改善荒漠化";

    li.appendChild(main);
    li.appendChild(tag);

    li.addEventListener("click", () => {
      // 选择建议后，直接加入对应列表
      const exists = (cause.type === "worsen" ? worsenSelected : improveSelected)
        .some(c => c.key === cause.key);
      if (!exists) {
        if (cause.type === "worsen") {
          worsenSelected.push(cause);
        } else {
          improveSelected.push(cause);
        }
        renderLists();
        updateScore();
        showFeedback(`已根据选择加入：${cause.key}（${cause.type === "worsen" ? "导致荒漠化" : "改善荒漠化"}成因）`, "success");
      } else {
        showFeedback("该成因已在列表中。", "success");
      }

      const input = document.getElementById("cause-input");
      input.value = cause.key;
      listEl.classList.add("hidden");
    });

    listEl.appendChild(li);
  });

  listEl.classList.remove("hidden");
}

function setup() {
  const input = document.getElementById("cause-input");
  const checkBtn = document.getElementById("check-btn");

  function handleCheck() {
    const text = input.value;
    if (!text.trim()) {
      showFeedback("请输入一个成因关键词，例如：过度放牧。", "error");
      return;
    }

    const cause = findCause(text);
    if (!cause) {
      showFeedback("暂未匹配到该成因，请尝试换个说法。", "error");
      return;
    }

    // 已经在对应列表中
    const exists = (cause.type === "worsen" ? worsenSelected : improveSelected)
      .some(c => c.key === cause.key);
    if (exists) {
      showFeedback("该成因已在列表中。", "success");
      return;
    }

    const label = cause.type === "worsen" ? "导致荒漠化" : "改善荒漠化";
    showFeedback(`识别为“${label}”成因：${cause.key}，已加入列表。`, "success");

    if (cause.type === "worsen") {
      worsenSelected.push(cause);
    } else {
      improveSelected.push(cause);
    }

    input.value = "";
    renderLists();
    updateScore();
  }

  checkBtn.addEventListener("click", handleCheck);
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      handleCheck();
    }
  });

   input.addEventListener("input", () => {
    updateSuggestList(input.value);
    showFeedback("", "");
  });

  // 初始化
  renderLists();
  updateScore();
}

window.addEventListener("DOMContentLoaded", setup);
