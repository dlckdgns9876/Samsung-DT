const pool = require('./db');

// 특정 게시글의 모든 댓글 조회
exports.getComments = async (req, res) => {
    const postId = req.params.postId;
    try {
        const [comments] = await pool.query(
            `SELECT c.*, u.nickname 
             FROM comments c 
             JOIN users u ON c.user_id = u.user_id 
             WHERE c.post_id = ? 
             ORDER BY c.created_at ASC`,
            [postId]
        );
        res.json(comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// 댓글 생성
exports.createComment = async (req, res) => {
    const { post_id, content } = req.body;
    const userId = req.user.id;

    try {
        const [result] = await pool.query(
            'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
            [post_id, userId, content]
        );
        res.json({ id: result.insertId, post_id, user_id: userId, content });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// 댓글 수정
exports.updateComment = async (req, res) => {
    const { content } = req.body;
    const commentId = req.params.id;
    const userId = req.user.id;

    try {
        const [comments] = await pool.query('SELECT * FROM comments WHERE comment_id = ? AND user_id = ?', [commentId, userId]);
        if (comments.length === 0) {
            return res.status(404).json({ msg: 'Comment not found or not authorized' });
        }

        await pool.query(
            'UPDATE comments SET content = ? WHERE comment_id = ?',
            [content, commentId]
        );
        res.json({ msg: 'Comment updated' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// 댓글 삭제
exports.deleteComment = async (req, res) => {
    const commentId = req.params.id;
    const userId = req.user.id;

    try {
        const [comments] = await pool.query('SELECT * FROM comments WHERE comment_id = ? AND user_id = ?', [commentId, userId]);
        if (comments.length === 0) {
            return res.status(404).json({ msg: 'Comment not found or not authorized' });
        }

        await pool.query('DELETE FROM comments WHERE comment_id = ?', [commentId]);
        res.json({ msg: 'Comment removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
