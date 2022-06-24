const pool = require('../utils/pool');

module.exports = class Post {
  id;
  text;
  user_id;

  constructor(row) {
    this.id = row.id;
    this.text = row.text;
    this.user_id = row.user_id;
  }

  static async getAll() {
    const { rows } = await pool.query('SELECT text, user_id FROM posts;');
    return rows.map((row) => new Post(row));
  }

  toJSON() {
    return { ...this };
  }
};
