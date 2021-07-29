const router = require('express').Router();
const profileController = require('../controllers/profileController');

/* GET users listing. */
router.get('/', (req, res) => {
  res.json(req.user);
});

router.get('/profile', profileController.profile_get);

router.post('/profile', profileController.profile_post);

router.put('/profile', profileController.profile_put);

router.delete('/profile', profileController.profile_delete);

module.exports = router;
