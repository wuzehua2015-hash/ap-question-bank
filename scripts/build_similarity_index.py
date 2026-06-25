import json, os, time, re
from sentence_transformers import SentenceTransformer
import numpy as np

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "data")
INPUT_FILE = os.path.join(DATA_DIR, "ap", "microeconomics", "question_bank.json")
OUTPUT_INDEX = os.path.join(DATA_DIR, "ap", "microeconomics", "similarity_index.json")
OUTPUT_EMBEDDED = os.path.join(DATA_DIR, "ap", "microeconomics", "question_bank_with_embeddings.json")
OUTPUT_INDEX = os.path.join(DATA_DIR, "similarity_index.json")
OUTPUT_EMBEDDED = os.path.join(DATA_DIR, "macro_question_bank_v4_with_embeddings.json")
MODEL_NAME = "all-MiniLM-L6-v2"

# Hybrid weights — revised to reduce same-unit bias and add concept matching
WEIGHTS = {
    "semantic":   0.40,   # increased: concept-level semantic similarity is key
    "structural": 0.10,   # reduced: format similarity is secondary
    "metadata":   0.10,   # REDUCED: same-unit was over-boosting to 0.95+
    "concept":    0.40,   # NEW: concept cluster overlap for cross-unit relevance
}
TOP_K = 10

# ---------------------------------------------------------------------------
# Concept Clusters for AP Macroeconomics
# Each cluster maps a concept name -> list of keywords/phrases to match
# ---------------------------------------------------------------------------
CONCEPT_CLUSTERS = {
    "economic_systems": [
        "command economy", "market economy", "mixed economy", "centrally planned",
        "free enterprise", "private ownership", "public ownership", "government ownership",
        "capitalism", "capitalist", "socialism", "communism", "laissez-faire",
    ],
    "ppc": [
        "production possibilities", "production possibility", "ppf", "ppc",
        "opportunity cost", "trade-off", "trade off", "efficiency", "productive efficiency",
        "allocative efficiency", "economic growth", "expansion", "contraction",
    ],
    "comparative_advantage": [
        "comparative advantage", "absolute advantage", "specialization", "specialize",
        "terms of trade", "gains from trade", "autarky", "international trade",
        "export", "import", "tariff", "quota", "trade barrier",
    ],
    "supply_demand": [
        "supply", "demand", "equilibrium", "surplus", "shortage", "excess supply",
        "excess demand", "price floor", "price ceiling", "binding", "nonbinding",
        "consumer surplus", "producer surplus", "deadweight loss", "welfare",
    ],
    "elasticity": [
        "elasticity", "elastic", "inelastic", "unit elastic", "perfectly elastic",
        "perfectly inelastic", "price elasticity", "income elasticity", "cross elasticity",
    ],
    "aggregate_demand": [
        "aggregate demand", "ad curve", "consumption", "investment", "government spending",
        "net exports", "wealth effect", "interest rate effect", "exchange rate effect",
        "real-balances effect", "real balances effect",
    ],
    "aggregate_supply": [
        "aggregate supply", "sras", "lras", "short-run aggregate supply",
        "long-run aggregate supply", "sticky wages", "sticky prices", "menu costs",
        "input prices", "nominal wages", "expected inflation", "supply shock",
    ],
    "fiscal_policy": [
        "fiscal policy", "government spending", "taxes", "tax", "taxation",
        "budget deficit", "budget surplus", "national debt", "government debt",
        "expansionary fiscal", "contractionary fiscal", "automatic stabilizer",
        "crowding out", "multiplier", "spending multiplier", "tax multiplier",
    ],
    "monetary_policy": [
        "monetary policy", "central bank", "federal reserve", "fed",
        "open market operation", "open market operations", "discount rate",
        "reserve requirement", "reserve ratio", "federal funds rate", "interest rate",
        "money supply", "money market", "quantitative easing", "contractionary monetary",
        "expansionary monetary", "tight money", "easy money",
    ],
    "inflation": [
        "inflation", "inflation rate", "cpi", "consumer price index",
        "gdp deflator", "nominal gdp", "real gdp", "hyperinflation", "deflation",
        "disinflation", "cost-push inflation", "demand-pull inflation", "expected inflation",
    ],
    "unemployment": [
        "unemployment", "unemployment rate", "cyclical unemployment", "frictional unemployment",
        "structural unemployment", "natural rate", "natural rate of unemployment",
        "labor force", "labor force participation", "discouraged worker",
    ],
    "money": [
        "money", "money supply", "m1", "m2", "velocity of money", "quantity theory",
        "nominal interest rate", "real interest rate", "liquidity", "medium of exchange",
        "store of value", "unit of account",
    ],
    "banking": [
        "bank", "commercial bank", "reserves", "required reserves", "excess reserves",
        "money multiplier", "deposit", "loan", "lending", "fractional reserve",
    ],
    "international": [
        "exchange rate", "floating exchange rate", "fixed exchange rate", "appreciation",
        "depreciation", "balance of payments", "current account", "capital account",
        "trade deficit", "trade surplus", "currency", "foreign exchange", " FOREX",
    ],
    "economic_growth": [
        "economic growth", "growth rate", "productivity", "human capital", "physical capital",
        "technological progress", "technology", "innovation", "research and development",
        "investment in human capital", "investment in physical capital",
    ],
    "business_cycle": [
        "business cycle", "recession", "expansion", "peak", "trough", "recovery",
        "boom", "bust", "contraction", "real gdp", "output gap", "potential gdp",
    ],
    "gdp": [
        "gross domestic product", "gdp", "real gdp", "nominal gdp", "per capita",
        "consumption", "investment", "government purchases", "net exports",
        "intermediate good", "final good", "value added", "double counting",
    ],
    "circular_flow": [
        "circular flow", "household", "firm", "business", "product market",
        "factor market", "resource market", "goods and services", "factors of production",
        "income", "revenue", "payment", "wage", "rent", "profit", "interest",
    ],
}

