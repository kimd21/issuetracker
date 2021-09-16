const router = require('express').Router({mergeParams: true});
const issueController = require('../controllers/issueController');
const { issueValidator } = require('../middlewares/issueValidator');
// const commentRouter = require('./comment');

router.get('/', issueController.issue_getAll)

router.post('/', issueValidator, issueController.issue_post);

router.get('/:issueId', issueController.issue_get);

router.put('/:issueId', issueValidator, issueController.issue_put);

router.delete('/:issueId', issueController.issue_delete);

// router.use('/:issueId/comments', commentRouter);

module.exports = router;