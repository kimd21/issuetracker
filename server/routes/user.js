const router = require('express').Router();
const userController = require('../controllers/userController');
const itemRouter = require('./issue');

// Get profile of specified user
router.get('/:userId', userController.user_get);

// Only ADMIN and developers can create new user
// router.post('/:userId', userController.user_post);


// router.put('/:userId', userController.user_put);

// router.delete('/:userId', userController.user_delete);

// router.use('/:userId/items', itemRouter);

module.exports = router;
