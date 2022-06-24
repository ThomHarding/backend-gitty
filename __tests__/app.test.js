const pool = require('../lib/utils/pool');
const setup = require('../data/setup');
const request = require('supertest');
const app = require('../lib/app');

jest.mock('../lib/services/github');

describe('gitty routes', () => {
  beforeEach(() => {
    return setup(pool);
  });

  afterAll(() => {
    pool.end();
  });

  it('should redirect to the github oauth page upon login', async () => {
    const res = await request(app).get('/api/v1/github/login');

    expect(res.header.location).toMatch(
      /https:\/\/github.com\/login\/oauth\/authorize\?client_id=[\w\d]+&scope=user&redirect_uri=http:\/\/localhost:7890\/api\/v1\/github\/callback/i
    );
  });

  it('should login and redirect users to /api/v1/github/dashboard', async () => {
    const res = await request
      .agent(app)
      .get('/api/v1/github/callback?code=42')
      .redirects(1);

    expect(res.body).toEqual({
      id: expect.any(String),
      username: 'fake_github_user',
      email: 'not-real@example.com',
      avatar: expect.any(String),
      iat: expect.any(Number),
      exp: expect.any(Number),
    });
  });

  it('should sign a user out on /delete', async () => {
    await request
      .agent(app)
      .get('/api/v1/github/callback?code=42')
      .redirects(1);
    const res = await request(app).delete('/api/v1/github/sessions');
    // TODO: try to access the dashboard and make sure the message is the you must be signed in thing
    expect(res.body.message).toEqual('Signed out successfully!');
  });

  it('should be able to GET all posts', async () => {
    const agent = request.agent(app);
    await agent
      .get('/api/v1/github/login')
      .redirects(1);
    await agent
      .get('/api/v1/github/callback?code=42')
      .redirects(1);
    const res = await agent.get('/api/v1/github/posts');
    expect(res.body).toEqual([
      { text: 'wow! a test post', user_id: 1 },
      { text: 'a test post from the future', user_id: 1 }]);
  });

  it('should be able to POST a post for the current user', async () => {
    const agent = request.agent(app);
    await agent
      .get('/api/v1/github/login')
      .redirects(1);
    const callback = await agent
      .get('/api/v1/github/callback?code=42')
      .redirects(1);
    const poster_id = callback.body.id;
    const res = await agent.post(`/api/v1/github/posts?poster=${poster_id}`);
    expect(res.body).toEqual(
      { text: 'wow! a test post', user_id: poster_id });
  });
});
