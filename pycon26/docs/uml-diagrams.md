# UML Diagrams

These UML diagrams focus on the learner analysis flow and its main backend collaborators.

## Learner Analysis Class Diagram

```mermaid
classDiagram
    class LearnerRouter {
        +upload_resume(file) ResumeUploadResponse
        +analyze_learner_profile(payload) LearnerProfileAnalyzeResponse
    }

    class LearnerProfileAnalyzeRequest {
        +str current_role
        +str target_interest
        +str skillset
        +str resume_text
        +validate_target_interest(value) str
        +require_skillset_or_resume()
    }

    class LearnerProfileAnalyzeResponse {
        +str normalized_text
        +VectorSearchHit[] similar_matches
        +LearnerRecommendation recommendation
        +str llm_provider
    }

    class LearnerRecommendation {
        +str[] next_roles
        +str[] priority_skills
        +str[] actions_today
        +str explanation
    }

    class LearnerAnalysisService {
        +normalize_profile_text(payload) str
        +similarity_search(text, role_query, client) VectorSearchHit[]
        +search_learner_evidence(text, role_query, client) VectorSearchHit[]
        +search_job_skill_evidence(text, role_query, client) VectorSearchHit[]
        +generate_recommendation(profile_text, matches, client) tuple
        +build_evidence_fallback_recommendation(matches) LearnerRecommendation
    }

    class VectorDbClient {
        +str collection_name
        +str unique_skills_collection_name
        +str hnsw_space
        +EmbeddingFunction embedding_function
        +upsert_points(points) dict
        +embeddings_for_points(points, documents) list
        +search_text(text, limit, where, auto_index) VectorSearchHit[]
        +search_unique_skills_text(text, limit, where) VectorSearchHit[]
        +search_collection_text(collection, text, limit, where) VectorSearchHit[]
        +find_role_records(role_query, limit, auto_index) VectorSearchHit[]
        +index_data_dir(data_dir) int
        +index_unique_skills(path) dict
        +list_collections() dict[]
    }

    class EmbeddingFunction {
        <<interface>>
        +__call__(documents) list
    }

    class OllamaEmbeddingFunction {
        +str model
        +str base_url
        +float timeout
        +__call__(documents) list
        +get_config() dict
    }

    class LocalHashEmbeddingFunction {
        +int dimensions
        +__call__(documents) list
        +get_config() dict
    }

    class LocalLlmClient {
        +str base_url
        +str model
        +str provider
        +bool enabled
        +recommend(profile_text, matches) LearnerRecommendation
        +extract_resume_profile(compressed_resume_text) ResumeProfileExtraction
    }

    class VectorSearchHit {
        +str id
        +float score
        +dict payload
    }

    class ChromaDB {
        +job_skills collection
        +unique_skills collection
    }

    class OllamaEmbeddingServer {
        +/api/embed
    }

    class LocalLLMServer {
        +/v1/chat/completions
        +/api/generate
    }

    LearnerRouter --> LearnerProfileAnalyzeRequest : accepts
    LearnerRouter --> LearnerProfileAnalyzeResponse : returns
    LearnerRouter --> LearnerAnalysisService : calls
    LearnerProfileAnalyzeResponse *-- LearnerRecommendation
    LearnerProfileAnalyzeResponse *-- VectorSearchHit
    LearnerAnalysisService --> VectorDbClient : retrieves evidence
    LearnerAnalysisService --> LocalLlmClient : generates recommendation
    VectorDbClient --> VectorSearchHit : creates
    VectorDbClient --> EmbeddingFunction : embeds documents/query text
    EmbeddingFunction <|.. OllamaEmbeddingFunction
    EmbeddingFunction <|.. LocalHashEmbeddingFunction
    OllamaEmbeddingFunction --> OllamaEmbeddingServer : HTTP JSON
    VectorDbClient --> ChromaDB : queries/indexes
    LocalLlmClient --> LocalLLMServer : HTTP JSON
```

## Learner Analysis Sequence Diagram

```mermaid
sequenceDiagram
    actor Learner
    participant Frontend as Next.js Dashboard
    participant Router as FastAPI Learner Router
    participant Service as Learner Analysis Service
    participant VectorDB as VectorDbClient / ChromaDB
    participant Embedder as Ollama Embedding Server
    participant LLM as LocalLlmClient
    participant Model as Local LLM Server

    Learner->>Frontend: Submit role, target interest, skills, resume text
    Frontend->>Router: POST /learner/analyze
    Router->>Service: normalize_profile_text(payload)
    Service-->>Router: normalized profile text

    Router->>Service: similarity_search(text, target_interest)
    Service->>VectorDB: find_role_records(target_interest, limit=3, auto_index=false)
    VectorDB->>Embedder: POST /api/embed target role query
    Embedder-->>VectorDB: query embedding

    alt Target role found
        VectorDB-->>Service: role matches
        Service->>VectorDB: search_text(text, where={role}, auto_index=false)
        VectorDB->>Embedder: POST /api/embed learner profile query
        Embedder-->>VectorDB: query embedding
        VectorDB-->>Service: supporting role evidence
        Service->>VectorDB: search_unique_skills_text(text, limit=5)
        VectorDB->>Embedder: POST /api/embed learner profile query
        Embedder-->>VectorDB: query embedding
        VectorDB-->>Service: unique skill evidence
        Service-->>Router: merged similarity matches
    else Target role missing
        VectorDB-->>Service: no role matches
        Service-->>Router: TargetInterestNotFoundError
        Router-->>Frontend: 404 target interest not found
        Frontend-->>Learner: Show backend error detail
    end

    Router->>Service: generate_recommendation(text, matches)
    Service->>LLM: recommend(profile_text, matches)
    LLM->>Model: JSON completion request with compressed evidence

    alt Local LLM returns valid JSON
        Model-->>LLM: recommendation JSON
        LLM-->>Service: LearnerRecommendation
        Service-->>Router: recommendation, provider=local
    else Local LLM unavailable
        Model--xLLM: HTTP/network error
        LLM-->>Service: LocalLlmUnavailableError
        Service-->>Router: LocalLlmUnavailableError
        Router-->>Frontend: 502 local LLM failed
    else Local LLM returns invalid JSON
        Model-->>LLM: invalid JSON
        LLM-->>Service: ValueError
        Service-->>Router: evidence fallback recommendation
    end

    Router-->>Frontend: LearnerProfileAnalyzeResponse
    Frontend-->>Learner: Show roles, priority skills, actions, and evidence
```

## Scope

- The class diagram shows implementation-level collaborators for the learner analysis use case.
- The sequence diagram shows the primary `/learner/analyze` runtime flow, including embedding-backed retrieval, target-role misses, and local LLM fallback behavior.
- The sequence starts from the dashboard user journey after login and ends with the dashboard outcome: recommended roles, priority skills, actions, explanation, and retrieved evidence.
- The default runtime uses Ollama `nomic-embed-text` for ChromaDB document/query embeddings, while tests can use the deterministic local hash embedding function.
