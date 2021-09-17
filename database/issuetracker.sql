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
  problem_title VARCHAR(255),
  problem VARCHAR(1000),
  id SERIAL,
  task_type TASK_TYPE,
  status STATUS,
  category CATEGORY,
  version NUMERIC(2,1),
  priority PRIORITY,
  created_at TIMESTAMPTZ NOT NULL,
  due_date TIMESTAMPTZ,
  registered_by VARCHAR(255) NOT NULL, --Change to 255 in database
  CONSTRAINT fk_user
    FOREIGN KEY(id) 
      REFERENCES "user"(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS comment(
  comment_id SERIAL PRIMARY KEY,
  id SERIAL,
  issue_id SERIAL,
  comment_title VARCHAR(255),
  comment VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL,  --Add to database
  registered_by VARCHAR(255) NOT NULL, --Add to database
  CONSTRAINT fk_issue
    FOREIGN KEY (issue_id)
      REFERENCES issue(issue_id)
      ON DELETE CASCADE
      ON UPDATE CASCADE,
  CONSTRAINT fk_user
    FOREIGN KEY(id) 
      REFERENCES "user"(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE
);