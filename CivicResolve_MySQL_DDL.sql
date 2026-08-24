-- ============================================================
-- CivicResolve — Schema DDL  (MySQL 8.0+ version)
-- Relational data -> MySQL.  Embeddings/vectors -> Qdrant (separate vector DB).
-- Run:  CREATE DATABASE CivicResolve;  USE CivicResolve;  then paste this.
-- ============================================================

-- ---------- Clean slate (MySQL has no DROP ... CASCADE) ----------
SET FOREIGN_KEY_CHECKS = 0;
DROP VIEW  IF EXISTS v_department_open_load;
DROP TABLE IF EXISTS audit_log, comment, attachment, status_history,
                     assignment, complaint_vector, complaint,
                     complaint_cluster, sla_policy, category,
                     department, app_user, ward, role;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------- Lookup / master tables ----------
CREATE TABLE role (
    role_id   INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(20) NOT NULL UNIQUE,
    CONSTRAINT chk_role CHECK (role_name IN ('CITIZEN','OFFICER','ADMIN'))
);

CREATE TABLE ward (
    ward_id     INT AUTO_INCREMENT PRIMARY KEY,
    ward_number INT NOT NULL UNIQUE,
    ward_name   VARCHAR(80) NOT NULL,
    zone        VARCHAR(40) NOT NULL
);

CREATE TABLE department (
    department_id INT AUTO_INCREMENT PRIMARY KEY,
    dept_name     VARCHAR(80) NOT NULL UNIQUE,
    description   VARCHAR(255)
);

CREATE TABLE category (
    category_id   INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(80) NOT NULL,
    department_id INT NOT NULL,
    CONSTRAINT fk_category_dept
        FOREIGN KEY (department_id) REFERENCES department(department_id),
    CONSTRAINT uq_category UNIQUE (category_name, department_id)
);

CREATE TABLE sla_policy (
    sla_id           INT AUTO_INCREMENT PRIMARY KEY,
    category_id      INT NOT NULL UNIQUE,
    resolution_hours INT NOT NULL,
    escalation_hours INT NOT NULL,
    CONSTRAINT fk_sla_category
        FOREIGN KEY (category_id) REFERENCES category(category_id),
    CONSTRAINT chk_res  CHECK (resolution_hours > 0),
    CONSTRAINT chk_esc  CHECK (escalation_hours > 0)
);

-- ---------- Users ----------
CREATE TABLE app_user (
    user_id       INT AUTO_INCREMENT PRIMARY KEY,
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(120) NOT NULL UNIQUE,
    phone         VARCHAR(15),
    password_hash VARCHAR(255) NOT NULL,               -- bcrypt hash, never plaintext
    role_id       INT NOT NULL,
    ward_id       INT,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES role(role_id),
    CONSTRAINT fk_user_ward FOREIGN KEY (ward_id) REFERENCES ward(ward_id),
    CONSTRAINT chk_phone CHECK (phone IS NULL OR phone REGEXP '^[0-9]{10}$')
);

-- ---------- Clusters (duplicate rollups) ----------
CREATE TABLE complaint_cluster (
    cluster_id                  INT AUTO_INCREMENT PRIMARY KEY,
    representative_complaint_id INT,
    report_count                INT NOT NULL DEFAULT 1,
    centroid_summary            TEXT,
    created_at                  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_count CHECK (report_count >= 1)
);

-- ---------- Core: complaints ----------
CREATE TABLE complaint (
    complaint_id INT AUTO_INCREMENT PRIMARY KEY,
    title        VARCHAR(150) NOT NULL,
    description  TEXT NOT NULL,
    citizen_id   INT NOT NULL,
    ward_id      INT NOT NULL,
    category_id  INT,                                   -- NULL at intake, set by routing
    cluster_id   INT,
    status       VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    priority     VARCHAR(10) NOT NULL DEFAULT 'MEDIUM',
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sla_due_at   TIMESTAMP NULL,
    resolved_at  TIMESTAMP NULL,
    CONSTRAINT fk_complaint_citizen  FOREIGN KEY (citizen_id) REFERENCES app_user(user_id),
    CONSTRAINT fk_complaint_ward     FOREIGN KEY (ward_id)     REFERENCES ward(ward_id),
    CONSTRAINT fk_complaint_category FOREIGN KEY (category_id) REFERENCES category(category_id),
    CONSTRAINT fk_complaint_cluster  FOREIGN KEY (cluster_id)  REFERENCES complaint_cluster(cluster_id),
    CONSTRAINT chk_status CHECK (status IN ('OPEN','ASSIGNED','IN_PROGRESS','RESOLVED','CLOSED','ESCALATED')),
    CONSTRAINT chk_priority CHECK (priority IN ('LOW','MEDIUM','HIGH'))
);

