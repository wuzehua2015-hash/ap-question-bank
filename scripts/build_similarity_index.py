import json, os, time, math, sys
from sentence_transformers import SentenceTransformer
import numpy as np

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "data")
INPUT_FILE = os.path.join(DATA_DIR, "macro_question_bank_v4.json")
OUTPUT_INDEX = os.path.join(DATA_DIR, "similarity_index.json")
OUTPUT_EMBEDDED = os.path.join(DATA_DIR, "macro_question_bank_v4_with_embeddings.json")
MODEL_NAME = "all-MiniLM-L6-v2"

# Hybrid weights
WEIGHTS = {
    "semantic": 0.35,
    "structural": 0.15,
    "metadata": 0.40,
    "behavioral": 0.10,  # reserved
}
TOP_K = 10

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
    # embeddings: (n, dim)
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
    """Compute metadata similarity between two questions."""
    score = 0.0
    count = 0
    
    # primary_unit
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

def main():
    print("=" * 60)
    print("AP Question Bank - Similarity Index Builder")
    print("=" * 60)
    
    # 1. Load data
    print("\n[1/7] Loading question bank...")
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    print(f"  Loaded {len(data)} questions from {INPUT_FILE}")
    
    # 2. Load model
    print("\n[2/7] Loading model '{}'...".format(MODEL_NAME))
    start = time.time()
    model = SentenceTransformer(MODEL_NAME)
    print(f"  Model loaded in {time.time() - start:.2f}s")
    
    # 3. Compute embeddings
    print("\n[3/7] Computing embeddings for all questions...")
    texts = [get_question_text(q) for q in data]
    start = time.time()
    embeddings = model.encode(texts, batch_size=32, show_progress_bar=True, normalize_embeddings=True)
    embed_time = time.time() - start
    print(f"  Computed {len(data)} embeddings in {embed_time:.2f}s")
    
    # 4. Compute semantic similarity matrix
    print("\n[4/7] Computing semantic similarity matrix...")
    start = time.time()
    sem_sim = cosine_similarity_matrix(embeddings)
    print(f"  Matrix computed in {time.time() - start:.2f}s")
    
    # 5. Compute structural & metadata similarity matrices
    print("\n[5/7] Computing structural and metadata similarities...")
    n = len(data)
    struct_sim = np.zeros((n, n))
    meta_sim = np.zeros((n, n))
    
    for i in range(n):
        for j in range(i, n):
            s = structural_similarity(data[i], data[j])
            m = metadata_similarity(data[i], data[j])
            struct_sim[i, j] = struct_sim[j, i] = s
            meta_sim[i, j] = meta_sim[j, i] = m
    
    # 6. Hybrid fusion and top-k extraction
    print("\n[6/7] Fusing similarities and extracting top-{} per question...".format(TOP_K))
    overall_sim = (
        WEIGHTS["semantic"] * sem_sim +
        WEIGHTS["structural"] * struct_sim +
        WEIGHTS["metadata"] * meta_sim
    )
    
    similarity_index = {}
    for i in range(n):
        qid = data[i]["question_id"]
        # Exclude self (similarity = 1.0)
        sim_row = overall_sim[i].copy()
        sim_row[i] = -1.0
        
        # Get top-k indices
        top_indices = np.argpartition(sim_row, -TOP_K)[-TOP_K:]
        top_indices = top_indices[np.argsort(-sim_row[top_indices])]
        
        similarity_index[qid] = {
            "semantic_top5": [],
            "topic_top5": [],
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
                "primary_unit": data[idx].get("primary_unit", ""),
                "topics": data[idx].get("topics", [])
            })
        
        # Also keep semantic-only top-5 (for debugging/comparison)
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
        
        # topic-only top-5
        meta_row = meta_sim[i].copy()
        meta_row[i] = -1.0
        topic_top = np.argpartition(meta_row, -5)[-5:]
        topic_top = topic_top[np.argsort(-meta_row[topic_top])]
        for idx in topic_top:
            idx = int(idx)
            similarity_index[qid]["topic_top5"].append({
                "question_id": data[idx]["question_id"],
                "similarity": round(float(meta_sim[i, idx]), 4)
            })
    
    # 7. Write outputs
    print("\n[7/7] Writing output files...")
    
    # Write similarity index
    with open(OUTPUT_INDEX, "w", encoding="utf-8") as f:
        json.dump(similarity_index, f, indent=2, ensure_ascii=False)
    print(f"  Similarity index: {OUTPUT_INDEX}")
    print(f"    Size: {os.path.getsize(OUTPUT_INDEX) / 1024:.1f} KB")
    
    # Write embedded data (add embedding to each question)
    embedded_data = []
    for i, q in enumerate(data):
        q_copy = dict(q)
        q_copy["embedding"] = embeddings[i].tolist()
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
    
    # Sample output
    print("\nSample similarity results (first 3 questions):")
    for qid in list(similarity_index.keys())[:3]:
        print(f"\n  {qid}:")
        for item in similarity_index[qid]["overall_top10"][:3]:
            print(f"    -> {item['question_id']}: sim={item['similarity']} (semantic={item['semantic']}, metadata={item['metadata']})")

if __name__ == "__main__":
    main()
