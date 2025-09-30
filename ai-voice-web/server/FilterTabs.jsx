export default function FilterTabs({ order, setOrder }) {
    const handlePopularClick = () => {
        if (order.type === 'popular') {
            setOrder({ ...order, dir: order.dir === 'desc' ? 'asc' : 'desc' });
        } else {
            setOrder({ type: 'popular', dir: 'desc' });
        }
    };

    return (
        <div className="tab-group">
            <button className={`tab ${order.type === "latest" ? "active" : ""}`} onClick={() => setOrder({ type: 'latest', dir: 'desc' })}>최신순</button>
            <button className={`tab ${order.type === "popular" ? "active" : ""}`} onClick={handlePopularClick}>
                인기순 {order.type === 'popular' && (order.dir === 'desc' ? '▼' : '▲')}
            </button>
        </div>
    );
}
