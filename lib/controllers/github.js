const { Router } = require('express');
const jwt = require('jsonwebtoken');
const authenticate = require('../middleware/authenticate');
const GithubUser = require('../models/GithubUser');
const Post = require('../models/Post');
const {
  exchangeCodeForToken,
  getGithubProfile,
} = require('../services/github.js');

const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24;

module.exports = Router()
  .get('/login', async (req, res) => {
    res.redirect(
      `https://github.com/login/oauth/authorize?client_id=${process.env.CLIENT_ID}&scope=user&redirect_uri=${process.env.REDIRECT_URI}`
    );
  })
  .get('/callback', async (req, res, next) => {
    try {
      //  * get code
      const { code } = req.query;
      //  * exchange code for token
      const token = await exchangeCodeForToken(code);
      //  * get info from github about user with token
      const githubProfile = await getGithubProfile(token);
      //  * get existing user if there is one
      let user = await GithubUser.findByUsername(githubProfile.login);
      //  * if not, create one
      if (!user) {
        user = await GithubUser.insert({
          username: githubProfile.login,
          email: githubProfile.email,
          avatar: githubProfile.avatar_url,
        });
      }
      //  * create jwt
      const payload = jwt.sign(user.toJSON(), process.env.JWT_SECRET, {
        expiresIn: '1 day',
      });
      //  * set cookie and redirect
      res
        .cookie(process.env.COOKIE_NAME, payload, {
          httpOnly: true,
          maxAge: ONE_DAY_IN_MS,
        })
        .redirect('/api/v1/github/dashboard');
    } catch (e) {
      next(e);
    }
  })

  .get('/dashboard', authenticate, async (req, res) => {
    // require req.user
    // get data about user and send it as json
    res.json(req.user);
  })

  .delete('/sessions', (req, res) => {
    res
      .clearCookie(process.env.COOKIE_NAME)
      .json({ success: true, message: 'Signed out successfully!' });
  })

  .get('/posts', authenticate, async(req, res) => {
    const posts = await Post.getAll();
    res.json(posts);
  })

  .post('/posts', authenticate, async(req, res) => {
    const { text } = req.query;
    if (!text.length >= 256) throw new Error('posts cannot be longer than 255 characters');
    const posts = await Post.insert(text, req.user.id);
    res.json(posts);
  });