def get_question_text(q):
    """Combine question text and options for embedding."""
    text = q.get("text", "")
    options = q.get("options", {})
    if not options:
        return text
    opts_str = " | ".join([f"{k}: {v}" for k, v in sorted(options.items())])
    return f"{text}\n[SEP]\nOptions: {opts_str}"

def cosine_similarity_matrix(embeddings):
    """Compute pairwise cosine similarity matrix from normalized embeddings."""
    dot = embeddings @ embeddings.T
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    return dot / (norms @ norms.T + 1e-8)

def structural_similarity(q1, q2):
    """Compute structural similarity between two questions."""
    score = 0.0
    count = 0
    
    # has_graph
    g1 = q1.get("has_graph", False)
    g2 = q2.get("has_graph", False)
    score += 1.0 if g1 == g2 else 0.0
    count += 1
    
    # option_table_data
    t1 = bool(q1.get("option_table_data"))
    t2 = bool(q2.get("option_table_data"))
    score += 1.0 if t1 == t2 else 0.0
    count += 1
    
    # options count
    o1 = len(q1.get("options", {}))
    o2 = len(q2.get("options", {}))
    score += 1.0 - abs(o1 - o2) / max(o1, o2, 1)
    count += 1
    
    # requires_calculation (if available)
    c1 = q1.get("requires_calculation", False)
    c2 = q2.get("requires_calculation", False)
    score += 1.0 if c1 == c2 else 0.0
    count += 1
    
    return score / count if count > 0 else 0.0

def metadata_similarity(q1, q2):
    """Compute metadata similarity — REDUCED weight, less unit-bias."""
    score = 0.0
    count = 0
    
    # primary_unit: same unit = small boost, NOT a dominant signal
    u1 = q1.get("primary_unit", "")
    u2 = q2.get("primary_unit", "")
    if u1 and u2:
        score += 1.0 if u1 == u2 else 0.0
        count += 1
    
    # secondary_units overlap
    s1 = set(q1.get("secondary_units", []))
    s2 = set(q2.get("secondary_units", []))
    if s1 or s2:
        union = s1 | s2
        if union:
            score += len(s1 & s2) / len(union)
        count += 1
    
    # topics overlap (Jaccard)
    t1 = set(q1.get("topics", []))
    t2 = set(q2.get("topics", []))
    if t1 or t2:
        union = t1 | t2
        if union:
            score += len(t1 & t2) / len(union)
        count += 1
    
    return score / count if count > 0 else 0.0

