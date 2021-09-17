const router = require('express').Router({mergeParams: true});
const commentController = require('../controllers/commentController');

router.get('/', commentController.comment_getAll);

router.post('/', commentController.comment_post);

router.get('/:commentId', commentController.comment_get);

router.put('/:commentId', commentController.comment_put);

router.delete('/:commentId', commentController.comment_delete);

module.exports = router;