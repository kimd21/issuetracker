CREATE TABLE IF NOT EXISTS "user"(
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(30) NOT NULL,
  last_name VARCHAR(30) NOT NULL,
  birth_date DATE,
  email VARCHAR(100) NOT NULL, 
  joined_on TIMESTAMP NOT NULL,
  last_logged_on TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS issue(
  issue_id SERIAL PRIMARY KEY,
  uid SERIAL,
  task_type TASK_TYPE,
  asignee ASIGNEE,
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