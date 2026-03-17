CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE professionals (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(100) NOT NULL,
    name_kana           VARCHAR(100),
    profession_type     VARCHAR(50) NOT NULL,
    organization        VARCHAR(200),
    organization_type   VARCHAR(50),
    role                VARCHAR(100),
    license_number      VARCHAR(100),
    country             VARCHAR(10) DEFAULT 'JP',
    region              VARCHAR(50),
    stance_axis1        FLOAT DEFAULT 0.0,
    stance_axis2        FLOAT DEFAULT 0.0,
    confidence          FLOAT DEFAULT 0.0,
    record_count        INT DEFAULT 0,
    attributes          JSONB DEFAULT '{}',
    profile_vector      vector(1536),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_professionals_name_trgm ON professionals USING gin(name gin_trgm_ops);
CREATE INDEX idx_professionals_type ON professionals(profession_type);
CREATE INDEX idx_professionals_org ON professionals(organization);
CREATE INDEX idx_professionals_country ON professionals(country);
CREATE INDEX idx_professionals_vector ON professionals USING hnsw(profile_vector vector_cosine_ops);

CREATE TABLE decisions (
    id              SERIAL PRIMARY KEY,
    decision_id     VARCHAR(100) UNIQUE NOT NULL,
    decision_type   VARCHAR(50),
    organization    VARCHAR(100),
    organization_type VARCHAR(20),
    decision_date   DATE,
    case_number     VARCHAR(100),
    title           TEXT,
    summary         TEXT,
    source_url      TEXT,
    country         VARCHAR(10) DEFAULT 'JP',
    scraped_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_decisions_date ON decisions(decision_date);
CREATE INDEX idx_decisions_type ON decisions(decision_type);
CREATE INDEX idx_decisions_country ON decisions(country);

CREATE TABLE decision_professionals (
    decision_id     INT REFERENCES decisions(id) ON DELETE CASCADE,
    professional_id INT REFERENCES professionals(id) ON DELETE CASCADE,
    role            VARCHAR(50),
    PRIMARY KEY (decision_id, professional_id)
);

CREATE TABLE decision_analyses (
    id                  SERIAL PRIMARY KEY,
    decision_id         INT REFERENCES decisions(id) ON DELETE CASCADE,
    professional_id     INT REFERENCES professionals(id) ON DELETE CASCADE,
    issue               TEXT,
    outcome             VARCHAR(100),
    reasoning_style     TEXT,
    interpretation      TEXT,
    area                VARCHAR(50),
    stance_axis1        FLOAT,
    stance_axis2        FLOAT,
    notable_points      JSONB DEFAULT '[]',
    raw_confidence      FLOAT DEFAULT 0.5,
    model_used          VARCHAR(50),
    analyzed_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analyses_professional ON decision_analyses(professional_id);
CREATE INDEX idx_analyses_area ON decision_analyses(area);

CREATE TABLE news_articles (
    id                  SERIAL PRIMARY KEY,
    article_id          VARCHAR(200) UNIQUE,
    source              VARCHAR(100),
    title               TEXT NOT NULL,
    url                 TEXT,
    published_at        TIMESTAMPTZ,
    professionals_mentioned JSONB DEFAULT '[]',
    organizations_mentioned JSONB DEFAULT '[]',
    keywords_found      JSONB DEFAULT '[]',
    country             VARCHAR(10) DEFAULT 'JP',
    scraped_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE news_professional_links (
    news_id         INT REFERENCES news_articles(id) ON DELETE CASCADE,
    professional_id INT REFERENCES professionals(id) ON DELETE CASCADE,
    context         TEXT,
    PRIMARY KEY (news_id, professional_id)
);

CREATE TABLE conduct_logs (
    id                  SERIAL PRIMARY KEY,
    professional_id     INT REFERENCES professionals(id),
    log_date            DATE NOT NULL,
    organization        VARCHAR(100),
    case_number         VARCHAR(100),
    log_type            VARCHAR(50),
    conduct_notes       TEXT,
    shakumei_exercised      BOOLEAN DEFAULT FALSE,
    impression_disclosed    BOOLEAN DEFAULT FALSE,
    opposing_professional   VARCHAR(100),
    opposing_conduct        TEXT,
    fairness_score      INT CHECK (fairness_score BETWEEN 1 AND 5),
    outcome_notes       TEXT,
    posted_by_hash      VARCHAR(64),
    country             VARCHAR(10) DEFAULT 'JP',
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conduct_professional ON conduct_logs(professional_id);
CREATE INDEX idx_conduct_date ON conduct_logs(log_date);
CREATE INDEX idx_conduct_type ON conduct_logs(log_type);

CREATE TABLE professional_relationships (
    pro_a_id            INT REFERENCES professionals(id),
    pro_b_id            INT REFERENCES professionals(id),
    relationship        VARCHAR(50),
    co_record_count     INT DEFAULT 0,
    similarity_score    FLOAT,
    PRIMARY KEY (pro_a_id, pro_b_id),
    CHECK (pro_a_id < pro_b_id)
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER professionals_updated_at
    BEFORE UPDATE ON professionals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE VIEW stance_map AS
SELECT
    p.id, p.name, p.profession_type, p.organization,
    p.country, p.stance_axis1, p.stance_axis2,
    p.confidence, p.record_count, p.attributes
FROM professionals p
WHERE p.confidence > 0.3
ORDER BY p.record_count DESC;

CREATE VIEW professional_area_stats AS
SELECT
    p.id, p.name, p.profession_type, a.area,
    COUNT(*) as case_count,
    AVG(a.stance_axis1) as avg_axis1,
    AVG(a.stance_axis2) as avg_axis2
FROM professionals p
JOIN decision_analyses a ON a.professional_id = p.id
GROUP BY p.id, p.name, p.profession_type, a.area;
