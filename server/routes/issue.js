const router = require('express').Router({mergeParams: true});
const issueController = require('../controllers/issueController');
// const commentRouter = require('./comment');

router.get('/', issueController.issue_getAll)

// router.get('/:issueId', issueController.issue_get);

router.post('/', issueController.issue_post);

// router.put('/:issueId', issueController.issue_put);

// router.delete('/:issueId', issueController.issue_delete);

// router.get('/:issueId/comments', commentRouter);

// module.exports = router;