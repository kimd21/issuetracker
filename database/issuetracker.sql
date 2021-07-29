CREATE TABLE IF NOT EXISTS "user"(
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(30),
  last_name VARCHAR(30),
  asignee ASIGNEE,
  birth_date DATE,
  username VARCHAR(255) UNIQUE,
  password VARCHAR(100),
  email VARCHAR(100), 
  joined_on TIMESTAMPTZ NOT NULL,
  last_logged_on TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS issue(
  issue_id SERIAL PRIMARY KEY,
  uid SERIAL,
  task_type TASK_TYPE,
  status STATUS,
  category CATEGORY,
  version NUMERIC(2,1),
  priority PRIORITY,
  created_at TIMESTAMP NOT NULL,
  due_date TIMESTAMP,
  registered_by VARCHAR(100) UNIQUE NOT NULL, 
  CONSTRAINT fk_user
    FOREIGN KEY(uid) 
      REFERENCES "user"(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS comments(
  comment_id SERIAL PRIMARY KEY,
  uid SERIAL,
  iid SERIAL,
  CONSTRAINT fk_issue
    FOREIGN KEY (iid)
      REFERENCES issue(issue_id)
      ON DELETE CASCADE
      ON UPDATE CASCADE,
  CONSTRAINT fk_user
    FOREIGN KEY(uid) 
      REFERENCES "user"(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE
);