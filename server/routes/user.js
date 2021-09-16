const router = require('express').Router();
const userController = require('../controllers/userController');
const { userValidator } = require('../middlewares/userValidator');
const issueRouter = require('./issue');

// Get all user profiles authorized for viewing
router.get('/', userController.user_getAll);

// Post (create) user profile
router.post('/', userValidator, userController.user_post);

// Get profile of userId
router.get('/:userId', userController.user_get);

// Update profile of userId
router.put('/:userId', userValidator, userController.user_put);

// Delete profile of userId
router.delete('/:userId', userController.user_delete);

router.use('/:userId/issues', issueRouter);

module.exports = router;
