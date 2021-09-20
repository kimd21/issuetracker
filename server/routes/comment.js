const router = require('express').Router({mergeParams: true});
const { commentValidator } = require('../middlewares/commentValidator');
const commentController = require('../controllers/commentController');

router.get('/', commentController.comment_getAll);

router.post('/', commentValidator, commentController.comment_post);

router.get('/:commentId', commentController.comment_get);

router.put('/:commentId', commentValidator, commentController.comment_put);

router.delete('/:commentId', commentController.comment_delete);

module.exports = router;