-- Deferred FK from cluster -> representative complaint (ALTER demonstration)
ALTER TABLE complaint_cluster
    ADD CONSTRAINT fk_cluster_rep_complaint
    FOREIGN KEY (representative_complaint_id) REFERENCES complaint(complaint_id);

-- ---------- Link to vector store (actual 384-dim vectors live in Qdrant) ----------
CREATE TABLE complaint_vector (
    complaint_id    INT PRIMARY KEY,
    qdrant_point_id VARCHAR(64) NOT NULL,               -- id of the point in Qdrant
    embedding_dim   INT NOT NULL DEFAULT 384,
    CONSTRAINT fk_vec_complaint FOREIGN KEY (complaint_id)
        REFERENCES complaint(complaint_id) ON DELETE CASCADE
);

-- ---------- Workflow tables ----------
CREATE TABLE assignment (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id  INT NOT NULL,
    officer_id    INT NOT NULL,
    assigned_by   INT NOT NULL,
    assigned_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_assign_complaint FOREIGN KEY (complaint_id) REFERENCES complaint(complaint_id),
    CONSTRAINT fk_assign_officer   FOREIGN KEY (officer_id)   REFERENCES app_user(user_id),
    CONSTRAINT fk_assign_by        FOREIGN KEY (assigned_by)  REFERENCES app_user(user_id)
);

CREATE TABLE status_history (
    history_id   INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    old_status   VARCHAR(20),
    new_status   VARCHAR(20) NOT NULL,
    changed_by   INT NOT NULL,
    remarks      TEXT,
    changed_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_hist_complaint FOREIGN KEY (complaint_id) REFERENCES complaint(complaint_id),
    CONSTRAINT fk_hist_user      FOREIGN KEY (changed_by)   REFERENCES app_user(user_id)
);

CREATE TABLE attachment (
    attachment_id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id  INT NOT NULL,
    file_url      VARCHAR(255) NOT NULL,
    file_type     VARCHAR(20),
    uploaded_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_att_complaint FOREIGN KEY (complaint_id) REFERENCES complaint(complaint_id)
);

CREATE TABLE comment (
    comment_id   INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    author_id    INT NOT NULL,
    body         TEXT NOT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comment_complaint FOREIGN KEY (complaint_id) REFERENCES complaint(complaint_id),
    CONSTRAINT fk_comment_author    FOREIGN KEY (author_id)    REFERENCES app_user(user_id)
);

CREATE TABLE audit_log (
    log_id     INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT,
    action     VARCHAR(50) NOT NULL,
    entity     VARCHAR(40) NOT NULL,
    entity_id  INT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES app_user(user_id)
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_complaint_status   ON complaint(status);
CREATE INDEX idx_complaint_ward      ON complaint(ward_id);
CREATE INDEX idx_complaint_category  ON complaint(category_id);
CREATE INDEX idx_complaint_created   ON complaint(created_at);
CREATE INDEX idx_assignment_officer  ON assignment(officer_id);

-- ============================================================
-- View: live open-complaint load per department
-- ============================================================
CREATE VIEW v_department_open_load AS
SELECT  d.department_id,
        d.dept_name,
        COUNT(c.complaint_id) AS open_complaints
FROM    department d
JOIN    category  cat ON cat.department_id = d.department_id
JOIN    complaint c   ON c.category_id     = cat.category_id
WHERE   c.status IN ('OPEN','ASSIGNED','IN_PROGRESS','ESCALATED')
GROUP BY d.department_id, d.dept_name
ORDER BY open_complaints DESC;