def extract_concepts(q):
    """Extract concept cluster tags from question text + options."""
    text = q.get("text", "").lower()
    options = q.get("options", {})
    for opt_text in options.values():
        text += " " + str(opt_text).lower()
    
    matched = set()
    for concept_name, keywords in CONCEPT_CLUSTERS.items():
        for kw in keywords:
            if kw.lower() in text:
                matched.add(concept_name)
                break  # one match per cluster is enough
    return matched

def concept_similarity(concepts1, concepts2):
    """Jaccard similarity between concept sets."""
    if not concepts1 or not concepts2:
        return 0.0
    union = concepts1 | concepts2
    if not union:
        return 0.0
    return len(concepts1 & concepts2) / len(union)

def main():
    print("=" * 60)
    print("AP Question Bank - Similarity Index Builder (v2)")
    print("=" * 60)
    
    # 1. Load data
    print("\n[1/8] Loading question bank...")
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    print(f"  Loaded {len(data)} questions from {INPUT_FILE}")
    
    # 2. Extract concepts for all questions
    print("\n[2/8] Extracting concept clusters...")
    question_concepts = [extract_concepts(q) for q in data]
    concept_counts = {}
    for concepts in question_concepts:
        for c in concepts:
            concept_counts[c] = concept_counts.get(c, 0) + 1
    print(f"  Extracted {len(concept_counts)} distinct concepts")
    for c, count in sorted(concept_counts.items(), key=lambda x: -x[1])[:10]:
        print(f"    {c}: {count} questions")
    
    # 3. Load model
    print("\n[3/8] Loading model '{}'...".format(MODEL_NAME))
    start = time.time()
    model = SentenceTransformer(MODEL_NAME)
    print(f"  Model loaded in {time.time() - start:.2f}s")
    
    # 4. Compute embeddings
    print("\n[4/8] Computing embeddings for all questions...")
    texts = [get_question_text(q) for q in data]
    start = time.time()
    embeddings = model.encode(texts, batch_size=32, show_progress_bar=True, normalize_embeddings=True)
    embed_time = time.time() - start
    print(f"  Computed {len(data)} embeddings in {embed_time:.2f}s")
    
    # 5. Compute semantic similarity matrix
    print("\n[5/8] Computing semantic similarity matrix...")
    start = time.time()
    sem_sim = cosine_similarity_matrix(embeddings)
    print(f"  Matrix computed in {time.time() - start:.2f}s")
    
    # 6. Compute structural, metadata, and concept similarity matrices
    print("\n[6/8] Computing structural, metadata, and concept similarities...")
    n = len(data)
    struct_sim = np.zeros((n, n))
    meta_sim = np.zeros((n, n))
    concept_sim = np.zeros((n, n))
    
    for i in range(n):
        for j in range(i, n):
            s = structural_similarity(data[i], data[j])
            m = metadata_similarity(data[i], data[j])
            c = concept_similarity(question_concepts[i], question_concepts[j])
            struct_sim[i, j] = struct_sim[j, i] = s
            meta_sim[i, j] = meta_sim[j, i] = m
            concept_sim[i, j] = concept_sim[j, i] = c
    
    # 7. Hybrid fusion and top-k extraction
    print("\n[7/8] Fusing similarities and extracting top-{} per question...".format(TOP_K))
    overall_sim = (
        WEIGHTS["semantic"] * sem_sim +
        WEIGHTS["structural"] * struct_sim +
        WEIGHTS["metadata"] * meta_sim +
        WEIGHTS["concept"] * concept_sim
    )
    
    similarity_index = {}
    for i in range(n):
        qid = data[i]["question_id"]
        # Exclude self
        sim_row = overall_sim[i].copy()
        sim_row[i] = -1.0
        
        # Get top-k indices
        top_indices = np.argpartition(sim_row, -TOP_K)[-TOP_K:]
        top_indices = top_indices[np.argsort(-sim_row[top_indices])]
        
        similarity_index[qid] = {
            "semantic_top5": [],
            "concept_top5": [],
            "overall_top10": []
        }
        
        for idx in top_indices:
            idx = int(idx)
            other_qid = data[idx]["question_id"]
            similarity_index[qid]["overall_top10"].append({
                "question_id": other_qid,
                "similarity": round(float(overall_sim[i, idx]), 4),
                "semantic": round(float(sem_sim[i, idx]), 4),
                "structural": round(float(struct_sim[i, idx]), 4),
                "metadata": round(float(meta_sim[i, idx]), 4),
                "concept": round(float(concept_sim[i, idx]), 4),
                "primary_unit": data[idx].get("primary_unit", ""),
                "topics": data[idx].get("topics", []),
                "concepts": sorted(list(question_concepts[idx]))[:5],  # top 5 concepts
            })
        
        # semantic-only top-5
        sem_row = sem_sim[i].copy()
        sem_row[i] = -1.0
        sem_top = np.argpartition(sem_row, -5)[-5:]
        sem_top = sem_top[np.argsort(-sem_row[sem_top])]
        for idx in sem_top:
            idx = int(idx)
            similarity_index[qid]["semantic_top5"].append({
                "question_id": data[idx]["question_id"],
                "similarity": round(float(sem_sim[i, idx]), 4)
            })
        
        # concept-only top-5
        concept_row = concept_sim[i].copy()
        concept_row[i] = -1.0
        concept_top = np.argpartition(concept_row, -5)[-5:]
        concept_top = concept_top[np.argsort(-concept_row[concept_top])]
        for idx in concept_top:
            idx = int(idx)
            similarity_index[qid]["concept_top5"].append({
                "question_id": data[idx]["question_id"],
                "similarity": round(float(concept_sim[i, idx]), 4),
                "concepts": sorted(list(question_concepts[idx]))[:5],
            })
    
    # 8. Write outputs
    print("\n[8/8] Writing output files...")
    
    with open(OUTPUT_INDEX, "w", encoding="utf-8") as f:
        json.dump(similarity_index, f, indent=2, ensure_ascii=False)
    print(f"  Similarity index: {OUTPUT_INDEX}")
    print(f"    Size: {os.path.getsize(OUTPUT_INDEX) / 1024:.1f} KB")
    
    embedded_data = []
    for i, q in enumerate(data):
        q_copy = dict(q)
        q_copy["embedding"] = embeddings[i].tolist()
        q_copy["concepts"] = sorted(list(question_concepts[i]))
        embedded_data.append(q_copy)
    
    with open(OUTPUT_EMBEDDED, "w", encoding="utf-8") as f:
        json.dump(embedded_data, f, indent=2, ensure_ascii=False)
    print(f"  Embedded data: {OUTPUT_EMBEDDED}")
    print(f"    Size: {os.path.getsize(OUTPUT_EMBEDDED) / 1024:.1f} KB")
    
    # Stats
    print("\n" + "=" * 60)
    print("Build Complete")
    print("=" * 60)
    print(f"Questions processed: {n}")
    print(f"Similarity pairs computed: {n * (n-1) // 2}")
    print(f"Top-k per question: {TOP_K}")
    print(f"Hybrid weights: {WEIGHTS}")
    print(f"\nOutput files:")
    print(f"  - {os.path.basename(OUTPUT_INDEX)}")
    print(f"  - {os.path.basename(OUTPUT_EMBEDDED)}")
    
    # Sample output — show cross-unit recommendations
    print("\nSample similarity results (showing cross-unit hits):")
    for qid in ["2012_Q04", "2015_Q01", "2012_Q50"]:
        if qid not in similarity_index:
            continue
        self_unit = next(q.get("primary_unit", "") for q in data if q["question_id"] == qid)
        self_concepts = next(sorted(list(question_concepts[i])) for i, q in enumerate(data) if q["question_id"] == qid)
        print(f"\n  {qid} (U={self_unit}, concepts={self_concepts}):")
        for item in similarity_index[qid]["overall_top10"][:5]:
            cross = " [CROSS-UNIT]" if item["primary_unit"] != self_unit else ""
            print(f"    -> {item['question_id']} U={item['primary_unit']} sim={item['similarity']} (sem={item['semantic']}, concept={item['concept']}, meta={item['metadata']}){cross}")

if __name__ == "__main__":
    main()
