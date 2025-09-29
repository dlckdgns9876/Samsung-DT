const pool = require('./db');

// 모든 게시글 조회
exports.getPosts = async (req, res) => {
    const { orderBy, direction = 'DESC' } = req.query;
    let orderByClause = 'ORDER BY p.created_at DESC';

    if (orderBy === 'popular') {
        orderByClause = `ORDER BY p.view_count ${direction.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'}`;
    }

    try {
        const [posts] = await pool.query(
            `SELECT p.*, u.nickname 
             FROM posts p 
             JOIN users u ON p.user_id = u.user_id 
             ${orderByClause}`
        );
        const processedPosts = posts.map(post => ({
            ...post,
            tags: post.hashtag ? post.hashtag.split(' ').filter(Boolean) : []
        }));
        res.json(processedPosts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// 특정 게시글 조회 (조회수 증가)
exports.getPostById = async (req, res) => {
    const postId = req.params.id;
    try {
        await pool.query('UPDATE posts SET view_count = view_count + 1 WHERE post_id = ?', [postId]);
        const [posts] = await pool.query(
            `SELECT p.*, u.nickname 
             FROM posts p 
             JOIN users u ON p.user_id = u.user_id 
             WHERE p.post_id = ?`,
            [postId]
        );
        if (posts.length === 0) {
            return res.status(404).json({ msg: 'Post not found' });
        }
        const post = {
            ...posts[0],
            tags: posts[0].hashtag ? posts[0].hashtag.split(' ').filter(Boolean) : []
        };
        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// 게시글 생성
exports.createPost = async (req, res) => {
    const { title, content, hashtag } = req.body;
    const userId = req.user.id;

    try {
        const [result] = await pool.query(
            'INSERT INTO posts (user_id, title, content, hashtag) VALUES ( ?, ?, ?, ?)',
            [userId, title, content, hashtag]
        );
        res.json({ id: result.insertId, user_id: userId, title, content, hashtag });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// 게시글 수정
exports.updatePost = async (req, res) => {
    const { title, content, hashtag } = req.body;
    const postId = req.params.id;
    const userId = req.user.id;

    try {
        const [posts] = await pool.query('SELECT * FROM posts WHERE post_id = ? AND user_id = ?', [postId, userId]);
        if (posts.length === 0) {
            return res.status(404).json({ msg: 'Post not found or not authorized' });
        }

        await pool.query(
            'UPDATE posts SET title = ?, content = ?, hashtag = ? WHERE post_id = ? and user_id = ?',
            [title, content, hashtag, postId, userId]
        );
        console.log(pool.query);
        
        res.json({ msg: 'Post updated' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// 게시글 삭제
exports.deletePost = async (req, res) => {
    const postId = req.params.id;
    const userId = req.user.id;

    try {
        const [posts] = await pool.query('SELECT * FROM posts WHERE post_id = ? AND user_id = ?', [postId, userId]);
        if (posts.length === 0) {
            return res.status(404).json({ msg: 'Post not found or not authorized' });
        }

        await pool.query('DELETE FROM posts WHERE post_id = ?', [postId]);
        // 관련 댓글도 삭제 (옵션)
        await pool.query('DELETE FROM comments WHERE post_id = ?', [postId]);
        
        res.json({ msg: 'Post removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
