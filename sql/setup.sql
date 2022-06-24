-- Use this file to define your SQL tables
-- The SQL in this file will be executed when you run `npm run setup-db`
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS github_users;

CREATE TABLE github_users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username VARCHAR NOT NULL,
  email VARCHAR,
  avatar VARCHAR
);

CREATE TABLE posts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  text VARCHAR NOT NULL,
  user_id int,
  FOREIGN KEY (user_id) REFERENCES github_users(id)
);

INSERT INTO github_users (
  username,
  email,
  avatar
)
VALUES
  ('admin', 'admin@administration.com', 'no');

INSERT INTO posts (
  text,
  user_id
)
VALUES 
  ('wow! a test post', 1),
  ('a test post from the future', 1);